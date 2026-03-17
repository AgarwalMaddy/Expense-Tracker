"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { CalendarIcon, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { PAYMENT_METHODS, CURRENCY_SYMBOL } from "@/lib/constants";
import { createExpense } from "@/lib/actions";
import { CategoryIcon } from "@/components/CategoryIcon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { Category, Tag } from "@/generated/prisma/client";

interface AddExpenseFormProps {
  categories: Category[];
  tags: Tag[];
}

export function AddExpenseForm({ categories, tags }: AddExpenseFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showSuccess, setShowSuccess] = useState(false);

  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("UPI");
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");
  const [date, setDate] = useState<Date>(new Date());
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const handleSubmit = () => {
    if (!amount || !categoryId) {
      toast.error("Amount and category are required");
      return;
    }

    startTransition(async () => {
      try {
        await createExpense({
          amount: parseFloat(amount),
          categoryId,
          paymentMethod: paymentMethod as "CASH" | "UPI" | "CARD" | "ONLINE",
          description: description || undefined,
          notes: notes || undefined,
          expenseDate: date.toISOString(),
          tagIds: selectedTags.length > 0 ? selectedTags : undefined,
        });

        if (navigator.vibrate) navigator.vibrate(50);
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 1500);
        toast.success("Expense added!");
        setAmount("");
        setCategoryId("");
        setDescription("");
        setNotes("");
        setSelectedTags([]);
        router.refresh();
      } catch {
        toast.error("Failed to add expense");
      }
    });
  };

  const selectedCat = categories.find((c) => c.id === categoryId);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.21, 0.47, 0.32, 0.98] }}
      className="mx-auto max-w-2xl space-y-6 p-4 md:p-8"
    >
      {/* Amount */}
      <div className="space-y-2">
        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Amount</Label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-semibold text-muted-foreground/60">
            {CURRENCY_SYMBOL}
          </span>
          <Input
            type="number"
            inputMode="decimal"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="h-16 pl-11 text-3xl font-bold rounded-2xl border-2 border-border/50 focus:border-primary/50 transition-colors"
          />
        </div>
      </div>

      {/* Category Grid */}
      <div className="space-y-2">
        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Category
          {selectedCat && (
            <span className="ml-1.5 normal-case tracking-normal text-foreground">
              &mdash; {selectedCat.name}
            </span>
          )}
        </Label>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
          {categories.map((cat, i) => {
            const isSelected = categoryId === cat.id;
            return (
              <motion.button
                key={cat.id}
                type="button"
                onClick={() => setCategoryId(prev => prev === cat.id ? "" : cat.id)}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: i * 0.03 }}
                whileTap={{ scale: 0.93 }}
                className={cn(
                  "relative flex flex-col items-center gap-2 rounded-2xl border-2 p-3 text-xs transition-all",
                  isSelected
                    ? "border-primary bg-primary/10 ring-2 ring-primary/20 shadow-md shadow-primary/10"
                    : "border-transparent bg-muted/40 hover:bg-muted/70"
                )}
              >
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary"
                  >
                    <Check className="h-3 w-3 text-primary-foreground" strokeWidth={3} />
                  </motion.div>
                )}
                <CategoryIcon name={cat.icon} color={cat.color} size="sm" glow={isSelected} />
                <span className={cn("truncate font-medium", isSelected && "text-primary font-semibold")}>
                  {cat.name}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Payment Method */}
      <div className="space-y-2">
        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Payment
          {paymentMethod && (
            <span className="ml-1.5 normal-case tracking-normal text-foreground">
              &mdash; {PAYMENT_METHODS.find((p) => p.value === paymentMethod)?.label}
            </span>
          )}
        </Label>
        <div className="grid grid-cols-4 gap-2">
          {PAYMENT_METHODS.map((pm) => {
            const isSelected = paymentMethod === pm.value;
            return (
              <motion.button
                key={pm.value}
                type="button"
                onClick={() => setPaymentMethod(prev => prev === pm.value ? "" : pm.value)}
                whileTap={{ scale: 0.93 }}
                className={cn(
                  "relative flex flex-col items-center gap-2 rounded-2xl border-2 p-3 text-xs transition-all",
                  isSelected
                    ? "border-primary bg-primary/10 ring-2 ring-primary/20 shadow-md shadow-primary/10"
                    : "border-transparent bg-muted/40 hover:bg-muted/70"
                )}
              >
                {isSelected && (
                  <motion.div
                    layoutId="payment-check"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary"
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  >
                    <Check className="h-3 w-3 text-primary-foreground" strokeWidth={3} />
                  </motion.div>
                )}
                <CategoryIcon name={pm.icon} size="sm" />
                <span className={cn("font-medium", isSelected && "text-primary font-semibold")}>
                  {pm.label}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Date */}
        <div className="space-y-2">
          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Date</Label>
          <Popover>
            <PopoverTrigger className="flex h-10 w-full items-center justify-start rounded-xl border border-input bg-background px-3 py-2 text-left text-sm font-normal ring-offset-background hover:bg-accent hover:text-accent-foreground transition-colors">
              <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
              {format(date, "PPP")}
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 rounded-xl" align="start">
              <Calendar
                mode="single"
                selected={date}
                onSelect={(d) => d && setDate(d)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Description</Label>
          <Input
            placeholder="What was this for?"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="rounded-xl"
          />
        </div>
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Notes (optional)</Label>
        <Input
          placeholder="Any additional notes..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="rounded-xl"
        />
      </div>

      {/* Tags */}
      {tags.length > 0 && (
        <div className="space-y-2">
          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tags</Label>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <motion.button
                key={tag.id}
                type="button"
                whileTap={{ scale: 0.9 }}
                onClick={() =>
                  setSelectedTags((prev) =>
                    prev.includes(tag.id)
                      ? prev.filter((t) => t !== tag.id)
                      : [...prev, tag.id]
                  )
                }
                className={cn(
                  "rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all",
                  selectedTags.includes(tag.id)
                    ? "border-primary bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                    : "border-border/60 hover:bg-muted/70 hover:border-border"
                )}
              >
                {tag.name}
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {/* Submit */}
      <motion.div whileTap={{ scale: 0.98 }}>
        <Button
          onClick={handleSubmit}
          disabled={isPending || !amount || !categoryId}
          className="relative h-14 w-full rounded-2xl text-base font-semibold gradient-primary hover:opacity-90 transition-opacity md:w-auto md:px-16"
          size="lg"
        >
          <AnimatePresence mode="wait">
            {isPending ? (
              <motion.span
                key="loading"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex items-center gap-2"
              >
                <Loader2 className="h-5 w-5 animate-spin" />
                Adding...
              </motion.span>
            ) : showSuccess ? (
              <motion.span
                key="success"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex items-center gap-2"
              >
                <Check className="h-5 w-5" />
                Added!
              </motion.span>
            ) : (
              <motion.span
                key="default"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
              >
                Add Expense
              </motion.span>
            )}
          </AnimatePresence>
        </Button>
      </motion.div>
    </motion.div>
  );
}
