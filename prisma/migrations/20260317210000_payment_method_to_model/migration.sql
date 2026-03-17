-- 1. Create payment_methods table
CREATE TABLE "payment_methods" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#6366f1',
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "payment_methods_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "payment_methods_userId_name_key" ON "payment_methods"("userId", "name");

-- 2. Seed default payment methods for each existing user
INSERT INTO "payment_methods" ("id", "userId", "name", "icon", "color", "isDefault")
SELECT
    gen_random_uuid()::text,
    u."userId",
    v."name",
    v."icon",
    v."color",
    true
FROM (SELECT DISTINCT "userId" FROM "expenses") u
CROSS JOIN (VALUES
    ('Cash', 'banknote', '#22c55e'),
    ('UPI (Bank)', 'smartphone', '#8b5cf6'),
    ('UPI (CC)', 'smartphone-nfc', '#a855f7'),
    ('Credit Card', 'credit-card', '#3b82f6'),
    ('Debit Card', 'wallet', '#06b6d4'),
    ('Net Banking', 'landmark', '#f97316')
) AS v("name", "icon", "color")
ON CONFLICT ("userId", "name") DO NOTHING;

-- 3. Add paymentMethodId column (nullable initially)
ALTER TABLE "expenses" ADD COLUMN "paymentMethodId" TEXT;

-- 4. Map old enum values to new payment_methods rows
UPDATE "expenses" e
SET "paymentMethodId" = pm."id"
FROM "payment_methods" pm
WHERE pm."userId" = e."userId"
  AND pm."name" = CASE e."paymentMethod"::text
    WHEN 'CASH' THEN 'Cash'
    WHEN 'UPI_BANK' THEN 'UPI (Bank)'
    WHEN 'UPI_CC' THEN 'UPI (CC)'
    WHEN 'CREDIT_CARD' THEN 'Credit Card'
    WHEN 'DEBIT_CARD' THEN 'Debit Card'
    WHEN 'NET_BANKING' THEN 'Net Banking'
  END;

-- 5. Make paymentMethodId NOT NULL now that all rows are populated
ALTER TABLE "expenses" ALTER COLUMN "paymentMethodId" SET NOT NULL;

-- 6. Drop old enum column
ALTER TABLE "expenses" DROP COLUMN "paymentMethod";

-- 7. Drop old enum type
DROP TYPE "PaymentMethod";

-- 8. Add FK constraint and index
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_paymentMethodId_fkey"
    FOREIGN KEY ("paymentMethodId") REFERENCES "payment_methods"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX "expenses_userId_paymentMethodId_idx" ON "expenses"("userId", "paymentMethodId");
