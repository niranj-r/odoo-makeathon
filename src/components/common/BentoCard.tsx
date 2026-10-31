import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { cn } from "@/utils/cn";

interface BentoCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  headerClassName?: string;
  contentClassName?: string;
}

export function BentoCard({
  title,
  description,
  action,
  children,
  className,
  headerClassName,
  contentClassName,
  ...props
}: BentoCardProps) {
  return (
    <Card
      className={cn(
        "flex flex-col justify-between overflow-hidden border border-slate-200/80 bg-white transition-all hover:border-slate-300/80",
        className
      )}
      {...props}
    >
      {(title || description || action) && (
        <CardHeader
          className={cn(
            "flex flex-row items-center justify-between border-b border-slate-100 pb-3 pt-4 px-5",
            headerClassName
          )}
        >
          <div className="space-y-0.5">
            {title && <CardTitle className="text-sm font-semibold text-slate-900">{title}</CardTitle>}
            {description && <CardDescription className="text-xs text-slate-500">{description}</CardDescription>}
          </div>
          {action && <div className="flex items-center gap-2">{action}</div>}
        </CardHeader>
      )}
      <CardContent className={cn("p-5 flex-1", contentClassName)}>
        {children}
      </CardContent>
    </Card>
  );
}

