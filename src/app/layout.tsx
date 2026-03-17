import type { Metadata, Viewport } from "next";
import { DM_Sans, Inter } from "next/font/google";
import { NeonAuthUIProvider, UserButton } from "@neondatabase/auth/react";
import { Toaster } from "@/components/ui/sonner";
import { ServiceWorkerRegistration } from "@/components/ServiceWorkerRegistration";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { authClient } from "@/lib/auth/client";
import { Wallet } from "lucide-react";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Expense Tracker",
  description: "Track your daily expenses",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Expense Tracker",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#1a1625",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${dmSans.variable} font-sans antialiased`}>
        <NeonAuthUIProvider
          authClient={authClient}
          redirectTo="/"
          social={{ providers: ["google"] }}
        >
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
          <main className="pb-20 md:pb-6">{children}</main>
          <Toaster position="top-center" richColors />
          <ServiceWorkerRegistration />
          <Analytics />
          <SpeedInsights />
        </NeonAuthUIProvider>
      </body>
    </html>
  );
}
