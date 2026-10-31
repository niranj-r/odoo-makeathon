import React from "react";
import Link from "next/link";
import {
  Zap,
  BarChart3,
  Layers,
  FileSpreadsheet,
  Receipt,
  CreditCard,
  UserCheck,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      {/* Top Banner */}
      <header className="border-b border-slate-200/80 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-white shadow-xs">
              <Zap className="h-5 w-5 fill-white" />
            </div>
            <div>
              <span className="font-bold text-base tracking-tight text-slate-900">
                BrightLoop
              </span>
              <span className="ml-2 rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                Member 4 Release
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/admin">
              <Button size="sm" variant="default" className="gap-1.5 text-xs">
                <span>Enter Admin Suite</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="mx-auto max-w-6xl px-6 py-12 flex-1">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700 shadow-2xs">
            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            <span>Hackathon Subscription Management & Intelligence Platform</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
            Automating Subscription Businesses, One Billing Cycle at a Time.
          </h1>
          <p className="text-sm text-slate-500 leading-relaxed">
            Member 4 delivers real-time executive KPIs, cohort churn analytics,
            exportable financial reports, and self-service customer portal.
          </p>
        </div>

        {/* Portal Cards Bento */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Admin Suite Card */}
          <Card className="overflow-hidden border border-slate-200/90 bg-white shadow-xs hover:border-slate-300 transition-all">
            <CardContent className="p-6 sm:p-8 flex flex-col justify-between h-full space-y-6">
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white">
                    <BarChart3 className="h-5 w-5" />
                  </div>
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
                    Finance & Operations
                  </span>
                </div>

                <h2 className="mt-4 text-xl font-bold text-slate-900">
                  Admin Executive Suite
                </h2>
                <p className="mt-2 text-xs text-slate-500 leading-relaxed">
                  Consolidated oversight for executive leadership. View real-time MRR/ARR velocity,
                  subscription health, net revenue movements, and download certified tax & financial CSV reports.
                </p>

                <ul className="mt-6 space-y-2.5 text-xs text-slate-700">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span><strong>Executive Dashboard:</strong> MRR ($128.4K), ARR ($1.54M), churn rate & live audit feed</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span><strong>Revenue Analytics:</strong> New vs expansion vs churn bar charts & 6-month retention cohort</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span><strong>Financial & Tax Reports:</strong> One-click CSV export with aging and tax jurisdiction breakdowns</span>
                  </li>
                </ul>
              </div>

              <div className="pt-4 border-t border-slate-100 flex flex-wrap gap-2">
                <Link href="/admin" className="flex-1">
                  <Button className="w-full gap-2 text-xs font-semibold">
                    <span>Open Admin Dashboard</span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/admin/analytics">
                  <Button variant="outline" className="text-xs">
                    Analytics
                  </Button>
                </Link>
                <Link href="/admin/reports">
                  <Button variant="outline" className="text-xs">
                    Reports & CSV
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Customer Portal Card */}
          <Card className="overflow-hidden border border-slate-200/90 bg-white shadow-xs hover:border-slate-300 transition-all">
            <CardContent className="p-6 sm:p-8 flex flex-col justify-between h-full space-y-6">
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white">
                    <Layers className="h-5 w-5" />
                  </div>
                  <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
                    Self-Service Portal
                  </span>
                </div>

                <h2 className="mt-4 text-xl font-bold text-slate-900">
                  Customer Self-Service Hub
                </h2>
                <p className="mt-2 text-xs text-slate-500 leading-relaxed">
                  Dedicated portal for subscribers like Acme Technologies Inc. Customers can self-manage
                  their subscription tiers, review PDF receipts, verify card transactions, and update billing details.
                </p>

                <ul className="mt-6 space-y-2.5 text-xs text-slate-700">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-blue-600 shrink-0" />
                    <span><strong>Customer Dashboard:</strong> Plan status, seat quota progress bars, and renewal countdown</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-blue-600 shrink-0" />
                    <span><strong>My Subscriptions:</strong> Manage tiers, pause cycle, or initiate upgrade with modal feedback</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-blue-600 shrink-0" />
                    <span><strong>Invoices & Payments:</strong> Printable itemized tax invoices & saved credit cards</span>
                  </li>
                </ul>
              </div>

              <div className="pt-4 border-t border-slate-100 flex flex-wrap gap-2">
                <Link href="/portal" className="flex-1">
                  <Button variant="default" className="w-full bg-blue-600 hover:bg-blue-700 gap-2 text-xs font-semibold">
                    <span>Enter Customer Portal</span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/portal/subscriptions">
                  <Button variant="outline" className="text-xs">
                    Subscriptions
                  </Button>
                </Link>
                <Link href="/portal/invoices">
                  <Button variant="outline" className="text-xs">
                    Invoices
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Enterprise Architecture Feature Grid */}
        <div className="mt-12 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Enterprise Engineering Standards Followed
            </h3>
          </div>
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs text-slate-600">
            <div className="p-3 bg-slate-50 rounded-lg">
              <span className="font-semibold text-slate-900 block">Strict Separation</span>
              Component ↓ Hook ↓ Service ↓ Mock Data (Supabase Ready)
            </div>
            <div className="p-3 bg-slate-50 rounded-lg">
              <span className="font-semibold text-slate-900 block">TypeScript Only</span>
              100% strict typed interfaces with zero `any` usage.
            </div>
            <div className="p-3 bg-slate-50 rounded-lg">
              <span className="font-semibold text-slate-900 block">Universal CSV</span>
              Excel-compatible UTF-8 BOM CSV generator with sanitization.
            </div>
            <div className="p-3 bg-slate-50 rounded-lg">
              <span className="font-semibold text-slate-900 block">Modern Stack</span>
              Next.js 15 App Router, TanStack Query, Tailwind, Recharts.
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200/80 bg-white px-6 py-4 text-center text-xs text-slate-400">
        BrightLoop Subscription Management System · Built for Hackathon
      </footer>
    </div>
  );
}

