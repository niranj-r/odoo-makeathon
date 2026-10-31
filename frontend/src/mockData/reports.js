export const mockReportsData = {
  summary: {
    grossRevenue: 1542000,
    discounts: 42300,
    refunds: 11450,
    netRevenue: 1488250,
    collectedTax: 104177,
    uncollectedInvoices: 38450,
  },
  monthlyRevenue: [
    { month: 'Jan 2026', gross: 118000, discounts: 3200, refunds: 900, net: 113900, tax: 7973 },
    { month: 'Feb 2026', gross: 121500, discounts: 3400, refunds: 1100, net: 117000, tax: 8190 },
    { month: 'Mar 2026', gross: 125000, discounts: 3100, refunds: 850, net: 121050, tax: 8473 },
    { month: 'Apr 2026', gross: 128200, discounts: 3600, refunds: 1200, net: 123400, tax: 8638 },
    { month: 'May 2026', gross: 131400, discounts: 3500, refunds: 950, net: 126950, tax: 8886 },
    { month: 'Jun 2026', gross: 134900, discounts: 3800, refunds: 1050, net: 130050, tax: 9103 },
    { month: 'Jul 2026', gross: 138600, discounts: 3900, refunds: 980, net: 133720, tax: 9360 },
    { month: 'Aug 2026', gross: 142100, discounts: 3700, refunds: 1150, net: 137250, tax: 9607 },
    { month: 'Sep 2026', gross: 146800, discounts: 4100, refunds: 1020, net: 141680, tax: 9917 },
    { month: 'Oct 2026', gross: 151500, discounts: 4300, refunds: 1250, net: 145950, tax: 10216 },
  ],
  invoiceAging: [
    { bucket: 'Current (0-30 days)', amount: 24650, invoiceCount: 18, percentage: 64.1 },
    { bucket: '31 - 60 days', amount: 8200, invoiceCount: 6, percentage: 21.3 },
    { bucket: '61 - 90 days', amount: 3750, invoiceCount: 3, percentage: 9.8 },
    { bucket: '90+ days overdue', amount: 1850, invoiceCount: 2, percentage: 4.8 },
  ],
  taxSummary: [
    { jurisdiction: 'United States (State Sales Tax)', taxableAmount: 648000, rate: 'Various (Avg 6.8%)', taxCollected: 44064 },
    { jurisdiction: 'European Union (VAT OSS)', taxableAmount: 412000, rate: '20.0%', taxCollected: 82400 },
    { jurisdiction: 'United Kingdom (HMRC VAT)', taxableAmount: 185000, rate: '20.0%', taxCollected: 37000 },
    { jurisdiction: 'Canada (GST / HST)', taxableAmount: 94000, rate: '13.0%', taxCollected: 12220 },
    { jurisdiction: 'Rest of World (Zero Rated)', taxableAmount: 149250, rate: '0.0%', taxCollected: 0 },
  ],
  churnReasons: [
    { reason: 'Price / Budgetary Constraints', count: 38, percentage: 41.3 },
    { reason: 'Missing specific feature / integration', count: 24, percentage: 26.1 },
    { reason: 'Company closed / project cancelled', count: 16, percentage: 17.4 },
    { reason: 'Switched to alternative provider', count: 9, percentage: 9.8 },
    { reason: 'Technical difficulty / low adoption', count: 5, percentage: 5.4 },
  ],
  availableExports: [
    { id: 'exp-rev-oct26', title: 'Monthly Revenue Reconciliation (Oct 2026)', format: 'CSV', generatedAt: '2026-10-31T06:00:00Z', size: '142 KB' },
    { id: 'exp-tax-q3-26', title: 'Quarterly Tax Liability Report (Q3 2026)', format: 'CSV', generatedAt: '2026-10-01T00:00:00Z', size: '98 KB' },
    { id: 'exp-churn-2026', title: 'Customer Churn Analysis YTD 2026', format: 'CSV', generatedAt: '2026-10-28T14:30:00Z', size: '54 KB' },
    { id: 'exp-aging-w43', title: 'Accounts Receivable Aging Report', format: 'CSV', generatedAt: '2026-10-30T18:00:00Z', size: '36 KB' },
  ],
};

