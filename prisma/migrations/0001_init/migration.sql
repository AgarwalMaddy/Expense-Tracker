-- CreateEnum
CREATE TYPE "PaymentMethodType" AS ENUM ('SIMPLE', 'CREDIT');

-- CreateEnum
CREATE TYPE "ExpenseType" AS ENUM ('EXPENSE', 'SETTLEMENT');

-- CreateTable
CREATE TABLE "categories" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#6366f1',
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_methods" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#6366f1',
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "type" "PaymentMethodType" NOT NULL DEFAULT 'SIMPLE',
    "bankName" TEXT,
    "lastFourDigits" TEXT,
    "creditLimit" DECIMAL(12,2),
    "initialOutstanding" DECIMAL(12,2),
    "billingCycleDay" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_methods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tags" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expenses" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "type" "ExpenseType" NOT NULL DEFAULT 'EXPENSE',
    "categoryId" TEXT NOT NULL,
    "paymentMethodId" TEXT NOT NULL,
    "settlesPaymentMethodId" TEXT,
    "description" TEXT,
    "notes" TEXT,
    "expenseDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "expenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expense_tags" (
    "expenseId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    CONSTRAINT "expense_tags_pkey" PRIMARY KEY ("expenseId","tagId")
);

-- CreateIndex
CREATE UNIQUE INDEX "categories_userId_name_key" ON "categories"("userId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "payment_methods_userId_name_key" ON "payment_methods"("userId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "tags_userId_name_key" ON "tags"("userId", "name");

-- CreateIndex
CREATE INDEX "expenses_userId_expenseDate_idx" ON "expenses"("userId", "expenseDate");

-- CreateIndex
CREATE INDEX "expenses_userId_categoryId_idx" ON "expenses"("userId", "categoryId");

-- CreateIndex
CREATE INDEX "expenses_userId_paymentMethodId_idx" ON "expenses"("userId", "paymentMethodId");

-- CreateIndex
CREATE INDEX "expenses_userId_type_idx" ON "expenses"("userId", "type");

-- CreateIndex
CREATE INDEX "expenses_userId_settlesPaymentMethodId_idx" ON "expenses"("userId", "settlesPaymentMethodId");

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_paymentMethodId_fkey" FOREIGN KEY ("paymentMethodId") REFERENCES "payment_methods"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_settlesPaymentMethodId_fkey" FOREIGN KEY ("settlesPaymentMethodId") REFERENCES "payment_methods"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expense_tags" ADD CONSTRAINT "expense_tags_expenseId_fkey" FOREIGN KEY ("expenseId") REFERENCES "expenses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expense_tags" ADD CONSTRAINT "expense_tags_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;
