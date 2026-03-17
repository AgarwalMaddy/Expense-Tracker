import { getCategories, getTags } from "@/lib/actions";
import { AddExpenseForm } from "@/components/AddExpenseForm";

export const dynamic = "force-dynamic";

export default async function AddPage() {
  const [categories, tags] = await Promise.all([getCategories(), getTags()]);

  return <AddExpenseForm categories={categories} tags={tags} />;
}
