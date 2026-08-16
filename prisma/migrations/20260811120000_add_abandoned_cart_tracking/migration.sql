-- AlterTable
ALTER TABLE "Order" ADD COLUMN "abandonedEmail1SentAt" TIMESTAMP(3);
ALTER TABLE "Order" ADD COLUMN "abandonedEmail2SentAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "AbandonedCartOptOut" (
    "email" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AbandonedCartOptOut_pkey" PRIMARY KEY ("email")
);
