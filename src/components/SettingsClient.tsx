"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Plus,
  User,
  Shield,
  ChevronRight,
  Tag,
  CreditCard,
  Check,
  Trash2,
  Loader2,
  Pencil,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  AVAILABLE_ICONS,
  AVAILABLE_COLORS,
  CURRENCIES,
  TIMEZONES,
  getCurrencySymbol,
} from "@/lib/constants";
import {
  createTag,
  createPaymentMethod,
  deletePaymentMethod,
  updatePaymentMethod,
  updateUserPreferences,
} from "@/lib/actions";
import type { CreatePaymentMethodInput } from "@/lib/validations";
import { CategoryIcon } from "@/components/CategoryIcon";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import Link from "next/link";
import type { PaymentMethod, UserPreference } from "@/generated/prisma/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Globe, Coins } from "lucide-react";

interface SettingsClientProps {
  initialPaymentMethods: PaymentMethod[];
  initialPreferences: UserPreference;
}

function PaymentMethodForm({
  onSubmit,
  isPending,
  submitLabel,
  initial,
  currencySymbol = "₹",
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
  currencySymbol?: string;
}) {
  const [name, setName] = useState(initial?.name || "");
  const [icon, setIcon] = useState(initial?.icon || "banknote");
  const [color, setColor] = useState(initial?.color || "#6366f1");
  const [type, setType] = useState<"SIMPLE" | "CREDIT">(initial?.type || "SIMPLE");
  const [bankName, setBankName] = useState(initial?.bankName || "");
  const [lastFour, setLastFour] = useState(initial?.lastFourDigits || "");
  const [creditLimit, setCreditLimit] = useState(
    initial?.creditLimit ? String(Number(initial.creditLimit)) : ""
  );
  const [initialOutstanding, setInitialOutstanding] = useState(
    initial?.initialOutstanding ? String(Number(initial.initialOutstanding)) : ""
  );
  const [billingDay, setBillingDay] = useState(
    initial?.billingCycleDay ? String(initial.billingCycleDay) : ""
  );

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
        <Label className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
          Type
        </Label>
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
                  : "bg-muted/40 hover:bg-muted/70 border-transparent"
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
                <Label className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                  Bank Name
                </Label>
                <Input
                  placeholder="e.g. HDFC, ICICI"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                  Last 4 Digits
                </Label>
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
                <Label className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                  Credit Limit
                </Label>
                <div className="relative">
                  <span className="text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2 text-xs">
                    {currencySymbol}
                  </span>
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
                <Label className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                  Billing Cycle Day
                </Label>
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
              <Label className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                Current Outstanding
                <span className="text-muted-foreground/60 ml-1 tracking-normal normal-case">
                  (existing balance before tracking)
                </span>
              </Label>
              <div className="relative">
                <span className="text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2 text-xs">
                  {currencySymbol}
                </span>
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
        <Label className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
          Icon
        </Label>
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
                  : "bg-muted/40 hover:bg-muted/70 border-transparent"
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
        <Label className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
          Color
        </Label>
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
        <div className="border-border/50 bg-muted/30 flex flex-1 items-center gap-2 rounded-xl border px-3 py-2">
          <CategoryIcon name={icon} color={color} size="sm" />
          <span className="truncate text-sm font-medium">{name || "Preview"}</span>
          {type === "CREDIT" && (
            <span className="text-primary bg-primary/10 ml-auto rounded-full px-2 py-0.5 text-[10px] font-semibold">
              CREDIT
            </span>
          )}
        </div>
        <motion.div whileTap={{ scale: 0.9 }}>
          <Button
            onClick={handleSubmit}
            disabled={isPending || !name.trim()}
            className="gradient-primary rounded-xl transition-opacity hover:opacity-90"
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

export function SettingsClient({ initialPaymentMethods, initialPreferences }: SettingsClientProps) {
  const router = useRouter();
  const [tagName, setTagName] = useState("");
  const [isPending, startTransition] = useTransition();
  const [paymentMethods, setPaymentMethods] = useState(initialPaymentMethods);
  const [editingPm, setEditingPm] = useState<PaymentMethod | null>(null);
  const [currency, setCurrency] = useState(initialPreferences.currency);
  const [timezone, setTimezone] = useState(initialPreferences.timezone);
  const currencySymbol = getCurrencySymbol(currency);

  const handleCurrencyChange = (value: string | null) => {
    if (!value) return;
    setCurrency(value);
    startTransition(async () => {
      const result = await updateUserPreferences({ currency: value });
      if (!result.success) {
        toast.error(result.error);
        setCurrency(initialPreferences.currency);
        return;
      }
      toast.success(`Currency set to ${value}`);
      router.refresh();
    });
  };

  const handleTimezoneChange = (value: string | null) => {
    if (!value) return;
    setTimezone(value);
    startTransition(async () => {
      const result = await updateUserPreferences({ timezone: value });
      if (!result.success) {
        toast.error(result.error);
        setTimezone(initialPreferences.timezone);
        return;
      }
      toast.success("Timezone updated");
      router.refresh();
    });
  };

  const handleAddTag = () => {
    if (!tagName.trim()) return;
    startTransition(async () => {
      const result = await createTag(tagName);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success(`Label "${tagName}" created`);
      setTagName("");
    });
  };

  const handleAddPaymentMethod = (data: CreatePaymentMethodInput) => {
    startTransition(async () => {
      const result = await createPaymentMethod(data);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      setPaymentMethods((prev) => [...prev, result.data as PaymentMethod]);
      toast.success(`"${data.name}" added`);
      router.refresh();
    });
  };

  const handleEditPaymentMethod = (data: CreatePaymentMethodInput) => {
    if (!editingPm) return;
    startTransition(async () => {
      const result = await updatePaymentMethod(editingPm.id, {
        ...data,
        bankName: data.bankName ?? null,
        lastFourDigits: data.lastFourDigits ?? null,
        creditLimit: data.creditLimit ?? null,
        initialOutstanding: data.initialOutstanding ?? null,
        billingCycleDay: data.billingCycleDay ?? null,
      });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      const updated = result.data as PaymentMethod;
      setPaymentMethods((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      toast.success(`"${data.name}" updated`);
      setEditingPm(null);
      router.refresh();
    });
  };

  const handleDeletePaymentMethod = (id: string, name: string) => {
    startTransition(async () => {
      const result = await deletePaymentMethod(id);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      setPaymentMethods((prev) => prev.filter((p) => p.id !== id));
      toast.success(`"${name}" deleted`);
      router.refresh();
    });
  };

  const accountLinks = [
    {
      href: "/account/settings",
      label: "Profile Settings",
      icon: User,
      desc: "Manage your profile information",
    },
    {
      href: "/account/security",
      label: "Security",
      icon: Shield,
      desc: "Password and authentication",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.21, 0.47, 0.32, 0.98] }}
      className="mx-auto max-w-2xl space-y-5 p-4 md:p-8"
    >
      {/* Payment Methods */}
      <Card className="border-border/50 overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="font-display flex items-center gap-2 text-base font-semibold">
            <div className="bg-primary/10 flex h-8 w-8 items-center justify-center rounded-lg">
              <CreditCard className="text-primary h-4 w-4" />
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
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-medium">{pm.name}</span>
                      {pm.type === "CREDIT" && (
                        <span className="text-primary bg-primary/10 shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-semibold">
                          CREDIT
                        </span>
                      )}
                    </div>
                    {pm.bankName && (
                      <span className="text-muted-foreground text-[11px]">
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
                      className="text-muted-foreground/40 hover:text-primary hover:bg-primary/10 rounded-lg p-1.5 transition-colors"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.8 }}
                      onClick={() => handleDeletePaymentMethod(pm.id, pm.name)}
                      disabled={isPending}
                      className="text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 rounded-lg p-1.5 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          <div className="border-border/50 border-t" />

          <p className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
            Add New
          </p>
          <PaymentMethodForm
            onSubmit={handleAddPaymentMethod}
            isPending={isPending}
            submitLabel="Add"
            currencySymbol={currencySymbol}
          />
        </CardContent>
      </Card>

      {/* Edit Payment Method Sheet */}
      <Sheet open={!!editingPm} onOpenChange={(open) => !open && setEditingPm(null)}>
        <SheetContent side="bottom" className="max-h-[85vh] rounded-t-3xl">
          <SheetHeader>
            <SheetTitle className="font-display">Edit Payment Method</SheetTitle>
          </SheetHeader>
          <div className="mx-auto mt-4 max-h-[65vh] max-w-lg overflow-y-auto pb-4">
            {editingPm && (
              <PaymentMethodForm
                key={editingPm.id}
                onSubmit={handleEditPaymentMethod}
                isPending={isPending}
                submitLabel="Save"
                initial={editingPm}
                currencySymbol={currencySymbol}
              />
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Create Label */}
      <Card className="border-border/50 overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="font-display flex items-center gap-2 text-base font-semibold">
            <div className="bg-primary/10 flex h-8 w-8 items-center justify-center rounded-lg">
              <Tag className="text-primary h-4 w-4" />
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
                className="gradient-primary rounded-xl transition-opacity hover:opacity-90"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </motion.div>
          </div>
        </CardContent>
      </Card>

      {/* Preferences */}
      <Card className="border-border/50 overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="font-display flex items-center gap-2 text-base font-semibold">
            <div className="bg-primary/10 flex h-8 w-8 items-center justify-center rounded-lg">
              <Coins className="text-primary h-4 w-4" />
            </div>
            Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
              Currency
            </Label>
            <Select value={currency} onValueChange={handleCurrencyChange}>
              <SelectTrigger className="rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CURRENCIES.map((c) => (
                  <SelectItem key={c.code} value={c.code}>
                    {c.symbol} {c.name} ({c.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
              Timezone
            </Label>
            <Select value={timezone} onValueChange={handleTimezoneChange}>
              <SelectTrigger className="rounded-xl">
                <div className="flex items-center gap-2">
                  <Globe className="text-muted-foreground h-3.5 w-3.5" />
                  <SelectValue />
                </div>
              </SelectTrigger>
              <SelectContent>
                {TIMEZONES.map((tz) => (
                  <SelectItem key={tz.value} value={tz.value}>
                    {tz.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Account */}
      <Card className="border-border/50 overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="font-display text-base font-semibold">Account</CardTitle>
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
                className="hover:bg-muted/60 group flex items-center gap-3 rounded-xl p-3 transition-colors"
              >
                <div className="bg-muted/80 group-hover:bg-muted flex h-10 w-10 items-center justify-center rounded-xl transition-colors">
                  <Icon className="text-muted-foreground h-4 w-4" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{label}</p>
                  <p className="text-muted-foreground text-xs">{desc}</p>
                </div>
                <ChevronRight className="text-muted-foreground/50 group-hover:text-muted-foreground h-4 w-4 transition-colors" />
              </Link>
            </motion.div>
          ))}
        </CardContent>
      </Card>
    </motion.div>
  );
}
