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
  const [data, creditSummary] = await Promise.all([getDashboardData(), getCreditCardSummary()]);
  const monthLabel = format(new Date(), "MMMM yyyy");

  return (
    <DashboardClient>
      <div className="mx-auto max-w-5xl space-y-6 p-4 md:p-8">
        {/* Hero Card */}
        <div
          data-animate
          className="gradient-hero border-primary/10 relative overflow-hidden rounded-2xl border p-6 md:p-8"
        >
          <div className="bg-primary/5 absolute top-0 right-0 h-40 w-40 rounded-full blur-3xl" />
          <div className="bg-chart-4/5 absolute -bottom-10 -left-10 h-32 w-32 rounded-full blur-3xl" />
          <div className="relative">
            <p className="text-muted-foreground text-sm font-medium">{monthLabel}</p>
            <p className="font-display mt-1 text-4xl font-bold tracking-tight md:text-5xl">
              {CURRENCY_SYMBOL}
              {data.totalSpent.toLocaleString("en-IN")}
            </p>
            <p className="text-muted-foreground mt-2 text-sm">
              across {data.transactionCount} transaction{data.transactionCount !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          <Card data-animate className="group transition-shadow hover:shadow-md">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-xl transition-transform group-hover:scale-105">
                <Wallet className="text-primary h-5 w-5" />
              </div>
              <div>
                <p className="text-muted-foreground text-[11px] font-medium tracking-wider uppercase">
                  Total
                </p>
                <p className="font-display text-lg font-bold tracking-tight tabular-nums">
                  {CURRENCY_SYMBOL}
                  {data.totalSpent.toLocaleString("en-IN")}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card data-animate className="group transition-shadow hover:shadow-md">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 transition-transform group-hover:scale-105">
                <Receipt className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-muted-foreground text-[11px] font-medium tracking-wider uppercase">
                  Count
                </p>
                <p className="font-display text-lg font-bold tracking-tight tabular-nums">
                  {data.transactionCount}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card
            data-animate
            className="group col-span-2 transition-shadow hover:shadow-md md:col-span-1"
          >
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 transition-transform group-hover:scale-105">
                <TrendingUp className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-muted-foreground text-[11px] font-medium tracking-wider uppercase">
                  Average
                </p>
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
          <Card data-animate className="border-border/50 overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <CreditCard className="text-primary h-4 w-4" />
                Credit Cards
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {creditSummary.map((cs) => (
                <div key={cs.card.id} className="space-y-2.5">
                  <div className="flex items-center gap-2.5">
                    <CategoryIcon name={cs.card.icon} color={cs.card.color} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{cs.card.name}</p>
                      {cs.card.bankName && (
                        <p className="text-muted-foreground text-[11px]">
                          {cs.card.bankName}
                          {cs.card.lastFourDigits && ` ••${cs.card.lastFourDigits}`}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold tabular-nums">
                        {CURRENCY_SYMBOL}
                        {cs.outstanding.toLocaleString("en-IN")}
                      </p>
                      <p className="text-muted-foreground text-[10px]">outstanding</p>
                    </div>
                  </div>

                  {/* Utilization bar */}
                  {cs.creditLimit > 0 && cs.utilization !== null && (
                    <div className="space-y-1">
                      <div className="text-muted-foreground flex justify-between text-[10px]">
                        <span>
                          {CURRENCY_SYMBOL}
                          {cs.outstanding.toLocaleString("en-IN")} / {CURRENCY_SYMBOL}
                          {cs.creditLimit.toLocaleString("en-IN")}
                        </span>
                        <span
                          className={cs.utilization > 80 ? "text-destructive font-semibold" : ""}
                        >
                          {cs.utilization.toFixed(0)}% used
                        </span>
                      </div>
                      <div className="bg-muted/60 h-2 overflow-hidden rounded-full">
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
                      <Receipt className="text-muted-foreground h-3 w-3" />
                      <span className="text-muted-foreground">Spent:</span>
                      <span className="font-semibold tabular-nums">
                        {CURRENCY_SYMBOL}
                        {cs.totalSpent.toLocaleString("en-IN")}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <ArrowLeftRight className="text-muted-foreground h-3 w-3" />
                      <span className="text-muted-foreground">Settled:</span>
                      <span className="font-semibold text-emerald-600 tabular-nums">
                        {CURRENCY_SYMBOL}
                        {cs.totalSettled.toLocaleString("en-IN")}
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
                  className="text-muted-foreground hover:text-primary inline-flex items-center gap-1 text-xs font-medium transition-colors"
                >
                  View all <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {data.recentExpenses.length === 0 ? (
                <p className="text-muted-foreground py-8 text-center text-sm">
                  No expenses yet.{" "}
                  <Link
                    href="/add"
                    className="text-primary hover:text-primary/80 font-medium underline underline-offset-4 transition-colors"
                  >
                    Add one
                  </Link>
                </p>
              ) : (
                <div className="space-y-3">
                  {data.recentExpenses.map((expense) => (
                    <div key={expense.id} className="group flex items-center gap-3">
                      <CategoryIcon
                        name={expense.category.icon}
                        color={expense.category.color}
                        size="sm"
                        glow
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <p className="truncate text-sm font-medium">
                            {expense.description || expense.category.name}
                          </p>
                          {expense.type === "SETTLEMENT" && (
                            <span className="shrink-0 rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-bold text-emerald-600">
                              SETTLEMENT
                            </span>
                          )}
                        </div>
                        <p className="text-muted-foreground text-xs">
                          {format(new Date(expense.expenseDate), "d MMM")} ·{" "}
                          {expense.paymentMethod.name}
                          {expense.settlesPaymentMethod &&
                            ` → ${expense.settlesPaymentMethod.name}`}
                        </p>
                      </div>
                      <p className="text-sm font-semibold tabular-nums">
                        {CURRENCY_SYMBOL}
                        {Number(expense.amount).toLocaleString("en-IN")}
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
