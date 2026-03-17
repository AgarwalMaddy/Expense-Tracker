import { UserButton } from "@neondatabase/auth/react";
import { Wallet } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="sticky top-0 z-50 glass-strong h-14 flex items-center justify-between px-6">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-primary">
            <Wallet className="h-4 w-4 text-white" />
          </div>
          <h1 className="font-display text-base font-semibold tracking-tight">
            Expense Tracker
          </h1>
        </div>
        <UserButton size="icon" />
      </header>
      <BottomNav />
      <main className="pb-20 md:pb-6 md:ml-60">
        {children}
      </main>
    </>
  );
}
