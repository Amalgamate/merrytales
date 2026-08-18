import { Router } from 'express';
import { UserRole, VendorStatus } from '@prisma/client';
import { z } from 'zod';
import { db } from '../db';
import { hashPassword, signAccessToken, verifyPassword } from '../lib/auth';
import { requireAuth } from '../middleware/auth';

const router = Router();
const publicUser = { id: true, email: true, phone: true, firstName: true, lastName: true, role: true, locale: true, mustChangePassword: true } as const;

const registerSchema = z.object({
  email: z.email().transform((value) => value.toLowerCase()),
  phone: z.string().trim().min(9).max(20),
  password: z.string().min(10).max(128),
  firstName: z.string().trim().min(2).max(60),
  lastName: z.string().trim().min(2).max(60),
  referralCode: z.string().trim().toUpperCase().regex(/^MT-[A-Z0-9]{6}$/).optional(),
});

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
    const accessToken = signAccessToken({ id: user.id, email: user.email, role: user.role });
    return res.status(201).json({ data: { user, accessToken } });
  } catch (error) { next(error); }
});

router.post('/register/vendor', async (req, res, next) => {
  try {
    const input = registerSchema.extend({ businessName: z.string().trim().min(2).max(120), category: z.string().trim().min(2).max(80), city: z.string().trim().min(2).max(80), description: z.string().trim().max(2000).optional(), whatsapp: z.string().trim().max(20).optional() }).parse(req.body);
    const existing = await db.user.findFirst({ where: { OR: [{ email: input.email }, { phone: input.phone }] } });
    if (existing) return res.status(409).json({ error: { code: 'ACCOUNT_EXISTS', message: 'An account already exists with these details.' } });
    const baseSlug = input.businessName.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || 'vendor';
    let slug = baseSlug; let suffix = 1;
    while (await db.vendorProfile.findUnique({ where: { slug } })) slug = `${baseSlug}-${++suffix}`;
    const passwordHash = await hashPassword(input.password);
    const user = await db.user.create({ data: { email: input.email, phone: input.phone, passwordHash, firstName: input.firstName, lastName: input.lastName, role: UserRole.VENDOR, vendor: { create: { businessName: input.businessName, slug, category: input.category, city: input.city, description: input.description, whatsapp: input.whatsapp, status: VendorStatus.PENDING_REVIEW } } }, select: publicUser });
    return res.status(201).json({ data: { user, accessToken: signAccessToken({ id: user.id, email: user.email, role: user.role }) } });
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
    return res.json({ data: { user, accessToken: signAccessToken({ id: user.id, email: user.email, role: user.role }) } });
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
    return res.json({ data: { user, accessToken: signAccessToken({ id: user.id, email: user.email, role: user.role }) } });
  } catch (error) { next(error); }
});

export { router as authRouter };
