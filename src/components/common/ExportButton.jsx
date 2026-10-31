"use client";
import React, { useState } from "react";
import { Download, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { exportToCsv } from "@/utils/exportCsv";
import { cn } from "@/utils/cn";
export function ExportButton({ filename, columns, data, label = "Export CSV", className, variant = "outline", size = "sm", }) {
    const [status, setStatus] = useState("idle");
    const handleExport = () => {
        if (status !== "idle" || !data || data.length === 0)
            return;
        setStatus("loading");
        setTimeout(() => {
            const ok = exportToCsv(filename, columns, data);
            if (ok) {
                setStatus("success");
                setTimeout(() => setStatus("idle"), 2000);
            }
            else {
                setStatus("idle");
            }
        }, 250);
    };
    return (<Button variant={variant} size={size} onClick={handleExport} disabled={status === "loading" || !data || data.length === 0} className={cn("gap-1.5 transition-all text-xs font-medium", status === "success" && "border-emerald-300 text-emerald-700 bg-emerald-50/50", className)}>
      {status === "loading" && <Loader2 className="h-3.5 w-3.5 animate-spin"/>}
      {status === "success" && <Check className="h-3.5 w-3.5 text-emerald-600"/>}
      {status === "idle" && <Download className="h-3.5 w-3.5 text-slate-500"/>}
      <span>{status === "success" ? "Exported!" : label}</span>
    </Button>);
}
