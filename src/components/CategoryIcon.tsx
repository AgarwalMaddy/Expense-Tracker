"use client";

import {
  UtensilsCrossed, Car, ShoppingCart, ShoppingBag, HeartPulse,
  FileText, Clapperboard, House, GraduationCap, Sparkles, Package,
  Banknote, Smartphone, CreditCard, Globe, type LucideIcon,
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
  "credit-card": CreditCard,
  globe: Globe,
};

interface CategoryIconProps {
  name: string;
  color?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeMap = {
  sm: "h-4 w-4",
  md: "h-5 w-5",
  lg: "h-6 w-6",
};

const containerSizeMap = {
  sm: "h-8 w-8",
  md: "h-10 w-10",
  lg: "h-12 w-12",
};

export function CategoryIcon({ name, color, size = "md", className }: CategoryIconProps) {
  const Icon = ICON_MAP[name] || Package;

  if (color) {
    return (
      <div
        className={cn("flex items-center justify-center rounded-xl", containerSizeMap[size], className)}
        style={{ backgroundColor: `${color}15` }}
      >
        <Icon className={sizeMap[size]} style={{ color }} />
      </div>
    );
  }

  return <Icon className={cn(sizeMap[size], className)} />;
}
