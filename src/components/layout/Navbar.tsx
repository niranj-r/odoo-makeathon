"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ShieldCheck,
  User,
  ArrowRightLeft,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/utils/cn";

interface NavbarProps {
  mode: "admin" | "customer";
}

export function Navbar({ mode }: NavbarProps) {
  const pathname = usePathname();

  const isAdmin = mode === "admin";
  const targetHref = isAdmin ? "/portal" : "/admin";
  const targetLabel = isAdmin ? "Switch to Customer Portal" : "Switch to Admin View";

  return (
    <header className="sticky top-0 z-30 flex h-14 w-full items-center justify-between border-b border-slate-200/80 bg-white/95 px-6 backdrop-blur-md">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm tracking-tight text-slate-900">
            {isAdmin ? "Enterprise Billing Hub" : "Acme Technologies Portal"}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-600">
            <Sparkles className="h-3 w-3 text-amber-500" />
            Hackathon Live
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Quick switcher between Admin & Customer Portal */}
        <Link href={targetHref}>
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 text-xs font-medium border-slate-200 text-slate-700 hover:bg-slate-50 shadow-xs"
          >
            <ArrowRightLeft className="h-3.5 w-3.5 text-slate-500" />
            <span>{targetLabel}</span>
          </Button>
        </Link>

        <div className="h-4 w-px bg-slate-200" />

        {/* User badge */}
        <div className="flex items-center gap-2 pl-1">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700">
            {isAdmin ? "BL" : "AM"}
          </div>
          <div className="hidden sm:flex flex-col text-left">
            <span className="text-xs font-semibold text-slate-800 leading-none">
              {isAdmin ? "Finance Lead" : "Alex Morgan"}
            </span>
            <span className="text-[10px] text-slate-500 leading-tight">
              {isAdmin ? "admin@brightloop.io" : "alex.morgan@acmetech.io"}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}

