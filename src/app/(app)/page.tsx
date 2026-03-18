import { getDashboardData, getCreditCardSummary } from "@/lib/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CategoryPieChart, PaymentBreakdown } from "@/components/DashboardCharts";
import { CategoryIcon } from "@/components/CategoryIcon";
import { CURRENCY_SYMBOL } from "@/lib/constants";
import { format } from "date-fns";
import Link from "next/link";
import { ArrowRight, TrendingUp, Receipt, Wallet, CreditCard, ArrowLeftRight } from "lucide-react";
import { DashboardClient } from "@/components/DashboardClient";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [data, creditSummary] = await Promise.all([
    getDashboardData(),
    getCreditCardSummary(),
  ]);
  const monthLabel = format(new Date(), "MMMM yyyy");

  return (
    <DashboardClient>
      <div className="mx-auto max-w-5xl space-y-6 p-4 md:p-8">
        {/* Hero Card */}
        <div
          data-animate
          className="relative overflow-hidden rounded-2xl gradient-hero border border-primary/10 p-6 md:p-8"
        >
          <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-primary/5 blur-3xl" />
          <div className="absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-chart-4/5 blur-3xl" />
          <div className="relative">
            <p className="text-sm font-medium text-muted-foreground">{monthLabel}</p>
            <p className="mt-1 font-display text-4xl font-bold tracking-tight md:text-5xl">
              {CURRENCY_SYMBOL}{data.totalSpent.toLocaleString("en-IN")}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              across {data.transactionCount} transaction{data.transactionCount !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid gap-3 grid-cols-2 md:grid-cols-3">
          <Card data-animate className="group hover:shadow-md transition-shadow">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 group-hover:scale-105 transition-transform">
                <Wallet className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Total</p>
                <p className="font-display text-lg font-bold tracking-tight tabular-nums">
                  {CURRENCY_SYMBOL}{data.totalSpent.toLocaleString("en-IN")}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card data-animate className="group hover:shadow-md transition-shadow">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 group-hover:scale-105 transition-transform">
                <Receipt className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Count</p>
                <p className="font-display text-lg font-bold tracking-tight tabular-nums">{data.transactionCount}</p>
              </div>
            </CardContent>
          </Card>

          <Card data-animate className="col-span-2 md:col-span-1 group hover:shadow-md transition-shadow">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 group-hover:scale-105 transition-transform">
                <TrendingUp className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Average</p>
                <p className="font-display text-lg font-bold tracking-tight tabular-nums">
                  {CURRENCY_SYMBOL}
                  {data.transactionCount > 0
                    ? Math.round(data.totalSpent / data.transactionCount).toLocaleString("en-IN")
                    : "0"}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Credit Card Summary */}
        {creditSummary.length > 0 && (
          <Card data-animate className="overflow-hidden border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <CreditCard className="h-4 w-4 text-primary" />
                Credit Cards
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {creditSummary.map((cs) => (
                <div key={cs.card.id} className="space-y-2.5">
                  <div className="flex items-center gap-2.5">
                    <CategoryIcon name={cs.card.icon} color={cs.card.color} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{cs.card.name}</p>
                      {cs.card.bankName && (
                        <p className="text-[11px] text-muted-foreground">
                          {cs.card.bankName}
                          {cs.card.lastFourDigits && ` ••${cs.card.lastFourDigits}`}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold tabular-nums">
                        {CURRENCY_SYMBOL}{cs.outstanding.toLocaleString("en-IN")}
                      </p>
                      <p className="text-[10px] text-muted-foreground">outstanding</p>
                    </div>
                  </div>

                  {/* Utilization bar */}
                  {cs.creditLimit > 0 && cs.utilization !== null && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] text-muted-foreground">
                        <span>
                          {CURRENCY_SYMBOL}{cs.outstanding.toLocaleString("en-IN")} / {CURRENCY_SYMBOL}{cs.creditLimit.toLocaleString("en-IN")}
                        </span>
                        <span className={cs.utilization > 80 ? "text-destructive font-semibold" : ""}>
                          {cs.utilization.toFixed(0)}% used
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-muted/60">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{
                            width: `${Math.min(100, cs.utilization)}%`,
                            backgroundColor:
                              cs.utilization > 80
                                ? "#ef4444"
                                : cs.utilization > 50
                                  ? "#f97316"
                                  : cs.card.color,
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Spent / Settled row */}
                  <div className="flex gap-4 text-xs">
                    <div className="flex items-center gap-1.5">
                      <Receipt className="h-3 w-3 text-muted-foreground" />
                      <span className="text-muted-foreground">Spent:</span>
                      <span className="font-semibold tabular-nums">
                        {CURRENCY_SYMBOL}{cs.totalSpent.toLocaleString("en-IN")}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <ArrowLeftRight className="h-3 w-3 text-muted-foreground" />
                      <span className="text-muted-foreground">Settled:</span>
                      <span className="font-semibold tabular-nums text-emerald-600">
                        {CURRENCY_SYMBOL}{cs.totalSettled.toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Charts Row */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card data-animate className="overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">By Category</CardTitle>
            </CardHeader>
            <CardContent>
              <CategoryPieChart data={data.categoryBreakdown} />
            </CardContent>
          </Card>
        </div>

        {/* Bottom Row */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card data-animate className="overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">By Payment Method</CardTitle>
            </CardHeader>
            <CardContent>
              <PaymentBreakdown data={data.paymentBreakdown} />
            </CardContent>
          </Card>

          <Card data-animate className="overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold">Recent</CardTitle>
                <Link
                  href="/history"
                  className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-primary transition-colors"
                >
                  View all <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {data.recentExpenses.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No expenses yet.{" "}
                  <Link href="/add" className="font-medium text-primary underline underline-offset-4 hover:text-primary/80 transition-colors">
                    Add one
                  </Link>
                </p>
              ) : (
                <div className="space-y-3">
                  {data.recentExpenses.map((expense) => (
                    <div key={expense.id} className="flex items-center gap-3 group">
                      <CategoryIcon
                        name={expense.category.icon}
                        color={expense.category.color}
                        size="sm"
                        glow
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="truncate text-sm font-medium">
                            {expense.description || expense.category.name}
                          </p>
                          {expense.type === "SETTLEMENT" && (
                            <span className="shrink-0 text-[9px] font-bold text-emerald-600 bg-emerald-500/10 rounded-full px-1.5 py-0.5">
                              SETTLEMENT
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(expense.expenseDate), "d MMM")} · {expense.paymentMethod.name}
                          {expense.settlesPaymentMethod && ` → ${expense.settlesPaymentMethod.name}`}
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
    </DashboardClient>
  );
}
