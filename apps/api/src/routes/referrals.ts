import { Router } from 'express';
import { ReferralCreditStatus, ReferralStatus } from '@prisma/client';
import { db } from '../db';
import { requireAuth } from '../middleware/auth';

const router = Router();
router.use(requireAuth);

async function ensureCode(userId: string) {
  const current = await db.user.findUnique({ where: { id: userId }, select: { referralCode: true } });
  if (current?.referralCode) return current.referralCode;
  let code = '';
  do { code = `MT-${Math.random().toString(36).slice(2, 8).toUpperCase()}`; } while (await db.user.findUnique({ where: { referralCode: code } }));
  await db.user.update({ where: { id: userId }, data: { referralCode: code } });
  return code;
}

router.get('/me', async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const [code, referrals, credits] = await Promise.all([
      ensureCode(userId),
      db.referral.findMany({ where: { referrerId: userId }, select: { id: true, status: true, createdAt: true, qualifiedAt: true, referee: { select: { firstName: true, lastName: true } } }, orderBy: { createdAt: 'desc' }, take: 20 }),
      db.referralCredit.aggregate({ where: { userId, status: ReferralCreditStatus.AVAILABLE, expiresAt: { gt: new Date() } }, _sum: { amount: true } }),
    ]);
    const earned = referrals.filter(item => item.status === ReferralStatus.QUALIFIED).length;
    res.json({ data: { code, balance: Number(credits._sum.amount ?? 0), earned, pending: referrals.length - earned, referrals: referrals.map(item => ({ id: item.id, name: `${item.referee.firstName} ${item.referee.lastName.slice(0, 1)}.`, status: item.status, createdAt: item.createdAt, qualifiedAt: item.qualifiedAt })) } });
  } catch (error) { next(error); }
});

export { router as referralsRouter };
