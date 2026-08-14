import { Router } from 'express';
import { UserRole, VendorStatus } from '@prisma/client';
import { z } from 'zod';
import { db } from '../db';
import { hashPassword, signAccessToken, verifyPassword } from '../lib/auth';
import { requireAuth } from '../middleware/auth';

const router = Router();
const publicUser = { id: true, email: true, phone: true, firstName: true, lastName: true, role: true, locale: true } as const;

const registerSchema = z.object({
  email: z.email().transform((value) => value.toLowerCase()),
  phone: z.string().min(9).max(20).optional(),
  password: z.string().min(10).max(128),
  firstName: z.string().trim().min(2).max(60),
  lastName: z.string().trim().min(2).max(60),
});

router.post('/register', async (req, res, next) => {
  try {
    const input = registerSchema.parse(req.body);
    const existing = await db.user.findFirst({ where: { OR: [{ email: input.email }, ...(input.phone ? [{ phone: input.phone }] : [])] } });
    if (existing) return res.status(409).json({ error: { code: 'ACCOUNT_EXISTS', message: 'An account already exists with these details.' } });
    const { password, ...profile } = input;
    const user = await db.user.create({ data: { ...profile, passwordHash: await hashPassword(password) }, select: publicUser });
    const accessToken = signAccessToken({ id: user.id, email: user.email, role: user.role });
    return res.status(201).json({ data: { user, accessToken } });
  } catch (error) { next(error); }
});

router.post('/register/vendor', async (req, res, next) => {
  try {
    const input = registerSchema.extend({ businessName: z.string().trim().min(2).max(120), category: z.string().trim().min(2).max(80), city: z.string().trim().min(2).max(80), description: z.string().trim().max(2000).optional(), whatsapp: z.string().trim().max(20).optional() }).parse(req.body);
    const existing = await db.user.findFirst({ where: { OR: [{ email: input.email }, ...(input.phone ? [{ phone: input.phone }] : [])] } });
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

export { router as authRouter };
