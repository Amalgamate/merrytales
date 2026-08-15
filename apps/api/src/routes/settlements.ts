import { Router } from 'express';
import { SettlementStatus, UserRole } from '@prisma/client';
import { z } from 'zod';
import { db } from '../db';
import { requireAuth, requireRole } from '../middleware/auth';

const router = Router();
router.use(requireAuth);

router.get('/vendor', requireRole(UserRole.VENDOR), async (req, res, next) => {
  try {
    const vendor = await db.vendorProfile.findUnique({ where: { ownerId: req.user!.id } });
    if (!vendor) return res.status(404).json({ error: { code: 'VENDOR_NOT_FOUND', message: 'Vendor profile not found.' } });

    const [items, summary] = await Promise.all([
      db.vendorSettlement.findMany({
        where: { vendorId: vendor.id },
        include: {
          order: { select: { orderNumber: true, createdAt: true } },
          orderItem: { select: { name: true, quantity: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 100,
      }),
      db.vendorSettlement.groupBy({
        by: ['status'],
        where: { vendorId: vendor.id },
        _sum: { netAmount: true },
        _count: true,
      }),
    ]);

    const totals = {
      ready: Number(summary.find((row) => row.status === SettlementStatus.READY)?._sum.netAmount ?? 0),
      paid: Number(summary.find((row) => row.status === SettlementStatus.PAID)?._sum.netAmount ?? 0),
      pending: Number(summary.find((row) => row.status === SettlementStatus.PENDING)?._sum.netAmount ?? 0),
    };

    return res.json({ data: { items, totals } });
  } catch (error) {
    next(error);
  }
});

router.patch('/:id/paid', requireRole(UserRole.ADMIN, UserRole.SUPERADMIN), async (req, res, next) => {
  try {
    const settlement = await db.vendorSettlement.findUnique({ where: { id: req.params.id } });
    if (!settlement) return res.status(404).json({ error: { code: 'SETTLEMENT_NOT_FOUND', message: 'Settlement not found.' } });
    if (settlement.status === SettlementStatus.PAID) return res.json({ data: settlement });

    const updated = await db.vendorSettlement.update({
      where: { id: settlement.id },
      data: { status: SettlementStatus.PAID, paidAt: new Date() },
    });

    const vendor = await db.vendorProfile.findUnique({ where: { id: settlement.vendorId }, select: { ownerId: true, businessName: true } });
    if (vendor) {
      await db.notification.create({
        data: {
          userId: vendor.ownerId,
          category: 'PAYOUT',
          severity: 'SUCCESS',
          title: 'Payout recorded',
          body: `KES ${Number(updated.netAmount).toLocaleString('en-KE')} for order item has been marked paid.`,
          actionUrl: '/vendor',
        },
      });
    }

    return res.json({ data: updated });
  } catch (error) {
    next(error);
  }
});

router.get('/admin', requireRole(UserRole.ADMIN, UserRole.SUPERADMIN), async (req, res, next) => {
  try {
    const query = z.object({ status: z.enum(SettlementStatus).optional() }).parse(req.query);
    const items = await db.vendorSettlement.findMany({
      where: query.status ? { status: query.status } : {},
      include: {
        vendor: { select: { businessName: true, slug: true } },
        order: { select: { orderNumber: true } },
        orderItem: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
    return res.json({ data: items });
  } catch (error) {
    next(error);
  }
});

export { router as settlementsRouter };
