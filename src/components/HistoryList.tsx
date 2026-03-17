"use client";

import { useState, useTransition } from "react";
import { format } from "date-fns";
import { Trash2, Search, Filter, X } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { CURRENCY_SYMBOL, PAYMENT_METHODS } from "@/lib/constants";
import { deleteExpense, getExpenses } from "@/lib/actions";
import { CategoryIcon } from "@/components/CategoryIcon";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import type { Category, Expense, ExpenseTag, Tag } from "@/generated/prisma/client";

type ExpenseWithRelations = Expense & {
  category: Category;
  tags: (ExpenseTag & { tag: Tag })[];
};

interface HistoryListProps {
  initialExpenses: ExpenseWithRelations[];
  total: number;
  categories: Category[];
}

export function HistoryList({ initialExpenses, total, categories }: HistoryListProps) {
  const [expenses, setExpenses] = useState<ExpenseWithRelations[]>(initialExpenses);
  const [count, setCount] = useState(total);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [paymentFilter, setPaymentFilter] = useState<string>("");
  const [isPending, startTransition] = useTransition();

  const handleFilter = () => {
    startTransition(async () => {
      const result = await getExpenses({
        search: search || undefined,
        categoryId: categoryFilter || undefined,
        paymentMethod: paymentFilter as "CASH" | "UPI" | "CARD" | "ONLINE" | undefined,
        limit: 50,
      });
      setExpenses(result.expenses as ExpenseWithRelations[]);
      setCount(result.total);
    });
  };

  const handleDelete = (id: string) => {
    startTransition(async () => {
      try {
        await deleteExpense(id);
        setExpenses((prev) => prev.filter((e) => e.id !== id));
        setCount((prev) => prev - 1);
        toast.success("Deleted");
      } catch {
        toast.error("Failed to delete");
      }
    });
  };

  const clearFilters = () => {
    setSearch("");
    setCategoryFilter("");
    setPaymentFilter("");
    startTransition(async () => {
      const result = await getExpenses({ limit: 50 });
      setExpenses(result.expenses as ExpenseWithRelations[]);
      setCount(result.total);
    });
  };

  const hasFilters = search || categoryFilter || paymentFilter;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="space-y-4"
    >
      {/* Search & Filter Bar */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search expenses..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleFilter()}
            className="pl-9 rounded-xl"
          />
        </div>
        <Sheet>
          <SheetTrigger className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors">
            <Filter className="h-4 w-4" />
            {hasFilters && (
              <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-primary ring-2 ring-background" />
            )}
          </SheetTrigger>
          <SheetContent side="bottom" className="rounded-t-3xl">
            <SheetHeader>
              <SheetTitle className="font-display">Filters</SheetTitle>
            </SheetHeader>
            <div className="mt-4 space-y-4">
              <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v ?? "")}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={paymentFilter} onValueChange={(v) => setPaymentFilter(v ?? "")}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="All Payment Methods" />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map((pm) => (
                    <SelectItem key={pm.value} value={pm.value}>
                      {pm.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex gap-2">
                <Button onClick={handleFilter} className="flex-1 rounded-xl gradient-primary hover:opacity-90 transition-opacity" disabled={isPending}>
                  Apply Filters
                </Button>
                {hasFilters && (
                  <Button variant="outline" onClick={clearFilters} disabled={isPending} className="rounded-xl">
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Count */}
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        {count} expense{count !== 1 ? "s" : ""}
      </p>

      {/* List */}
      {expenses.length === 0 ? (
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="py-16 text-center text-sm text-muted-foreground"
        >
          No expenses found
        </motion.p>
      ) : (
        <div className="space-y-2">
          <AnimatePresence mode="popLayout">
            {expenses.map((expense, i) => (
              <motion.div
                key={expense.id}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -60, transition: { duration: 0.2 } }}
                transition={{ duration: 0.35, delay: i * 0.03 }}
                className={cn(
                  "flex items-center gap-3 rounded-2xl border border-border/50 bg-card p-3.5 transition-all hover:shadow-sm hover:border-border",
                  isPending && "opacity-50"
                )}
              >
                <CategoryIcon
                  name={expense.category.icon}
                  color={expense.category.color}
                  size="md"
                  glow
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {expense.description || expense.category.name}
                  </p>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                    <span>{format(new Date(expense.expenseDate), "d MMM yyyy")}</span>
                    <span className="text-border">·</span>
                    <span>{expense.paymentMethod}</span>
                  </div>
                  {expense.tags.length > 0 && (
                    <div className="mt-1.5 flex gap-1">
                      {expense.tags.map((et) => (
                        <Badge key={et.tagId} variant="secondary" className="text-[10px] px-2 py-0 rounded-full">
                          {et.tag.name}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <p className="text-sm font-semibold tabular-nums">
                    {CURRENCY_SYMBOL}{Number(expense.amount).toLocaleString("en-IN")}
                  </p>
                  <motion.button
                    whileTap={{ scale: 0.8 }}
                    onClick={() => handleDelete(expense.id)}
                    className="rounded-lg p-1 text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10 transition-colors"
                    disabled={isPending}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
}
