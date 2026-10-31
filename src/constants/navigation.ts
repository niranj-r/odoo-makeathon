import {
  LayoutDashboard,
  BarChart3,
  FileSpreadsheet,
  Layers,
  CreditCard,
  Receipt,
  UserCheck,
  LifeBuoy,
  Settings,
  LucideIcon,
} from "lucide-react";

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
  description?: string;
}

export const ADMIN_NAV_ITEMS: NavItem[] = [
  {
    title: "Executive Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
    description: "High-level KPI overview & quick health metrics",
  },
  {
    title: "Analytics",
    href: "/admin/analytics",
    icon: BarChart3,
    description: "MRR movements, churn cohort & LTV trends",
  },
  {
    title: "Financial & Plan Reports",
    href: "/admin/reports",
    icon: FileSpreadsheet,
    description: "Tax, revenue, aging & plan performance reports with CSV export",
  },
];

export const CUSTOMER_PORTAL_NAV_ITEMS: NavItem[] = [
  {
    title: "Portal Overview",
    href: "/portal",
    icon: LayoutDashboard,
    description: "Account summary, plan status & quick billing",
  },
  {
    title: "My Subscriptions",
    href: "/portal/subscriptions",
    icon: Layers,
    description: "Active tiers, add-ons & subscription lifecycle",
  },
  {
    title: "My Invoices",
    href: "/portal/invoices",
    icon: Receipt,
    description: "Billing statements, breakdown & PDF receipts",
  },
  {
    title: "Payment History",
    href: "/portal/payments",
    icon: CreditCard,
    description: "Transaction records & saved payment methods",
  },
  {
    title: "Customer Profile",
    href: "/portal/profile",
    icon: UserCheck,
    description: "Company details, billing address & preferences",
  },
];

export const SUPPORT_NAV_ITEMS: NavItem[] = [
  {
    title: "Documentation",
    href: "https://docs.brightloop.internal",
    icon: LifeBuoy,
  },
  {
    title: "System Settings",
    href: "/admin#settings",
    icon: Settings,
  },
];

