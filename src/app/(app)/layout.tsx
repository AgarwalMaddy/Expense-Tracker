import { BottomNav } from "@/components/BottomNav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <BottomNav />
      <div className="md:ml-56">
        {children}
      </div>
    </>
  );
}
