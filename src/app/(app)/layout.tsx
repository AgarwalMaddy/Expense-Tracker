import { UserButton } from "@neondatabase/auth/react";
import { Wallet } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="glass-strong sticky top-0 z-50 flex h-14 items-center justify-between px-6">
        <div className="flex items-center gap-2.5">
          <div className="gradient-primary flex h-8 w-8 items-center justify-center rounded-lg">
            <Wallet className="h-4 w-4 text-white" />
          </div>
          <h1 className="font-display text-base font-semibold tracking-tight">Expense Tracker</h1>
        </div>
        <UserButton size="icon" />
      </header>
      <BottomNav />
      <main className="pb-20 md:ml-60 md:pb-6">{children}</main>
    </>
  );
}
