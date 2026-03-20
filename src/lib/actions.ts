"use server";

import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth/server";
import { DEFAULT_CATEGORIES, DEFAULT_PAYMENT_METHODS } from "@/lib/constants";
import {
  createTagSchema,
  createPaymentMethodSchema,
  updatePaymentMethodSchema,
  createExpenseSchema,
  updateExpenseSchema,
  getExpensesSchema,
  idSchema,
  updatePreferencesSchema,
} from "@/lib/validations";
import { getCurrencyLocale } from "@/lib/constants";
import { revalidatePath } from "next/cache";

async function getUserId(): Promise<string> {
  const { data: session } = await auth.getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");
  return session.user.id;
}

function revalidateAll() {
  revalidatePath("/");
  revalidatePath("/add");
  revalidatePath("/history");
  revalidatePath("/settings");
}

const EMOJI_TO_LUCIDE: Record<string, string> = {
  "🍔": "utensils-crossed",
  "🚗": "car",
  "🛒": "shopping-cart",
  "🛍️": "shopping-bag",
  "💊": "heart-pulse",
  "📄": "file-text",
  "🎬": "clapperboard",
  "🏠": "house",
  "📚": "graduation-cap",
  "✨": "sparkles",
  "📦": "package",
};

// --- Seed defaults ---

export async function ensureDefaultCategories() {
  const userId = await getUserId();
  const existing = await prisma.category.findMany({ where: { userId } });

  if (existing.length === 0) {
    await prisma.category.createMany({
      data: DEFAULT_CATEGORIES.map((c) => ({
        userId,
        name: c.name,
        icon: c.icon,
        color: c.color,
        isDefault: true,
      })),
    });
    return;
  }

  for (const cat of existing) {
    const lucideName = EMOJI_TO_LUCIDE[cat.icon];
    if (lucideName) {
      await prisma.category.update({
        where: { id: cat.id },
        data: { icon: lucideName },
      });
    }
  }
}

export async function ensureDefaultPaymentMethods() {
  const userId = await getUserId();
  const existing = await prisma.paymentMethod.findMany({ where: { userId } });
  if (existing.length === 0) {
    await prisma.paymentMethod.createMany({
      data: DEFAULT_PAYMENT_METHODS.map((pm) => ({
        userId,
        name: pm.name,
        icon: pm.icon,
        color: pm.color,
        isDefault: true,
        type: pm.type,
      })),
    });
  }
}

// --- Read operations ---

export async function getCategories() {
  const userId = await getUserId();
  await ensureDefaultCategories();
  return prisma.category.findMany({
    where: { userId },
    orderBy: { name: "asc" },
  });
}

export async function getPaymentMethods() {
  const userId = await getUserId();
  await ensureDefaultPaymentMethods();
  return prisma.paymentMethod.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });
}

export async function getCreditPaymentMethods() {
  const userId = await getUserId();
  return prisma.paymentMethod.findMany({
    where: { userId, type: "CREDIT" },
    orderBy: { createdAt: "asc" },
  });
}

export async function getTags() {
  const userId = await getUserId();
  return prisma.tag.findMany({
    where: { userId },
    orderBy: { name: "asc" },
  });
}

// --- Tags ---

export async function createTag(name: unknown) {
  const validated = createTagSchema.parse(name);
  const userId = await getUserId();
  const tag = await prisma.tag.create({
    data: { userId, name: validated },
  });
  revalidatePath("/add");
  return tag;
}

// --- Payment Methods ---

export async function createPaymentMethod(rawData: unknown) {
  const data = createPaymentMethodSchema.parse(rawData);
  const userId = await getUserId();
  const pm = await prisma.paymentMethod.create({
    data: {
      userId,
      name: data.name,
      icon: data.icon,
      color: data.color,
      type: data.type,
      bankName: data.bankName || null,
      lastFourDigits: data.lastFourDigits || null,
      creditLimit: data.creditLimit ?? null,
      initialOutstanding: data.initialOutstanding ?? null,
      billingCycleDay: data.billingCycleDay ?? null,
    },
  });
  revalidateAll();
  return pm;
}

export async function updatePaymentMethod(id: unknown, rawData: unknown) {
  const validId = idSchema.parse(id);
  const data = updatePaymentMethodSchema.parse(rawData);
  const userId = await getUserId();
  const pm = await prisma.paymentMethod.update({
    where: { id: validId, userId },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.icon !== undefined && { icon: data.icon }),
      ...(data.color !== undefined && { color: data.color }),
      ...(data.type !== undefined && { type: data.type }),
      ...(data.bankName !== undefined && { bankName: data.bankName }),
      ...(data.lastFourDigits !== undefined && { lastFourDigits: data.lastFourDigits }),
      ...(data.creditLimit !== undefined && { creditLimit: data.creditLimit }),
      ...(data.initialOutstanding !== undefined && { initialOutstanding: data.initialOutstanding }),
      ...(data.billingCycleDay !== undefined && { billingCycleDay: data.billingCycleDay }),
    },
  });
  revalidateAll();
  return pm;
}

export async function deletePaymentMethod(id: unknown) {
  const validId = idSchema.parse(id);
  const userId = await getUserId();

  const [usageCount, settlementCount] = await Promise.all([
    prisma.expense.count({ where: { userId, paymentMethodId: validId } }),
    prisma.expense.count({ where: { userId, settlesPaymentMethodId: validId } }),
  ]);

  if (usageCount > 0 || settlementCount > 0) {
    throw new Error(
      `Cannot delete — ${usageCount + settlementCount} expense(s)/settlement(s) reference this method`
    );
  }

  await prisma.paymentMethod.delete({ where: { id: validId, userId } });
  revalidateAll();
}

// --- Expenses ---

export async function createExpense(rawData: unknown) {
  const data = createExpenseSchema.parse(rawData);
  const userId = await getUserId();

  const expense = await prisma.expense.create({
    data: {
      userId,
      amount: data.amount,
      type: data.type,
      categoryId: data.categoryId,
      paymentMethodId: data.paymentMethodId,
      settlesPaymentMethodId: data.settlesPaymentMethodId || null,
      description: data.description || null,
      notes: data.notes || null,
      expenseDate: new Date(data.expenseDate),
      tags: data.tagIds?.length ? { create: data.tagIds.map((tagId) => ({ tagId })) } : undefined,
    },
  });

  revalidatePath("/");
  revalidatePath("/history");
  return expense;
}

export async function updateExpense(id: unknown, rawData: unknown) {
  const validId = idSchema.parse(id);
  const data = updateExpenseSchema.parse(rawData);
  const userId = await getUserId();

  const tagUpdate =
    data.tagIds !== undefined
      ? {
          deleteMany: {},
          ...(data.tagIds.length > 0 ? { create: data.tagIds.map((tagId) => ({ tagId })) } : {}),
        }
      : undefined;

  const expense = await prisma.expense.update({
    where: { id: validId, userId },
    data: {
      amount: data.amount,
      categoryId: data.categoryId,
      paymentMethodId: data.paymentMethodId,
      description: data.description || null,
      notes: data.notes || null,
      expenseDate: new Date(data.expenseDate),
      tags: tagUpdate,
    },
  });

  revalidatePath("/");
  revalidatePath("/history");
  return expense;
}

export async function deleteExpense(id: unknown) {
  const validId = idSchema.parse(id);
  const userId = await getUserId();
  await prisma.expense.delete({ where: { id: validId, userId } });
  revalidatePath("/");
  revalidatePath("/history");
}

export async function getExpenses(rawParams?: unknown) {
  const params = getExpensesSchema.parse(rawParams);
  const userId = await getUserId();

  const where: Record<string, unknown> = { userId };

  if (params?.startDate || params?.endDate) {
    where.expenseDate = {
      ...(params.startDate ? { gte: new Date(params.startDate) } : {}),
      ...(params.endDate ? { lte: new Date(params.endDate) } : {}),
    };
  }
  if (params?.categoryId) where.categoryId = params.categoryId;
  if (params?.paymentMethodId) where.paymentMethodId = params.paymentMethodId;
  if (params?.type) where.type = params.type;
  if (params?.search) {
    where.OR = [
      { description: { contains: params.search, mode: "insensitive" } },
      { notes: { contains: params.search, mode: "insensitive" } },
    ];
  }

  const [expenses, total] = await Promise.all([
    prisma.expense.findMany({
      where,
      include: {
        category: true,
        paymentMethod: true,
        settlesPaymentMethod: true,
        tags: { include: { tag: true } },
      },
      orderBy: { expenseDate: "desc" },
      take: params?.limit ?? 50,
      skip: params?.offset ?? 0,
    }),
    prisma.expense.count({ where }),
  ]);

  return { expenses, total };
}

// --- User Preferences ---

export async function getUserPreferences() {
  const userId = await getUserId();
  let prefs = await prisma.userPreference.findUnique({ where: { userId } });
  if (!prefs) {
    prefs = await prisma.userPreference.create({
      data: { userId },
    });
  }
  return prefs;
}

export async function updateUserPreferences(rawData: unknown) {
  const data = updatePreferencesSchema.parse(rawData);
  const userId = await getUserId();

  const updateData: Record<string, string> = {};
  if (data.currency) {
    updateData.currency = data.currency;
    updateData.locale = getCurrencyLocale(data.currency);
  }
  if (data.timezone) updateData.timezone = data.timezone;
  if (data.locale) updateData.locale = data.locale;

  const prefs = await prisma.userPreference.upsert({
    where: { userId },
    update: updateData,
    create: { userId, ...updateData },
  });

  revalidateAll();
  return prefs;
}

// --- Dashboard ---

function getMonthBoundsForTimezone(tz: string): { startOfMonth: Date; endOfMonth: Date } {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    hour12: false,
  });

  const parts = fmt.formatToParts(new Date());
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0);
  const year = get("year");
  const month = get("month");

  // Build "YYYY-MM-01T00:00:00" in the target timezone, then find its UTC equivalent
  // by computing the offset at that specific instant (handles DST correctly).
  function tzDateToUTC(y: number, m: number, d: number): Date {
    const guess = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
    const localParts = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
      hour12: false,
    }).formatToParts(guess);
    const gp = (type: string) => Number(localParts.find((p) => p.type === type)?.value ?? 0);
    const localAtGuess = Date.UTC(
      gp("year"),
      gp("month") - 1,
      gp("day"),
      gp("hour"),
      gp("minute"),
      gp("second")
    );
    const offsetMs = localAtGuess - guess.getTime();
    return new Date(Date.UTC(y, m - 1, d, 0, 0, 0) - offsetMs);
  }

  const startOfMonth = tzDateToUTC(year, month, 1);
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  const endOfMonth = new Date(tzDateToUTC(nextYear, nextMonth, 1).getTime() - 1);

  return { startOfMonth, endOfMonth };
}

export async function getDashboardData() {
  const userId = await getUserId();
  const prefs = await getUserPreferences();
  const { startOfMonth, endOfMonth } = getMonthBoundsForTimezone(prefs.timezone);

  const expenseFilter = {
    userId,
    type: "EXPENSE" as const,
    expenseDate: { gte: startOfMonth, lte: endOfMonth },
  };

  const [monthlyExpenses, categoryBreakdown, paymentBreakdown, recentExpenses] = await Promise.all([
    prisma.expense.aggregate({
      where: expenseFilter,
      _sum: { amount: true },
      _count: true,
    }),
    prisma.expense.groupBy({
      by: ["categoryId"],
      where: expenseFilter,
      _sum: { amount: true },
      _count: true,
    }),
    prisma.expense.groupBy({
      by: ["paymentMethodId"],
      where: expenseFilter,
      _sum: { amount: true },
    }),
    prisma.expense.findMany({
      where: { userId },
      include: { category: true, paymentMethod: true, settlesPaymentMethod: true },
      orderBy: { expenseDate: "desc" },
      take: 5,
    }),
  ]);

  const categories = await prisma.category.findMany({
    where: { userId, id: { in: categoryBreakdown.map((c) => c.categoryId) } },
  });
  const paymentMethods = await prisma.paymentMethod.findMany({
    where: { userId, id: { in: paymentBreakdown.map((p) => p.paymentMethodId) } },
  });

  const categoryMap = new Map(categories.map((c) => [c.id, c]));
  const pmMap = new Map(paymentMethods.map((p) => [p.id, p]));

  return {
    totalSpent: Number(monthlyExpenses._sum.amount || 0),
    transactionCount: monthlyExpenses._count,
    categoryBreakdown: categoryBreakdown.map((c) => ({
      category: categoryMap.get(c.categoryId)!,
      total: Number(c._sum.amount || 0),
      count: c._count,
    })),
    paymentBreakdown: paymentBreakdown.map((p) => ({
      paymentMethod: pmMap.get(p.paymentMethodId)!,
      total: Number(p._sum.amount || 0),
    })),
    recentExpenses,
  };
}

// --- Credit Card Summary ---

export async function getCreditCardSummary() {
  const userId = await getUserId();

  const creditMethods = await prisma.paymentMethod.findMany({
    where: { userId, type: "CREDIT" },
    orderBy: { createdAt: "asc" },
  });

  if (creditMethods.length === 0) return [];

  const summaries = await Promise.all(
    creditMethods.map(async (card) => {
      const [expenseTotal, settlementTotal] = await Promise.all([
        prisma.expense.aggregate({
          where: { userId, paymentMethodId: card.id, type: "EXPENSE" },
          _sum: { amount: true },
        }),
        prisma.expense.aggregate({
          where: { userId, settlesPaymentMethodId: card.id, type: "SETTLEMENT" },
          _sum: { amount: true },
        }),
      ]);

      const totalSpent = Number(expenseTotal._sum.amount || 0);
      const totalSettled = Number(settlementTotal._sum.amount || 0);
      const initialOutstanding = Number(card.initialOutstanding || 0);
      const outstanding = initialOutstanding + totalSpent - totalSettled;
      const creditLimit = Number(card.creditLimit || 0);

      return {
        card,
        totalSpent,
        totalSettled,
        outstanding: Math.max(0, outstanding),
        creditLimit,
        availableCredit: creditLimit > 0 ? Math.max(0, creditLimit - outstanding) : null,
        utilization: creditLimit > 0 ? Math.min(100, (outstanding / creditLimit) * 100) : null,
      };
    })
  );

  return summaries;
}
