"use client";

import { useState, useTransition, useMemo } from "react";
import { format, isToday, isYesterday } from "date-fns";
import { Trash2, Search, Filter, X, Pencil, CalendarIcon, Check, Loader2, ArrowUpDown, ArrowLeftRight } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { CURRENCY_SYMBOL } from "@/lib/constants";

import { deleteExpense, getExpenses, updateExpense } from "@/lib/actions";
import { CategoryIcon } from "@/components/CategoryIcon";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import type {
  Category,
  Expense,
  ExpenseTag,
  Tag,
  PaymentMethod,
} from "@/generated/prisma/client";

type ExpenseWithRelations = Expense & {
  category: Category;
  paymentMethod: PaymentMethod;
  settlesPaymentMethod?: PaymentMethod | null;
  tags: (ExpenseTag & { tag: Tag })[];
};

interface HistoryListProps {
  initialExpenses: ExpenseWithRelations[];
  total: number;
  categories: Category[];
  paymentMethods: PaymentMethod[];
  tags: Tag[];
}

function EditExpenseSheet({
  expense,
  categories,
  paymentMethods,
  tags,
  onSave,
  onClose,
}: {
  expense: ExpenseWithRelations;
  categories: Category[];
  paymentMethods: PaymentMethod[];
  tags: Tag[];
  onSave: (updated: ExpenseWithRelations) => void;
  onClose: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [amount, setAmount] = useState(String(Number(expense.amount)));
  const [categoryId, setCategoryId] = useState(expense.categoryId);
  const [paymentMethodId, setPaymentMethodId] = useState(expense.paymentMethodId);
  const [description, setDescription] = useState(expense.description || "");
  const [notes, setNotes] = useState(expense.notes || "");
  const [date, setDate] = useState<Date>(new Date(expense.expenseDate));
  const [selectedTags, setSelectedTags] = useState<string[]>(
    expense.tags.map((et) => et.tagId)
  );

  const handleSave = () => {
    if (!amount || !categoryId || !paymentMethodId) {
      toast.error("Amount, category, and payment are required");
      return;
    }

    startTransition(async () => {
      try {
        await updateExpense(expense.id, {
          amount: parseFloat(amount),
          categoryId,
          paymentMethodId,
          description: description || undefined,
          notes: notes || undefined,
          expenseDate: date.toISOString(),
          tagIds: selectedTags.length > 0 ? selectedTags : undefined,
        });

        const cat = categories.find((c) => c.id === categoryId)!;
        const pm = paymentMethods.find((p) => p.id === paymentMethodId)!;
        onSave({
          ...expense,
          amount: parseFloat(amount) as unknown as Expense["amount"],
          categoryId,
          category: cat,
          paymentMethodId,
          paymentMethod: pm,
          description: description || null,
          notes: notes || null,
          expenseDate: date,
          tags: selectedTags.map((tagId) => ({
            expenseId: expense.id,
            tagId,
            tag: tags.find((t) => t.id === tagId)!,
          })),
        });

        toast.success("Expense updated");
        onClose();
      } catch {
        toast.error("Failed to update");
      }
    });
  };

  return (
    <div className="mx-auto max-w-lg space-y-4 mt-4 max-h-[70vh] overflow-y-auto pb-4">
      {/* Amount */}
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Amount</Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg font-semibold text-muted-foreground/60">
            {CURRENCY_SYMBOL}
          </span>
          <Input
            type="number"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="h-12 pl-8 text-xl font-bold rounded-xl"
          />
        </div>
      </div>

      {/* Category */}
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Category</Label>
        <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-5">
          {categories.map((cat) => {
            const isSelected = categoryId === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategoryId(cat.id)}
                className={cn(
                  "relative flex flex-col items-center gap-1.5 rounded-xl border-2 p-2 text-[10px] transition-all overflow-hidden min-w-0",
                  isSelected
                    ? "border-primary bg-primary/10 ring-1 ring-primary/20"
                    : "border-transparent bg-muted/40"
                )}
              >
                {isSelected && (
                  <div className="absolute right-0.5 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary">
                    <Check className="h-2.5 w-2.5 text-primary-foreground" strokeWidth={3} />
                  </div>
                )}
                <CategoryIcon name={cat.icon} color={cat.color} size="sm" />
                <span className={cn("max-w-full truncate font-medium", isSelected && "text-primary font-semibold")}>
                  {cat.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Payment */}
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Payment</Label>
        <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-5">
          {paymentMethods.map((pm) => {
            const isSelected = paymentMethodId === pm.id;
            return (
              <button
                key={pm.id}
                type="button"
                onClick={() => setPaymentMethodId(pm.id)}
                className={cn(
                  "relative flex flex-col items-center gap-1.5 rounded-xl border-2 p-2 text-[10px] transition-all overflow-hidden min-w-0",
                  isSelected
                    ? "border-primary bg-primary/10 ring-1 ring-primary/20"
                    : "border-transparent bg-muted/40"
                )}
              >
                {isSelected && (
                  <div className="absolute right-0.5 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary">
                    <Check className="h-2.5 w-2.5 text-primary-foreground" strokeWidth={3} />
                  </div>
                )}
                <CategoryIcon name={pm.icon} color={pm.color} size="sm" />
                <span className={cn("max-w-full truncate font-medium", isSelected && "text-primary font-semibold")}>
                  {pm.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Date + Description */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Date</Label>
          <Popover>
            <PopoverTrigger className="flex h-10 w-full items-center justify-start rounded-xl border border-input bg-background px-3 py-2 text-left text-sm hover:bg-accent transition-colors">
              <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
              {format(date, "PPP")}
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 rounded-xl" align="start">
              <Calendar mode="single" selected={date} onSelect={(d) => d && setDate(d)} initialFocus />
            </PopoverContent>
          </Popover>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Description</Label>
          <Input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What was this for?"
            className="rounded-xl"
          />
        </div>
      </div>

      {/* Notes */}
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Notes</Label>
        <Input
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Optional notes..."
          className="rounded-xl"
        />
      </div>

      {/* Labels */}
      {tags.length > 0 && (
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Labels</Label>
          <div className="flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <button
                key={tag.id}
                type="button"
                onClick={() =>
                  setSelectedTags((prev) =>
                    prev.includes(tag.id)
                      ? prev.filter((t) => t !== tag.id)
                      : [...prev, tag.id]
                  )
                }
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-medium transition-all",
                  selectedTags.includes(tag.id)
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border/60 hover:bg-muted/70"
                )}
              >
                {tag.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Save */}
      <Button
        onClick={handleSave}
        disabled={isPending || !amount || !categoryId || !paymentMethodId}
        className="h-12 w-full rounded-xl gradient-primary hover:opacity-90 transition-opacity font-semibold"
      >
        {isPending ? (
          <span className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" /> Saving...
          </span>
        ) : (
          "Save Changes"
        )}
      </Button>
    </div>
  );
}

type SortOption = "newest" | "oldest" | "highest" | "lowest";

function formatDateHeading(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  if (isToday(d)) return "Today";
  if (isYesterday(d)) return "Yesterday";
  return format(d, "EEEE, d MMM yyyy");
}

export function HistoryList({
  initialExpenses,
  total,
  categories,
  paymentMethods,
  tags,
}: HistoryListProps) {
  const [expenses, setExpenses] = useState<ExpenseWithRelations[]>(initialExpenses);
  const [count, setCount] = useState(total);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [paymentFilter, setPaymentFilter] = useState<string>("");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [editingExpense, setEditingExpense] = useState<ExpenseWithRelations | null>(null);
  const [isPending, startTransition] = useTransition();

  const sortedExpenses = useMemo(() => {
    const sorted = [...expenses];
    switch (sortBy) {
      case "newest":
        sorted.sort((a, b) => new Date(b.expenseDate).getTime() - new Date(a.expenseDate).getTime());
        break;
      case "oldest":
        sorted.sort((a, b) => new Date(a.expenseDate).getTime() - new Date(b.expenseDate).getTime());
        break;
      case "highest":
        sorted.sort((a, b) => Number(b.amount) - Number(a.amount));
        break;
      case "lowest":
        sorted.sort((a, b) => Number(a.amount) - Number(b.amount));
        break;
    }
    return sorted;
  }, [expenses, sortBy]);

  const groupedByDate = useMemo(() => {
    const groups: { date: string; expenses: ExpenseWithRelations[]; dayTotal: number }[] = [];
    const map = new Map<string, ExpenseWithRelations[]>();

    for (const exp of sortedExpenses) {
      const d = new Date(exp.expenseDate);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(exp);
    }

    for (const [date, exps] of map) {
      groups.push({
        date,
        expenses: exps,
        dayTotal: exps.reduce((s, e) => s + Number(e.amount), 0),
      });
    }

    if (sortBy === "newest" || sortBy === "highest" || sortBy === "lowest") {
      groups.sort((a, b) => b.date.localeCompare(a.date));
    } else {
      groups.sort((a, b) => a.date.localeCompare(b.date));
    }

    return groups;
  }, [sortedExpenses, sortBy]);

  const handleFilter = () => {
    startTransition(async () => {
      const result = await getExpenses({
        search: search || undefined,
        categoryId: categoryFilter || undefined,
        paymentMethodId: paymentFilter || undefined,
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

  const handleUpdate = (updated: ExpenseWithRelations) => {
    setExpenses((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
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
                  {paymentMethods.map((pm) => (
                    <SelectItem key={pm.id} value={pm.id}>
                      {pm.name}
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

      {/* Count + Sort */}
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {count} expense{count !== 1 ? "s" : ""}
        </p>
        <Select value={sortBy} onValueChange={(v) => setSortBy((v as SortOption) ?? "newest")}>
          <SelectTrigger className="h-8 w-auto gap-1.5 rounded-lg border-border/50 bg-muted/40 px-2.5 text-xs font-medium">
            <ArrowUpDown className="h-3 w-3" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent align="end">
            <SelectItem value="newest">Newest first</SelectItem>
            <SelectItem value="oldest">Oldest first</SelectItem>
            <SelectItem value="highest">Highest amount</SelectItem>
            <SelectItem value="lowest">Lowest amount</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Date-Grouped List */}
      {expenses.length === 0 ? (
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="py-16 text-center text-sm text-muted-foreground"
        >
          No expenses found
        </motion.p>
      ) : (
        <div className="space-y-5">
          {groupedByDate.map((group) => (
            <div key={group.date} className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {formatDateHeading(group.date)}
                </h3>
                <span className="text-xs font-semibold tabular-nums text-muted-foreground">
                  {CURRENCY_SYMBOL}{group.dayTotal.toLocaleString("en-IN")}
                </span>
              </div>
              <AnimatePresence mode="popLayout">
                {group.expenses.map((expense, i) => (
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
                    {expense.type === "SETTLEMENT" ? (
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10">
                        <ArrowLeftRight className="h-5 w-5 text-emerald-600" />
                      </div>
                    ) : (
                      <CategoryIcon
                        name={expense.category.icon}
                        color={expense.category.color}
                        size="md"
                        glow
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="truncate text-sm font-medium">
                          {expense.description || expense.category.name}
                        </p>
                        {expense.type === "SETTLEMENT" && (
                          <span className="shrink-0 text-[9px] font-bold text-emerald-600 bg-emerald-500/10 rounded-full px-1.5 py-0.5">
                            SETTLEMENT
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {expense.paymentMethod.name}
                        {expense.settlesPaymentMethod && ` → ${expense.settlesPaymentMethod.name}`}
                      </span>
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
                      <div className="flex items-center gap-1">
                        <motion.button
                          whileTap={{ scale: 0.8 }}
                          onClick={() => setEditingExpense(expense)}
                          className="rounded-lg p-1 text-muted-foreground/50 hover:text-primary hover:bg-primary/10 transition-colors"
                          disabled={isPending}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </motion.button>
                        <motion.button
                          whileTap={{ scale: 0.8 }}
                          onClick={() => handleDelete(expense.id)}
                          className="rounded-lg p-1 text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10 transition-colors"
                          disabled={isPending}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          ))}
        </div>
      )}

      {/* Edit Sheet */}
      <Sheet open={!!editingExpense} onOpenChange={(open) => !open && setEditingExpense(null)}>
        <SheetContent side="bottom" className="rounded-t-3xl max-h-[85vh]">
          <SheetHeader>
            <SheetTitle className="font-display">Edit Expense</SheetTitle>
          </SheetHeader>
          {editingExpense && (
            <EditExpenseSheet
              key={editingExpense.id}
              expense={editingExpense}
              categories={categories}
              paymentMethods={paymentMethods}
              tags={tags}
              onSave={handleUpdate}
              onClose={() => setEditingExpense(null)}
            />
          )}
        </SheetContent>
      </Sheet>
    </motion.div>
  );
}
