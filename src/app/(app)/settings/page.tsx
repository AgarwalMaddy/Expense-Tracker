import { getPaymentMethods } from "@/lib/actions";
import { SettingsClient } from "@/components/SettingsClient";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const paymentMethods = await getPaymentMethods();
  return <SettingsClient initialPaymentMethods={paymentMethods} />;
}
