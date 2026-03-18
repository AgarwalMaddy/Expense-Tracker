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

export const DEFAULT_PAYMENT_METHODS = [
  { name: "Cash", icon: "banknote", color: "#22c55e", type: "SIMPLE" as const },
  { name: "UPI", icon: "smartphone", color: "#8b5cf6", type: "SIMPLE" as const },
  { name: "Credit Card", icon: "credit-card", color: "#3b82f6", type: "CREDIT" as const },
  { name: "Debit Card", icon: "wallet", color: "#06b6d4", type: "SIMPLE" as const },
  { name: "Net Banking", icon: "landmark", color: "#f97316", type: "SIMPLE" as const },
] as const;

export const AVAILABLE_ICONS = [
  { name: "banknote", label: "Cash" },
  { name: "smartphone", label: "Phone" },
  { name: "smartphone-nfc", label: "NFC" },
  { name: "credit-card", label: "Card" },
  { name: "wallet", label: "Wallet" },
  { name: "landmark", label: "Bank" },
  { name: "globe", label: "Online" },
  { name: "building-2", label: "Office" },
  { name: "hand-coins", label: "Coins" },
  { name: "piggy-bank", label: "Savings" },
  { name: "receipt", label: "Receipt" },
  { name: "qr-code", label: "QR Code" },
] as const;

export const AVAILABLE_COLORS = [
  "#22c55e", "#8b5cf6", "#a855f7", "#3b82f6", "#06b6d4",
  "#f97316", "#ef4444", "#ec4899", "#eab308", "#14b8a6",
  "#6366f1", "#f43f5e", "#6b7280", "#84cc16",
] as const;

export const CURRENCY_SYMBOL = "₹";
