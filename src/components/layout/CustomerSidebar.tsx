"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CUSTOMER_PORTAL_NAV_ITEMS } from "@/constants/navigation";
import { Building2, LifeBuoy } from "lucide-react";
import { cn } from "@/utils/cn";

export function CustomerSidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-slate-200/80 bg-white md:flex">
      {/* Brand Header */}
      <div className="flex h-14 items-center gap-2.5 border-b border-slate-200/80 px-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white shadow-xs">
          <Building2 className="h-4 w-4 fill-white" />
        </div>
        <div className="flex flex-col">
          <span className="font-bold text-sm tracking-tight text-slate-900">
            Acme Portal
          </span>
          <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">
            BrightLoop Self-Service
          </span>
        </div>
      </div>

      {/* Main Navigation */}
      <div className="flex-1 overflow-y-auto px-3 py-4">
        <div className="mb-2 px-3 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
          Billing & Account
        </div>
        <nav className="space-y-1">
          {CUSTOMER_PORTAL_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href !== "/portal" && pathname?.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group flex items-center justify-between rounded-lg px-3 py-2 text-xs font-medium transition-all",
                  isActive
                    ? "bg-blue-50/70 text-blue-900 font-semibold shadow-2xs border-l-2 border-blue-600"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                <div className="flex items-center gap-2.5">
                  <Icon
                    className={cn(
                      "h-4 w-4 transition-colors",
                      isActive
                        ? "text-blue-600"
                        : "text-slate-400 group-hover:text-slate-600"
                    )}
                  />
                  <span>{item.title}</span>
                </div>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Customer Quick Help */}
      <div className="border-t border-slate-200/80 p-4">
        <div className="flex items-start gap-2.5 rounded-lg border border-slate-200 bg-slate-50/70 p-3">
          <LifeBuoy className="h-4 w-4 text-blue-600 mt-0.5" />
          <div className="text-xs">
            <span className="font-medium text-slate-800">Need billing help?</span>
            <p className="mt-0.5 text-[11px] text-slate-500 leading-snug">
              Contact our team at billing@brightloop.io
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}

