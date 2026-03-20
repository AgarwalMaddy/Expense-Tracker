import { z } from "zod";

const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/, "Invalid hex color");
const cuid = z.string().min(1, "Required");

export const createTagSchema = z
  .string()
  .min(1, "Label name is required")
  .max(50, "Label name too long")
  .trim();

export const createPaymentMethodSchema = z
  .object({
    name: z.string().min(1, "Name is required").max(50, "Name too long").trim(),
    icon: z.string().min(1, "Icon is required"),
    color: hexColor,
    type: z.enum(["SIMPLE", "CREDIT"]).default("SIMPLE"),
    bankName: z.string().max(50).trim().optional(),
    lastFourDigits: z
      .string()
      .length(4, "Must be exactly 4 digits")
      .regex(/^\d+$/, "Must be digits only")
      .optional(),
    creditLimit: z.number().positive("Must be positive").max(100_000_000).optional(),
    initialOutstanding: z.number().min(0).max(100_000_000).optional(),
    billingCycleDay: z.number().int().min(1).max(31).optional(),
  })
  .refine(
    (data) => {
      if (data.type === "CREDIT") return true;
      return !data.creditLimit && !data.initialOutstanding && !data.billingCycleDay;
    },
    { message: "Credit fields only allowed for CREDIT type" }
  );

export const updatePaymentMethodSchema = z.object({
  name: z.string().min(1).max(50).trim().optional(),
  icon: z.string().min(1).optional(),
  color: hexColor.optional(),
  type: z.enum(["SIMPLE", "CREDIT"]).optional(),
  bankName: z.string().max(50).trim().nullable().optional(),
  lastFourDigits: z.string().length(4).regex(/^\d+$/).nullable().optional(),
  creditLimit: z.number().positive().max(100_000_000).nullable().optional(),
  initialOutstanding: z.number().min(0).max(100_000_000).nullable().optional(),
  billingCycleDay: z.number().int().min(1).max(31).nullable().optional(),
});

export const createExpenseSchema = z
  .object({
    amount: z.number().positive("Amount must be positive").max(100_000_000, "Amount too large"),
    categoryId: cuid,
    paymentMethodId: cuid,
    description: z.string().max(200, "Description too long").optional(),
    notes: z.string().max(500, "Notes too long").optional(),
    expenseDate: z.string().min(1, "Date is required"),
    tagIds: z.array(z.string().min(1)).optional(),
    type: z.enum(["EXPENSE", "SETTLEMENT"]).default("EXPENSE"),
    settlesPaymentMethodId: z.string().min(1).optional(),
  })
  .refine(
    (data) => {
      if (data.type === "SETTLEMENT") return !!data.settlesPaymentMethodId;
      return true;
    },
    {
      message: "Settlement must specify which card is being settled",
      path: ["settlesPaymentMethodId"],
    }
  );

export const updateExpenseSchema = z.object({
  amount: z.number().positive("Amount must be positive").max(100_000_000, "Amount too large"),
  categoryId: cuid,
  paymentMethodId: cuid,
  description: z.string().max(200, "Description too long").optional(),
  notes: z.string().max(500, "Notes too long").optional(),
  expenseDate: z.string().min(1, "Date is required"),
  tagIds: z.array(z.string().min(1)).optional(),
});

export const getExpensesSchema = z
  .object({
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    categoryId: z.string().optional(),
    paymentMethodId: z.string().optional(),
    search: z.string().max(200).optional(),
    type: z.enum(["EXPENSE", "SETTLEMENT"]).optional(),
    limit: z.number().int().min(1).max(200).default(50),
    offset: z.number().int().min(0).default(0),
  })
  .optional();

export const idSchema = z.string().min(1, "ID is required");

export const updatePreferencesSchema = z.object({
  currency: z.string().min(2).max(5).optional(),
  timezone: z.string().min(1).max(50).optional(),
  locale: z.string().min(2).max(10).optional(),
});

// Inferred types for callers
export type CreatePaymentMethodInput = z.input<typeof createPaymentMethodSchema>;
export type UpdatePaymentMethodInput = z.input<typeof updatePaymentMethodSchema>;
export type CreateExpenseInput = z.input<typeof createExpenseSchema>;
export type UpdateExpenseInput = z.input<typeof updateExpenseSchema>;
export type GetExpensesInput = z.input<typeof getExpensesSchema>;
