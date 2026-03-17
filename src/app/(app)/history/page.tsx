import { getExpenses, getCategories, getTags, getPaymentMethods } from "@/lib/actions";
import { HistoryList } from "@/components/HistoryList";

export const dynamic = "force-dynamic";

export default async function HistoryPage() {
  const [{ expenses, total }, categories, tags, paymentMethods] = await Promise.all([
    getExpenses({ limit: 50 }),
    getCategories(),
    getTags(),
    getPaymentMethods(),
  ]);

  return (
    <div className="mx-auto max-w-3xl p-4 md:p-8">
      <HistoryList
        initialExpenses={expenses}
        total={total}
        categories={categories}
        paymentMethods={paymentMethods}
        tags={tags}
      />
    </div>
  );
}
