"use client";

import { useState, useTransition, useMemo } from "react";
import { format, isToday, isYesterday } from "date-fns";
import {
  Trash2,
  Search,
  Filter,
  X,
  Pencil,
  CalendarIcon,
  Check,
  Loader2,
  ArrowUpDown,
  ArrowLeftRight,
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { usePreferences } from "@/lib/preferences-context";

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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { exportExpensesCSV } from "@/lib/actions";
import { Download } from "lucide-react";
import type { Category, Expense, ExpenseTag, Tag, PaymentMethod } from "@/generated/prisma/client";

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
  const { currencySymbol } = usePreferences();
  const [isPending, startTransition] = useTransition();
  const [amount, setAmount] = useState(String(Number(expense.amount)));
  const [categoryId, setCategoryId] = useState(expense.categoryId);
  const [paymentMethodId, setPaymentMethodId] = useState(expense.paymentMethodId);
  const [description, setDescription] = useState(expense.description || "");
  const [notes, setNotes] = useState(expense.notes || "");
  const [date, setDate] = useState<Date>(new Date(expense.expenseDate));
  const [selectedTags, setSelectedTags] = useState<string[]>(expense.tags.map((et) => et.tagId));

  const handleSave = () => {
    if (!amount || !categoryId || !paymentMethodId) {
      toast.error("Amount, category, and payment are required");
      return;
    }

    startTransition(async () => {
      const result = await updateExpense(expense.id, {
        amount: parseFloat(amount),
        categoryId,
        paymentMethodId,
        description: description || undefined,
        notes: notes || undefined,
        expenseDate: date.toISOString(),
        tagIds: selectedTags.length > 0 ? selectedTags : undefined,
      });

      if (!result.success) {
        toast.error(result.error);
        return;
      }

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
    });
  };

  return (
    <div className="mx-auto mt-4 max-h-[70vh] max-w-lg space-y-4 overflow-y-auto pb-4">
      {/* Amount */}
      <div className="space-y-1.5">
        <Label className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
          Amount
        </Label>
        <div className="relative">
          <span className="text-muted-foreground/60 absolute top-1/2 left-3 -translate-y-1/2 text-lg font-semibold">
            {currencySymbol}
          </span>
          <Input
            type="number"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="h-12 rounded-xl pl-8 text-xl font-bold"
          />
        </div>
      </div>

      {/* Category */}
      <div className="space-y-1.5">
        <Label className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
          Category
        </Label>
        <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-5">
          {categories.map((cat) => {
            const isSelected = categoryId === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategoryId(cat.id)}
                className={cn(
                  "relative flex min-w-0 flex-col items-center gap-1.5 overflow-hidden rounded-xl border-2 p-2 text-[10px] transition-all",
                  isSelected
                    ? "border-primary bg-primary/10 ring-primary/20 ring-1"
                    : "bg-muted/40 border-transparent"
                )}
              >
                {isSelected && (
                  <div className="bg-primary absolute top-0.5 right-0.5 flex h-4 w-4 items-center justify-center rounded-full">
                    <Check className="text-primary-foreground h-2.5 w-2.5" strokeWidth={3} />
                  </div>
                )}
                <CategoryIcon name={cat.icon} color={cat.color} size="sm" />
                <span
                  className={cn(
                    "max-w-full truncate font-medium",
                    isSelected && "text-primary font-semibold"
                  )}
                >
                  {cat.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Payment */}
      <div className="space-y-1.5">
        <Label className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
          Payment
        </Label>
        <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-5">
          {paymentMethods.map((pm) => {
            const isSelected = paymentMethodId === pm.id;
            return (
              <button
                key={pm.id}
                type="button"
                onClick={() => setPaymentMethodId(pm.id)}
                className={cn(
                  "relative flex min-w-0 flex-col items-center gap-1.5 overflow-hidden rounded-xl border-2 p-2 text-[10px] transition-all",
                  isSelected
                    ? "border-primary bg-primary/10 ring-primary/20 ring-1"
                    : "bg-muted/40 border-transparent"
                )}
              >
                {isSelected && (
                  <div className="bg-primary absolute top-0.5 right-0.5 flex h-4 w-4 items-center justify-center rounded-full">
                    <Check className="text-primary-foreground h-2.5 w-2.5" strokeWidth={3} />
                  </div>
                )}
                <CategoryIcon name={pm.icon} color={pm.color} size="sm" />
                <span
                  className={cn(
                    "max-w-full truncate font-medium",
                    isSelected && "text-primary font-semibold"
                  )}
                >
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
          <Label className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
            Date
          </Label>
          <Popover>
            <PopoverTrigger className="border-input bg-background hover:bg-accent flex h-10 w-full items-center justify-start rounded-xl border px-3 py-2 text-left text-sm transition-colors">
              <CalendarIcon className="text-muted-foreground mr-2 h-4 w-4" />
              {format(date, "PPP")}
            </PopoverTrigger>
            <PopoverContent className="w-auto rounded-xl p-0" align="start">
              <Calendar
                mode="single"
                selected={date}
                onSelect={(d) => d && setDate(d)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
        <div className="space-y-1.5">
          <Label className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
            Description
          </Label>
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
        <Label className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
          Notes
        </Label>
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
          <Label className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
            Labels
          </Label>
          <div className="flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <button
                key={tag.id}
                type="button"
                onClick={() =>
                  setSelectedTags((prev) =>
                    prev.includes(tag.id) ? prev.filter((t) => t !== tag.id) : [...prev, tag.id]
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
        className="gradient-primary h-12 w-full rounded-xl font-semibold transition-opacity hover:opacity-90"
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
  const { currencySymbol, locale } = usePreferences();
  const [expenses, setExpenses] = useState<ExpenseWithRelations[]>(initialExpenses);
  const [count, setCount] = useState(total);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [paymentFilter, setPaymentFilter] = useState<string>("");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [editingExpense, setEditingExpense] = useState<ExpenseWithRelations | null>(null);
  const [deletingExpense, setDeletingExpense] = useState<ExpenseWithRelations | null>(null);
  const [isPending, startTransition] = useTransition();

  const sortedExpenses = useMemo(() => {
    const sorted = [...expenses];
    switch (sortBy) {
      case "newest":
        sorted.sort(
          (a, b) => new Date(b.expenseDate).getTime() - new Date(a.expenseDate).getTime()
        );
        break;
      case "oldest":
        sorted.sort(
          (a, b) => new Date(a.expenseDate).getTime() - new Date(b.expenseDate).getTime()
        );
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

  const confirmDelete = () => {
    if (!deletingExpense) return;
    const id = deletingExpense.id;
    setDeletingExpense(null);
    startTransition(async () => {
      const result = await deleteExpense(id);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      setExpenses((prev) => prev.filter((e) => e.id !== id));
      setCount((prev) => prev - 1);
      toast.success("Deleted");
    });
  };

  const handleUpdate = (updated: ExpenseWithRelations) => {
    setExpenses((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
  };

  const handleExportCSV = () => {
    startTransition(async () => {
      const csv = await exportExpensesCSV({
        search: search || undefined,
        categoryId: categoryFilter || undefined,
        paymentMethodId: paymentFilter || undefined,
      });
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `expenses-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("CSV exported");
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
          <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <Input
            placeholder="Search expenses..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleFilter()}
            className="rounded-xl pl-9"
          />
        </div>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={handleExportCSV}
          disabled={isPending || expenses.length === 0}
          className="border-input bg-background hover:bg-accent hover:text-accent-foreground inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-colors disabled:opacity-40"
          title="Export CSV"
        >
          <Download className="h-4 w-4" />
        </motion.button>
        <Sheet>
          <SheetTrigger className="border-input bg-background hover:bg-accent hover:text-accent-foreground relative inline-flex h-10 w-10 items-center justify-center rounded-xl border transition-colors">
            <Filter className="h-4 w-4" />
            {hasFilters && (
              <span className="bg-primary ring-background absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full ring-2" />
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
                <Button
                  onClick={handleFilter}
                  className="gradient-primary flex-1 rounded-xl transition-opacity hover:opacity-90"
                  disabled={isPending}
                >
                  Apply Filters
                </Button>
                {hasFilters && (
                  <Button
                    variant="outline"
                    onClick={clearFilters}
                    disabled={isPending}
                    className="rounded-xl"
                  >
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
        <p className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
          {count} expense{count !== 1 ? "s" : ""}
        </p>
        <Select value={sortBy} onValueChange={(v) => setSortBy((v as SortOption) ?? "newest")}>
          <SelectTrigger className="border-border/50 bg-muted/40 h-8 w-auto gap-1.5 rounded-lg px-2.5 text-xs font-medium">
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
          className="text-muted-foreground py-16 text-center text-sm"
        >
          No expenses found
        </motion.p>
      ) : (
        <div className="space-y-5">
          {groupedByDate.map((group) => (
            <div key={group.date} className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                  {formatDateHeading(group.date)}
                </h3>
                <span className="text-muted-foreground text-xs font-semibold tabular-nums">
                  {currencySymbol}
                  {group.dayTotal.toLocaleString(locale)}
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
                      "border-border/50 bg-card hover:border-border flex items-center gap-3 rounded-2xl border p-3.5 transition-all hover:shadow-sm",
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
                          <span className="shrink-0 rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-bold text-emerald-600">
                            SETTLEMENT
                          </span>
                        )}
                      </div>
                      <span className="text-muted-foreground text-xs">
                        {expense.paymentMethod.name}
                        {expense.settlesPaymentMethod && ` → ${expense.settlesPaymentMethod.name}`}
                      </span>
                      {expense.tags.length > 0 && (
                        <div className="mt-1.5 flex gap-1">
                          {expense.tags.map((et) => (
                            <Badge
                              key={et.tagId}
                              variant="secondary"
                              className="rounded-full px-2 py-0 text-[10px]"
                            >
                              {et.tag.name}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      <p className="text-sm font-semibold tabular-nums">
                        {currencySymbol}
                        {Number(expense.amount).toLocaleString(locale)}
                      </p>
                      <div className="flex items-center gap-1">
                        <motion.button
                          whileTap={{ scale: 0.8 }}
                          onClick={() => setEditingExpense(expense)}
                          className="text-muted-foreground/50 hover:text-primary hover:bg-primary/10 rounded-lg p-1 transition-colors"
                          disabled={isPending}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </motion.button>
                        <motion.button
                          whileTap={{ scale: 0.8 }}
                          onClick={() => setDeletingExpense(expense)}
                          className="text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10 rounded-lg p-1 transition-colors"
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
        <SheetContent side="bottom" className="max-h-[85vh] rounded-t-3xl">
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deletingExpense} onOpenChange={(open) => !open && setDeletingExpense(null)}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Delete Expense</DialogTitle>
            <DialogDescription>
              {deletingExpense && (
                <>
                  Delete{" "}
                  <strong>
                    {currencySymbol}
                    {Number(deletingExpense.amount).toLocaleString(locale)}
                  </strong>{" "}
                  — {deletingExpense.description || deletingExpense.category.name}? This cannot be
                  undone.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeletingExpense(null)}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={isPending}
              className="rounded-xl"
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
