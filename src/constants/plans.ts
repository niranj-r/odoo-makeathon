export interface PlanInfo {
  id: string;
  name: string;
  code: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  features: string[];
  recommended?: boolean;
}

export const AVAILABLE_PLANS: PlanInfo[] = [
  {
    id: "plan_starter",
    name: "Starter Tier",
    code: "starter",
    description: "Essential billing and invoicing for early-stage teams.",
    monthlyPrice: 49,
    yearlyPrice: 490,
    features: [
      "Up to 5 team members",
      "Standard recurring billing",
      "Automated PDF invoices",
      "Email support",
    ],
  },
  {
    id: "plan_pro",
    name: "Professional Growth",
    code: "pro",
    description: "Advanced analytics, discount engine and custom tax rules.",
    monthlyPrice: 199,
    yearlyPrice: 1990,
    features: [
      "Up to 25 team members",
      "Automated tax rules & discount engine",
      "Revenue & churn cohort analytics",
      "Custom branded invoice portal",
      "Priority email & chat support",
    ],
    recommended: true,
  },
  {
    id: "plan_enterprise",
    name: "Enterprise Global",
    code: "enterprise",
    description: "Dedicated account management, custom contracts & unlimited volume.",
    monthlyPrice: 599,
    yearlyPrice: 5990,
    features: [
      "Unlimited team seats",
      "Multi-currency & custom tax jurisdictions",
      "Dedicated account manager",
      "Custom integrations & webhooks",
      "99.99% uptime SLA",
    ],
  },
];

