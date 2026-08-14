import { Router } from 'express';
import { EventType } from '@prisma/client';
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

export { router as eventsRouter };
