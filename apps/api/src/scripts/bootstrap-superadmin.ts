import { randomBytes } from 'crypto';
import { UserRole } from '@prisma/client';
import { db } from '../db';
import { hashPassword } from '../lib/auth';

async function main() {
  if (process.env.NODE_ENV !== 'production' || process.env.ALLOW_SUPERADMIN_BOOTSTRAP !== 'true') {
    throw new Error('This command can only run in production with explicit approval.');
  }

  const email = process.env.BOOTSTRAP_SUPERADMIN_EMAIL?.trim().toLowerCase();
  if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
    throw new Error('BOOTSTRAP_SUPERADMIN_EMAIL must be a valid email address.');
  }
  const existingSuperadmin = await db.user.findFirst({ where: { role: UserRole.SUPERADMIN }, select: { id: true } });
  if (existingSuperadmin) throw new Error('A superadmin already exists; refusing to create or overwrite an account.');
  const existingUser = await db.user.findUnique({ where: { email }, select: { id: true } });
  if (existingUser) throw new Error('This email already belongs to an account; refusing to change its role or password.');

  const temporaryPassword = `MT-${randomBytes(24).toString('base64url')}!`;
  const user = await db.user.create({
    data: {
      email,
      firstName: 'Merry Tales',
      lastName: 'Superadmin',
      role: UserRole.SUPERADMIN,
      passwordHash: await hashPassword(temporaryPassword),
      mustChangePassword: true,
    },
    select: { email: true },
  });
  console.log(JSON.stringify({ email: user.email, temporaryPassword, mustChangePassword: true }));
}

main()
  .catch((error: unknown) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; })
  .finally(() => db.$disconnect());
