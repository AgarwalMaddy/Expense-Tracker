"use server";

import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth/server";
import { DEFAULT_CATEGORIES, DEFAULT_PAYMENT_METHODS } from "@/lib/constants";
import { revalidatePath } from "next/cache";

async function getUserId(): Promise<string> {
  const { data: session } = await auth.getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");
  return session.user.id;
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

export async function createPaymentMethod(data: {
  name: string;
  icon: string;
  color: string;
  type?: "SIMPLE" | "CREDIT";
  bankName?: string;
  lastFourDigits?: string;
  creditLimit?: number;
  initialOutstanding?: number;
  billingCycleDay?: number;
}) {
  const userId = await getUserId();
  const pm = await prisma.paymentMethod.create({
    data: {
      userId,
      name: data.name.trim(),
      icon: data.icon,
      color: data.color,
      type: data.type || "SIMPLE",
      bankName: data.bankName?.trim() || null,
      lastFourDigits: data.lastFourDigits?.trim() || null,
      creditLimit: data.creditLimit ?? null,
      initialOutstanding: data.initialOutstanding ?? null,
      billingCycleDay: data.billingCycleDay ?? null,
    },
  });
  revalidatePath("/add");
  revalidatePath("/settings");
  revalidatePath("/");
  return pm;
}

export async function updatePaymentMethod(
  id: string,
  data: {
    name?: string;
    icon?: string;
    color?: string;
    type?: "SIMPLE" | "CREDIT";
    bankName?: string | null;
    lastFourDigits?: string | null;
    creditLimit?: number | null;
    initialOutstanding?: number | null;
    billingCycleDay?: number | null;
  }
) {
  const userId = await getUserId();
  const pm = await prisma.paymentMethod.update({
    where: { id, userId },
    data: {
      ...(data.name !== undefined && { name: data.name.trim() }),
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
  revalidatePath("/add");
  revalidatePath("/settings");
  revalidatePath("/");
  return pm;
}

export async function deletePaymentMethod(id: string) {
  const userId = await getUserId();

  const usageCount = await prisma.expense.count({
    where: { userId, paymentMethodId: id },
  });
  const settlementCount = await prisma.expense.count({
    where: { userId, settlesPaymentMethodId: id },
  });
  if (usageCount > 0 || settlementCount > 0) {
    throw new Error(
      `Cannot delete — ${usageCount + settlementCount} expense(s)/settlement(s) reference this method`
    );
  }

  await prisma.paymentMethod.delete({ where: { id, userId } });
  revalidatePath("/add");
  revalidatePath("/settings");
  revalidatePath("/history");
}

export async function getTags() {
  const userId = await getUserId();
  return prisma.tag.findMany({
    where: { userId },
    orderBy: { name: "asc" },
  });
}

export async function createTag(name: string) {
  const userId = await getUserId();
  const tag = await prisma.tag.create({
    data: { userId, name: name.trim() },
  });
  revalidatePath("/add");
  return tag;
}

export async function createExpense(data: {
  amount: number;
  categoryId: string;
  paymentMethodId: string;
  description?: string;
  notes?: string;
  expenseDate: string;
  tagIds?: string[];
  type?: "EXPENSE" | "SETTLEMENT";
  settlesPaymentMethodId?: string;
}) {
  const userId = await getUserId();

  const expense = await prisma.expense.create({
    data: {
      userId,
      amount: data.amount,
      type: data.type || "EXPENSE",
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

export async function getExpenses(params?: {
  startDate?: string;
  endDate?: string;
  categoryId?: string;
  paymentMethodId?: string;
  search?: string;
  type?: "EXPENSE" | "SETTLEMENT";
  limit?: number;
  offset?: number;
}) {
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
      take: params?.limit || 50,
      skip: params?.offset || 0,
    }),
    prisma.expense.count({ where }),
  ]);

  return { expenses, total };
}

export async function updateExpense(
  id: string,
  data: {
    amount: number;
    categoryId: string;
    paymentMethodId: string;
    description?: string;
    notes?: string;
    expenseDate: string;
    tagIds?: string[];
  }
) {
  const userId = await getUserId();

  await prisma.expenseTag.deleteMany({ where: { expenseId: id } });

  const expense = await prisma.expense.update({
    where: { id, userId },
    data: {
      amount: data.amount,
      categoryId: data.categoryId,
      paymentMethodId: data.paymentMethodId,
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

export async function deleteExpense(id: string) {
  const userId = await getUserId();
  await prisma.expense.delete({ where: { id, userId } });
  revalidatePath("/");
  revalidatePath("/history");
}

export async function getDashboardData() {
  const userId = await getUserId();

  const istNow = new Date(Date.now() + 5.5 * 60 * 60 * 1000);
  const istYear = istNow.getUTCFullYear();
  const istMonth = istNow.getUTCMonth();
  const startOfMonth = new Date(Date.UTC(istYear, istMonth, 1) - 5.5 * 60 * 60 * 1000);
  const endOfMonth = new Date(Date.UTC(istYear, istMonth + 1, 1) - 5.5 * 60 * 60 * 1000 - 1);

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
