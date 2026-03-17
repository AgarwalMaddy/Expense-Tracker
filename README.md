# Expense Tracker

A fast, mobile-first expense tracking web app built as a PWA — designed to replace clunky spreadsheets and unreliable bank-statement-parsing apps.

**Live:** [madhur-expenses.vercel.app](https://madhur-expenses.vercel.app)

---

## The Problem

Most people want to track their expenses but the existing options fall short:

- **Bank statement parsers** break frequently — APIs change, categorization is wrong, and they miss cash/UPI transactions entirely.
- **Spreadsheets** work but are tedious on mobile — too many taps to enter a single expense, no categorization UI, no visualizations.
- **Dedicated apps** are bloated, require subscriptions, or demand unnecessary permissions.

What's needed is something **dead simple**: open it on your phone, tap a category, enter the amount, done. No app store install, no subscription, no bank access. Just a fast PWA you can add to your home screen.

---

## Features

- **Quick entry** — Amount → Category → Payment method → Done. Optimized for one-handed mobile use.
- **Smart categorization** — 11 default categories (Food, Transport, Groceries, Shopping, Health, Bills, Entertainment, Rent, Education, Personal Care, Misc) with icon-based selection grid.
- **Payment tracking** — Cash, UPI, Card, Online — tap to select.
- **Custom tags** — Create your own tags (recurring, impulse, needs, wants) for cross-cutting analysis.
- **Dashboard** — Monthly total, transaction count, average per transaction, category pie chart, daily spending bar chart, payment method breakdown.
- **History** — Search and filter by category, payment method, or keyword. Delete with animated feedback.
- **PWA** — Add to home screen on any device. Works like a native app with standalone display mode.
- **Google OAuth** — Sign in with Google. No passwords to remember.
- **Multi-user** — Each user sees only their own data.
- **Responsive** — Mobile-first with bottom nav; desktop gets a sidebar and wider grid layouts.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | [Next.js 16](https://nextjs.org) (App Router, Server Actions) |
| **UI** | [Tailwind CSS 4](https://tailwindcss.com) + [shadcn/ui](https://ui.shadcn.com) |
| **Animations** | [Framer Motion](https://www.framer.com/motion/) |
| **Typography** | [DM Sans](https://fonts.google.com/specimen/DM+Sans) (display) + [Inter](https://fonts.google.com/specimen/Inter) (body) |
| **Charts** | [Recharts](https://recharts.org) |
| **Database** | [Neon](https://neon.tech) (Serverless Postgres) |
| **ORM** | [Prisma 7](https://www.prisma.io) with `@prisma/adapter-neon` |
| **Auth** | [Neon Auth](https://neon.tech/docs/guides/neon-auth) (Google OAuth, built on Better Auth) |
| **Hosting** | [Vercel](https://vercel.com) |
| **Analytics** | [Vercel Analytics](https://vercel.com/analytics) + [Speed Insights](https://vercel.com/docs/speed-insights) |

---

## Project Structure

```
expense-tracker/
├── prisma/
│   ├── schema.prisma          # Database models (Category, Tag, Expense, ExpenseTag)
│   └── migrations/            # SQL migration files
├── public/
│   ├── icons/                 # PWA icons (192x192, 512x512 PNG)
│   ├── manifest.json          # PWA manifest
│   └── sw.js                  # Service worker (network-first caching)
├── src/
│   ├── app/
│   │   ├── (app)/             # Authenticated app routes
│   │   │   ├── page.tsx       # Dashboard
│   │   │   ├── add/           # Add expense
│   │   │   ├── history/       # Expense history
│   │   │   └── settings/      # Tags & account settings
│   │   ├── auth/              # Sign-in / sign-up pages
│   │   ├── account/           # Account management pages
│   │   ├── api/auth/          # Auth API handler
│   │   ├── layout.tsx         # Root layout (header, providers)
│   │   └── globals.css        # Theme, colors, animations, utilities
│   ├── components/
│   │   ├── AddExpenseForm.tsx  # Expense entry form with animated grid
│   │   ├── BottomNav.tsx      # Mobile bottom nav + desktop sidebar
│   │   ├── CategoryIcon.tsx   # Lucide icon renderer with glow effect
│   │   ├── DashboardCharts.tsx # Pie, bar, and progress bar charts
│   │   ├── HistoryList.tsx    # Filterable expense list with animations
│   │   └── ui/               # shadcn/ui primitives
│   └── lib/
│       ├── actions.ts         # Server Actions (CRUD, dashboard queries)
│       ├── auth/              # Neon Auth client & server setup
│       ├── constants.ts       # Categories, payment methods, currency
│       ├── db.ts              # Prisma client singleton
│       └── utils.ts           # cn() utility
├── middleware.ts               # Auth route protection
├── .env.example                # Required environment variables
└── package.json
```

---

## Getting Started

### Prerequisites

- Node.js 20+
- A [Neon](https://neon.tech) account (free tier works)
- A Google Cloud project with OAuth credentials (configured in Neon Auth)

### Setup

1. **Clone the repo**

```bash
git clone https://github.com/AgarwalMaddy/Expense-Tracker.git
cd Expense-Tracker
```

2. **Install dependencies**

```bash
npm install
```

3. **Configure environment variables**

```bash
cp .env.example .env
```

Fill in the values — see `.env.example` for what's needed.

4. **Run database migrations**

```bash
npx prisma migrate deploy
```

5. **Start the dev server**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Deploy to Vercel

```bash
npx vercel --prod
```

Make sure to set the same environment variables in your Vercel project settings.

---

## Design Decisions

- **oklch color space** — Perceptually uniform colors that look consistent across the palette. The indigo-violet theme feels modern without being garish.
- **Glassmorphism** — Header and mobile nav use `backdrop-blur` for depth without visual weight.
- **Framer Motion** — Spring-based nav indicators, staggered list animations, and animated progress bars make the app feel responsive and alive.
- **Server Actions** — All data mutations go through Next.js Server Actions. No separate API layer to maintain.
- **Prisma raw SQL for aggregations** — `groupBy` and `aggregate` for simple queries, raw SQL for date-based aggregations where Prisma's query builder is awkward.

---

## License

MIT
