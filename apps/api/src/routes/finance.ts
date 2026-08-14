import { ApprovalStatus, CommitmentStatus, Prisma, QuoteStatus } from '@prisma/client';
import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db';
import { requireAuth } from '../middleware/auth';

const router = Router();
router.use(requireAuth);

async function ownedEvent(eventId: string, ownerId: string) {
  return db.event.findFirst({ where: { id: eventId, ownerId } });
}

const money = z.coerce.number().finite().nonnegative().max(1_000_000_000);
const envelopeSchema = z.object({
  name: z.string().trim().min(2).max(80),
  allocatedAmount: money,
  color: z.string().trim().max(30).optional(),
});
const quoteSchema = z.object({
  eventId: z.string().min(1),
  vendorId: z.string().min(1).optional(),
  title: z.string().trim().min(3).max(160),
  depositAmount: money.optional(),
  validUntil: z.iso.datetime().optional(),
  notes: z.string().trim().max(2000).optional(),
  lines: z.array(z.object({
    description: z.string().trim().min(2).max(240),
    quantity: z.coerce.number().positive().max(100_000),
    unitPrice: money,
    taxRate: z.coerce.number().min(0).max(100).default(0),
  })).min(1).max(100),
});

router.get('/events/:eventId/summary', async (req, res, next) => {
  try {
    const event = await ownedEvent(req.params.eventId, req.user!.id);
    if (!event) return res.status(404).json({ error: { code: 'EVENT_NOT_FOUND', message: 'Event not found.' } });
    const [envelopes, quotes, approvals, accounts] = await Promise.all([
      db.budgetEnvelope.findMany({ where: { eventId: event.id }, include: { commitments: true }, orderBy: { createdAt: 'asc' } }),
      db.quote.findMany({ where: { eventId: event.id }, include: { lines: true, vendor: { select: { businessName: true, slug: true } }, commitment: true }, orderBy: { createdAt: 'desc' } }),
      db.approvalRequest.findMany({ where: { eventId: event.id }, include: { requestedBy: { select: { firstName: true, lastName: true } }, decidedBy: { select: { firstName: true, lastName: true } } }, orderBy: { createdAt: 'desc' } }),
      db.financialAccount.findMany({ where: { eventId: event.id }, include: { postings: true }, orderBy: { code: 'asc' } }),
    ]);
    const accountBalances = accounts.map((account) => {
      const debit = account.postings.filter((p) => p.side === 'DEBIT').reduce((sum, p) => sum + Number(p.amount), 0);
      const credit = account.postings.filter((p) => p.side === 'CREDIT').reduce((sum, p) => sum + Number(p.amount), 0);
      const balance = account.type === 'ASSET' || account.type === 'EXPENSE' ? debit - credit : credit - debit;
      return { id: account.id, code: account.code, name: account.name, type: account.type, currency: account.currency, balance };
    });
    const funded = accountBalances.find((a) => a.code === '2000')?.balance ?? 0;
    const commitments = envelopes.flatMap((envelope) => envelope.commitments);
    const reserved = commitments.filter((item) => item.status === CommitmentStatus.RESERVED).reduce((sum, item) => sum + Number(item.amount), 0);
    const paid = commitments.filter((item) => item.status === CommitmentStatus.PAID).reduce((sum, item) => sum + Number(item.amount), 0);
    return res.json({ data: { event, totals: { budget: Number(event.budget ?? 0), funded, reserved, paid, available: funded - reserved - paid }, envelopes, quotes, approvals, accountBalances } });
  } catch (error) { return next(error); }
});

router.post('/events/:eventId/envelopes', async (req, res, next) => {
  try {
    const input = envelopeSchema.parse(req.body);
    const event = await ownedEvent(req.params.eventId, req.user!.id);
    if (!event) return res.status(404).json({ error: { code: 'EVENT_NOT_FOUND', message: 'Event not found.' } });
    const envelope = await db.budgetEnvelope.create({ data: { eventId: event.id, currency: event.currency, ...input } });
    await db.auditLog.create({ data: { actorId: req.user!.id, action: 'BUDGET_ENVELOPE_CREATED', entityType: 'BudgetEnvelope', entityId: envelope.id, metadata: { eventId: event.id, allocatedAmount: input.allocatedAmount } } });
    return res.status(201).json({ data: envelope });
  } catch (error) { return next(error); }
});

router.post('/quotes', async (req, res, next) => {
  try {
    const input = quoteSchema.parse(req.body);
    const event = await ownedEvent(input.eventId, req.user!.id);
    if (!event) return res.status(404).json({ error: { code: 'EVENT_NOT_FOUND', message: 'Event not found.' } });
    if (input.vendorId && !(await db.vendorProfile.findUnique({ where: { id: input.vendorId } }))) return res.status(400).json({ error: { code: 'VENDOR_NOT_FOUND', message: 'Vendor not found.' } });
    const lines = input.lines.map((line, index) => {
      const base = Math.round(line.quantity * line.unitPrice * 100) / 100;
      const lineTotal = Math.round(base * (1 + line.taxRate / 100) * 100) / 100;
      return { ...line, lineTotal, sortOrder: index };
    });
    const subtotal = Math.round(input.lines.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0) * 100) / 100;
    const total = Math.round(lines.reduce((sum, line) => sum + line.lineTotal, 0) * 100) / 100;
    const taxAmount = Math.round((total - subtotal) * 100) / 100;
    if (input.depositAmount !== undefined && input.depositAmount > total) return res.status(400).json({ error: { code: 'INVALID_DEPOSIT', message: 'Deposit cannot exceed the quote total.' } });
    const quoteNumber = `QT-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 10_000).toString().padStart(4, '0')}`;
    const quote = await db.quote.create({ data: { eventId: event.id, vendorId: input.vendorId, createdById: req.user!.id, quoteNumber, title: input.title, currency: event.currency, subtotal, taxAmount, total, depositAmount: input.depositAmount, validUntil: input.validUntil ? new Date(input.validUntil) : undefined, notes: input.notes, lines: { create: lines } }, include: { lines: true, vendor: { select: { businessName: true, slug: true } } } });
    await db.auditLog.create({ data: { actorId: req.user!.id, action: 'QUOTE_CREATED', entityType: 'Quote', entityId: quote.id, metadata: { eventId: event.id, quoteNumber, total } } });
    return res.status(201).json({ data: quote });
  } catch (error) { return next(error); }
});

router.patch('/quotes/:quoteId/status', async (req, res, next) => {
  try {
    const input = z.object({ status: z.enum([QuoteStatus.SENT, QuoteStatus.DECLINED, QuoteStatus.CANCELLED]) }).parse(req.body);
    const quote = await db.quote.findFirst({ where: { id: req.params.quoteId, event: { ownerId: req.user!.id } } });
    if (!quote) return res.status(404).json({ error: { code: 'QUOTE_NOT_FOUND', message: 'Quote not found.' } });
    if (quote.status === QuoteStatus.ACCEPTED) return res.status(409).json({ error: { code: 'QUOTE_FINAL', message: 'An accepted quote cannot be changed.' } });
    const updated = await db.quote.update({ where: { id: quote.id }, data: { status: input.status } });
    return res.json({ data: updated });
  } catch (error) { return next(error); }
});

router.post('/quotes/:quoteId/accept', async (req, res, next) => {
  try {
    const input = z.object({ envelopeId: z.string().min(1).optional(), requireApproval: z.boolean().default(false) }).parse(req.body ?? {});
    const quote = await db.quote.findFirst({ where: { id: req.params.quoteId, event: { ownerId: req.user!.id } }, include: { event: true, commitment: true } });
    if (!quote) return res.status(404).json({ error: { code: 'QUOTE_NOT_FOUND', message: 'Quote not found.' } });
    if (quote.commitment || quote.status === QuoteStatus.ACCEPTED) return res.status(409).json({ error: { code: 'QUOTE_ALREADY_ACCEPTED', message: 'Quote is already accepted.' } });
    if (quote.status !== QuoteStatus.DRAFT && quote.status !== QuoteStatus.SENT) return res.status(409).json({ error: { code: 'QUOTE_NOT_ACCEPTABLE', message: 'This quote cannot be accepted.' } });
    if (quote.validUntil && quote.validUntil < new Date()) return res.status(409).json({ error: { code: 'QUOTE_EXPIRED', message: 'This quote has expired.' } });
    if (input.envelopeId && !(await db.budgetEnvelope.findFirst({ where: { id: input.envelopeId, eventId: quote.eventId } }))) return res.status(400).json({ error: { code: 'INVALID_ENVELOPE', message: 'Budget envelope does not belong to this event.' } });
    const result = await db.$transaction(async (tx) => {
      const updated = await tx.quote.update({ where: { id: quote.id }, data: { status: QuoteStatus.ACCEPTED, acceptedAt: new Date() } });
      const commitment = await tx.budgetCommitment.create({ data: { eventId: quote.eventId, envelopeId: input.envelopeId, quoteId: quote.id, description: quote.title, amount: quote.total, currency: quote.currency } });
      const approval = input.requireApproval ? await tx.approvalRequest.create({ data: { eventId: quote.eventId, commitmentId: commitment.id, requestedById: req.user!.id, purpose: `Approve ${quote.quoteNumber}: ${quote.title}`, amount: quote.total, currency: quote.currency } }) : null;
      await tx.auditLog.create({ data: { actorId: req.user!.id, action: 'QUOTE_ACCEPTED', entityType: 'Quote', entityId: quote.id, metadata: { eventId: quote.eventId, commitmentId: commitment.id } } });
      return { quote: updated, commitment, approval };
    });
    return res.json({ data: result });
  } catch (error) { return next(error); }
});

router.patch('/approvals/:approvalId', async (req, res, next) => {
  try {
    const input = z.object({ status: z.enum([ApprovalStatus.APPROVED, ApprovalStatus.REJECTED]), note: z.string().trim().max(500).optional() }).parse(req.body);
    const approval = await db.approvalRequest.findFirst({ where: { id: req.params.approvalId, event: { ownerId: req.user!.id } } });
    if (!approval) return res.status(404).json({ error: { code: 'APPROVAL_NOT_FOUND', message: 'Approval request not found.' } });
    if (approval.status !== ApprovalStatus.PENDING) return res.status(409).json({ error: { code: 'APPROVAL_FINAL', message: 'Approval request has already been decided.' } });
    const updated = await db.approvalRequest.update({ where: { id: approval.id }, data: { status: input.status, note: input.note, decidedById: req.user!.id, decidedAt: new Date() } });
    await db.auditLog.create({ data: { actorId: req.user!.id, action: `APPROVAL_${input.status}`, entityType: 'ApprovalRequest', entityId: approval.id, metadata: { eventId: approval.eventId } } });
    return res.json({ data: updated });
  } catch (error) { return next(error); }
});

export { router as financeRouter };
