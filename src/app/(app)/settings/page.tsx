import { getPaymentMethods, getUserPreferences } from "@/lib/actions";
import { SettingsClient } from "@/components/SettingsClient";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const [paymentMethods, preferences] = await Promise.all([
    getPaymentMethods(),
    getUserPreferences(),
  ]);
  return <SettingsClient initialPaymentMethods={paymentMethods} initialPreferences={preferences} />;
}
