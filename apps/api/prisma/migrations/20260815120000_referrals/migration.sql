CREATE TYPE "ReferralStatus" AS ENUM ('PENDING', 'QUALIFIED');
CREATE TYPE "ReferralCreditStatus" AS ENUM ('AVAILABLE', 'REDEEMED', 'EXPIRED');
CREATE TYPE "ReferralRewardKind" AS ENUM ('PLAN_COMPLETION', 'FIRST_PURCHASE');

ALTER TABLE "User" ADD COLUMN "referralCode" TEXT;
CREATE UNIQUE INDEX "User_referralCode_key" ON "User"("referralCode");

CREATE TABLE "Referral" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "referrerId" TEXT NOT NULL,
  "refereeId" TEXT NOT NULL,
  "status" "ReferralStatus" NOT NULL DEFAULT 'PENDING',
  "referrerCredit" DECIMAL(12,2) NOT NULL DEFAULT 200,
  "refereeCredit" DECIMAL(12,2) NOT NULL DEFAULT 200,
  "qualifiedAt" TIMESTAMP(3),
  "purchaseQualifiedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Referral_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Referral_refereeId_key" ON "Referral"("refereeId");
CREATE INDEX "Referral_referrerId_status_createdAt_idx" ON "Referral"("referrerId", "status", "createdAt");

CREATE TABLE "ReferralCredit" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "referralId" TEXT NOT NULL,
  "amount" DECIMAL(12,2) NOT NULL,
  "kind" "ReferralRewardKind" NOT NULL DEFAULT 'PLAN_COMPLETION',
  "status" "ReferralCreditStatus" NOT NULL DEFAULT 'AVAILABLE',
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ReferralCredit_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ReferralCredit_referralId_userId_kind_key" ON "ReferralCredit"("referralId", "userId", "kind");
CREATE INDEX "ReferralCredit_userId_status_expiresAt_idx" ON "ReferralCredit"("userId", "status", "expiresAt");

ALTER TABLE "Referral" ADD CONSTRAINT "Referral_referrerId_fkey" FOREIGN KEY ("referrerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_refereeId_fkey" FOREIGN KEY ("refereeId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ReferralCredit" ADD CONSTRAINT "ReferralCredit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ReferralCredit" ADD CONSTRAINT "ReferralCredit_referralId_fkey" FOREIGN KEY ("referralId") REFERENCES "Referral"("id") ON DELETE CASCADE ON UPDATE CASCADE;
