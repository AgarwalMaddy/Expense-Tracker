import { getExpenses, getCategories } from "@/lib/actions";
import { HistoryList } from "@/components/HistoryList";

export const dynamic = "force-dynamic";

export default async function HistoryPage() {
  const [{ expenses, total }, categories] = await Promise.all([
    getExpenses({ limit: 50 }),
    getCategories(),
  ]);

  return (
    <div className="mx-auto max-w-md p-4">
      <HistoryList
        initialExpenses={expenses}
        total={total}
        categories={categories}
      />
    </div>
  );
}
