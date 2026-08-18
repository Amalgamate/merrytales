import { Router } from 'express';
import { ReferralRewardKind, ReferralStatus } from '@prisma/client';
import { z } from 'zod';
import { db } from '../db';
import { requireAuth } from '../middleware/auth';
import { requireMpesaIp } from '../middleware/mpesa';
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
      // Look up reward amounts from SystemSettings
      const [referrerSetting, refereeSetting, expirySetting] = await Promise.all([
        db.systemSetting.findUnique({ where: { key: 'referral_first_purchase_referrer_credit' } }),
        db.systemSetting.findUnique({ where: { key: 'referral_first_purchase_referee_credit' } }),
        db.systemSetting.findUnique({ where: { key: 'referral_credit_expiry_days' } }),
      ]);
      const referrerAmount = Number(referrerSetting?.value ?? 500);
      const refereeAmount = Number(refereeSetting?.value ?? 300);
      const expiryDays = Number(expirySetting?.value ?? 180);
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expiryDays);
      await db.referralCredit.createMany({
        data: [
          { userId: referral.referrerId, referralId: referral.id, amount: referrerAmount, kind: ReferralRewardKind.FIRST_PURCHASE, expiresAt },
          { userId: referral.refereeId, referralId: referral.id, amount: refereeAmount, kind: ReferralRewardKind.FIRST_PURCHASE, expiresAt },
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

/**
 * Parse an M-Pesa timestamp string (YYYYMMDDHHmmss) into a Date.
 * Returns null if the string doesn't match the expected format.
 */
function parseMpesaTimestamp(ts: unknown): Date | null {
  if (typeof ts !== 'string' || !/^\d{14}$/.test(ts)) return null;
  const year = parseInt(ts.slice(0, 4), 10);
  const month = parseInt(ts.slice(4, 6), 10) - 1; // 0-indexed
  const day = parseInt(ts.slice(6, 8), 10);
  const hour = parseInt(ts.slice(8, 10), 10);
  const minute = parseInt(ts.slice(10, 12), 10);
  const second = parseInt(ts.slice(12, 14), 10);
  const date = new Date(Date.UTC(year, month, day, hour, minute, second));
  return isNaN(date.getTime()) ? null : date;
}

router.post('/mpesa/callback', requireMpesaIp, async (req, res, next) => {
  try {
    const callback = req.body?.Body?.stkCallback;
    if (!callback?.CheckoutRequestID) return res.json({ ResultCode: 0, ResultDesc: 'Accepted' });

    // Timestamp staleness check — reject callbacks older than 5 minutes
    const callbackTime = parseMpesaTimestamp(callback.Timestamp);
    if (callbackTime !== null) {
      const ageMs = Date.now() - callbackTime.getTime();
      if (ageMs > 5 * 60 * 1000) {
        console.warn(`[mpesa-callback] stale timestamp (${callback.Timestamp}), skipping processing`);
        return res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
      }
    }

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
      try {
        await handleSuccessfulPayment(payment.orderId, payment.order.customerId);
      } catch (err) {
        console.error('[mpesa-callback] post-payment processing error:', err);
      }
    }

    res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
  } catch (error) {
    next(error);
  }
});

export { router as paymentsRouter };
