export const DEFAULT_CATEGORIES = [
  { name: "Food", icon: "🍔", color: "#f97316" },
  { name: "Transport", icon: "🚗", color: "#3b82f6" },
  { name: "Groceries", icon: "🛒", color: "#22c55e" },
  { name: "Shopping", icon: "🛍️", color: "#ec4899" },
  { name: "Health", icon: "💊", color: "#ef4444" },
  { name: "Bills", icon: "📄", color: "#8b5cf6" },
  { name: "Entertainment", icon: "🎬", color: "#eab308" },
  { name: "Rent", icon: "🏠", color: "#06b6d4" },
  { name: "Education", icon: "📚", color: "#14b8a6" },
  { name: "Personal Care", icon: "✨", color: "#f43f5e" },
  { name: "Misc", icon: "📦", color: "#6b7280" },
] as const;

export const PAYMENT_METHODS = [
  { value: "CASH", label: "Cash", icon: "💵" },
  { value: "UPI", label: "UPI", icon: "📱" },
  { value: "CARD", label: "Card", icon: "💳" },
  { value: "ONLINE", label: "Online", icon: "🌐" },
] as const;

export const CURRENCY_SYMBOL = "₹";
