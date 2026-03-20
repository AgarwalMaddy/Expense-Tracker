import type { Metadata, Viewport } from "next";
import { DM_Sans, Inter } from "next/font/google";
import { NeonAuthUIProvider } from "@neondatabase/auth/react";
import { Toaster } from "@/components/ui/sonner";
import { ServiceWorkerRegistration } from "@/components/ServiceWorkerRegistration";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { authClient } from "@/lib/auth/client";
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

const siteUrl = "https://madhur-expenses.vercel.app";

export const metadata: Metadata = {
  title: {
    default: "Expense Tracker — Track & Manage Your Spending",
    template: "%s | Expense Tracker",
  },
  description:
    "A personal expense tracking app with category breakdowns, credit card management, settlement tracking, and CSV export. Built with Next.js and Neon PostgreSQL.",
  manifest: "/manifest.json",
  metadataBase: new URL(siteUrl),
  openGraph: {
    title: "Expense Tracker — Track & Manage Your Spending",
    description:
      "Track daily expenses, manage credit cards, record settlements, and export data. Multi-currency support with a beautiful mobile-first UI.",
    url: siteUrl,
    siteName: "Expense Tracker",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Expense Tracker",
    description: "Track daily expenses, manage credit cards, and export data as CSV.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Expense Tracker",
  },
  keywords: [
    "expense tracker",
    "personal finance",
    "budget",
    "spending",
    "credit card tracker",
    "settlement",
    "CSV export",
  ],
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
          {children}
          <Toaster position="top-center" richColors />
          <ServiceWorkerRegistration />
          <Analytics />
          <SpeedInsights />
        </NeonAuthUIProvider>
      </body>
    </html>
  );
}
