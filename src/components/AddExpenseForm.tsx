"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { toast } from "sonner";
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

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4 md:p-8">
      {/* Amount */}
      <div className="space-y-2">
        <Label className="text-sm font-medium text-muted-foreground">Amount</Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-2xl font-semibold text-muted-foreground">
            {CURRENCY_SYMBOL}
          </span>
          <Input
            type="number"
            inputMode="decimal"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="h-16 pl-10 text-3xl font-bold"
            autoFocus
          />
        </div>
      </div>

      {/* Category Grid */}
      <div className="space-y-2">
        <Label className="text-sm font-medium text-muted-foreground">Category</Label>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setCategoryId(cat.id)}
              className={cn(
                "flex flex-col items-center gap-2 rounded-xl border-2 p-3 text-xs transition-all active:scale-95",
                categoryId === cat.id
                  ? "border-primary bg-primary/5 shadow-sm"
                  : "border-transparent bg-muted/50 hover:bg-muted"
              )}
            >
              <CategoryIcon name={cat.icon} color={cat.color} size="sm" />
              <span className="truncate font-medium">{cat.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Payment Method */}
      <div className="space-y-2">
        <Label className="text-sm font-medium text-muted-foreground">Payment</Label>
        <div className="grid grid-cols-4 gap-2">
          {PAYMENT_METHODS.map((pm) => (
            <button
              key={pm.value}
              type="button"
              onClick={() => setPaymentMethod(pm.value)}
              className={cn(
                "flex flex-col items-center gap-2 rounded-xl border-2 p-3 text-xs transition-all active:scale-95",
                paymentMethod === pm.value
                  ? "border-primary bg-primary/5 shadow-sm"
                  : "border-transparent bg-muted/50 hover:bg-muted"
              )}
            >
              <CategoryIcon name={pm.icon} size="sm" />
              <span className="font-medium">{pm.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Date */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-muted-foreground">Date</Label>
          <Popover>
            <PopoverTrigger className="flex h-10 w-full items-center justify-start rounded-md border border-input bg-background px-3 py-2 text-left text-sm font-normal ring-offset-background hover:bg-accent hover:text-accent-foreground">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {format(date, "PPP")}
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
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
          <Label className="text-sm font-medium text-muted-foreground">Description</Label>
          <Input
            placeholder="What was this for?"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <Label className="text-sm font-medium text-muted-foreground">Notes (optional)</Label>
        <Input
          placeholder="Any additional notes..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      {/* Tags */}
      {tags.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm font-medium text-muted-foreground">Tags</Label>
          <div className="flex flex-wrap gap-2">
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
                  "rounded-full border px-3 py-1 text-xs font-medium transition-all active:scale-95",
                  selectedTags.includes(tag.id)
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border hover:bg-muted"
                )}
              >
                {tag.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Submit */}
      <Button
        onClick={handleSubmit}
        disabled={isPending || !amount || !categoryId}
        className="h-14 w-full text-base font-semibold md:w-auto md:px-12"
        size="lg"
      >
        {isPending ? "Adding..." : "Add Expense"}
      </Button>
    </div>
  );
}
