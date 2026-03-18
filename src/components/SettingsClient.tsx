"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, User, Shield, ChevronRight, Tag, CreditCard, Check, Trash2, Loader2, Pencil } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { AVAILABLE_ICONS, AVAILABLE_COLORS, CURRENCY_SYMBOL } from "@/lib/constants";
import { createTag, createPaymentMethod, deletePaymentMethod, updatePaymentMethod } from "@/lib/actions";
import { CategoryIcon } from "@/components/CategoryIcon";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import Link from "next/link";
import type { PaymentMethod } from "@/generated/prisma/client";

interface SettingsClientProps {
  initialPaymentMethods: PaymentMethod[];
}

function PaymentMethodForm({
  onSubmit,
  isPending,
  submitLabel,
  initial,
}: {
  onSubmit: (data: {
    name: string;
    icon: string;
    color: string;
    type: "SIMPLE" | "CREDIT";
    bankName?: string;
    lastFourDigits?: string;
    creditLimit?: number;
    initialOutstanding?: number;
    billingCycleDay?: number;
  }) => void;
  isPending: boolean;
  submitLabel: string;
  initial?: Partial<PaymentMethod>;
}) {
  const [name, setName] = useState(initial?.name || "");
  const [icon, setIcon] = useState(initial?.icon || "banknote");
  const [color, setColor] = useState(initial?.color || "#6366f1");
  const [type, setType] = useState<"SIMPLE" | "CREDIT">(initial?.type || "SIMPLE");
  const [bankName, setBankName] = useState(initial?.bankName || "");
  const [lastFour, setLastFour] = useState(initial?.lastFourDigits || "");
  const [creditLimit, setCreditLimit] = useState(initial?.creditLimit ? String(Number(initial.creditLimit)) : "");
  const [initialOutstanding, setInitialOutstanding] = useState(initial?.initialOutstanding ? String(Number(initial.initialOutstanding)) : "");
  const [billingDay, setBillingDay] = useState(initial?.billingCycleDay ? String(initial.billingCycleDay) : "");

  const handleSubmit = () => {
    if (!name.trim()) return;
    onSubmit({
      name,
      icon,
      color,
      type,
      bankName: bankName || undefined,
      lastFourDigits: lastFour || undefined,
      creditLimit: creditLimit ? parseFloat(creditLimit) : undefined,
      initialOutstanding: initialOutstanding ? parseFloat(initialOutstanding) : undefined,
      billingCycleDay: billingDay ? parseInt(billingDay) : undefined,
    });
  };

  return (
    <div className="space-y-4">
      <Input
        placeholder="e.g. HDFC Credit Card, Amazon Pay"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
        className="rounded-xl"
      />

      {/* Type toggle */}
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Type</Label>
        <div className="flex gap-2">
          {(["SIMPLE", "CREDIT"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={cn(
                "flex-1 rounded-xl border-2 px-3 py-2.5 text-sm font-medium transition-all",
                type === t
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-transparent bg-muted/40 hover:bg-muted/70"
              )}
            >
              {t === "SIMPLE" ? "Simple (Cash/UPI/etc)" : "Credit Card"}
            </button>
          ))}
        </div>
      </div>

      {/* Credit card specific fields */}
      <AnimatePresence>
        {type === "CREDIT" && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-3 overflow-hidden"
          >
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Bank Name</Label>
                <Input
                  placeholder="e.g. HDFC, ICICI"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Last 4 Digits</Label>
                <Input
                  placeholder="e.g. 4532"
                  value={lastFour}
                  onChange={(e) => setLastFour(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  maxLength={4}
                  className="rounded-xl"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Credit Limit</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">{CURRENCY_SYMBOL}</span>
                  <Input
                    type="number"
                    inputMode="decimal"
                    placeholder="0"
                    value={creditLimit}
                    onChange={(e) => setCreditLimit(e.target.value)}
                    className="rounded-xl pl-7"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Billing Cycle Day</Label>
                <Input
                  type="number"
                  inputMode="numeric"
                  placeholder="1-31"
                  value={billingDay}
                  onChange={(e) => setBillingDay(e.target.value)}
                  min={1}
                  max={31}
                  className="rounded-xl"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Current Outstanding
                <span className="ml-1 normal-case tracking-normal text-muted-foreground/60">(existing balance before tracking)</span>
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">{CURRENCY_SYMBOL}</span>
                <Input
                  type="number"
                  inputMode="decimal"
                  placeholder="0"
                  value={initialOutstanding}
                  onChange={(e) => setInitialOutstanding(e.target.value)}
                  className="rounded-xl pl-7"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Icon picker */}
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Icon</Label>
        <div className="flex flex-wrap gap-1.5">
          {AVAILABLE_ICONS.map((ic) => (
            <button
              key={ic.name}
              type="button"
              onClick={() => setIcon(ic.name)}
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-xl border-2 transition-all",
                icon === ic.name
                  ? "border-primary bg-primary/10"
                  : "border-transparent bg-muted/40 hover:bg-muted/70"
              )}
              title={ic.label}
            >
              <CategoryIcon name={ic.name} size="sm" />
            </button>
          ))}
        </div>
      </div>

      {/* Color picker */}
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Color</Label>
        <div className="flex flex-wrap gap-1.5">
          {AVAILABLE_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className={cn(
                "relative flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all",
                color === c ? "border-foreground scale-110" : "border-transparent"
              )}
              style={{ backgroundColor: c }}
            >
              {color === c && (
                <Check className="h-3.5 w-3.5 text-white drop-shadow-sm" strokeWidth={3} />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Preview + Submit */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 rounded-xl border border-border/50 bg-muted/30 px-3 py-2 flex-1">
          <CategoryIcon name={icon} color={color} size="sm" />
          <span className="text-sm font-medium truncate">{name || "Preview"}</span>
          {type === "CREDIT" && (
            <span className="ml-auto text-[10px] font-semibold text-primary bg-primary/10 rounded-full px-2 py-0.5">
              CREDIT
            </span>
          )}
        </div>
        <motion.div whileTap={{ scale: 0.9 }}>
          <Button
            onClick={handleSubmit}
            disabled={isPending || !name.trim()}
            className="rounded-xl gradient-primary hover:opacity-90 transition-opacity"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Plus className="mr-1.5 h-4 w-4" />
                {submitLabel}
              </>
            )}
          </Button>
        </motion.div>
      </div>
    </div>
  );
}

export function SettingsClient({ initialPaymentMethods }: SettingsClientProps) {
  const router = useRouter();
  const [tagName, setTagName] = useState("");
  const [isPending, startTransition] = useTransition();
  const [paymentMethods, setPaymentMethods] = useState(initialPaymentMethods);
  const [editingPm, setEditingPm] = useState<PaymentMethod | null>(null);

  const handleAddTag = () => {
    if (!tagName.trim()) return;
    startTransition(async () => {
      try {
        await createTag(tagName);
        toast.success(`Label "${tagName}" created`);
        setTagName("");
      } catch {
        toast.error("Failed to create label");
      }
    });
  };

  const handleAddPaymentMethod = (data: Parameters<typeof createPaymentMethod>[0]) => {
    startTransition(async () => {
      try {
        const pm = await createPaymentMethod(data);
        setPaymentMethods((prev) => [...prev, pm]);
        toast.success(`"${data.name}" added`);
        router.refresh();
      } catch {
        toast.error("Failed to create payment method");
      }
    });
  };

  const handleEditPaymentMethod = (data: Parameters<typeof createPaymentMethod>[0]) => {
    if (!editingPm) return;
    startTransition(async () => {
      try {
        const updated = await updatePaymentMethod(editingPm.id, {
          ...data,
          bankName: data.bankName ?? null,
          lastFourDigits: data.lastFourDigits ?? null,
          creditLimit: data.creditLimit ?? null,
          initialOutstanding: data.initialOutstanding ?? null,
          billingCycleDay: data.billingCycleDay ?? null,
        });
        setPaymentMethods((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
        toast.success(`"${data.name}" updated`);
        setEditingPm(null);
        router.refresh();
      } catch {
        toast.error("Failed to update");
      }
    });
  };

  const handleDeletePaymentMethod = (id: string, name: string) => {
    startTransition(async () => {
      try {
        await deletePaymentMethod(id);
        setPaymentMethods((prev) => prev.filter((p) => p.id !== id));
        toast.success(`"${name}" deleted`);
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to delete");
      }
    });
  };

  const accountLinks = [
    { href: "/account/settings", label: "Profile Settings", icon: User, desc: "Manage your profile information" },
    { href: "/account/security", label: "Security", icon: Shield, desc: "Password and authentication" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.21, 0.47, 0.32, 0.98] }}
      className="mx-auto max-w-2xl space-y-5 p-4 md:p-8"
    >
      {/* Payment Methods */}
      <Card className="overflow-hidden border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-display font-semibold">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <CreditCard className="h-4 w-4 text-primary" />
            </div>
            Payment Methods
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <AnimatePresence mode="popLayout">
              {paymentMethods.map((pm) => (
                <motion.div
                  key={pm.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -40, transition: { duration: 0.2 } }}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors",
                    isPending ? "opacity-50" : "hover:bg-muted/50"
                  )}
                >
                  <CategoryIcon name={pm.icon} color={pm.color} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium truncate">{pm.name}</span>
                      {pm.type === "CREDIT" && (
                        <span className="text-[10px] font-semibold text-primary bg-primary/10 rounded-full px-1.5 py-0.5 shrink-0">
                          CREDIT
                        </span>
                      )}
                    </div>
                    {pm.bankName && (
                      <span className="text-[11px] text-muted-foreground">
                        {pm.bankName}
                        {pm.lastFourDigits && ` ••${pm.lastFourDigits}`}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <motion.button
                      whileTap={{ scale: 0.8 }}
                      onClick={() => setEditingPm(pm)}
                      disabled={isPending}
                      className="rounded-lg p-1.5 text-muted-foreground/40 hover:text-primary hover:bg-primary/10 transition-colors"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.8 }}
                      onClick={() => handleDeletePaymentMethod(pm.id, pm.name)}
                      disabled={isPending}
                      className="rounded-lg p-1.5 text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          <div className="border-t border-border/50" />

          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Add New</p>
          <PaymentMethodForm
            onSubmit={handleAddPaymentMethod}
            isPending={isPending}
            submitLabel="Add"
          />
        </CardContent>
      </Card>

      {/* Edit Payment Method Sheet */}
      <Sheet open={!!editingPm} onOpenChange={(open) => !open && setEditingPm(null)}>
        <SheetContent side="bottom" className="rounded-t-3xl max-h-[85vh]">
          <SheetHeader>
            <SheetTitle className="font-display">Edit Payment Method</SheetTitle>
          </SheetHeader>
          <div className="mt-4 mx-auto max-w-lg overflow-y-auto max-h-[65vh] pb-4">
            {editingPm && (
              <PaymentMethodForm
                key={editingPm.id}
                onSubmit={handleEditPaymentMethod}
                isPending={isPending}
                submitLabel="Save"
                initial={editingPm}
              />
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Create Label */}
      <Card className="overflow-hidden border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-display font-semibold">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <Tag className="h-4 w-4 text-primary" />
            </div>
            Create Label
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="e.g. recurring, impulse, essential"
              value={tagName}
              onChange={(e) => setTagName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddTag()}
              className="rounded-xl"
            />
            <motion.div whileTap={{ scale: 0.9 }}>
              <Button
                onClick={handleAddTag}
                size="icon"
                disabled={isPending || !tagName.trim()}
                className="rounded-xl gradient-primary hover:opacity-90 transition-opacity"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </motion.div>
          </div>
        </CardContent>
      </Card>

      {/* Account */}
      <Card className="overflow-hidden border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-display font-semibold">Account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 p-2">
          {accountLinks.map(({ href, label, icon: Icon, desc }, i) => (
            <motion.div
              key={href}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + i * 0.05 }}
            >
              <Link
                href={href}
                className="flex items-center gap-3 rounded-xl p-3 transition-colors hover:bg-muted/60 group"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted/80 group-hover:bg-muted transition-colors">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{label}</p>
                  <p className="text-xs text-muted-foreground">{desc}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground/50 group-hover:text-muted-foreground transition-colors" />
              </Link>
            </motion.div>
          ))}
        </CardContent>
      </Card>
    </motion.div>
  );
}
