-- Add new enum values
ALTER TYPE "PaymentMethod" ADD VALUE IF NOT EXISTS 'UPI_BANK';
ALTER TYPE "PaymentMethod" ADD VALUE IF NOT EXISTS 'UPI_CC';
ALTER TYPE "PaymentMethod" ADD VALUE IF NOT EXISTS 'CREDIT_CARD';
ALTER TYPE "PaymentMethod" ADD VALUE IF NOT EXISTS 'DEBIT_CARD';
ALTER TYPE "PaymentMethod" ADD VALUE IF NOT EXISTS 'NET_BANKING';

-- Migrate existing data
UPDATE "expenses" SET "paymentMethod" = 'UPI_BANK' WHERE "paymentMethod" = 'UPI';
UPDATE "expenses" SET "paymentMethod" = 'CREDIT_CARD' WHERE "paymentMethod" = 'CARD';
UPDATE "expenses" SET "paymentMethod" = 'NET_BANKING' WHERE "paymentMethod" = 'ONLINE';

-- Recreate enum without old values
ALTER TYPE "PaymentMethod" RENAME TO "PaymentMethod_old";
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'UPI_BANK', 'UPI_CC', 'CREDIT_CARD', 'DEBIT_CARD', 'NET_BANKING');
ALTER TABLE "expenses" ALTER COLUMN "paymentMethod" TYPE "PaymentMethod" USING "paymentMethod"::text::"PaymentMethod";
DROP TYPE "PaymentMethod_old";
