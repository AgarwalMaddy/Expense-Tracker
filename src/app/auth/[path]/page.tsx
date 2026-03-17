import { AuthView } from "@neondatabase/auth/react";
import { Wallet } from "lucide-react";

export const dynamicParams = false;

export default async function AuthPage({
  params,
}: {
  params: Promise<{ path: string }>;
}) {
  const { path } = await params;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary">
          <Wallet className="h-5 w-5 text-white" />
        </div>
        <span className="font-display text-xl font-semibold tracking-tight">Expense Tracker</span>
      </div>
      <AuthView path={path} />
    </main>
  );
}
