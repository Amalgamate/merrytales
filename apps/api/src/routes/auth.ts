import { Router } from 'express';
import { UserRole, VendorStatus } from '@prisma/client';
import { z } from 'zod';
import crypto from 'node:crypto';
import { db } from '../db';
import { generateRefreshToken, hashPassword, signAccessToken, verifyPassword, verifyRefreshToken } from '../lib/auth';
import { config, primaryWebOrigin } from '../config';
import { requireAuth } from '../middleware/auth';
import { sendEmail, emailFrame } from '../services/email';

const router = Router();
const publicUser = { id: true, email: true, phone: true, firstName: true, lastName: true, role: true, status: true, locale: true, mustChangePassword: true, emailVerified: true } as const;

const REFRESH_COOKIE = 'mt_refresh';
const cookieOptions = (prod: boolean) => ({
  httpOnly: true,
  sameSite: 'strict' as const,
  secure: prod,
  maxAge: 30 * 24 * 60 * 60 * 1000,
  path: '/api/auth',
});

async function issueRefreshToken(userId: string): Promise<string> {
  const { raw, hash } = generateRefreshToken();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  await db.refreshToken.create({ data: { tokenHash: hash, userId, expiresAt } });
  return raw;
}

const registerSchema = z.object({
  email: z.email().transform((value) => value.toLowerCase()),
  phone: z.string().trim().min(9).max(20),
  password: z.string().min(10).max(128),
  firstName: z.string().trim().min(2).max(60),
  lastName: z.string().trim().min(2).max(60),
  referralCode: z.string().trim().toUpperCase().regex(/^MT-[A-Z0-9]{6}$/).optional(),
});

function vendorSlug(input: string) {
  return input.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || 'vendor';
}

async function nextReferralCode() {
  let code = '';
  do { code = `MT-${Math.random().toString(36).slice(2, 8).toUpperCase()}`; } while (await db.user.findUnique({ where: { referralCode: code } }));
  return code;
}

router.post('/register', async (req, res, next) => {
  try {
    const input = registerSchema.parse(req.body);
    const existing = await db.user.findFirst({ where: { OR: [{ email: input.email }, { phone: input.phone }] } });
    if (existing) return res.status(409).json({ error: { code: 'ACCOUNT_EXISTS', message: 'An account already exists with these details.' } });
    const { password, referralCode, ...profile } = input;
    const referrer = referralCode ? await db.user.findFirst({ where: { referralCode, role: UserRole.CUSTOMER, status: 'ACTIVE' } }) : null;
    const user = await db.user.create({ data: { ...profile, passwordHash: await hashPassword(password), referralCode: await nextReferralCode(), ...(referrer ? { referralReceived: { create: { code: referralCode!, referrerId: referrer.id } } } : {}) }, select: publicUser });
    if (process.env.RESEND_API_KEY) {
      const rawVerifyToken = crypto.randomBytes(32).toString('hex');
      const verifyTokenHash = crypto.createHash('sha256').update(rawVerifyToken).digest('hex');
      const verifyExpiresAt = new Date(Date.now() + 24 * 60 * 60_000); // 24 hours
      await db.user.update({
        where: { id: user.id },
        data: { emailVerifyToken: verifyTokenHash, emailVerifyExpiresAt: verifyExpiresAt },
      });
      const verifyLink = `${primaryWebOrigin}/verify-email?token=${rawVerifyToken}`;
      const html = emailFrame(`
        <h2 style="margin:0 0 16px;font-size:22px;font-weight:800;color:#171735">Verify your email</h2>
        <p style="margin:0 0 24px;font-size:15px;color:#444;line-height:1.6">Welcome to Merry Tales! Click the button below to verify your email address. This link expires in 24 hours.</p>
        <a href="${verifyLink}" style="display:inline-block;background:#7c3aed;color:#fff;text-decoration:none;font-weight:700;font-size:15px;padding:14px 28px;border-radius:12px">Verify my email</a>
        <p style="margin:24px 0 0;font-size:13px;color:#888">If you didn't create this account, you can safely ignore this email.</p>
      `);
      await sendEmail({ to: user.email, subject: 'Verify your Merry Tales email', html, idempotencyKey: `email-verify-${verifyTokenHash}` }).catch(() => {}); // non-blocking
    }
    const accessToken = signAccessToken({ id: user.id, email: user.email, role: user.role, status: user.status, mustChangePassword: user.mustChangePassword });
    const refreshRaw = await issueRefreshToken(user.id);
    res.cookie(REFRESH_COOKIE, refreshRaw, cookieOptions(config.NODE_ENV === 'production'));
    return res.status(201).json({ data: { user, accessToken } });
  } catch (error) { next(error); }
});

router.post('/register/vendor', async (req, res, next) => {
  try {
    const input = registerSchema.extend({ businessName: z.string().trim().min(2).max(120), category: z.string().trim().min(2).max(80), city: z.string().trim().min(2).max(80), description: z.string().trim().max(2000).optional(), whatsapp: z.string().trim().max(20).optional() }).parse(req.body);
    const existing = await db.user.findFirst({ where: { OR: [{ email: input.email }, { phone: input.phone }] } });
    if (existing) return res.status(409).json({ error: { code: 'ACCOUNT_EXISTS', message: 'An account already exists with these details.' } });
    const baseSlug = vendorSlug(input.businessName);
    let slug = baseSlug; let suffix = 1;
    while (await db.vendorProfile.findUnique({ where: { slug } })) slug = `${baseSlug}-${++suffix}`;
    const passwordHash = await hashPassword(input.password);
    const user = await db.user.create({ data: { email: input.email, phone: input.phone, passwordHash, firstName: input.firstName, lastName: input.lastName, role: UserRole.VENDOR, vendor: { create: { businessName: input.businessName, slug, category: input.category, city: input.city, description: input.description, whatsapp: input.whatsapp, status: VendorStatus.PENDING_REVIEW } } }, select: publicUser });
    const accessToken = signAccessToken({ id: user.id, email: user.email, role: user.role, status: user.status, mustChangePassword: user.mustChangePassword });
    const refreshRaw = await issueRefreshToken(user.id);
    res.cookie(REFRESH_COOKIE, refreshRaw, cookieOptions(config.NODE_ENV === 'production'));
    return res.status(201).json({ data: { user, accessToken } });
  } catch (error) { next(error); }
});

router.post('/login', async (req, res, next) => {
  try {
    const input = z.object({ email: z.email().transform((v) => v.toLowerCase()), password: z.string().min(1) }).parse(req.body);
    const userRecord = await db.user.findUnique({ where: { email: input.email } });
    if (!userRecord || !(await verifyPassword(input.password, userRecord.passwordHash))) {
      return res.status(401).json({ error: { code: 'INVALID_CREDENTIALS', message: 'Email or password is incorrect.' } });
    }
    const { passwordHash: _, ...user } = userRecord;
    const accessToken = signAccessToken({ id: user.id, email: user.email, role: user.role, status: user.status, mustChangePassword: user.mustChangePassword });
    const refreshRaw = await issueRefreshToken(user.id);
    res.cookie(REFRESH_COOKIE, refreshRaw, cookieOptions(config.NODE_ENV === 'production'));
    return res.json({ data: { user, accessToken } });
  } catch (error) { next(error); }
});

router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const user = await db.user.findUnique({ where: { id: req.user!.id }, select: publicUser });
    if (!user) return res.status(404).json({ error: { code: 'USER_NOT_FOUND', message: 'Account not found.' } });
    return res.json({ data: user });
  } catch (error) { next(error); }
});

router.post('/change-password', requireAuth, async (req, res, next) => {
  try {
    const input = z.object({
      currentPassword: z.string().min(1),
      newPassword: z.string().min(16, 'Use at least 16 characters for your new password.').max(128),
    }).parse(req.body);
    const userRecord = await db.user.findUnique({ where: { id: req.user!.id } });
    if (!userRecord || !(await verifyPassword(input.currentPassword, userRecord.passwordHash))) {
      return res.status(401).json({ error: { code: 'INVALID_CREDENTIALS', message: 'Your current password is incorrect.' } });
    }
    if (await verifyPassword(input.newPassword, userRecord.passwordHash)) {
      return res.status(400).json({ error: { code: 'PASSWORD_REUSED', message: 'Choose a different password from your temporary password.' } });
    }
    const user = await db.user.update({
      where: { id: userRecord.id },
      data: { passwordHash: await hashPassword(input.newPassword), mustChangePassword: false },
      select: publicUser,
    });
    return res.json({ data: { user, accessToken: signAccessToken({ id: user.id, email: user.email, role: user.role, status: user.status, mustChangePassword: user.mustChangePassword }) } });
  } catch (error) { next(error); }
});

router.post('/forgot-password', async (req, res, next) => {
  try {
    const { email } = z.object({ email: z.email().transform((v) => v.toLowerCase()) }).parse(req.body);
    const user = await db.user.findFirst({ where: { email } });
    if (user) {
      const rawToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
      const expiresAt = new Date(Date.now() + 60 * 60_000);
      await db.user.update({ where: { id: user.id }, data: { passwordResetToken: tokenHash, passwordResetExpiresAt: expiresAt } });
      const webOrigin = process.env.WEB_ORIGIN?.split(',')[0] ?? 'http://localhost:5173';
      const resetLink = `${webOrigin}/reset-password?token=${rawToken}`;
      const html = emailFrame(`
        <h2 style="margin:0 0 16px;font-size:22px;font-weight:800;color:#171735">Reset your password</h2>
        <p style="margin:0 0 24px;font-size:15px;color:#444;line-height:1.6">We received a request to reset the password for your Merry Tales account. Click the button below to choose a new password. This link expires in 1 hour.</p>
        <a href="${resetLink}" style="display:inline-block;background:#7c3aed;color:#fff;text-decoration:none;font-weight:700;font-size:15px;padding:14px 28px;border-radius:12px">Reset my password</a>
        <p style="margin:24px 0 0;font-size:13px;color:#888">If you didn't request this, you can safely ignore this email. Your password won't change.</p>
      `);
      await sendEmail({ to: user.email, subject: 'Reset your Merry Tales password', html, idempotencyKey: `pwd-reset-${tokenHash}` });
    }
    return res.json({ data: { ok: true } });
  } catch (error) { next(error); }
});

router.post('/reset-password', async (req, res, next) => {
  try {
    const { token, newPassword } = z.object({
      token: z.string().min(1),
      newPassword: z.string().min(10, 'Password must be at least 10 characters.').max(128),
    }).parse(req.body);
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const user = await db.user.findFirst({
      where: { passwordResetToken: tokenHash, passwordResetExpiresAt: { gt: new Date() }, status: 'ACTIVE' },
    });
    if (!user) {
      return res.status(400).json({ error: { code: 'INVALID_RESET_TOKEN', message: 'This link is invalid or has expired.' } });
    }
    await db.user.update({
      where: { id: user.id },
      data: { passwordHash: await hashPassword(newPassword), passwordResetToken: null, passwordResetExpiresAt: null, mustChangePassword: false },
    });
    return res.json({ data: { ok: true } });
  } catch (error) { next(error); }
});

router.post('/verify-email', async (req, res, next) => {
  try {
    const { token } = z.object({ token: z.string().min(1) }).parse(req.body);
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const user = await db.user.findFirst({
      where: {
        emailVerifyToken: tokenHash,
        emailVerifyExpiresAt: { gt: new Date() },
        emailVerified: false,
      },
    });
    if (!user) {
      return res.status(400).json({ error: { code: 'INVALID_VERIFY_TOKEN', message: 'This verification link is invalid or has expired.' } });
    }
    await db.user.update({
      where: { id: user.id },
      data: { emailVerified: true, emailVerifyToken: null, emailVerifyExpiresAt: null },
    });
    return res.json({ data: { ok: true } });
  } catch (error) { next(error); }
});

router.post('/refresh', async (req, res, next) => {
  try {
    const rawToken: unknown = req.cookies?.[REFRESH_COOKIE];
    if (!rawToken || typeof rawToken !== 'string') {
      return res.status(401).json({ error: { code: 'NO_REFRESH_TOKEN', message: 'Sign in is required.' } });
    }
    let userId: string;
    try {
      ({ userId } = verifyRefreshToken(rawToken));
    } catch {
      return res.status(401).json({ error: { code: 'INVALID_REFRESH_TOKEN', message: 'Your session has expired. Please sign in again.' } });
    }
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const record = await db.refreshToken.findUnique({ where: { tokenHash } });
    if (!record || record.userId !== userId || record.revokedAt || record.expiresAt < new Date()) {
      return res.status(401).json({ error: { code: 'INVALID_REFRESH_TOKEN', message: 'Your session has expired. Please sign in again.' } });
    }
    const user = await db.user.findUnique({ where: { id: userId }, select: { id: true, email: true, role: true, status: true, mustChangePassword: true } });
    if (!user || user.status !== 'ACTIVE') {
      return res.status(403).json({ error: { code: 'ACCOUNT_UNAVAILABLE', message: 'This account is not currently active.' } });
    }
    // Rotate: revoke old, issue new
    await db.refreshToken.update({ where: { tokenHash }, data: { revokedAt: new Date() } });
    const newRefreshRaw = await issueRefreshToken(userId);
    const accessToken = signAccessToken({ id: user.id, email: user.email, role: user.role, status: user.status, mustChangePassword: user.mustChangePassword });
    res.cookie(REFRESH_COOKIE, newRefreshRaw, cookieOptions(config.NODE_ENV === 'production'));
    return res.json({ data: { accessToken } });
  } catch (error) { next(error); }
});

router.post('/resend-verification', requireAuth, async (req, res, next) => {
  try {
    const user = await db.user.findUnique({
      where: { id: req.user!.id },
      select: { id: true, email: true, emailVerified: true },
    });
    if (!user || user.emailVerified) {
      return res.json({ data: { ok: true } }); // already verified — no-op
    }
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60_000);
    await db.user.update({ where: { id: user.id }, data: { emailVerifyToken: tokenHash, emailVerifyExpiresAt: expiresAt } });
    const verifyLink = `${primaryWebOrigin}/verify-email?token=${rawToken}`;
    const html = emailFrame(`
      <h2 style="margin:0 0 16px;font-size:22px;font-weight:800;color:#171735">Verify your email</h2>
      <p style="margin:0 0 24px;font-size:15px;color:#444;line-height:1.6">Here is your new Merry Tales email verification link. It expires in 24 hours.</p>
      <a href="${verifyLink}" style="display:inline-block;background:#7c3aed;color:#fff;text-decoration:none;font-weight:700;font-size:15px;padding:14px 28px;border-radius:12px">Verify my email</a>
    `);
    await sendEmail({ to: user.email, subject: 'Verify your Merry Tales email', html, idempotencyKey: `email-verify-resend-${tokenHash}` }).catch(() => {});
    return res.json({ data: { ok: true } });
  } catch (error) { next(error); }
});

router.post('/logout', requireAuth, async (req, res, next) => {
  try {
    await db.refreshToken.deleteMany({ where: { userId: req.user!.id } });
    res.clearCookie(REFRESH_COOKIE, { path: '/api/auth' });
    return res.json({ data: { ok: true } });
  } catch (error) { next(error); }
});

export { router as authRouter };
