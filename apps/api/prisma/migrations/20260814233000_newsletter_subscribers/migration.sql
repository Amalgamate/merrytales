CREATE TABLE "NewsletterSubscriber" (
  "id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "source" TEXT NOT NULL DEFAULT 'WEBSITE_POPUP',
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "confirmToken" TEXT NOT NULL,
  "unsubscribeToken" TEXT NOT NULL,
  "consentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "confirmedAt" TIMESTAMP(3),
  "unsubscribedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "NewsletterSubscriber_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "NewsletterSubscriber_email_key" ON "NewsletterSubscriber"("email");
CREATE UNIQUE INDEX "NewsletterSubscriber_confirmToken_key" ON "NewsletterSubscriber"("confirmToken");
CREATE UNIQUE INDEX "NewsletterSubscriber_unsubscribeToken_key" ON "NewsletterSubscriber"("unsubscribeToken");
CREATE INDEX "NewsletterSubscriber_status_createdAt_idx" ON "NewsletterSubscriber"("status", "createdAt");
