import { Router } from 'express';
import { LeadStatus, UserRole } from '@prisma/client';
import { z } from 'zod';
import { db } from '../db';
import { requireAuth, requireRole } from '../middleware/auth';

const router = Router();
router.post('/', async (req, res, next) => {
  try {
    const input = z.object({ vendorId: z.string(), name: z.string().min(2).max(100), email: z.email().optional(), phone: z.string().max(20).optional(), eventDate: z.iso.datetime().optional(), message: z.string().min(10).max(2000) }).parse(req.body);
    const lead = await db.lead.create({ data: { ...input, eventDate: input.eventDate ? new Date(input.eventDate) : undefined, conversation: { create: {} } }, include: { conversation: true } });
    res.status(201).json({ data: lead });
  } catch (error) { next(error); }
});

router.get('/vendor', requireAuth, requireRole(UserRole.VENDOR, UserRole.ADMIN), async (req, res, next) => {
  try {
    const vendor = await db.vendorProfile.findUnique({ where: { ownerId: req.user!.id } });
    const leads = await db.lead.findMany({ where: req.user!.role === UserRole.ADMIN ? {} : { vendorId: vendor?.id ?? 'none' }, include: { conversation: { include: { messages: true } } }, orderBy: { createdAt: 'desc' } });
    res.json({ data: leads });
  } catch (error) { next(error); }
});

router.patch('/:id/status', requireAuth, requireRole(UserRole.VENDOR, UserRole.ADMIN), async (req, res, next) => {
  try {
    const { status } = z.object({ status: z.enum(LeadStatus) }).parse(req.body);
    const vendor = req.user!.role === UserRole.VENDOR ? await db.vendorProfile.findUnique({ where: { ownerId: req.user!.id } }) : null;
    const existing = await db.lead.findFirst({ where: { id: req.params.id, ...(vendor ? { vendorId: vendor.id } : {}) } });
    if (!existing) return res.status(404).json({ error: { code: 'LEAD_NOT_FOUND', message: 'Lead not found.' } });
    const lead = await db.lead.update({ where: { id: existing.id }, data: { status } });
    res.json({ data: lead });
  } catch (error) { next(error); }
});
router.post('/:id/messages', requireAuth, requireRole(UserRole.VENDOR, UserRole.ADMIN), async (req, res, next) => {
  try {
    const { body } = z.object({ body: z.string().trim().min(1).max(4000) }).parse(req.body);
    const vendor = req.user!.role === UserRole.VENDOR ? await db.vendorProfile.findUnique({ where: { ownerId: req.user!.id } }) : null;
    const lead = await db.lead.findFirst({ where: { id: req.params.id, ...(vendor ? { vendorId: vendor.id } : {}) }, include: { conversation: true } });
    if (!lead?.conversation) return res.status(404).json({ error: { code: 'CONVERSATION_NOT_FOUND', message: 'Conversation not found.' } });
    const message = await db.message.create({ data: { conversationId: lead.conversation.id, senderId: req.user!.id, body } });
    return res.status(201).json({ data: message });
  } catch (error) { next(error); }
});
export { router as leadsRouter };
