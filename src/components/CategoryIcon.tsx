"use client";

import {
  UtensilsCrossed, Car, ShoppingCart, ShoppingBag, HeartPulse,
  FileText, Clapperboard, House, GraduationCap, Sparkles, Package,
  Banknote, Smartphone, SmartphoneNfc, CreditCard, Wallet, Landmark,
  Globe, Building2, HandCoins, PiggyBank, Receipt, QrCode,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

const ICON_MAP: Record<string, LucideIcon> = {
  "utensils-crossed": UtensilsCrossed,
  car: Car,
  "shopping-cart": ShoppingCart,
  "shopping-bag": ShoppingBag,
  "heart-pulse": HeartPulse,
  "file-text": FileText,
  clapperboard: Clapperboard,
  house: House,
  "graduation-cap": GraduationCap,
  sparkles: Sparkles,
  package: Package,
  banknote: Banknote,
  smartphone: Smartphone,
  "smartphone-nfc": SmartphoneNfc,
  "credit-card": CreditCard,
  wallet: Wallet,
  landmark: Landmark,
  globe: Globe,
  "building-2": Building2,
  "hand-coins": HandCoins,
  "piggy-bank": PiggyBank,
  receipt: Receipt,
  "qr-code": QrCode,
};

interface CategoryIconProps {
  name: string;
  color?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
  glow?: boolean;
}

const sizeMap = {
  sm: "h-4 w-4",
  md: "h-5 w-5",
  lg: "h-6 w-6",
};

const containerSizeMap = {
  sm: "h-9 w-9",
  md: "h-11 w-11",
  lg: "h-13 w-13",
};

export function CategoryIcon({ name, color, size = "md", className, glow }: CategoryIconProps) {
  const Icon = ICON_MAP[name] || Package;

  if (color) {
    return (
      <div
        className={cn(
          "relative flex items-center justify-center rounded-xl transition-transform",
          containerSizeMap[size],
          className
        )}
        style={{ backgroundColor: `${color}12` }}
      >
        {glow && (
          <div
            className="absolute inset-0 rounded-xl opacity-40 blur-lg"
            style={{ backgroundColor: `${color}30` }}
          />
        )}
        <Icon className={cn(sizeMap[size], "relative")} style={{ color }} strokeWidth={2} />
      </div>
    );
  }

  return <Icon className={cn(sizeMap[size], className)} strokeWidth={2} />;
}
