"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, PlusCircle, Clock, Settings } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/add", label: "Add", icon: PlusCircle },
  { href: "/history", label: "History", icon: Clock },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile: floating bottom bar */}
      <nav className="fixed right-4 bottom-4 left-4 z-50 md:hidden">
        <div className="glass-strong mx-auto flex h-16 max-w-md items-center justify-around rounded-2xl shadow-lg shadow-black/5">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "relative flex flex-col items-center gap-1 px-4 py-2 text-[11px] font-medium transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <div className="relative">
                  <Icon className={cn("h-5 w-5 transition-transform", isActive && "scale-110")} />
                  {isActive && (
                    <motion.div
                      layoutId="nav-indicator-mobile"
                      className="bg-primary absolute -bottom-1.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full"
                      transition={{ type: "spring", stiffness: 500, damping: 35 }}
                    />
                  )}
                </div>
                <span className={cn(isActive && "font-semibold")}>{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Desktop: side bar */}
      <nav className="border-border/50 bg-background/50 fixed top-14 left-0 z-40 hidden h-[calc(100vh-3.5rem)] w-60 border-r p-5 backdrop-blur-xl md:block">
        <div className="mt-2 space-y-1">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "group relative flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-medium transition-all",
                  isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="nav-indicator-desktop"
                    className="bg-primary/8 border-primary/15 absolute inset-0 rounded-xl border"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <Icon className={cn("relative h-[18px] w-[18px]", isActive && "text-primary")} />
                <span className="relative">{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
