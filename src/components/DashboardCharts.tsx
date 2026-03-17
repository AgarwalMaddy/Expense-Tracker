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
import { motion } from "framer-motion";

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
  paymentMethod: { name: string; icon: string; color: string };
  total: number;
}

const tooltipStyle = {
  contentStyle: {
    borderRadius: "12px",
    border: "1px solid oklch(0.915 0.008 260)",
    boxShadow: "0 8px 30px oklch(0 0 0 / 0.08)",
    padding: "8px 12px",
    fontSize: "13px",
  },
};

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
            innerRadius={45}
            paddingAngle={2}
            cornerRadius={4}
          >
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.category.color} strokeWidth={0} />
            ))}
          </Pie>
          <Tooltip
            {...tooltipStyle}
            formatter={(value) => `${CURRENCY_SYMBOL}${Number(value).toLocaleString("en-IN")}`}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="flex flex-1 flex-col gap-2.5">
        {data
          .sort((a, b) => b.total - a.total)
          .slice(0, 5)
          .map((entry, i) => (
            <motion.div
              key={entry.category.name}
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06 }}
              className="flex items-center gap-2.5 text-xs"
            >
              <CategoryIcon name={entry.category.icon} color={entry.category.color} size="sm" />
              <span className="flex-1 truncate font-medium">{entry.category.name}</span>
              <span className="font-semibold tabular-nums">
                {CURRENCY_SYMBOL}{entry.total.toLocaleString("en-IN")}
              </span>
            </motion.div>
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
      <BarChart data={data} barCategoryGap="20%">
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="oklch(0.915 0.008 260)" />
        <XAxis
          dataKey="date"
          tickFormatter={(v: string) => new Date(v).getDate().toString()}
          fontSize={11}
          tickLine={false}
          axisLine={false}
          stroke="oklch(0.52 0.02 261)"
        />
        <YAxis
          fontSize={11}
          tickLine={false}
          axisLine={false}
          width={40}
          stroke="oklch(0.52 0.02 261)"
        />
        <Tooltip
          {...tooltipStyle}
          formatter={(value) => `${CURRENCY_SYMBOL}${Number(value).toLocaleString("en-IN")}`}
          labelFormatter={(label) =>
            new Date(String(label)).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
            })
          }
        />
        <defs>
          <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="oklch(0.488 0.243 264)" />
            <stop offset="100%" stopColor="oklch(0.623 0.214 259)" />
          </linearGradient>
        </defs>
        <Bar dataKey="total" fill="url(#barGrad)" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

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
    <div className="space-y-3.5">
      {data
        .filter((d) => d.total > 0)
        .sort((a, b) => b.total - a.total)
        .map((entry, i) => {
          const pct = ((entry.total / total) * 100).toFixed(0);
          const pm = entry.paymentMethod;
          return (
            <motion.div
              key={pm.name}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="space-y-2"
            >
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2.5">
                  <CategoryIcon name={pm.icon} color={pm.color} size="sm" />
                  <span className="font-medium">{pm.name}</span>
                </span>
                <span className="font-semibold tabular-nums">
                  {CURRENCY_SYMBOL}{entry.total.toLocaleString("en-IN")}
                  <span className="ml-1.5 text-xs font-normal text-muted-foreground">({pct}%)</span>
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted/60">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.8, delay: 0.2 + i * 0.1, ease: [0.21, 0.47, 0.32, 0.98] }}
                  className="h-full rounded-full"
                  style={{ backgroundColor: pm.color }}
                />
              </div>
            </motion.div>
          );
        })}
    </div>
  );
}
