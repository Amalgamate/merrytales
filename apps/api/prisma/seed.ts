import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const db = new PrismaClient();

async function main() {
  // ⚠️  DEVELOPMENT SEED ONLY — do NOT run against production.
  // To bootstrap a production superadmin, use: npx ts-node src/scripts/bootstrap-superadmin.ts

  // ── Platform accounts ────────────────────────────────────────────────────────
  // Only create these if they don't already exist. Passwords are never overwritten
  // on subsequent runs — change them via the admin panel or bootstrap script.
  const devPassword = process.env.SEED_PASSWORD ?? 'ChangeMe@Dev2026!';
  const passwordHash = await bcrypt.hash(devPassword, 12);

  await db.user.upsert({
    where: { email: 'superadmin@merrytales.co.ke' },
    update: { role: UserRole.SUPERADMIN },
    create: {
      email: 'superadmin@merrytales.co.ke',
      passwordHash,
      firstName: 'Merry Tales',
      lastName: 'Superadmin',
      role: UserRole.SUPERADMIN,
      mustChangePassword: true,
    },
  });

  await db.user.upsert({
    where: { email: 'admin@merrytales.co.ke' },
    update: { role: UserRole.ADMIN },
    create: {
      email: 'admin@merrytales.co.ke',
      passwordHash,
      firstName: 'Merry Tales',
      lastName: 'Administrator',
      role: UserRole.ADMIN,
      mustChangePassword: true,
    },
  });

  await db.user.upsert({
    where: { email: 'staff@merrytales.co.ke' },
    update: { role: UserRole.STAFF },
    create: {
      email: 'staff@merrytales.co.ke',
      passwordHash,
      firstName: 'Merry Tales',
      lastName: 'Staff',
      role: UserRole.STAFF,
      mustChangePassword: true,
    },
  });

  await db.user.upsert({
    where: { email: 'studio@merrytales.co.ke' },
    update: { role: UserRole.STUDIO },
    create: {
      email: 'studio@merrytales.co.ke',
      passwordHash,
      firstName: 'Merry Tales',
      lastName: 'Studio',
      role: UserRole.STUDIO,
      mustChangePassword: true,
    },
  });

  console.log('✓ Platform accounts seeded (superadmin, admin, staff, studio)');

  // ── System settings ──────────────────────────────────────────────────────────
  // These are operational defaults that can be overridden via the admin panel
  // at /admin → System controls. Values here are only applied on first run
  // (update: {} means subsequent runs leave existing values untouched).
  const systemSettings = [
    {
      key: 'delivery_fees',
      value: { Nairobi: 500, Kiambu: 700, Mombasa: 1200, Nakuru: 800, Kisumu: 900, default: 1000 },
    },
    { key: 'referral_first_purchase_referrer_credit', value: 500 },
    { key: 'referral_first_purchase_referee_credit', value: 300 },
    { key: 'referral_credit_expiry_days', value: 180 },
    // Stories are managed via the admin panel — seed an empty array so the
    // GET /api/stories endpoint returns [] rather than null on a fresh install.
    { key: 'stories', value: [] },
  ];

  for (const setting of systemSettings) {
    await db.systemSetting.upsert({
      where: { key: setting.key },
      update: {}, // never overwrite admin-configured values on re-seed
      create: { key: setting.key, value: setting.value },
    });
  }

  console.log('✓ System settings seeded (delivery fees, referral config, stories placeholder)');
}

main()
  .then(() => console.log('Seed complete.'))
  .catch((err) => { console.error('Seed failed:', err); process.exit(1); })
  .finally(() => db.$disconnect());
