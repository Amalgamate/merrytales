CREATE TYPE "ListingType" AS ENUM ('PRODUCT', 'SERVICE', 'RENTAL', 'PACKAGE');
CREATE TYPE "PriceUnit" AS ENUM ('ITEM', 'FIXED', 'PERSON', 'HOUR', 'DAY', 'EVENT', 'QUOTE');
ALTER TABLE "Product" ADD COLUMN "vendorId" TEXT,
ADD COLUMN "listingType" "ListingType" NOT NULL DEFAULT 'PRODUCT',
ADD COLUMN "priceUnit" "PriceUnit" NOT NULL DEFAULT 'ITEM',
ADD COLUMN "stockQuantity" INTEGER,
ADD COLUMN "minimumOrder" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN "maximumOrder" INTEGER,
ADD COLUMN "leadTimeDays" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "serviceArea" TEXT,
ADD COLUMN "depositAmount" DECIMAL(12,2),
ADD COLUMN "terms" TEXT;
CREATE TABLE "ListingAvailability" (
  "id" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "startsAt" TIMESTAMP(3) NOT NULL,
  "endsAt" TIMESTAMP(3) NOT NULL,
  "isAvailable" BOOLEAN NOT NULL DEFAULT false,
  "note" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ListingAvailability_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "Product" ADD CONSTRAINT "Product_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "VendorProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ListingAvailability" ADD CONSTRAINT "ListingAvailability_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
CREATE INDEX "Product_vendorId_listingType_isActive_idx" ON "Product"("vendorId", "listingType", "isActive");
CREATE INDEX "ListingAvailability_productId_startsAt_endsAt_idx" ON "ListingAvailability"("productId", "startsAt", "endsAt");
