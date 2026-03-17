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
      <div className="flex flex-1 flex-col gap-1.5">
        {data
          .sort((a, b) => b.total - a.total)
          .slice(0, 5)
          .map((entry) => (
            <div key={entry.category.name} className="flex items-center gap-2 text-xs">
              <div
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: entry.category.color }}
              />
              <span className="flex-1 truncate">{entry.category.icon} {entry.category.name}</span>
              <span className="font-medium">
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

export function PaymentBreakdown({ data }: { data: PaymentData[] }) {
  const total = data.reduce((sum, d) => sum + d.total, 0);
  const ICONS: Record<string, string> = { CASH: "💵", UPI: "📱", CARD: "💳", ONLINE: "🌐" };

  if (total === 0) {
    return (
      <div className="flex h-20 items-center justify-center text-sm text-muted-foreground">
        No data
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {data
        .filter((d) => d.total > 0)
        .sort((a, b) => b.total - a.total)
        .map((entry) => {
          const pct = ((entry.total / total) * 100).toFixed(0);
          return (
            <div key={entry.method} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span>
                  {ICONS[entry.method] || ""} {entry.method}
                </span>
                <span className="font-medium">
                  {CURRENCY_SYMBOL}{entry.total.toLocaleString("en-IN")} ({pct}%)
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
    </div>
  );
}
