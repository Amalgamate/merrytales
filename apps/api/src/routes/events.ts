import { Router } from 'express';
import { EventType, ReferralRewardKind, ReferralStatus } from '@prisma/client';
import { z } from 'zod';
import { db } from '../db';
import { requireAuth } from '../middleware/auth';

const router = Router();
router.use(requireAuth);

const eventSchema = z.object({
  type: z.enum(EventType).default(EventType.WEDDING),
  title: z.string().trim().min(3).max(120),
  slug: z.string().trim().min(3).max(100).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  partnerOne: z.string().trim().max(60).optional(),
  partnerTwo: z.string().trim().max(60).optional(),
  eventDate: z.iso.datetime().optional(),
  venue: z.string().trim().max(160).optional(),
  city: z.string().trim().max(80).optional(),
  countryCode: z.string().length(2).default('KE'),
  currency: z.string().length(3).default('KES'),
  budget: z.coerce.number().nonnegative().optional(),
  guestTarget: z.coerce.number().int().nonnegative().optional(),
  celebrationType: z.string().trim().min(2).max(60).default('WEDDING'),
  traditions: z.array(z.string().trim().min(2).max(60)).max(12).default([]),
  planningPreferences: z.array(z.string().trim().min(2).max(80)).max(12).default([]),
});

router.get('/', async (req, res, next) => {
  try {
    const events = await db.event.findMany({ where: { ownerId: req.user!.id }, include: { _count: { select: { guests: true } } }, orderBy: { createdAt: 'desc' } });
    res.json({ data: events });
  } catch (error) { next(error); }
});

router.post('/', async (req, res, next) => {
  try {
    const input = eventSchema.parse(req.body);
    const event = await db.event.create({ data: { ...input, eventDate: input.eventDate ? new Date(input.eventDate) : undefined, ownerId: req.user!.id } });
    const referral = await db.referral.findUnique({ where: { refereeId: req.user!.id } });
    if (referral?.status === ReferralStatus.PENDING) {
      const qualified = await db.referral.updateMany({ where: { id: referral.id, status: ReferralStatus.PENDING }, data: { status: ReferralStatus.QUALIFIED, qualifiedAt: new Date() } });
      if (qualified.count) {
        const expirySetting = await db.systemSetting.findUnique({ where: { key: 'referral_credit_expiry_days' } });
        const expiryDays = Number(expirySetting?.value ?? 180);
        const expiresAt = new Date(); expiresAt.setDate(expiresAt.getDate() + expiryDays);
        await db.referralCredit.createMany({ data: [{ userId: referral.referrerId, referralId: referral.id, amount: referral.referrerCredit, kind: ReferralRewardKind.PLAN_COMPLETION, expiresAt }, { userId: referral.refereeId, referralId: referral.id, amount: referral.refereeCredit, kind: ReferralRewardKind.PLAN_COMPLETION, expiresAt }], skipDuplicates: true });
      }
    }
    res.status(201).json({ data: event });
  } catch (error) { next(error); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const event = await db.event.findFirst({ where: { id: req.params.id, ownerId: req.user!.id }, include: { guests: true } });
    if (!event) return res.status(404).json({ error: { code: 'EVENT_NOT_FOUND', message: 'Event not found.' } });
    return res.json({ data: event });
  } catch (error) { next(error); }
});

router.patch('/:id', async (req, res, next) => {
  try {
    const input = eventSchema.partial().extend({ isActive: z.boolean().optional() }).parse(req.body);
    const event = await db.event.findFirst({ where: { id: req.params.id, ownerId: req.user!.id } });
    if (!event) return res.status(404).json({ error: { code: 'EVENT_NOT_FOUND', message: 'Event not found.' } });
    if (input.slug) {
      const conflict = await db.event.findFirst({ where: { slug: input.slug, NOT: { id: event.id } } });
      if (conflict) return res.status(409).json({ error: { code: 'SLUG_TAKEN', message: 'This URL slug is already taken. Choose a different one.' } });
    }
    const updated = await db.event.update({ where: { id: event.id }, data: { ...input, eventDate: input.eventDate ? new Date(input.eventDate) : undefined } });
    return res.json({ data: updated });
  } catch (error) { next(error); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const event = await db.event.findFirst({ where: { id: req.params.id, ownerId: req.user!.id } });
    if (!event) return res.status(404).json({ error: { code: 'EVENT_NOT_FOUND', message: 'Event not found.' } });
    await db.event.delete({ where: { id: event.id } });
    return res.status(204).send();
  } catch (error) { next(error); }
});

// ── Guest management ────────────────────────────────────────────────────────

const guestSchema = z.object({
  name: z.string().trim().min(2).max(120),
  phone: z.string().trim().max(20).optional(),
  email: z.string().email().optional(),
  household: z.string().trim().max(120).optional(),
  attending: z.boolean().optional(),
  plusOnes: z.coerce.number().int().min(0).max(20).default(0),
});

router.get('/:id/guests', async (req, res, next) => {
  try {
    const event = await db.event.findFirst({ where: { id: req.params.id, ownerId: req.user!.id } });
    if (!event) return res.status(404).json({ error: { code: 'EVENT_NOT_FOUND', message: 'Event not found.' } });
    const guests = await db.guest.findMany({ where: { eventId: event.id }, orderBy: { createdAt: 'asc' } });
    return res.json({ data: guests });
  } catch (error) { next(error); }
});

router.post('/:id/guests', async (req, res, next) => {
  try {
    const event = await db.event.findFirst({ where: { id: req.params.id, ownerId: req.user!.id } });
    if (!event) return res.status(404).json({ error: { code: 'EVENT_NOT_FOUND', message: 'Event not found.' } });
    const input = guestSchema.parse(req.body);
    const guest = await db.guest.create({ data: { ...input, eventId: event.id } });
    return res.status(201).json({ data: guest });
  } catch (error) { next(error); }
});

router.patch('/:id/guests/:guestId', async (req, res, next) => {
  try {
    const event = await db.event.findFirst({ where: { id: req.params.id, ownerId: req.user!.id } });
    if (!event) return res.status(404).json({ error: { code: 'EVENT_NOT_FOUND', message: 'Event not found.' } });
    const guest = await db.guest.findFirst({ where: { id: req.params.guestId, eventId: event.id } });
    if (!guest) return res.status(404).json({ error: { code: 'GUEST_NOT_FOUND', message: 'Guest not found.' } });
    const input = guestSchema.partial().parse(req.body);
    const updated = await db.guest.update({ where: { id: guest.id }, data: input });
    return res.json({ data: updated });
  } catch (error) { next(error); }
});

router.delete('/:id/guests/:guestId', async (req, res, next) => {
  try {
    const event = await db.event.findFirst({ where: { id: req.params.id, ownerId: req.user!.id } });
    if (!event) return res.status(404).json({ error: { code: 'EVENT_NOT_FOUND', message: 'Event not found.' } });
    const guest = await db.guest.findFirst({ where: { id: req.params.guestId, eventId: event.id } });
    if (!guest) return res.status(404).json({ error: { code: 'GUEST_NOT_FOUND', message: 'Guest not found.' } });
    await db.guest.delete({ where: { id: guest.id } });
    return res.status(204).send();
  } catch (error) { next(error); }
});

export { router as eventsRouter };
