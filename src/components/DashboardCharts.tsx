"use client";

import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { CURRENCY_SYMBOL } from "@/lib/constants";
import { CategoryIcon } from "@/components/CategoryIcon";
import {
  Banknote, Smartphone, CreditCard, Globe, type LucideIcon,
} from "lucide-react";

interface CategoryData {
  category: { name: string; icon: string; color: string };
  total: number;
  count: number;
}

interface DailyData {
  date: string;
  total: number;
}

interface PaymentData {
  method: string;
  total: number;
}

export function CategoryPieChart({ data }: { data: CategoryData[] }) {
  if (data.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
        No expenses this month
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4">
      <ResponsiveContainer width="50%" height={200}>
        <PieChart>
          <Pie
            data={data}
            dataKey="total"
            nameKey="category.name"
            cx="50%"
            cy="50%"
            outerRadius={80}
            innerRadius={40}
          >
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.category.color} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value) => `${CURRENCY_SYMBOL}${Number(value).toLocaleString("en-IN")}`}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="flex flex-1 flex-col gap-2">
        {data
          .sort((a, b) => b.total - a.total)
          .slice(0, 5)
          .map((entry) => (
            <div key={entry.category.name} className="flex items-center gap-2.5 text-xs">
              <CategoryIcon name={entry.category.icon} color={entry.category.color} size="sm" />
              <span className="flex-1 truncate font-medium">{entry.category.name}</span>
              <span className="font-semibold tabular-nums">
                {CURRENCY_SYMBOL}{entry.total.toLocaleString("en-IN")}
              </span>
            </div>
          ))}
      </div>
    </div>
  );
}

export function DailyBarChart({ data }: { data: DailyData[] }) {
  if (data.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
        No expenses this month
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
        <XAxis
          dataKey="date"
          tickFormatter={(v: string) => new Date(v).getDate().toString()}
          fontSize={11}
          tickLine={false}
          axisLine={false}
        />
        <YAxis fontSize={11} tickLine={false} axisLine={false} width={40} />
        <Tooltip
          formatter={(value) => `${CURRENCY_SYMBOL}${Number(value).toLocaleString("en-IN")}`}
          labelFormatter={(label) =>
            new Date(String(label)).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
            })
          }
        />
        <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

const PAYMENT_ICONS: Record<string, LucideIcon> = {
  CASH: Banknote,
  UPI: Smartphone,
  CARD: CreditCard,
  ONLINE: Globe,
};

const PAYMENT_COLORS: Record<string, string> = {
  CASH: "#22c55e",
  UPI: "#8b5cf6",
  CARD: "#3b82f6",
  ONLINE: "#f97316",
};

export function PaymentBreakdown({ data }: { data: PaymentData[] }) {
  const total = data.reduce((sum, d) => sum + d.total, 0);

  if (total === 0) {
    return (
      <div className="flex h-20 items-center justify-center text-sm text-muted-foreground">
        No data
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {data
        .filter((d) => d.total > 0)
        .sort((a, b) => b.total - a.total)
        .map((entry) => {
          const pct = ((entry.total / total) * 100).toFixed(0);
          const Icon = PAYMENT_ICONS[entry.method] || Globe;
          const color = PAYMENT_COLORS[entry.method] || "#6b7280";
          return (
            <div key={entry.method} className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <div
                    className="flex h-7 w-7 items-center justify-center rounded-lg"
                    style={{ backgroundColor: `${color}15` }}
                  >
                    <Icon className="h-3.5 w-3.5" style={{ color }} />
                  </div>
                  <span className="font-medium">{entry.method}</span>
                </span>
                <span className="font-semibold tabular-nums">
                  {CURRENCY_SYMBOL}{entry.total.toLocaleString("en-IN")}
                  <span className="ml-1 text-xs font-normal text-muted-foreground">({pct}%)</span>
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${pct}%`, backgroundColor: color }}
                />
              </div>
            </div>
          );
        })}
    </div>
  );
}
