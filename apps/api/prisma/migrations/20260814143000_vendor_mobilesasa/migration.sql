CREATE TABLE "VendorSmsConnection" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "encryptedApiToken" TEXT NOT NULL,
    "tokenLastFour" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'CONNECTED',
    "lastTestedAt" TIMESTAMP(3),
    "lastSuccessfulSendAt" TIMESTAMP(3),
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "VendorSmsConnection_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "VendorSmsConnection_vendorId_key" ON "VendorSmsConnection"("vendorId");
CREATE INDEX "VendorSmsConnection_status_idx" ON "VendorSmsConnection"("status");
ALTER TABLE "VendorSmsConnection" ADD CONSTRAINT "VendorSmsConnection_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "VendorProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
