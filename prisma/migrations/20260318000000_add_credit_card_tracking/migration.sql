-- CreateEnum
CREATE TYPE "PaymentMethodType" AS ENUM ('SIMPLE', 'CREDIT');

-- CreateEnum
CREATE TYPE "ExpenseType" AS ENUM ('EXPENSE', 'SETTLEMENT');

-- AlterTable: Add credit card fields to payment_methods
ALTER TABLE "payment_methods" ADD COLUMN "type" "PaymentMethodType" NOT NULL DEFAULT 'SIMPLE';
ALTER TABLE "payment_methods" ADD COLUMN "bankName" TEXT;
ALTER TABLE "payment_methods" ADD COLUMN "lastFourDigits" TEXT;
ALTER TABLE "payment_methods" ADD COLUMN "creditLimit" DECIMAL(12,2);
ALTER TABLE "payment_methods" ADD COLUMN "initialOutstanding" DECIMAL(12,2);
ALTER TABLE "payment_methods" ADD COLUMN "billingCycleDay" INTEGER;

-- AlterTable: Add type and settlement fields to expenses
ALTER TABLE "expenses" ADD COLUMN "type" "ExpenseType" NOT NULL DEFAULT 'EXPENSE';
ALTER TABLE "expenses" ADD COLUMN "settlesPaymentMethodId" TEXT;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_settlesPaymentMethodId_fkey" FOREIGN KEY ("settlesPaymentMethodId") REFERENCES "payment_methods"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "expenses_userId_type_idx" ON "expenses"("userId", "type");
CREATE INDEX "expenses_userId_settlesPaymentMethodId_idx" ON "expenses"("userId", "settlesPaymentMethodId");

-- Mark existing "Credit Card" payment methods as CREDIT type
UPDATE "payment_methods" SET "type" = 'CREDIT' WHERE LOWER("name") LIKE '%credit%card%';
