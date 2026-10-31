"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ADMIN_NAV_ITEMS, SUPPORT_NAV_ITEMS } from "@/constants/navigation";
import { Zap, HelpCircle } from "lucide-react";
import { cn } from "@/utils/cn";

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-slate-200/80 bg-white md:flex">
      {/* Brand Header */}
      <div className="flex h-14 items-center gap-2.5 border-b border-slate-200/80 px-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-white shadow-xs">
          <Zap className="h-4 w-4 fill-white" />
        </div>
        <div className="flex flex-col">
          <span className="font-bold text-sm tracking-tight text-slate-900">
            BrightLoop
          </span>
          <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">
            Admin Suite
          </span>
        </div>
      </div>

      {/* Main Navigation */}
      <div className="flex-1 overflow-y-auto px-3 py-4">
        <div className="mb-2 px-3 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
          Intelligence & Operations
        </div>
        <nav className="space-y-1">
          {ADMIN_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href !== "/admin" && pathname?.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group flex items-center justify-between rounded-lg px-3 py-2 text-xs font-medium transition-all",
                  isActive
                    ? "bg-slate-100/90 text-slate-900 font-semibold shadow-2xs"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                <div className="flex items-center gap-2.5">
                  <Icon
                    className={cn(
                      "h-4 w-4 transition-colors",
                      isActive
                        ? "text-slate-900"
                        : "text-slate-400 group-hover:text-slate-600"
                    )}
                  />
                  <span>{item.title}</span>
                </div>
                {item.badge && (
                  <span className="rounded-full bg-slate-200 px-1.5 py-0.2 text-[10px] text-slate-700">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="mt-8 mb-2 px-3 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
          System Modules
        </div>
        <div className="space-y-1 text-xs">
          <div className="px-3 py-1.5 text-slate-400 flex items-center justify-between">
            <span>Products & Plans</span>
            <span className="text-[10px] text-slate-400 bg-slate-100 rounded px-1.5 py-0.5">Member 2</span>
          </div>
          <div className="px-3 py-1.5 text-slate-400 flex items-center justify-between">
            <span>Quotations & Billing</span>
            <span className="text-[10px] text-slate-400 bg-slate-100 rounded px-1.5 py-0.5">Member 3</span>
          </div>
          <div className="px-3 py-1.5 text-slate-400 flex items-center justify-between">
            <span>Auth & RBAC</span>
            <span className="text-[10px] text-slate-400 bg-slate-100 rounded px-1.5 py-0.5">Member 1</span>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="border-t border-slate-200/80 p-4">
        <div className="rounded-lg bg-slate-50 p-3 border border-slate-200/70">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-semibold text-slate-800">
              Billing Engine Active
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500 leading-snug">
            1,482 subscriptions monitored with sub-2s query latency.
          </p>
        </div>
      </div>
    </aside>
  );
}

