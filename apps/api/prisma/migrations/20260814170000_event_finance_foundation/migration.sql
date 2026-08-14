CREATE TYPE "QuoteStatus" AS ENUM ('DRAFT', 'SENT', 'ACCEPTED', 'DECLINED', 'EXPIRED', 'CANCELLED');
CREATE TYPE "CommitmentStatus" AS ENUM ('RESERVED', 'RELEASED', 'PAID', 'CANCELLED');
CREATE TYPE "ApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');
CREATE TYPE "LedgerAccountType" AS ENUM ('ASSET', 'LIABILITY', 'REVENUE', 'EXPENSE', 'EQUITY');
CREATE TYPE "LedgerSide" AS ENUM ('DEBIT', 'CREDIT');

CREATE TABLE "BudgetEnvelope" (
  "id" TEXT NOT NULL, "eventId" TEXT NOT NULL, "name" TEXT NOT NULL,
  "allocatedAmount" DECIMAL(14,2) NOT NULL, "currency" TEXT NOT NULL DEFAULT 'KES', "color" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "BudgetEnvelope_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "Quote" (
  "id" TEXT NOT NULL, "eventId" TEXT NOT NULL, "vendorId" TEXT, "createdById" TEXT NOT NULL,
  "quoteNumber" TEXT NOT NULL, "title" TEXT NOT NULL, "version" INTEGER NOT NULL DEFAULT 1,
  "status" "QuoteStatus" NOT NULL DEFAULT 'DRAFT', "currency" TEXT NOT NULL DEFAULT 'KES',
  "subtotal" DECIMAL(14,2) NOT NULL, "taxAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
  "total" DECIMAL(14,2) NOT NULL, "depositAmount" DECIMAL(14,2), "validUntil" TIMESTAMP(3),
  "notes" TEXT, "acceptedAt" TIMESTAMP(3), "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "Quote_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "QuoteLine" (
  "id" TEXT NOT NULL, "quoteId" TEXT NOT NULL, "description" TEXT NOT NULL,
  "quantity" DECIMAL(12,2) NOT NULL, "unitPrice" DECIMAL(14,2) NOT NULL,
  "taxRate" DECIMAL(5,2) NOT NULL DEFAULT 0, "lineTotal" DECIMAL(14,2) NOT NULL,
  "sortOrder" INTEGER NOT NULL DEFAULT 0, CONSTRAINT "QuoteLine_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "BudgetCommitment" (
  "id" TEXT NOT NULL, "eventId" TEXT NOT NULL, "envelopeId" TEXT, "quoteId" TEXT,
  "description" TEXT NOT NULL, "amount" DECIMAL(14,2) NOT NULL, "currency" TEXT NOT NULL DEFAULT 'KES',
  "status" "CommitmentStatus" NOT NULL DEFAULT 'RESERVED',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "BudgetCommitment_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "ApprovalRequest" (
  "id" TEXT NOT NULL, "eventId" TEXT NOT NULL, "commitmentId" TEXT, "requestedById" TEXT NOT NULL,
  "decidedById" TEXT, "purpose" TEXT NOT NULL, "amount" DECIMAL(14,2) NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'KES', "status" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
  "note" TEXT, "decidedAt" TIMESTAMP(3), "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ApprovalRequest_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "FinancialAccount" (
  "id" TEXT NOT NULL, "eventId" TEXT NOT NULL, "code" TEXT NOT NULL, "name" TEXT NOT NULL,
  "type" "LedgerAccountType" NOT NULL, "currency" TEXT NOT NULL DEFAULT 'KES',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "FinancialAccount_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "LedgerJournal" (
  "id" TEXT NOT NULL, "eventId" TEXT NOT NULL, "reference" TEXT NOT NULL, "description" TEXT NOT NULL,
  "sourceType" TEXT NOT NULL, "sourceId" TEXT, "idempotencyKey" TEXT NOT NULL,
  "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "LedgerJournal_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "LedgerPosting" (
  "id" TEXT NOT NULL, "journalId" TEXT NOT NULL, "accountId" TEXT NOT NULL,
  "side" "LedgerSide" NOT NULL, "amount" DECIMAL(14,2) NOT NULL, "currency" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "LedgerPosting_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "BudgetEnvelope_eventId_name_key" ON "BudgetEnvelope"("eventId", "name");
CREATE INDEX "BudgetEnvelope_eventId_idx" ON "BudgetEnvelope"("eventId");
CREATE UNIQUE INDEX "Quote_quoteNumber_key" ON "Quote"("quoteNumber");
CREATE INDEX "Quote_eventId_status_createdAt_idx" ON "Quote"("eventId", "status", "createdAt");
CREATE INDEX "Quote_vendorId_idx" ON "Quote"("vendorId");
CREATE INDEX "QuoteLine_quoteId_sortOrder_idx" ON "QuoteLine"("quoteId", "sortOrder");
CREATE UNIQUE INDEX "BudgetCommitment_quoteId_key" ON "BudgetCommitment"("quoteId");
CREATE INDEX "BudgetCommitment_eventId_status_idx" ON "BudgetCommitment"("eventId", "status");
CREATE INDEX "BudgetCommitment_envelopeId_idx" ON "BudgetCommitment"("envelopeId");
CREATE INDEX "ApprovalRequest_eventId_status_createdAt_idx" ON "ApprovalRequest"("eventId", "status", "createdAt");
CREATE UNIQUE INDEX "FinancialAccount_eventId_code_currency_key" ON "FinancialAccount"("eventId", "code", "currency");
CREATE INDEX "FinancialAccount_eventId_type_idx" ON "FinancialAccount"("eventId", "type");
CREATE UNIQUE INDEX "LedgerJournal_reference_key" ON "LedgerJournal"("reference");
CREATE UNIQUE INDEX "LedgerJournal_idempotencyKey_key" ON "LedgerJournal"("idempotencyKey");
CREATE INDEX "LedgerJournal_eventId_occurredAt_idx" ON "LedgerJournal"("eventId", "occurredAt");
CREATE INDEX "LedgerJournal_sourceType_sourceId_idx" ON "LedgerJournal"("sourceType", "sourceId");
CREATE INDEX "LedgerPosting_journalId_idx" ON "LedgerPosting"("journalId");
CREATE INDEX "LedgerPosting_accountId_createdAt_idx" ON "LedgerPosting"("accountId", "createdAt");

ALTER TABLE "BudgetEnvelope" ADD CONSTRAINT "BudgetEnvelope_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "VendorProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "QuoteLine" ADD CONSTRAINT "QuoteLine_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BudgetCommitment" ADD CONSTRAINT "BudgetCommitment_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BudgetCommitment" ADD CONSTRAINT "BudgetCommitment_envelopeId_fkey" FOREIGN KEY ("envelopeId") REFERENCES "BudgetEnvelope"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "BudgetCommitment" ADD CONSTRAINT "BudgetCommitment_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ApprovalRequest" ADD CONSTRAINT "ApprovalRequest_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ApprovalRequest" ADD CONSTRAINT "ApprovalRequest_commitmentId_fkey" FOREIGN KEY ("commitmentId") REFERENCES "BudgetCommitment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ApprovalRequest" ADD CONSTRAINT "ApprovalRequest_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ApprovalRequest" ADD CONSTRAINT "ApprovalRequest_decidedById_fkey" FOREIGN KEY ("decidedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "FinancialAccount" ADD CONSTRAINT "FinancialAccount_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LedgerJournal" ADD CONSTRAINT "LedgerJournal_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LedgerPosting" ADD CONSTRAINT "LedgerPosting_journalId_fkey" FOREIGN KEY ("journalId") REFERENCES "LedgerJournal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LedgerPosting" ADD CONSTRAINT "LedgerPosting_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "FinancialAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
