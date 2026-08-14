CREATE TYPE "ComplianceStatus" AS ENUM ('NOT_SUBMITTED', 'PENDING', 'VERIFIED', 'EXPIRED', 'REJECTED');
CREATE TYPE "VerificationDocumentType" AS ENUM ('IDENTITY', 'BUSINESS_REGISTRATION', 'KRA_PIN', 'TAX_COMPLIANCE_CERTIFICATE', 'ETIMS_PROOF', 'COUNTY_BUSINESS_PERMIT', 'SECTOR_LICENCE', 'BANK_OR_MPESA_PROOF', 'ODPC_CERTIFICATE', 'INSURANCE', 'OTHER');
CREATE TYPE "DocumentReviewStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'EXPIRED');
CREATE TYPE "ListingModerationStatus" AS ENUM ('DRAFT', 'PENDING_REVIEW', 'CHANGES_REQUIRED', 'APPROVED', 'REJECTED', 'SUSPENDED', 'ARCHIVED');
CREATE TYPE "SubscriptionTier" AS ENUM ('STARTER', 'GROWTH', 'BUSINESS', 'PRO');
CREATE TYPE "SubscriptionStatus" AS ENUM ('PENDING_PAYMENT', 'ACTIVE', 'PAST_DUE', 'CANCELLED', 'EXPIRED');

ALTER TABLE "VendorProfile"
  ADD COLUMN "kraPin" TEXT,
  ADD COLUMN "businessRegistrationNumber" TEXT,
  ADD COLUMN "taxComplianceStatus" "ComplianceStatus" NOT NULL DEFAULT 'NOT_SUBMITTED',
  ADD COLUMN "taxComplianceExpiresAt" TIMESTAMP(3),
  ADD COLUMN "etimsStatus" "ComplianceStatus" NOT NULL DEFAULT 'NOT_SUBMITTED',
  ADD COLUMN "verifiedAt" TIMESTAMP(3),
  ADD COLUMN "verificationNotes" TEXT,
  ADD COLUMN "subscriptionTier" "SubscriptionTier" NOT NULL DEFAULT 'STARTER',
  ADD COLUMN "subscriptionStatus" "SubscriptionStatus" NOT NULL DEFAULT 'PENDING_PAYMENT',
  ADD COLUMN "subscriptionEndsAt" TIMESTAMP(3);

CREATE UNIQUE INDEX "VendorProfile_kraPin_key" ON "VendorProfile"("kraPin");

ALTER TABLE "Product"
  ADD COLUMN "moderationStatus" "ListingModerationStatus" NOT NULL DEFAULT 'DRAFT',
  ADD COLUMN "moderationReason" TEXT,
  ADD COLUMN "submittedAt" TIMESTAMP(3),
  ADD COLUMN "approvedAt" TIMESTAMP(3),
  ADD COLUMN "moderatedById" TEXT;

-- Preserve catalogue continuity for listings that pre-date the moderation workflow.
UPDATE "Product" SET "moderationStatus" = 'APPROVED', "approvedAt" = CURRENT_TIMESTAMP WHERE "isActive" = true;

CREATE TABLE "VerificationDocument" (
  "id" TEXT NOT NULL,
  "vendorId" TEXT NOT NULL,
  "type" "VerificationDocumentType" NOT NULL,
  "referenceNumber" TEXT,
  "fileUrl" TEXT NOT NULL,
  "issuedAt" TIMESTAMP(3),
  "expiresAt" TIMESTAMP(3),
  "status" "DocumentReviewStatus" NOT NULL DEFAULT 'PENDING',
  "reviewNotes" TEXT,
  "reviewedById" TEXT,
  "reviewedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "VerificationDocument_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "VendorSubscription" (
  "id" TEXT NOT NULL,
  "vendorId" TEXT NOT NULL,
  "tier" "SubscriptionTier" NOT NULL,
  "status" "SubscriptionStatus" NOT NULL DEFAULT 'PENDING_PAYMENT',
  "priceKes" DECIMAL(12,2) NOT NULL,
  "startsAt" TIMESTAMP(3),
  "endsAt" TIMESTAMP(3),
  "paymentReference" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "VendorSubscription_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "VerificationDocument_vendorId_type_status_idx" ON "VerificationDocument"("vendorId", "type", "status");
CREATE INDEX "VerificationDocument_status_expiresAt_idx" ON "VerificationDocument"("status", "expiresAt");
CREATE INDEX "VendorSubscription_vendorId_status_idx" ON "VendorSubscription"("vendorId", "status");
CREATE INDEX "Product_moderationStatus_submittedAt_idx" ON "Product"("moderationStatus", "submittedAt");

ALTER TABLE "VerificationDocument" ADD CONSTRAINT "VerificationDocument_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "VendorProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "VerificationDocument" ADD CONSTRAINT "VerificationDocument_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "VendorSubscription" ADD CONSTRAINT "VendorSubscription_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "VendorProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Product" ADD CONSTRAINT "Product_moderatedById_fkey" FOREIGN KEY ("moderatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
