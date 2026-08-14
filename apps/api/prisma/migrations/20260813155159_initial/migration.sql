-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('CUSTOMER', 'VENDOR', 'STUDIO', 'ADMIN');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'PENDING_VERIFICATION');

-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('WEDDING', 'ENGAGEMENT', 'ANNIVERSARY', 'BIRTHDAY', 'BABY_SHOWER', 'GRADUATION', 'PARTY', 'CORPORATE', 'OTHER');

-- CreateEnum
CREATE TYPE "VendorStatus" AS ENUM ('DRAFT', 'PENDING_REVIEW', 'VERIFIED', 'REJECTED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING_PAYMENT', 'ORDER_RECEIVED', 'DESIGNING', 'PROOF_READY', 'APPROVED', 'PRINTING', 'QUALITY_CHECK', 'READY', 'DISPATCHED', 'DELIVERED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PROCESSING', 'PAID', 'FAILED', 'REFUNDED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "passwordHash" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'CUSTOMER',
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "locale" TEXT NOT NULL DEFAULT 'en-KE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefreshToken" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "type" "EventType" NOT NULL DEFAULT 'WEDDING',
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "partnerOne" TEXT,
    "partnerTwo" TEXT,
    "eventDate" TIMESTAMP(3),
    "venue" TEXT,
    "city" TEXT,
    "countryCode" TEXT NOT NULL DEFAULT 'KE',
    "currency" TEXT NOT NULL DEFAULT 'KES',
    "budget" DECIMAL(12,2),
    "guestTarget" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Guest" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "household" TEXT,
    "attending" BOOLEAN,
    "plusOnes" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Guest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VendorProfile" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "businessName" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "city" TEXT NOT NULL,
    "countryCode" TEXT NOT NULL DEFAULT 'KE',
    "whatsapp" TEXT,
    "startingPrice" DECIMAL(12,2),
    "currency" TEXT NOT NULL DEFAULT 'KES',
    "status" "VendorStatus" NOT NULL DEFAULT 'DRAFT',
    "responseMinutes" INTEGER,
    "rating" DECIMAL(2,1) NOT NULL DEFAULT 0,
    "reviewCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VendorProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VendorService" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" DECIMAL(12,2),
    "currency" TEXT NOT NULL DEFAULT 'KES',

    CONSTRAINT "VendorService_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "price" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'KES',
    "isDigital" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING_PAYMENT',
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "currency" TEXT NOT NULL DEFAULT 'KES',
    "subtotal" DECIMAL(12,2) NOT NULL,
    "total" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderItem" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "RefreshToken_tokenHash_key" ON "RefreshToken"("tokenHash");

-- CreateIndex
CREATE INDEX "RefreshToken_userId_idx" ON "RefreshToken"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Event_slug_key" ON "Event"("slug");

-- CreateIndex
CREATE INDEX "Event_ownerId_idx" ON "Event"("ownerId");

-- CreateIndex
CREATE INDEX "Guest_eventId_idx" ON "Guest"("eventId");

-- CreateIndex
CREATE UNIQUE INDEX "VendorProfile_ownerId_key" ON "VendorProfile"("ownerId");

-- CreateIndex
CREATE UNIQUE INDEX "VendorProfile_slug_key" ON "VendorProfile"("slug");

-- CreateIndex
CREATE INDEX "VendorProfile_category_city_status_idx" ON "VendorProfile"("category", "city", "status");

-- CreateIndex
CREATE INDEX "VendorService_vendorId_idx" ON "VendorService"("vendorId");

-- CreateIndex
CREATE UNIQUE INDEX "Product_slug_key" ON "Product"("slug");

-- CreateIndex
CREATE INDEX "Product_category_isActive_idx" ON "Product"("category", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "Order_orderNumber_key" ON "Order"("orderNumber");

-- CreateIndex
CREATE INDEX "Order_customerId_createdAt_idx" ON "Order"("customerId", "createdAt");

-- CreateIndex
CREATE INDEX "OrderItem_orderId_idx" ON "OrderItem"("orderId");

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Guest" ADD CONSTRAINT "Guest_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorProfile" ADD CONSTRAINT "VendorProfile_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorService" ADD CONSTRAINT "VendorService_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "VendorProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
