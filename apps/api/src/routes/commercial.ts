import { randomBytes } from 'crypto';
import { InvoiceStatus, UserRole, VendorQuoteStatus } from '@prisma/client';
import { Router } from 'express';
import { z } from 'zod';
import { allowedOrigins } from '../config';
import { db } from '../db';
import { requireAuth, requireRole } from '../middleware/auth';

const router = Router();
const money = z.coerce.number().finite().nonnegative().max(1_000_000_000);
const lineSchema = z.object({ description: z.string().trim().min(2).max(240), quantity: z.coerce.number().positive().max(100_000), unitPrice: money, taxRate: z.coerce.number().min(0).max(100).default(0) });
const publicInclude = { lines: { orderBy: { sortOrder: 'asc' as const } }, vendor: { select: { businessName: true, slug: true, category: true, city: true, whatsapp: true, status: true } }, invoice: true };
const maskPhone = (phone: string) => phone.length > 4 ? `${'*'.repeat(Math.max(4, phone.length - 4))}${phone.slice(-4)}` : '****';
const phoneDigits = (phone: string) => phone.replace(/\D/g, '').replace(/^0/, '254');
const webOrigin = allowedOrigins[0] ?? 'http://localhost:5173';
const isDecisionFinal = (status: VendorQuoteStatus) => status === VendorQuoteStatus.ACCEPTED || status === VendorQuoteStatus.DECLINED;
const isClosed = (status: VendorQuoteStatus) => isDecisionFinal(status) || status === VendorQuoteStatus.CANCELLED;

router.get('/review/:token', async (req, res, next) => {
  try {
    const quote = await db.vendorQuote.findUnique({ where: { reviewToken: req.params.token }, include: publicInclude });
    if (!quote) return res.status(404).json({ error: { code: 'QUOTE_NOT_FOUND', message: 'This quote link is invalid or no longer available.' } });
    const expired = quote.validUntil ? quote.validUntil < new Date() : false;
    if (expired && !isDecisionFinal(quote.status)) await db.vendorQuote.update({ where: { id: quote.id }, data: { status: VendorQuoteStatus.EXPIRED } });
    else if (quote.status === VendorQuoteStatus.SENT) await db.vendorQuote.update({ where: { id: quote.id }, data: { status: VendorQuoteStatus.VIEWED, viewedAt: new Date() } });
    const { clientPhone, clientEmail, ...safe } = quote;
    return res.json({ data: { ...safe, status: expired && !isDecisionFinal(quote.status) ? VendorQuoteStatus.EXPIRED : quote.status, clientPhone: maskPhone(clientPhone), clientEmail: clientEmail ? clientEmail.replace(/^(.{2}).*(@.*)$/, '$1***$2') : null } });
  } catch (error) { return next(error); }
});

router.post('/review/:token/decision', async (req, res, next) => {
  try {
    const input = z.object({ decision: z.enum(['ACCEPTED', 'DECLINED']), signerName: z.string().trim().min(2).max(120), note: z.string().trim().max(500).optional() }).parse(req.body);
    const quote = await db.vendorQuote.findUnique({ where: { reviewToken: req.params.token } });
    if (!quote) return res.status(404).json({ error: { code: 'QUOTE_NOT_FOUND', message: 'This quote link is invalid or no longer available.' } });
    if (quote.validUntil && quote.validUntil < new Date()) return res.status(409).json({ error: { code: 'QUOTE_EXPIRED', message: 'This quote has expired. Ask the vendor for a revised quote.' } });
    if (isClosed(quote.status)) return res.status(409).json({ error: { code: 'QUOTE_FINAL', message: `This quote is already ${quote.status.toLowerCase()}.` } });
    const updated = await db.$transaction(async (tx) => {
      const result = await tx.vendorQuote.update({ where: { id: quote.id }, data: { status: input.decision, acceptedAt: input.decision === 'ACCEPTED' ? new Date() : undefined, declinedAt: input.decision === 'DECLINED' ? new Date() : undefined, notes: input.note ? `${quote.notes ? `${quote.notes}\n\n` : ''}Customer note (${input.signerName}): ${input.note}` : quote.notes } });
      await tx.auditLog.create({ data: { action: `VENDOR_QUOTE_${input.decision}`, entityType: 'VendorQuote', entityId: quote.id, metadata: { signerName: input.signerName, decision: input.decision } } });
      return result;
    });
    return res.json({ data: updated });
  } catch (error) { return next(error); }
});

router.use('/vendor', requireAuth, requireRole(UserRole.VENDOR, UserRole.ADMIN, UserRole.SUPERADMIN));

async function currentVendor(userId: string) { return db.vendorProfile.findUnique({ where: { ownerId: userId } }); }

router.get('/vendor/quotes', async (req, res, next) => {
  try { const vendor = await currentVendor(req.user!.id); if (!vendor) return res.status(404).json({ error: { code: 'VENDOR_NOT_FOUND', message: 'Vendor profile not found.' } }); return res.json({ data: await db.vendorQuote.findMany({ where: { vendorId: vendor.id }, include: { lines: true, invoice: true }, orderBy: { createdAt: 'desc' } }) }); }
  catch (error) { return next(error); }
});

router.post('/vendor/quotes', async (req, res, next) => {
  try {
    const input = z.object({ clientName: z.string().trim().min(2).max(120), clientPhone: z.string().trim().min(9).max(20), clientEmail: z.email().optional(), title: z.string().trim().min(3).max(160), currency: z.string().length(3).default('KES'), discountAmount: money.default(0), depositAmount: money.optional(), notes: z.string().trim().max(2000).optional(), terms: z.string().trim().max(3000).optional(), validUntil: z.iso.datetime().optional(), lines: z.array(lineSchema).min(1).max(100) }).parse(req.body);
    const vendor = await currentVendor(req.user!.id); if (!vendor) return res.status(404).json({ error: { code: 'VENDOR_NOT_FOUND', message: 'Vendor profile not found.' } });
    const lines = input.lines.map((line, index) => { const base = Math.round(line.quantity * line.unitPrice * 100) / 100; return { ...line, lineTotal: Math.round(base * (1 + line.taxRate / 100) * 100) / 100, sortOrder: index }; });
    const subtotal = Math.round(input.lines.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0) * 100) / 100;
    const withTax = Math.round(lines.reduce((sum, line) => sum + line.lineTotal, 0) * 100) / 100;
    const taxAmount = Math.round((withTax - subtotal) * 100) / 100; const total = Math.max(0, Math.round((withTax - input.discountAmount) * 100) / 100);
    if (input.depositAmount !== undefined && input.depositAmount > total) return res.status(400).json({ error: { code: 'INVALID_DEPOSIT', message: 'Deposit cannot exceed quote total.' } });
    const quote = await db.vendorQuote.create({ data: { vendorId: vendor.id, createdById: req.user!.id, quoteNumber: `VQ-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`, reviewToken: randomBytes(24).toString('base64url'), clientName: input.clientName, clientPhone: input.clientPhone, clientEmail: input.clientEmail, title: input.title, currency: input.currency.toUpperCase(), subtotal, taxAmount, discountAmount: input.discountAmount, total, depositAmount: input.depositAmount, notes: input.notes, terms: input.terms, validUntil: input.validUntil ? new Date(input.validUntil) : undefined, lines: { create: lines } }, include: { lines: true } });
    return res.status(201).json({ data: quote });
  } catch (error) { return next(error); }
});

router.post('/vendor/quotes/:id/share', async (req, res, next) => {
  try {
    const vendor = await currentVendor(req.user!.id); const quote = vendor ? await db.vendorQuote.findFirst({ where: { id: req.params.id, vendorId: vendor.id } }) : null;
    if (!quote || !vendor) return res.status(404).json({ error: { code: 'QUOTE_NOT_FOUND', message: 'Quote not found.' } });
    if (isClosed(quote.status)) return res.status(409).json({ error: { code: 'QUOTE_FINAL', message: 'This quote can no longer be sent.' } });
    const reviewUrl = `${webOrigin}/quote/${quote.reviewToken}`;
    const message = `Hello ${quote.clientName},\n\n${vendor.businessName} has prepared quote ${quote.quoteNumber} for ${quote.title}.\n\nTotal: ${quote.currency} ${Number(quote.total).toLocaleString('en-KE')}\n${quote.depositAmount ? `Deposit: ${quote.currency} ${Number(quote.depositAmount).toLocaleString('en-KE')}\n` : ''}\nReview and approve securely on Merry Tales:\n${reviewUrl}\n\nPlease do not share this private link.`;
    await db.vendorQuote.update({ where: { id: quote.id }, data: { status: VendorQuoteStatus.SENT, sentAt: new Date() } });
    await db.auditLog.create({ data: { actorId: req.user!.id, action: 'VENDOR_QUOTE_SHARED_WHATSAPP', entityType: 'VendorQuote', entityId: quote.id, metadata: { channel: 'WHATSAPP_CLICK_TO_CHAT' } } });
    return res.json({ data: { reviewUrl, whatsappUrl: `https://wa.me/${phoneDigits(quote.clientPhone)}?text=${encodeURIComponent(message)}`, message } });
  } catch (error) { return next(error); }
});

router.post('/vendor/quotes/:id/invoice', async (req, res, next) => {
  try {
    const input = z.object({ dueAt: z.iso.datetime().optional() }).parse(req.body ?? {}); const vendor = await currentVendor(req.user!.id);
    const quote = vendor ? await db.vendorQuote.findFirst({ where: { id: req.params.id, vendorId: vendor.id }, include: { invoice: true } }) : null;
    if (!quote || !vendor) return res.status(404).json({ error: { code: 'QUOTE_NOT_FOUND', message: 'Quote not found.' } });
    if (quote.status !== VendorQuoteStatus.ACCEPTED) return res.status(409).json({ error: { code: 'QUOTE_NOT_ACCEPTED', message: 'Only an accepted quote can become an invoice.' } });
    if (quote.invoice) return res.status(409).json({ error: { code: 'INVOICE_EXISTS', message: 'This quote already has an invoice.' } });
    const invoice = await db.invoice.create({ data: { vendorId: vendor.id, quoteId: quote.id, invoiceNumber: `INV-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`, status: InvoiceStatus.SENT, currency: quote.currency, subtotal: quote.subtotal, taxAmount: quote.taxAmount, total: quote.total, balanceDue: quote.total, dueAt: input.dueAt ? new Date(input.dueAt) : undefined, sentAt: new Date() } });
    return res.status(201).json({ data: invoice });
  } catch (error) { return next(error); }
});

router.get('/vendor/invoices', async (req, res, next) => {
  try { const vendor = await currentVendor(req.user!.id); if (!vendor) return res.status(404).json({ error: { code: 'VENDOR_NOT_FOUND', message: 'Vendor profile not found.' } }); return res.json({ data: await db.invoice.findMany({ where: { vendorId: vendor.id }, include: { quote: { select: { clientName: true, clientPhone: true, title: true, reviewToken: true } } }, orderBy: { createdAt: 'desc' } }) }); }
  catch (error) { return next(error); }
});

export { router as commercialRouter };
