export const DEFAULT_CATEGORIES = [
  { name: "Food", icon: "utensils-crossed", color: "#f97316" },
  { name: "Transport", icon: "car", color: "#3b82f6" },
  { name: "Groceries", icon: "shopping-cart", color: "#22c55e" },
  { name: "Shopping", icon: "shopping-bag", color: "#ec4899" },
  { name: "Health", icon: "heart-pulse", color: "#ef4444" },
  { name: "Bills", icon: "file-text", color: "#8b5cf6" },
  { name: "Entertainment", icon: "clapperboard", color: "#eab308" },
  { name: "Rent", icon: "house", color: "#06b6d4" },
  { name: "Education", icon: "graduation-cap", color: "#14b8a6" },
  { name: "Personal Care", icon: "sparkles", color: "#f43f5e" },
  { name: "Misc", icon: "package", color: "#6b7280" },
] as const;

export const PAYMENT_METHODS = [
  { value: "CASH", label: "Cash", icon: "banknote" },
  { value: "UPI_BANK", label: "UPI (Bank)", icon: "smartphone" },
  { value: "UPI_CC", label: "UPI (CC)", icon: "smartphone-nfc" },
  { value: "CREDIT_CARD", label: "Credit Card", icon: "credit-card" },
  { value: "DEBIT_CARD", label: "Debit Card", icon: "wallet" },
  { value: "NET_BANKING", label: "Net Banking", icon: "landmark" },
] as const;

export const PAYMENT_LABEL_MAP: Record<string, string> = Object.fromEntries(
  PAYMENT_METHODS.map((pm) => [pm.value, pm.label])
);

export const CURRENCY_SYMBOL = "₹";
