import { Router } from 'express';
import { ReferralRewardKind, ReferralStatus } from '@prisma/client';
import { z } from 'zod';
import { db } from '../db';
import { requireAuth } from '../middleware/auth';
import { initiateStkPush } from '../services/mpesa';
import { createOrderSettlements } from '../services/settlements';
import { notifyUser } from '../services/notifications';

const router = Router();

async function handleSuccessfulPayment(orderId: string, customerId: string) {
  await db.order.update({
    where: { id: orderId },
    data: { paymentStatus: 'PAID', status: 'ORDER_RECEIVED' },
  });

  const order = await db.order.findUnique({
    where: { id: orderId },
    include: {
      items: {
        include: {
          product: {
            include: {
              vendor: { select: { id: true, businessName: true, ownerId: true } },
            },
          },
        },
      },
    },
  });

  if (order) {
    await notifyUser(db, {
      userId: customerId,
      category: 'ORDER',
      severity: 'SUCCESS',
      title: 'Payment received',
      body: `Your order ${order.orderNumber} is confirmed. Vendors will begin fulfilment shortly.`,
      actionUrl: '/app/orders',
    });

    const vendorOwners = new Map<string, { ownerId: string; businessName: string; items: string[] }>();
    for (const item of order.items) {
      const vendor = item.product.vendor;
      if (!vendor) continue;
      const bucket = vendorOwners.get(vendor.id) ?? { ownerId: vendor.ownerId, businessName: vendor.businessName, items: [] };
      bucket.items.push(`${item.quantity}× ${item.name}`);
      vendorOwners.set(vendor.id, bucket);
    }

    for (const vendor of vendorOwners.values()) {
      await notifyUser(db, {
        userId: vendor.ownerId,
        category: 'ORDER',
        severity: 'INFO',
        title: 'New paid order',
        body: `${vendor.businessName} received: ${vendor.items.join(', ')}.`,
        actionUrl: '/vendor',
      });
    }
  }

  await createOrderSettlements(orderId);

  const referral = await db.referral.findUnique({ where: { refereeId: customerId } });
  if (referral?.status === ReferralStatus.QUALIFIED && !referral.purchaseQualifiedAt) {
    const issued = await db.referral.updateMany({
      where: { id: referral.id, purchaseQualifiedAt: null },
      data: { purchaseQualifiedAt: new Date() },
    });
    if (issued.count) {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 180);
      await db.referralCredit.createMany({
        data: [
          { userId: referral.referrerId, referralId: referral.id, amount: 500, kind: ReferralRewardKind.FIRST_PURCHASE, expiresAt },
          { userId: referral.refereeId, referralId: referral.id, amount: 300, kind: ReferralRewardKind.FIRST_PURCHASE, expiresAt },
        ],
        skipDuplicates: true,
      });
    }
  }
}

router.post('/mpesa/stk', requireAuth, async (req, res, next) => {
  try {
    const input = z.object({ orderId: z.string(), phone: z.string().min(10).max(15) }).parse(req.body);
    const order = await db.order.findFirst({ where: { id: input.orderId, customerId: req.user!.id } });
    if (!order) return res.status(404).json({ error: { code: 'ORDER_NOT_FOUND', message: 'Order not found.' } });
    if (order.paymentStatus === 'PAID') return res.status(409).json({ error: { code: 'ORDER_ALREADY_PAID', message: 'This order is already paid.' } });

    const payment = await db.payment.create({
      data: { orderId: order.id, provider: 'MPESA', phone: input.phone, amount: order.total, currency: order.currency, status: 'PROCESSING' },
    });
    const result = await initiateStkPush({ amount: Number(order.total), phone: input.phone, reference: order.orderNumber, description: 'Merry Tales order payment' });
    await db.payment.update({ where: { id: payment.id }, data: { providerReference: result.checkoutRequestId, metadata: { ...result } } });
    res.json({ data: { paymentId: payment.id, ...result } });
  } catch (error) {
    next(error);
  }
});

router.post('/mpesa/callback', async (req, res, next) => {
  try {
    const callback = req.body?.Body?.stkCallback;
    if (!callback?.CheckoutRequestID) return res.json({ ResultCode: 0, ResultDesc: 'Accepted' });

    const success = callback.ResultCode === 0;
    await db.payment.updateMany({
      where: { providerReference: callback.CheckoutRequestID },
      data: { status: success ? 'PAID' : 'FAILED', metadata: callback },
    });

    const payment = await db.payment.findUnique({
      where: { providerReference: callback.CheckoutRequestID },
      include: { order: true },
    });

    if (payment && success && payment.order.paymentStatus !== 'PAID') {
      await handleSuccessfulPayment(payment.orderId, payment.order.customerId);
    }

    res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
  } catch (error) {
    next(error);
  }
});

export { router as paymentsRouter };
