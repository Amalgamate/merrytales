import { DeliveryMethod, FulfillmentStatus, ListingModerationStatus, OrderStatus, UserRole, VendorStatus } from '@prisma/client';
import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db';
import { requireAuth, requireRole } from '../middleware/auth';

const router = Router();
router.use(requireAuth);

const deliverySchema = z.object({
  recipientName: z.string().trim().min(2).max(120),
  recipientPhone: z.string().trim().min(9).max(20),
  recipientEmail: z.email().optional(),
  county: z.string().trim().min(2).max(80),
  addressLine: z.string().trim().min(4).max(240),
  landmark: z.string().trim().max(160).optional(),
  instructions: z.string().trim().max(500).optional(),
  method: z.enum(DeliveryMethod).default(DeliveryMethod.COURIER),
});

const fulfillmentInclude = {
  items: { select: { id: true, name: true, quantity: true, unitPrice: true } },
  events: { orderBy: { occurredAt: 'asc' as const } },
  vendor: { select: { businessName: true, slug: true, whatsapp: true } },
};

router.get('/vendor/fulfillments', requireRole(UserRole.VENDOR, UserRole.ADMIN, UserRole.SUPERADMIN), async (req, res, next) => {
  try {
    const vendor = await db.vendorProfile.findUnique({ where: { ownerId: req.user!.id } });
    if (!vendor && req.user!.role === UserRole.VENDOR) return res.status(404).json({ error: { code: 'VENDOR_NOT_FOUND', message: 'Vendor profile not found.' } });
    const fulfillments = await db.fulfillment.findMany({ where: vendor ? { vendorId: vendor.id } : {}, include: { ...fulfillmentInclude, order: { select: { orderNumber: true, customer: { select: { firstName: true, lastName: true } } } } }, orderBy: { createdAt: 'desc' } });
    return res.json({ data: fulfillments.map(({ deliveryPin: _pin, ...item }) => item) });
  } catch (error) { return next(error); }
});

const transitions: Record<FulfillmentStatus, FulfillmentStatus[]> = {
  PENDING: ['PREPARING', 'CANCELLED'], PREPARING: ['READY_FOR_PICKUP', 'CANCELLED'],
  READY_FOR_PICKUP: ['COURIER_ASSIGNED', 'PICKED_UP'], COURIER_ASSIGNED: ['PICKED_UP', 'CANCELLED'],
  PICKED_UP: ['IN_TRANSIT'], IN_TRANSIT: ['ARRIVING', 'DELIVERY_FAILED'], ARRIVING: ['DELIVERED', 'DELIVERY_FAILED'],
  DELIVERY_FAILED: ['COURIER_ASSIGNED', 'RETURNING'], RETURN_REQUESTED: ['RETURNING'], RETURNING: ['RETURNED'],
  DELIVERED: ['RETURN_REQUESTED'], RETURNED: [], CANCELLED: [],
};

router.patch('/vendor/fulfillments/:id/status', requireRole(UserRole.VENDOR, UserRole.ADMIN, UserRole.SUPERADMIN), async (req, res, next) => {
  try {
    const input = z.object({ status: z.enum(FulfillmentStatus), detail: z.string().trim().max(500).optional(), location: z.string().trim().max(160).optional(), deliveryPin: z.string().trim().optional(), courierName: z.string().trim().max(120).optional(), courierPhone: z.string().trim().max(20).optional() }).parse(req.body);
    const vendor = await db.vendorProfile.findUnique({ where: { ownerId: req.user!.id } });
    const fulfillment = await db.fulfillment.findFirst({ where: { id: req.params.id, ...(vendor ? { vendorId: vendor.id } : {}) } });
    if (!fulfillment) return res.status(404).json({ error: { code: 'FULFILLMENT_NOT_FOUND', message: 'Delivery not found.' } });
    if (!transitions[fulfillment.status].includes(input.status)) return res.status(409).json({ error: { code: 'INVALID_DELIVERY_TRANSITION', message: `Cannot move delivery from ${fulfillment.status} to ${input.status}.` } });
    if (input.status === FulfillmentStatus.DELIVERED && fulfillment.handoffMethod === 'PIN' && input.deliveryPin !== fulfillment.deliveryPin) return res.status(400).json({ error: { code: 'INVALID_DELIVERY_PIN', message: 'The recipient PIN is incorrect.' } });
    const label = input.status.replaceAll('_', ' ').toLowerCase().replace(/^./, (letter) => letter.toUpperCase());
    const updated = await db.$transaction(async (tx) => {
      const record = await tx.fulfillment.update({ where: { id: fulfillment.id }, data: { status: input.status, courierName: input.courierName, courierPhone: input.courierPhone, deliveredAt: input.status === FulfillmentStatus.DELIVERED ? new Date() : undefined } });
      await tx.fulfillmentEvent.create({ data: { fulfillmentId: fulfillment.id, status: input.status, label, detail: input.detail, location: input.location, createdById: req.user!.id } });
      if (input.status === FulfillmentStatus.DELIVERED) {
        const pending = await tx.fulfillment.count({ where: { orderId: fulfillment.orderId, status: { notIn: [FulfillmentStatus.DELIVERED, FulfillmentStatus.CANCELLED, FulfillmentStatus.RETURNED] } } });
        if (pending === 0) await tx.order.update({ where: { id: fulfillment.orderId }, data: { status: OrderStatus.DELIVERED } });
      } else if (input.status === FulfillmentStatus.IN_TRANSIT) await tx.order.update({ where: { id: fulfillment.orderId }, data: { status: OrderStatus.DISPATCHED } });
      return record;
    });
    return res.json({ data: updated });
  } catch (error) { return next(error); }
});

router.get('/', async (req, res, next) => {
  try { return res.json({ data: await db.order.findMany({ where: { customerId: req.user!.id }, include: { items: true, payments: true, productionJobs: true, fulfillments: { include: fulfillmentInclude } }, orderBy: { createdAt: 'desc' } }) }); }
  catch (error) { return next(error); }
});

router.post('/', async (req, res, next) => {
  try {
    const input = z.object({ items: z.array(z.object({ productId: z.string(), quantity: z.number().int().min(1).max(1000) })).min(1), delivery: deliverySchema.optional() }).parse(req.body);
    const ids = [...new Set(input.items.map((item) => item.productId))];
    const products = await db.product.findMany({
      where: {
        OR: [{ id: { in: ids } }, { slug: { in: ids } }],
        isActive: true,
        moderationStatus: ListingModerationStatus.APPROVED,
      },
      include: { vendor: true },
    });
    if (products.length !== ids.length) return res.status(400).json({ error: { code: 'INVALID_PRODUCTS', message: 'One or more listings are unavailable or not approved for checkout.' } });

    const unverified = products.find((product) => product.vendorId && product.vendor?.status !== VendorStatus.VERIFIED);
    if (unverified) return res.status(400).json({ error: { code: 'VENDOR_NOT_VERIFIED', message: 'One or more items are from vendors that are not verified for checkout.' } });

    const byId = new Map(products.flatMap((product) => [[product.id, product] as const, [product.slug, product] as const]));
    const invalidQuantity = input.items.find((item) => { const product = byId.get(item.productId)!; return item.quantity < product.minimumOrder || (product.maximumOrder !== null && item.quantity > product.maximumOrder) || (product.stockQuantity !== null && item.quantity > product.stockQuantity); });
    if (invalidQuantity) return res.status(400).json({ error: { code: 'INVALID_QUANTITY', message: 'A listing quantity is outside its order limits or current stock.' } });
    const hasPhysicalItems = input.items.some((item) => !byId.get(item.productId)!.isDigital);
    if (hasPhysicalItems && !input.delivery) return res.status(400).json({ error: { code: 'DELIVERY_REQUIRED', message: 'Add delivery details for physical items.' } });
    const items = input.items.map((item) => { const product = byId.get(item.productId)!; return { productId: product.id, name: product.name, quantity: item.quantity, unitPrice: product.price }; });
    const subtotal = items.reduce((sum, item) => sum + Number(item.unitPrice) * item.quantity, 0);
    // Fetch delivery fees from SystemSettings, fall back to hardcoded defaults
    const feeSettingRecord = await db.systemSetting.findUnique({ where: { key: 'delivery_fees' } });
    const feesMap: Record<string, number> = (feeSettingRecord?.value && typeof feeSettingRecord.value === 'object' && !Array.isArray(feeSettingRecord.value))
      ? (feeSettingRecord.value as Record<string, number>)
      : { Nairobi: 500, Kiambu: 700, Mombasa: 1200, default: 1000 };
    const deliveryFee = hasPhysicalItems && input.delivery!.method !== DeliveryMethod.CUSTOMER_PICKUP
      ? (feesMap[input.delivery!.county] ?? feesMap.default ?? 1000)
      : 0;
    const orderNumber = `MT-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
    const order = await db.$transaction(async (tx) => {
      const created = await tx.order.create({ data: { customerId: req.user!.id, orderNumber, subtotal, deliveryFee, total: subtotal + deliveryFee, items: { create: items }, productionJobs: { create: items.map((item) => ({ title: item.name })) } }, include: { items: true } });
      if (input.delivery) {
        const groups = new Map<string, { vendorId: string | null; itemIds: string[]; leadTimeDays: number }>();
        for (const orderItem of created.items) {
          const product = products.find((candidate) => candidate.id === orderItem.productId)!;
          if (product.isDigital) continue;
          const key = product.vendorId ?? 'merry-tales';
          const group = groups.get(key) ?? { vendorId: product.vendorId, itemIds: [], leadTimeDays: 0 };
          group.itemIds.push(orderItem.id); group.leadTimeDays = Math.max(group.leadTimeDays, product.leadTimeDays); groups.set(key, group);
        }
        let sequence = 0;
        for (const group of groups.values()) {
          sequence += 1;
          const estimatedStart = new Date(Date.now() + Math.max(1, group.leadTimeDays) * 86_400_000);
          const estimatedEnd = new Date(estimatedStart.getTime() + 2 * 86_400_000);
          const fulfillment = await tx.fulfillment.create({ data: { orderId: created.id, vendorId: group.vendorId, trackingCode: `${orderNumber}-${sequence}`, deliveryPin: Math.floor(1000 + Math.random() * 9000).toString(), estimatedStart, estimatedEnd, ...input.delivery, events: { create: { status: FulfillmentStatus.PENDING, label: 'Order received', detail: 'The seller is reviewing the order.' } } } });
          await tx.orderItem.updateMany({ where: { id: { in: group.itemIds } }, data: { fulfillmentId: fulfillment.id } });
        }
      }
      return tx.order.findUniqueOrThrow({ where: { id: created.id }, include: { items: true, productionJobs: true, fulfillments: { include: fulfillmentInclude } } });
    });
    return res.status(201).json({ data: order });
  } catch (error) { return next(error); }
});

router.get('/:id', async (req, res, next) => {
  try { const order = await db.order.findFirst({ where: { id: req.params.id, customerId: req.user!.id }, include: { items: true, payments: true, productionJobs: true, fulfillments: { include: fulfillmentInclude } } }); if (!order) return res.status(404).json({ error: { code: 'ORDER_NOT_FOUND', message: 'Order not found.' } }); return res.json({ data: order }); }
  catch (error) { return next(error); }
});

export { router as ordersRouter };
