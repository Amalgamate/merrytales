import { randomBytes } from 'crypto';
import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { db } from '../db';
import { emailFrame, sendEmail } from '../services/email';

const router = Router();
const origin = process.env.WEB_ORIGIN || process.env.CORS_ORIGIN?.split(',')[0] || 'http://localhost:5173';
const token = () => randomBytes(32).toString('base64url');
const button = (href: string, label: string) => `<a href="${href}" style="display:inline-block;background:#e93b82;color:#fff;text-decoration:none;padding:14px 24px;border-radius:999px;font-weight:700">${label}</a>`;

router.post('/newsletter', rateLimit({ windowMs: 60 * 60_000, limit: 8, standardHeaders: 'draft-8', legacyHeaders: false }), async (req, res, next) => {
  try {
    const { email, source } = z.object({ email: z.email().trim().toLowerCase(), source: z.string().trim().max(60).default('WEBSITE_POPUP') }).parse(req.body);
    const confirmToken = token(); const unsubscribeToken = token();
    const subscriber = await db.newsletterSubscriber.upsert({ where: { email }, create: { email, source, confirmToken, unsubscribeToken }, update: { status: 'PENDING', source, consentAt: new Date(), confirmToken, unsubscribeToken, confirmedAt: null, unsubscribedAt: null } });
    const confirmUrl = `${origin}/newsletter/confirm?token=${encodeURIComponent(subscriber.confirmToken)}`;
    const delivery = await sendEmail({ to: email, subject: 'Confirm your place on the Merry List', idempotencyKey: `newsletter-confirm-${subscriber.confirmToken}`, html: emailFrame(`<p style="color:#e93b82;font-weight:700;text-transform:uppercase;letter-spacing:.12em;font-size:12px">One final step</p><h1 style="font-size:30px;line-height:1.15">Confirm your subscription.</h1><p style="color:#626276;line-height:1.7">You asked to receive thoughtfully selected event ideas, planning notes and marketplace discoveries from Merry Tales.</p><p style="margin:28px 0">${button(confirmUrl, 'Confirm my email')}</p><p style="font-size:12px;color:#888">If you did not request this, simply ignore this email.</p>`) });
    res.status(201).json({ data: { subscribed: false, confirmationRequired: true, emailSent: delivery.sent, message: delivery.sent ? 'Check your inbox to confirm your subscription.' : 'Subscription saved. Email delivery awaits Resend configuration.' } });
  } catch (error) { next(error); }
});

router.post('/newsletter/confirm', async (req, res, next) => {
  try {
    const { token: confirmation } = z.object({ token: z.string().min(20).max(200) }).parse(req.body);
    const subscriber = await db.newsletterSubscriber.findUnique({ where: { confirmToken: confirmation } });
    if (!subscriber) return res.status(404).json({ error: { code: 'INVALID_CONFIRMATION', message: 'This confirmation link is invalid or expired.' } });
    const confirmed = await db.newsletterSubscriber.update({ where: { id: subscriber.id }, data: { status: 'SUBSCRIBED', confirmedAt: new Date(), unsubscribedAt: null } });
    const unsubscribeUrl = `${origin}/newsletter/unsubscribe?token=${encodeURIComponent(confirmed.unsubscribeToken)}`;
    await sendEmail({ to: confirmed.email, subject: 'Welcome to the Merry List', idempotencyKey: `newsletter-welcome-${confirmed.id}`, html: emailFrame(`<p style="color:#e93b82;font-weight:700;text-transform:uppercase;letter-spacing:.12em;font-size:12px">Welcome</p><h1 style="font-size:30px;line-height:1.15">You’re officially on the Merry List.</h1><p style="color:#626276;line-height:1.7">Expect useful planning ideas, fresh marketplace discoveries and inspiration for every kind of occasion.</p><p style="margin-top:30px;font-size:11px;color:#888">Changed your mind? <a href="${unsubscribeUrl}" style="color:#e93b82">Unsubscribe here</a>.</p>`) });
    res.json({ data: { confirmed: true } });
  } catch (error) { next(error); }
});

router.post('/newsletter/unsubscribe', async (req, res, next) => {
  try {
    const { token: unsubscribeToken } = z.object({ token: z.string().min(20).max(200) }).parse(req.body);
    const subscriber = await db.newsletterSubscriber.findUnique({ where: { unsubscribeToken } });
    if (!subscriber) return res.status(404).json({ error: { code: 'INVALID_UNSUBSCRIBE', message: 'This unsubscribe link is invalid.' } });
    await db.newsletterSubscriber.update({ where: { id: subscriber.id }, data: { status: 'UNSUBSCRIBED', unsubscribedAt: new Date() } });
    res.json({ data: { unsubscribed: true } });
  } catch (error) { next(error); }
});

export { router as engagementRouter };
