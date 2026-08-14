CREATE TYPE "VendorQuoteStatus" AS ENUM ('DRAFT','SENT','VIEWED','ACCEPTED','DECLINED','EXPIRED','CANCELLED');
CREATE TYPE "InvoiceStatus" AS ENUM ('DRAFT','SENT','PARTIALLY_PAID','PAID','OVERDUE','VOID');
CREATE TABLE "VendorQuote" (
  "id" TEXT NOT NULL, "vendorId" TEXT NOT NULL, "createdById" TEXT NOT NULL, "customerId" TEXT,
  "quoteNumber" TEXT NOT NULL, "reviewToken" TEXT NOT NULL, "clientName" TEXT NOT NULL, "clientPhone" TEXT NOT NULL,
  "clientEmail" TEXT, "title" TEXT NOT NULL, "status" "VendorQuoteStatus" NOT NULL DEFAULT 'DRAFT',
  "currency" TEXT NOT NULL DEFAULT 'KES', "subtotal" DECIMAL(14,2) NOT NULL, "taxAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
  "discountAmount" DECIMAL(14,2) NOT NULL DEFAULT 0, "total" DECIMAL(14,2) NOT NULL, "depositAmount" DECIMAL(14,2),
  "notes" TEXT, "terms" TEXT, "validUntil" TIMESTAMP(3), "sentAt" TIMESTAMP(3), "viewedAt" TIMESTAMP(3),
  "acceptedAt" TIMESTAMP(3), "declinedAt" TIMESTAMP(3), "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "VendorQuote_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "VendorQuoteLine" (
  "id" TEXT NOT NULL, "quoteId" TEXT NOT NULL, "description" TEXT NOT NULL, "quantity" DECIMAL(12,2) NOT NULL,
  "unitPrice" DECIMAL(14,2) NOT NULL, "taxRate" DECIMAL(5,2) NOT NULL DEFAULT 0, "lineTotal" DECIMAL(14,2) NOT NULL,
  "sortOrder" INTEGER NOT NULL DEFAULT 0, CONSTRAINT "VendorQuoteLine_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "Invoice" (
  "id" TEXT NOT NULL, "vendorId" TEXT NOT NULL, "quoteId" TEXT, "invoiceNumber" TEXT NOT NULL,
  "status" "InvoiceStatus" NOT NULL DEFAULT 'DRAFT', "currency" TEXT NOT NULL DEFAULT 'KES',
  "subtotal" DECIMAL(14,2) NOT NULL, "taxAmount" DECIMAL(14,2) NOT NULL DEFAULT 0, "total" DECIMAL(14,2) NOT NULL,
  "amountPaid" DECIMAL(14,2) NOT NULL DEFAULT 0, "balanceDue" DECIMAL(14,2) NOT NULL, "dueAt" TIMESTAMP(3),
  "sentAt" TIMESTAMP(3), "paidAt" TIMESTAMP(3), "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "VendorQuote_quoteNumber_key" ON "VendorQuote"("quoteNumber");
CREATE UNIQUE INDEX "VendorQuote_reviewToken_key" ON "VendorQuote"("reviewToken");
CREATE INDEX "VendorQuote_vendorId_status_createdAt_idx" ON "VendorQuote"("vendorId","status","createdAt");
CREATE INDEX "VendorQuote_customerId_idx" ON "VendorQuote"("customerId");
CREATE INDEX "VendorQuoteLine_quoteId_sortOrder_idx" ON "VendorQuoteLine"("quoteId","sortOrder");
CREATE UNIQUE INDEX "Invoice_quoteId_key" ON "Invoice"("quoteId");
CREATE UNIQUE INDEX "Invoice_invoiceNumber_key" ON "Invoice"("invoiceNumber");
CREATE INDEX "Invoice_vendorId_status_createdAt_idx" ON "Invoice"("vendorId","status","createdAt");
ALTER TABLE "VendorQuote" ADD CONSTRAINT "VendorQuote_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "VendorProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "VendorQuote" ADD CONSTRAINT "VendorQuote_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "VendorQuoteLine" ADD CONSTRAINT "VendorQuoteLine_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "VendorQuote"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "VendorProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "VendorQuote"("id") ON DELETE SET NULL ON UPDATE CASCADE;
