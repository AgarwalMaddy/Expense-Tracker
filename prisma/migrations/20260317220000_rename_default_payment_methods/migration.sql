-- Rename "UPI (Bank)" to "UPI" for all users
UPDATE "payment_methods" SET "name" = 'UPI' WHERE "name" = 'UPI (Bank)' AND "isDefault" = true;

-- Move expenses from "UPI (CC)" to "Credit Card" where both exist for the same user
UPDATE "expenses" e
SET "paymentMethodId" = cc."id"
FROM "payment_methods" upicc, "payment_methods" cc
WHERE e."paymentMethodId" = upicc."id"
  AND upicc."name" = 'UPI (CC)'
  AND upicc."isDefault" = true
  AND cc."userId" = upicc."userId"
  AND cc."name" = 'Credit Card';

-- Delete "UPI (CC)" default entries that have no remaining expenses
DELETE FROM "payment_methods" pm
WHERE pm."name" = 'UPI (CC)'
  AND pm."isDefault" = true
  AND NOT EXISTS (
    SELECT 1 FROM "expenses" e WHERE e."paymentMethodId" = pm."id"
  );
