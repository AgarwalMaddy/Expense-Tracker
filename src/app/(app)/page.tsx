import { getDashboardData } from "@/lib/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CategoryPieChart, DailyBarChart, PaymentBreakdown } from "@/components/DashboardCharts";
import { CURRENCY_SYMBOL } from "@/lib/constants";
import { format } from "date-fns";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const data = await getDashboardData();

  const monthLabel = format(new Date(), "MMMM yyyy");

  return (
    <div className="mx-auto max-w-md space-y-4 p-4">
      {/* Total Spent */}
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">{monthLabel}</p>
          <p className="text-4xl font-bold tracking-tight">
            {CURRENCY_SYMBOL}{data.totalSpent.toLocaleString("en-IN")}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {data.transactionCount} transaction{data.transactionCount !== 1 ? "s" : ""}
          </p>
        </CardContent>
      </Card>

      {/* Category Breakdown */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">By Category</CardTitle>
        </CardHeader>
        <CardContent>
          <CategoryPieChart data={data.categoryBreakdown} />
        </CardContent>
      </Card>

      {/* Daily Trend */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Daily Spending</CardTitle>
        </CardHeader>
        <CardContent>
          <DailyBarChart data={data.dailyTrend} />
        </CardContent>
      </Card>

      {/* Payment Breakdown */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">By Payment Method</CardTitle>
        </CardHeader>
        <CardContent>
          <PaymentBreakdown data={data.paymentBreakdown} />
        </CardContent>
      </Card>

      {/* Recent Expenses */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">Recent</CardTitle>
            <Link href="/history" className="text-xs text-primary hover:underline">
              View all
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {data.recentExpenses.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              No expenses yet. <Link href="/add" className="text-primary underline">Add one!</Link>
            </p>
          ) : (
            <div className="space-y-3">
              {data.recentExpenses.map((expense) => (
                <div key={expense.id} className="flex items-center gap-3">
                  <span className="text-xl">{expense.category.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium">
                      {expense.description || expense.category.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(expense.expenseDate), "d MMM")} · {expense.paymentMethod}
                    </p>
                  </div>
                  <p className="text-sm font-semibold">
                    {CURRENCY_SYMBOL}{Number(expense.amount).toLocaleString("en-IN")}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
