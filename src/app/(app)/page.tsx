import { getDashboardData } from "@/lib/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CategoryPieChart, DailyBarChart, PaymentBreakdown } from "@/components/DashboardCharts";
import { CategoryIcon } from "@/components/CategoryIcon";
import { CURRENCY_SYMBOL } from "@/lib/constants";
import { format } from "date-fns";
import Link from "next/link";
import { ArrowRight, TrendingUp, Receipt, Wallet } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const data = await getDashboardData();
  const monthLabel = format(new Date(), "MMMM yyyy");

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 md:p-8">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="md:col-span-1">
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
              <Wallet className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">{monthLabel}</p>
              <p className="text-3xl font-bold tracking-tight">
                {CURRENCY_SYMBOL}{data.totalSpent.toLocaleString("en-IN")}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10">
              <Receipt className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Transactions</p>
              <p className="text-3xl font-bold tracking-tight">{data.transactionCount}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10">
              <TrendingUp className="h-6 w-6 text-emerald-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Avg / Transaction</p>
              <p className="text-3xl font-bold tracking-tight">
                {CURRENCY_SYMBOL}
                {data.transactionCount > 0
                  ? Math.round(data.totalSpent / data.transactionCount).toLocaleString("en-IN")
                  : "0"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">By Category</CardTitle>
          </CardHeader>
          <CardContent>
            <CategoryPieChart data={data.categoryBreakdown} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Daily Spending</CardTitle>
          </CardHeader>
          <CardContent>
            <DailyBarChart data={data.dailyTrend} />
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">By Payment Method</CardTitle>
          </CardHeader>
          <CardContent>
            <PaymentBreakdown data={data.paymentBreakdown} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Recent</CardTitle>
              <Link
                href="/history"
                className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {data.recentExpenses.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No expenses yet.{" "}
                <Link href="/add" className="font-medium text-foreground underline underline-offset-4">
                  Add one
                </Link>
              </p>
            ) : (
              <div className="space-y-3">
                {data.recentExpenses.map((expense) => (
                  <div key={expense.id} className="flex items-center gap-3">
                    <CategoryIcon
                      name={expense.category.icon}
                      color={expense.category.color}
                      size="sm"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-medium">
                        {expense.description || expense.category.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(expense.expenseDate), "d MMM")} · {expense.paymentMethod}
                      </p>
                    </div>
                    <p className="text-sm font-semibold tabular-nums">
                      {CURRENCY_SYMBOL}{Number(expense.amount).toLocaleString("en-IN")}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
