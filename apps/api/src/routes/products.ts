import { Router } from 'express';
import { ListingModerationStatus, ListingType, Prisma, PriceUnit, SubscriptionStatus, UserRole, VendorStatus } from '@prisma/client';
import { z } from 'zod';
import { db } from '../db';
import { requireAuth, requireRole } from '../middleware/auth';
import { MARKETPLACE_PLANS } from '../config/marketplace-plans';
import { MARKETPLACE_CATEGORIES } from '../config/marketplace-categories';

const router = Router();
const listingSchema = z.object({
  name: z.string().trim().min(2).max(160),
  description: z.string().trim().max(4000).nullable().optional(),
  category: z.string().trim().min(2).max(100),
  listingType: z.enum(ListingType),
  priceUnit: z.enum(PriceUnit),
  price: z.coerce.number().nonnegative(),
  currency: z.string().length(3).default('KES'),
  stockQuantity: z.coerce.number().int().nonnegative().nullable().optional(),
  minimumOrder: z.coerce.number().int().positive().default(1),
  maximumOrder: z.coerce.number().int().positive().nullable().optional(),
  leadTimeDays: z.coerce.number().int().nonnegative().default(0),
  serviceArea: z.string().trim().max(200).nullable().optional(),
  depositAmount: z.coerce.number().nonnegative().nullable().optional(),
  terms: z.string().trim().max(4000).nullable().optional(),
  isDigital: z.boolean().default(false),
  isActive: z.boolean().default(true),
}).refine((value) => !value.maximumOrder || value.maximumOrder >= value.minimumOrder, {
  message: 'Maximum order must be at least the minimum order.',
  path: ['maximumOrder'],
});

const publicListingFilter: Prisma.ProductWhereInput = {
  OR: [{ vendorId: null }, { vendor: { status: VendorStatus.VERIFIED } }],
};

router.get('/categories', (_req, res) => res.json({ data: MARKETPLACE_CATEGORIES }));

router.get('/vendor/mine', requireAuth, requireRole(UserRole.VENDOR), async (req, res, next) => {
  try {
    const vendor = await db.vendorProfile.findUnique({ where: { ownerId: req.user!.id } });
    return res.json({ data: vendor ? await db.product.findMany({ where: { vendorId: vendor.id }, include: { availability: true }, orderBy: { createdAt: 'desc' } }) : [] });
  } catch (error) { next(error); }
});

router.post('/vendor', requireAuth, requireRole(UserRole.VENDOR), async (req, res, next) => {
  try {
    const input = listingSchema.parse(req.body);
    const vendor = await db.vendorProfile.findUnique({ where: { ownerId: req.user!.id } });
    if (!vendor) return res.status(404).json({ error: { code: 'VENDOR_NOT_FOUND', message: 'Vendor profile not found.' } });
    const base = input.name.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || 'listing';
    let slug = `${vendor.slug}-${base}`;
    let suffix = 1;
    while (await db.product.findUnique({ where: { slug } })) slug = `${vendor.slug}-${base}-${++suffix}`;
    return res.status(201).json({ data: await db.product.create({ data: { ...input, slug, vendorId: vendor.id }, include: { availability: true } }) });
  } catch (error) { next(error); }
});

router.patch('/vendor/:id', requireAuth, requireRole(UserRole.VENDOR), async (req, res, next) => {
  try {
    const input = listingSchema.partial().parse(req.body);
    const vendor = await db.vendorProfile.findUnique({ where: { ownerId: req.user!.id } });
    const existing = await db.product.findFirst({ where: { id: req.params.id, vendorId: vendor?.id ?? 'none' } });
    if (!existing) return res.status(404).json({ error: { code: 'LISTING_NOT_FOUND', message: 'Listing not found.' } });
    const resetReview = existing.moderationStatus === ListingModerationStatus.APPROVED || existing.moderationStatus === ListingModerationStatus.PENDING_REVIEW;
    return res.json({ data: await db.product.update({ where: { id: existing.id }, data: { ...input, ...(resetReview && { moderationStatus: ListingModerationStatus.DRAFT, moderationReason: 'Listing changed after submission; please resubmit.' }) }, include: { availability: true } }) });
  } catch (error) { next(error); }
});

router.post('/vendor/:id/submit', requireAuth, requireRole(UserRole.VENDOR), async (req, res, next) => {
  try {
    const vendor = await db.vendorProfile.findUnique({ where: { ownerId: req.user!.id } });
    if (!vendor) return res.status(404).json({ error: { code: 'VENDOR_NOT_FOUND', message: 'Vendor profile not found.' } });
    if (vendor.status !== VendorStatus.VERIFIED || vendor.taxComplianceStatus !== 'VERIFIED' || vendor.etimsStatus !== 'VERIFIED') {
      return res.status(403).json({ error: { code: 'VENDOR_NOT_VERIFIED', message: 'Identity, business, tax compliance and eTIMS checks must be verified before publication.' } });
    }
    if (vendor.taxComplianceExpiresAt && vendor.taxComplianceExpiresAt <= new Date()) {
      return res.status(403).json({ error: { code: 'TAX_COMPLIANCE_EXPIRED', message: 'Renew your Tax Compliance Certificate before submitting listings.' } });
    }
    if (vendor.subscriptionStatus !== SubscriptionStatus.ACTIVE || !vendor.subscriptionEndsAt || vendor.subscriptionEndsAt <= new Date()) {
      return res.status(402).json({ error: { code: 'SUBSCRIPTION_REQUIRED', message: 'An active marketplace tools package is required to submit listings.' } });
    }
    const listing = await db.product.findFirst({ where: { id: req.params.id, vendorId: vendor.id } });
    if (!listing) return res.status(404).json({ error: { code: 'LISTING_NOT_FOUND', message: 'Listing not found.' } });
    const count = await db.product.count({ where: { vendorId: vendor.id, moderationStatus: { not: ListingModerationStatus.ARCHIVED } } });
    if (count > MARKETPLACE_PLANS[vendor.subscriptionTier].listingLimit) {
      return res.status(403).json({ error: { code: 'PLAN_LIMIT_REACHED', message: `${vendor.subscriptionTier} supports ${MARKETPLACE_PLANS[vendor.subscriptionTier].listingLimit} listings. Archive one or upgrade.` } });
    }
    return res.json({ data: await db.product.update({ where: { id: listing.id }, data: { moderationStatus: ListingModerationStatus.PENDING_REVIEW, submittedAt: new Date(), moderationReason: null } }) });
  } catch (error) { next(error); }
});

router.delete('/vendor/:id', requireAuth, requireRole(UserRole.VENDOR), async (req, res, next) => {
  try {
    const vendor = await db.vendorProfile.findUnique({ where: { ownerId: req.user!.id } });
    const existing = await db.product.findFirst({ where: { id: req.params.id, vendorId: vendor?.id ?? 'none' } });
    if (!existing) return res.status(404).json({ error: { code: 'LISTING_NOT_FOUND', message: 'Listing not found.' } });
    await db.product.delete({ where: { id: existing.id } });
    return res.status(204).send();
  } catch (error) { next(error); }
});

router.post('/vendor/:id/availability', requireAuth, requireRole(UserRole.VENDOR), async (req, res, next) => {
  try {
    const input = z.object({
      startsAt: z.iso.datetime(),
      endsAt: z.iso.datetime(),
      isAvailable: z.boolean().default(false),
      note: z.string().max(500).optional(),
    }).refine((value) => new Date(value.endsAt) > new Date(value.startsAt), { message: 'End time must be after start time.' }).parse(req.body);
    const vendor = await db.vendorProfile.findUnique({ where: { ownerId: req.user!.id } });
    const listing = await db.product.findFirst({ where: { id: req.params.id, vendorId: vendor?.id ?? 'none' } });
    if (!listing) return res.status(404).json({ error: { code: 'LISTING_NOT_FOUND', message: 'Listing not found.' } });
    return res.status(201).json({ data: await db.listingAvailability.create({ data: { productId: listing.id, startsAt: new Date(input.startsAt), endsAt: new Date(input.endsAt), isAvailable: input.isAvailable, note: input.note } }) });
  } catch (error) { next(error); }
});

router.delete('/vendor/:id/availability/:availabilityId', requireAuth, requireRole(UserRole.VENDOR), async (req, res, next) => {
  try {
    const vendor = await db.vendorProfile.findUnique({ where: { ownerId: req.user!.id } });
    const slot = await db.listingAvailability.findFirst({ where: { id: req.params.availabilityId, productId: req.params.id, product: { vendorId: vendor?.id ?? 'none' } } });
    if (!slot) return res.status(404).json({ error: { code: 'AVAILABILITY_NOT_FOUND', message: 'Availability entry not found.' } });
    await db.listingAvailability.delete({ where: { id: slot.id } });
    return res.status(204).send();
  } catch (error) { next(error); }
});

router.get('/', async (req, res, next) => {
  try {
    const query = z.object({
      q: z.string().optional(),
      category: z.string().optional(),
      type: z.enum(ListingType).optional(),
      city: z.string().optional(),
      vendorSlug: z.string().optional(),
      availableFrom: z.iso.datetime().optional(),
      availableTo: z.iso.datetime().optional(),
      page: z.coerce.number().int().positive().default(1),
      limit: z.coerce.number().int().min(1).max(100).default(24),
    }).parse(req.query);

    const dateFilter = query.availableFrom && query.availableTo
      ? { availability: { none: { isAvailable: false, startsAt: { lt: new Date(query.availableTo) }, endsAt: { gt: new Date(query.availableFrom) } } } }
      : {};

    const where = {
      isActive: true,
      moderationStatus: ListingModerationStatus.APPROVED,
      AND: [publicListingFilter],
      ...(query.category && { category: { contains: query.category, mode: 'insensitive' as const } }),
      ...(query.type && { listingType: query.type }),
      ...(query.vendorSlug && { vendor: { slug: query.vendorSlug, status: VendorStatus.VERIFIED } }),
      ...(query.city && { OR: [{ serviceArea: { contains: query.city, mode: 'insensitive' as const } }, { vendor: { city: { contains: query.city, mode: 'insensitive' as const } } }] }),
      ...(query.q && { OR: [{ name: { contains: query.q, mode: 'insensitive' as const } }, { description: { contains: query.q, mode: 'insensitive' as const } }, { category: { contains: query.q, mode: 'insensitive' as const } }] }),
      ...dateFilter,
    };

    const [items, total] = await Promise.all([
      db.product.findMany({
        where,
        include: { vendor: { select: { businessName: true, slug: true, city: true, rating: true, status: true } }, availability: true },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        orderBy: { createdAt: 'desc' },
      }),
      db.product.count({ where }),
    ]);

    return res.json({ data: items, meta: { page: query.page, limit: query.limit, total, pages: Math.ceil(total / query.limit) } });
  } catch (error) { next(error); }
});

router.get('/:slug', async (req, res, next) => {
  try {
    const product = await db.product.findFirst({
      where: {
        slug: req.params.slug,
        isActive: true,
        moderationStatus: ListingModerationStatus.APPROVED,
        AND: [publicListingFilter],
      },
      include: {
        vendor: { select: { id: true, businessName: true, slug: true, city: true, rating: true, reviewCount: true, status: true, whatsapp: true, startingPrice: true, responseMinutes: true } },
        availability: true,
      },
    });
    if (!product) return res.status(404).json({ error: { code: 'PRODUCT_NOT_FOUND', message: 'Listing not found.' } });
    return res.json({ data: product });
  } catch (error) { next(error); }
});

export { router as productsRouter };
