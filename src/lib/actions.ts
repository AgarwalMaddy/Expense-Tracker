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

export async function createPaymentMethod(data: {
  name: string;
  icon: string;
  color: string;
}) {
  const userId = await getUserId();
  const pm = await prisma.paymentMethod.create({
    data: {
      userId,
      name: data.name.trim(),
      icon: data.icon,
      color: data.color,
    },
  });
  revalidatePath("/add");
  revalidatePath("/settings");
  return pm;
}

export async function deletePaymentMethod(id: string) {
  const userId = await getUserId();

  const usageCount = await prisma.expense.count({
    where: { userId, paymentMethodId: id },
  });
  if (usageCount > 0) {
    throw new Error(`Cannot delete — ${usageCount} expense(s) use this payment method`);
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
}) {
  const userId = await getUserId();

  const expense = await prisma.expense.create({
    data: {
      userId,
      amount: data.amount,
      categoryId: data.categoryId,
      paymentMethodId: data.paymentMethodId,
      description: data.description || null,
      notes: data.notes || null,
      expenseDate: new Date(data.expenseDate),
      tags: data.tagIds?.length
        ? { create: data.tagIds.map((tagId) => ({ tagId })) }
        : undefined,
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
      tags: data.tagIds?.length
        ? { create: data.tagIds.map((tagId) => ({ tagId })) }
        : undefined,
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

  const [monthlyExpenses, categoryBreakdown, paymentBreakdown, recentExpenses] =
    await Promise.all([
      prisma.expense.aggregate({
        where: { userId, expenseDate: { gte: startOfMonth, lte: endOfMonth } },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.expense.groupBy({
        by: ["categoryId"],
        where: { userId, expenseDate: { gte: startOfMonth, lte: endOfMonth } },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.expense.groupBy({
        by: ["paymentMethodId"],
        where: { userId, expenseDate: { gte: startOfMonth, lte: endOfMonth } },
        _sum: { amount: true },
      }),
      prisma.expense.findMany({
        where: { userId },
        include: { category: true, paymentMethod: true },
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
