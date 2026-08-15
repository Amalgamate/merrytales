import { SettlementStatus, VendorStatus } from '@prisma/client';
import { db } from '../db';
import { MARKETPLACE_PLANS } from '../config/marketplace-plans';

export async function createOrderSettlements(orderId: string) {
  const order = await db.order.findUnique({
    where: { id: orderId },
    include: {
      items: {
        include: {
          product: {
            include: {
              vendor: true,
            },
          },
        },
      },
    },
  });
  if (!order || order.paymentStatus !== 'PAID') return [];

  const created = [];
  for (const item of order.items) {
    const vendor = item.product.vendor;
    if (!vendor || vendor.status !== VendorStatus.VERIFIED) continue;

    const existing = await db.vendorSettlement.findUnique({ where: { orderItemId: item.id } });
    if (existing) continue;

    const grossAmount = Number(item.unitPrice) * item.quantity;
    const commissionPercent = MARKETPLACE_PLANS[vendor.subscriptionTier].commissionPercent;
    const commissionAmount = Math.round(grossAmount * commissionPercent) / 100;
    const netAmount = grossAmount - commissionAmount;

    const settlement = await db.vendorSettlement.create({
      data: {
        vendorId: vendor.id,
        orderId: order.id,
        orderItemId: item.id,
        grossAmount,
        commissionPercent,
        commissionAmount,
        netAmount,
        currency: order.currency,
        status: SettlementStatus.READY,
      },
    });
    created.push(settlement);
  }
  return created;
}
