"use client";

import { useState, useTransition } from "react";
import { format } from "date-fns";
import { Trash2, Search, Filter } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { CURRENCY_SYMBOL, PAYMENT_METHODS } from "@/lib/constants";
import { deleteExpense, getExpenses } from "@/lib/actions";
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
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search expenses..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleFilter()}
            className="pl-9"
          />
        </div>
        <Sheet>
          <SheetTrigger className="relative inline-flex h-10 w-10 items-center justify-center rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground">
            <Filter className="h-4 w-4" />
            {hasFilters && (
              <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-primary" />
            )}
          </SheetTrigger>
          <SheetContent side="bottom" className="rounded-t-2xl">
            <SheetHeader>
              <SheetTitle>Filters</SheetTitle>
            </SheetHeader>
            <div className="mt-4 space-y-4">
              <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v ?? "")}>
                <SelectTrigger>
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.icon} {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={paymentFilter} onValueChange={(v) => setPaymentFilter(v ?? "")}>
                <SelectTrigger>
                  <SelectValue placeholder="All Payment Methods" />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map((pm) => (
                    <SelectItem key={pm.value} value={pm.value}>
                      {pm.icon} {pm.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex gap-2">
                <Button onClick={handleFilter} className="flex-1" disabled={isPending}>
                  Apply
                </Button>
                {hasFilters && (
                  <Button variant="outline" onClick={clearFilters} disabled={isPending}>
                    Clear
                  </Button>
                )}
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <p className="text-xs text-muted-foreground">
        {count} expense{count !== 1 ? "s" : ""}
      </p>

      {expenses.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">No expenses found</p>
      ) : (
        <div className="space-y-2">
          {expenses.map((expense) => (
            <div
              key={expense.id}
              className={cn(
                "flex items-center gap-3 rounded-xl border bg-card p-3 transition-opacity",
                isPending && "opacity-50"
              )}
            >
              <span className="text-2xl">{expense.category.icon}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {expense.description || expense.category.name}
                </p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{format(new Date(expense.expenseDate), "d MMM yyyy")}</span>
                  <span>·</span>
                  <span>{expense.paymentMethod}</span>
                </div>
                {expense.tags.length > 0 && (
                  <div className="mt-1 flex gap-1">
                    {expense.tags.map((et) => (
                      <Badge key={et.tagId} variant="secondary" className="text-[10px] px-1.5 py-0">
                        {et.tag.name}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex flex-col items-end gap-1">
                <p className="text-sm font-semibold">
                  {CURRENCY_SYMBOL}{Number(expense.amount).toLocaleString("en-IN")}
                </p>
                <button
                  onClick={() => handleDelete(expense.id)}
                  className="text-muted-foreground hover:text-destructive"
                  disabled={isPending}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
