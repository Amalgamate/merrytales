CREATE TYPE "SettlementStatus" AS ENUM ('PENDING', 'READY', 'PAID', 'CANCELLED');

CREATE TABLE "VendorSettlement" (
  "id" TEXT NOT NULL,
  "vendorId" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "orderItemId" TEXT NOT NULL,
  "grossAmount" DECIMAL(14,2) NOT NULL,
  "commissionPercent" DECIMAL(5,2) NOT NULL,
  "commissionAmount" DECIMAL(14,2) NOT NULL,
  "netAmount" DECIMAL(14,2) NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'KES',
  "status" "SettlementStatus" NOT NULL DEFAULT 'PENDING',
  "paidAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "VendorSettlement_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "VendorSettlement_orderItemId_key" ON "VendorSettlement"("orderItemId");
CREATE INDEX "VendorSettlement_vendorId_status_createdAt_idx" ON "VendorSettlement"("vendorId", "status", "createdAt");
CREATE INDEX "VendorSettlement_orderId_idx" ON "VendorSettlement"("orderId");

ALTER TABLE "VendorSettlement" ADD CONSTRAINT "VendorSettlement_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "VendorProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "VendorSettlement" ADD CONSTRAINT "VendorSettlement_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "VendorSettlement" ADD CONSTRAINT "VendorSettlement_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "OrderItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
