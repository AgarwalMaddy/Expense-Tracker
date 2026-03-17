import { getExpenses, getCategories, getTags } from "@/lib/actions";
import { HistoryList } from "@/components/HistoryList";

export const dynamic = "force-dynamic";

export default async function HistoryPage() {
  const [{ expenses, total }, categories, tags] = await Promise.all([
    getExpenses({ limit: 50 }),
    getCategories(),
    getTags(),
  ]);

  return (
    <div className="mx-auto max-w-3xl p-4 md:p-8">
      <HistoryList
        initialExpenses={expenses}
        total={total}
        categories={categories}
        tags={tags}
      />
    </div>
  );
}
