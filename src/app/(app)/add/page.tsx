import { getCategories, getTags, getPaymentMethods } from "@/lib/actions";
import { AddExpenseForm } from "@/components/AddExpenseForm";

export const dynamic = "force-dynamic";

export default async function AddPage() {
  const [categories, tags, paymentMethods] = await Promise.all([
    getCategories(),
    getTags(),
    getPaymentMethods(),
  ]);

  const creditMethods = paymentMethods.filter((pm) => pm.type === "CREDIT");

  return (
    <AddExpenseForm
      categories={categories}
      tags={tags}
      paymentMethods={paymentMethods}
      creditMethods={creditMethods}
    />
  );
}
