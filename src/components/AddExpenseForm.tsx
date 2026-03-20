"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { CalendarIcon, Check, Loader2, ArrowLeftRight } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { usePreferences } from "@/lib/preferences-context";
import { autoGridCols } from "@/lib/grid";
import { createExpense } from "@/lib/actions";
import { CategoryIcon } from "@/components/CategoryIcon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { Category, Tag, PaymentMethod } from "@/generated/prisma/client";

interface AddExpenseFormProps {
  categories: Category[];
  tags: Tag[];
  paymentMethods: PaymentMethod[];
  creditMethods: PaymentMethod[];
}

type FormMode = "expense" | "settlement";

export function AddExpenseForm({
  categories,
  tags,
  paymentMethods,
  creditMethods,
}: AddExpenseFormProps) {
  const router = useRouter();
  const { currencySymbol } = usePreferences();
  const [isPending, startTransition] = useTransition();
  const [showSuccess, setShowSuccess] = useState(false);
  const [mode, setMode] = useState<FormMode>("expense");

  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [paymentMethodId, setPaymentMethodId] = useState("");
  const [settlesCardId, setSettlesCardId] = useState("");
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");
  const [date, setDate] = useState<Date>(new Date());
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const handleSubmit = () => {
    if (!amount) {
      toast.error("Amount is required");
      return;
    }

    if (mode === "expense" && (!categoryId || !paymentMethodId)) {
      toast.error("Category and payment method are required");
      return;
    }

    if (mode === "settlement") {
      if (!settlesCardId) {
        toast.error("Select which credit card you're settling");
        return;
      }
      if (!paymentMethodId) {
        toast.error("Select the payment method used to pay the bill");
        return;
      }
    }

    startTransition(async () => {
      try {
        if (mode === "settlement") {
          const billsCategory = categories.find((c) => c.name.toLowerCase() === "bills");
          await createExpense({
            amount: parseFloat(amount),
            categoryId: billsCategory?.id || categories[0].id,
            paymentMethodId,
            settlesPaymentMethodId: settlesCardId,
            type: "SETTLEMENT",
            description: description || `CC Bill Payment`,
            notes: notes || undefined,
            expenseDate: date.toISOString(),
          });
        } else {
          await createExpense({
            amount: parseFloat(amount),
            categoryId,
            paymentMethodId,
            description: description || undefined,
            notes: notes || undefined,
            expenseDate: date.toISOString(),
            tagIds: selectedTags.length > 0 ? selectedTags : undefined,
          });
        }

        if (navigator.vibrate) navigator.vibrate(50);
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 1500);
        toast.success(mode === "settlement" ? "Settlement recorded!" : "Expense added!");
        setAmount("");
        setCategoryId("");
        setPaymentMethodId("");
        setSettlesCardId("");
        setDescription("");
        setNotes("");
        setSelectedTags([]);
        router.refresh();
      } catch {
        toast.error("Failed to save");
      }
    });
  };

  const selectedCat = categories.find((c) => c.id === categoryId);
  const selectedPm = paymentMethods.find((p) => p.id === paymentMethodId);
  const selectedCard = creditMethods.find((c) => c.id === settlesCardId);

  const nonCreditMethods = paymentMethods.filter((pm) => pm.type !== "CREDIT");

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.21, 0.47, 0.32, 0.98] }}
      className="mx-auto max-w-2xl space-y-6 p-4 md:p-8"
    >
      {/* Mode Toggle */}
      {creditMethods.length > 0 && (
        <div className="border-border/50 bg-muted/30 flex rounded-2xl border p-1">
          {(["expense", "settlement"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => {
                setMode(m);
                setPaymentMethodId("");
                setCategoryId("");
                setSettlesCardId("");
              }}
              className={cn(
                "flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all",
                mode === m
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {m === "expense" ? "Expense" : "Settlement"}
            </button>
          ))}
        </div>
      )}

      {/* Amount */}
      <div className="space-y-2">
        <Label className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
          {mode === "settlement" ? "Settlement Amount" : "Amount"}
        </Label>
        <div className="relative">
          <span className="text-muted-foreground/60 absolute top-1/2 left-4 -translate-y-1/2 text-2xl font-semibold">
            {currencySymbol}
          </span>
          <Input
            type="number"
            inputMode="decimal"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="border-border/50 focus:border-primary/50 h-16 rounded-2xl border-2 pl-11 text-3xl font-bold transition-colors"
          />
        </div>
      </div>

      {mode === "settlement" ? (
        <>
          {/* Which card are you settling? */}
          <div className="space-y-2">
            <Label className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
              Settling Card
              {selectedCard && (
                <span className="text-foreground ml-1.5 tracking-normal normal-case">
                  &mdash; {selectedCard.name}
                </span>
              )}
            </Label>
            <div className={cn("grid gap-2", autoGridCols(creditMethods.length))}>
              {creditMethods.map((card) => {
                const isSelected = settlesCardId === card.id;
                return (
                  <motion.button
                    key={card.id}
                    type="button"
                    onClick={() => setSettlesCardId((prev) => (prev === card.id ? "" : card.id))}
                    whileTap={{ scale: 0.93 }}
                    className={cn(
                      "relative flex min-w-0 flex-col items-center gap-2 overflow-hidden rounded-2xl border-2 p-3 text-xs transition-all",
                      isSelected
                        ? "border-primary bg-primary/10 ring-primary/20 shadow-primary/10 shadow-md ring-2"
                        : "bg-muted/40 hover:bg-muted/70 border-transparent"
                    )}
                  >
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="bg-primary absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full"
                      >
                        <Check className="text-primary-foreground h-3 w-3" strokeWidth={3} />
                      </motion.div>
                    )}
                    <CategoryIcon name={card.icon} color={card.color} size="sm" glow={isSelected} />
                    <span
                      className={cn(
                        "max-w-full truncate font-medium",
                        isSelected && "text-primary font-semibold"
                      )}
                    >
                      {card.name}
                    </span>
                    {card.bankName && (
                      <span className="text-muted-foreground max-w-full truncate text-[10px]">
                        {card.bankName}
                        {card.lastFourDigits && ` ••${card.lastFourDigits}`}
                      </span>
                    )}
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Paid via (non-credit methods only) */}
          <div className="space-y-2">
            <Label className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
              Paid Via
              {selectedPm && (
                <span className="text-foreground ml-1.5 tracking-normal normal-case">
                  &mdash; {selectedPm.name}
                </span>
              )}
            </Label>
            <div className={cn("grid gap-2", autoGridCols(nonCreditMethods.length))}>
              {nonCreditMethods.map((pm) => {
                const isSelected = paymentMethodId === pm.id;
                return (
                  <motion.button
                    key={pm.id}
                    type="button"
                    onClick={() => setPaymentMethodId((prev) => (prev === pm.id ? "" : pm.id))}
                    whileTap={{ scale: 0.93 }}
                    className={cn(
                      "relative flex min-w-0 flex-col items-center gap-2 overflow-hidden rounded-2xl border-2 p-3 text-xs transition-all",
                      isSelected
                        ? "border-primary bg-primary/10 ring-primary/20 shadow-primary/10 shadow-md ring-2"
                        : "bg-muted/40 hover:bg-muted/70 border-transparent"
                    )}
                  >
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="bg-primary absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full"
                      >
                        <Check className="text-primary-foreground h-3 w-3" strokeWidth={3} />
                      </motion.div>
                    )}
                    <CategoryIcon name={pm.icon} color={pm.color} size="sm" glow={isSelected} />
                    <span
                      className={cn(
                        "max-w-full truncate font-medium",
                        isSelected && "text-primary font-semibold"
                      )}
                    >
                      {pm.name}
                    </span>
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Settlement flow indicator */}
          {settlesCardId && paymentMethodId && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="border-border/50 bg-muted/20 flex items-center justify-center gap-3 rounded-2xl border p-3"
            >
              <div className="flex items-center gap-1.5">
                <CategoryIcon name={selectedPm!.icon} color={selectedPm!.color} size="sm" />
                <span className="text-xs font-medium">{selectedPm!.name}</span>
              </div>
              <ArrowLeftRight className="text-muted-foreground h-4 w-4" />
              <div className="flex items-center gap-1.5">
                <CategoryIcon name={selectedCard!.icon} color={selectedCard!.color} size="sm" />
                <span className="text-xs font-medium">{selectedCard!.name}</span>
              </div>
            </motion.div>
          )}
        </>
      ) : (
        <>
          {/* Category Grid */}
          <div className="space-y-2">
            <Label className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
              Category
              {selectedCat && (
                <span className="text-foreground ml-1.5 tracking-normal normal-case">
                  &mdash; {selectedCat.name}
                </span>
              )}
            </Label>
            <div className={cn("grid gap-2", autoGridCols(categories.length))}>
              {categories.map((cat, i) => {
                const isSelected = categoryId === cat.id;
                return (
                  <motion.button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategoryId((prev) => (prev === cat.id ? "" : cat.id))}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: i * 0.03 }}
                    whileTap={{ scale: 0.93 }}
                    className={cn(
                      "relative flex min-w-0 flex-col items-center gap-2 overflow-hidden rounded-2xl border-2 p-3 text-xs transition-all",
                      isSelected
                        ? "border-primary bg-primary/10 ring-primary/20 shadow-primary/10 shadow-md ring-2"
                        : "bg-muted/40 hover:bg-muted/70 border-transparent"
                    )}
                  >
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="bg-primary absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full"
                      >
                        <Check className="text-primary-foreground h-3 w-3" strokeWidth={3} />
                      </motion.div>
                    )}
                    <CategoryIcon name={cat.icon} color={cat.color} size="sm" glow={isSelected} />
                    <span
                      className={cn(
                        "max-w-full truncate font-medium",
                        isSelected && "text-primary font-semibold"
                      )}
                    >
                      {cat.name}
                    </span>
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Payment Method Grid */}
          <div className="space-y-2">
            <Label className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
              Payment
              {selectedPm && (
                <span className="text-foreground ml-1.5 tracking-normal normal-case">
                  &mdash; {selectedPm.name}
                </span>
              )}
            </Label>
            <div className={cn("grid gap-2", autoGridCols(paymentMethods.length))}>
              {paymentMethods.map((pm) => {
                const isSelected = paymentMethodId === pm.id;
                return (
                  <motion.button
                    key={pm.id}
                    type="button"
                    onClick={() => setPaymentMethodId((prev) => (prev === pm.id ? "" : pm.id))}
                    whileTap={{ scale: 0.93 }}
                    className={cn(
                      "relative flex min-w-0 flex-col items-center gap-2 overflow-hidden rounded-2xl border-2 p-3 text-xs transition-all",
                      isSelected
                        ? "border-primary bg-primary/10 ring-primary/20 shadow-primary/10 shadow-md ring-2"
                        : "bg-muted/40 hover:bg-muted/70 border-transparent"
                    )}
                  >
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="bg-primary absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full"
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      >
                        <Check className="text-primary-foreground h-3 w-3" strokeWidth={3} />
                      </motion.div>
                    )}
                    <CategoryIcon name={pm.icon} color={pm.color} size="sm" glow={isSelected} />
                    <span
                      className={cn(
                        "max-w-full truncate font-medium",
                        isSelected && "text-primary font-semibold"
                      )}
                    >
                      {pm.name}
                    </span>
                  </motion.button>
                );
              })}
            </div>
          </div>
        </>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {/* Date */}
        <div className="space-y-2">
          <Label className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
            Date
          </Label>
          <Popover>
            <PopoverTrigger className="border-input bg-background ring-offset-background hover:bg-accent hover:text-accent-foreground flex h-10 w-full items-center justify-start rounded-xl border px-3 py-2 text-left text-sm font-normal transition-colors">
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

        {/* Description */}
        <div className="space-y-2">
          <Label className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
            Description
          </Label>
          <Input
            placeholder={mode === "settlement" ? "e.g. March CC bill" : "What was this for?"}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="rounded-xl"
          />
        </div>
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <Label className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
          Notes (optional)
        </Label>
        <Input
          placeholder="Any additional notes..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="rounded-xl"
        />
      </div>

      {/* Labels (expense mode only) */}
      {mode === "expense" && tags.length > 0 && (
        <div className="space-y-2">
          <Label className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
            Labels
          </Label>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <motion.button
                key={tag.id}
                type="button"
                whileTap={{ scale: 0.9 }}
                onClick={() =>
                  setSelectedTags((prev) =>
                    prev.includes(tag.id) ? prev.filter((t) => t !== tag.id) : [...prev, tag.id]
                  )
                }
                className={cn(
                  "rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all",
                  selectedTags.includes(tag.id)
                    ? "border-primary bg-primary text-primary-foreground shadow-primary/20 shadow-sm"
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
          disabled={
            isPending ||
            !amount ||
            (mode === "expense"
              ? !categoryId || !paymentMethodId
              : !settlesCardId || !paymentMethodId)
          }
          className="gradient-primary relative h-14 w-full rounded-2xl text-base font-semibold transition-opacity hover:opacity-90 md:w-auto md:px-16"
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
                {mode === "settlement" ? "Recording..." : "Adding..."}
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
                {mode === "settlement" ? "Recorded!" : "Added!"}
              </motion.span>
            ) : (
              <motion.span
                key="default"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
              >
                {mode === "settlement" ? "Record Settlement" : "Add Expense"}
              </motion.span>
            )}
          </AnimatePresence>
        </Button>
      </motion.div>
    </motion.div>
  );
}
