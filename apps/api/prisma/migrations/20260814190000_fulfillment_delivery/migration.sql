CREATE TYPE "FulfillmentStatus" AS ENUM ('PENDING','PREPARING','READY_FOR_PICKUP','COURIER_ASSIGNED','PICKED_UP','IN_TRANSIT','ARRIVING','DELIVERED','DELIVERY_FAILED','RETURN_REQUESTED','RETURNING','RETURNED','CANCELLED');
CREATE TYPE "DeliveryMethod" AS ENUM ('COURIER','VENDOR_DELIVERY','CUSTOMER_PICKUP');
CREATE TYPE "HandoffMethod" AS ENUM ('PIN','SIGNATURE','PHOTO','IN_PERSON');
ALTER TABLE "Order" ADD COLUMN "deliveryFee" DECIMAL(12,2) NOT NULL DEFAULT 0;

CREATE TABLE "Fulfillment" (
  "id" TEXT NOT NULL, "orderId" TEXT NOT NULL, "vendorId" TEXT, "trackingCode" TEXT NOT NULL,
  "status" "FulfillmentStatus" NOT NULL DEFAULT 'PENDING', "method" "DeliveryMethod" NOT NULL DEFAULT 'COURIER',
  "handoffMethod" "HandoffMethod" NOT NULL DEFAULT 'PIN', "recipientName" TEXT NOT NULL,
  "recipientPhone" TEXT NOT NULL, "recipientEmail" TEXT, "county" TEXT NOT NULL, "addressLine" TEXT NOT NULL,
  "landmark" TEXT, "instructions" TEXT, "deliveryPin" TEXT, "estimatedStart" TIMESTAMP(3), "estimatedEnd" TIMESTAMP(3),
  "courierName" TEXT, "courierPhone" TEXT, "courierProvider" TEXT, "providerReference" TEXT,
  "trackingUrl" TEXT, "proofUrl" TEXT, "deliveredAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Fulfillment_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "FulfillmentEvent" (
  "id" TEXT NOT NULL, "fulfillmentId" TEXT NOT NULL, "status" "FulfillmentStatus" NOT NULL,
  "label" TEXT NOT NULL, "detail" TEXT, "location" TEXT, "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdById" TEXT, CONSTRAINT "FulfillmentEvent_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "OrderItem" ADD COLUMN "fulfillmentId" TEXT;
CREATE UNIQUE INDEX "Fulfillment_trackingCode_key" ON "Fulfillment"("trackingCode");
CREATE INDEX "Fulfillment_orderId_status_idx" ON "Fulfillment"("orderId","status");
CREATE INDEX "Fulfillment_vendorId_status_createdAt_idx" ON "Fulfillment"("vendorId","status","createdAt");
CREATE INDEX "FulfillmentEvent_fulfillmentId_occurredAt_idx" ON "FulfillmentEvent"("fulfillmentId","occurredAt");
CREATE INDEX "OrderItem_fulfillmentId_idx" ON "OrderItem"("fulfillmentId");
ALTER TABLE "Fulfillment" ADD CONSTRAINT "Fulfillment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Fulfillment" ADD CONSTRAINT "Fulfillment_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "VendorProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "FulfillmentEvent" ADD CONSTRAINT "FulfillmentEvent_fulfillmentId_fkey" FOREIGN KEY ("fulfillmentId") REFERENCES "Fulfillment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_fulfillmentId_fkey" FOREIGN KEY ("fulfillmentId") REFERENCES "Fulfillment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
