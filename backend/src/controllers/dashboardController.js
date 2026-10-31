import { supabaseAdmin } from '../config/supabase.js';

/**
 * Calculate date range boundaries from preset or custom query
 */
export const getDateRange = (filter = 'last_30_days', customStart = null, customEnd = null) => {
  const now = new Date();
  let start = new Date();
  let prevStart = new Date();
  let prevEnd = new Date();

  const normalized = filter ? filter.toLowerCase().replace(/\s+/g, '_') : 'last_30_days';

  switch (normalized) {
    case 'today':
      start.setHours(0, 0, 0, 0);
      prevStart.setDate(start.getDate() - 1);
      prevStart.setHours(0, 0, 0, 0);
      prevEnd.setDate(start.getDate() - 1);
      prevEnd.setHours(23, 59, 59, 999);
      break;
    case 'last_7_days':
    case 'week':
      start.setDate(now.getDate() - 7);
      prevStart.setDate(now.getDate() - 14);
      prevEnd.setDate(now.getDate() - 7);
      break;
    case 'this_quarter':
    case 'quarter':
      start.setDate(now.getDate() - 90);
      prevStart.setDate(now.getDate() - 180);
      prevEnd.setDate(now.getDate() - 90);
      break;
    case 'this_year':
    case 'year':
      start.setDate(now.getDate() - 365);
      prevStart.setDate(now.getDate() - 730);
      prevEnd.setDate(now.getDate() - 365);
      break;
    case 'custom':
      if (customStart) start = new Date(customStart);
      if (customEnd) now.setTime(new Date(customEnd).getTime());
      break;
    case 'last_30_days':
    case 'month':
    default:
      start.setDate(now.getDate() - 30);
      prevStart.setDate(now.getDate() - 60);
      prevEnd.setDate(now.getDate() - 30);
      break;
  }

  return {
    startDate: start.toISOString(),
    endDate: now.toISOString(),
    prevStartDate: prevStart.toISOString(),
    prevEndDate: prevEnd.toISOString(),
  };
};

/**
 * Calculate Monthly Recurring Revenue (MRR) equivalent
 */
export const calculateMonthlyEquivalent = (amount, frequency) => {
  const num = Number(amount) || 0;
  const freq = (frequency || 'monthly').toLowerCase();
  switch (freq) {
    case 'daily':
      return num * 30;
    case 'weekly':
      return num * 4.33;
    case 'monthly':
      return num;
    case 'yearly':
      return num / 12;
    default:
      return num;
  }
};

/**
 * GET /api/dashboard/summary
 * Master dashboard aggregation for Executive & Finance Lead
 */
export const getDashboardSummary = async (req, res, next) => {
  try {
    const { filter = 'last_30_days', startDate, endDate } = req.query;
    const range = getDateRange(filter, startDate, endDate);

    // 1. Subscriptions query
    const { data: allSubscriptions, error: subError } = await supabaseAdmin
      .from('subscriptions')
      .select('id, subscription_number, customer_id, billing_frequency, start_date, end_date, next_billing_date, status, grand_total, auto_renew, created_at');

    if (subError) throw subError;

    // 2. Subscription lines for plan & product info
    const { data: allSubLines } = await supabaseAdmin
      .from('subscription_lines')
      .select('id, subscription_id, product_id, plan_id, description');

    const subLineMap = (allSubLines || []).reduce((acc, line) => {
      if (!acc[line.subscription_id]) acc[line.subscription_id] = line;
      return acc;
    }, {});

    // 3. Invoices query
    const { data: allInvoices, error: invError } = await supabaseAdmin
      .from('invoices')
      .select('id, invoice_number, subscription_id, customer_id, invoice_date, due_date, status, payment_status, grand_total, amount_paid, outstanding_amount, created_at');

    if (invError) throw invError;

    // 4. Payments query
    const { data: allPayments, error: pmtError } = await supabaseAdmin
      .from('payments')
      .select('id, payment_number, invoice_id, customer_id, amount, payment_method, payment_date, transaction_reference, created_at');

    if (pmtError) throw pmtError;

    // 5. Customers query
    const { data: allCustomers, error: custError } = await supabaseAdmin
      .from('customers')
      .select('id, name, company_name, email, status, created_at');

    if (custError) throw custError;

    const customerMap = (allCustomers || []).reduce((acc, c) => {
      acc[c.id] = c.company_name || c.name || 'Customer';
      return acc;
    }, {});

    // Compute KPIs
    const subscriptions = allSubscriptions || [];
    const invoices = allInvoices || [];
    const payments = allPayments || [];

    const activeSubs = subscriptions.filter((s) => s.status === 'ACTIVE');
    const pausedSubs = subscriptions.filter((s) => s.status === 'PAUSED');
    const closedSubs = subscriptions.filter((s) => ['CLOSED', 'CANCELLED'].includes(s.status));
    const draftSubs = subscriptions.filter((s) => ['DRAFT', 'CONFIRMED'].includes(s.status));

    // Calculate MRR from active subscriptions
    const totalMRR = activeSubs.reduce(
      (sum, s) => sum + calculateMonthlyEquivalent(s.grand_total, s.billing_frequency),
      0
    );

    // Filter payments in range
    const periodPayments = payments.filter((p) => {
      const pDate = new Date(p.payment_date || p.created_at);
      return pDate >= new Date(range.startDate) && pDate <= new Date(range.endDate);
    });

    const totalPeriodRevenue = periodPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

    // Outstanding invoices (unpaid / partially paid)
    const unpaidInvoices = invoices.filter(
      (i) => i.status !== 'CANCELLED' && ['UNPAID', 'PARTIALLY_PAID'].includes(i.payment_status)
    );
    const totalOutstanding = unpaidInvoices.reduce(
      (sum, i) => sum + (Number(i.outstanding_amount) || Number(i.grand_total) || 0),
      0
    );

    // Overdue invoices (due_date in past and unpaid)
    const todayStr = new Date().toISOString().split('T')[0];
    const overdueInvoices = unpaidInvoices.filter((i) => i.due_date && i.due_date < todayStr);
    const totalOverdueAmount = overdueInvoices.reduce(
      (sum, i) => sum + (Number(i.outstanding_amount) || Number(i.grand_total) || 0),
      0
    );

    // Sparklines generation (6 points)
    const generateSparkline = (currentVal) => {
      const v = Number(currentVal) || 0;
      if (v === 0) {
        return [
          { step: 1, val: 0 },
          { step: 2, val: 0 },
          { step: 3, val: 0 },
          { step: 4, val: 0 },
          { step: 5, val: 0 },
          { step: 6, val: 0 },
        ];
      }
      return [
        { step: 1, val: Math.round(v * 0.85) },
        { step: 2, val: Math.round(v * 0.88) },
        { step: 3, val: Math.round(v * 0.92) },
        { step: 4, val: Math.round(v * 0.95) },
        { step: 5, val: Math.round(v * 0.98) },
        { step: 6, val: Math.round(v) },
      ];
    };

    const kpis = [
      {
        id: 'active_subscriptions',
        title: 'Active Subscriptions',
        value: activeSubs.length.toLocaleString(),
        rawNumericValue: activeSubs.length,
        change: '+0.0%',
        changeType: 'positive',
        changePeriod: 'realtime total',
        iconName: 'Users',
        sparklineData: generateSparkline(activeSubs.length),
      },
      {
        id: 'monthly_revenue',
        title: 'Recurring Revenue (MRR)',
        value: `$${totalMRR.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        rawNumericValue: totalMRR,
        change: '+0.0%',
        changeType: 'positive',
        changePeriod: 'monthly rate',
        iconName: 'DollarSign',
        sparklineData: generateSparkline(totalMRR),
      },
      {
        id: 'collected_revenue',
        title: 'Total Revenue Collected',
        value: `$${totalPeriodRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        rawNumericValue: totalPeriodRevenue,
        change: '+0.0%',
        changeType: 'positive',
        changePeriod: filter,
        iconName: 'CreditCard',
        sparklineData: generateSparkline(totalPeriodRevenue),
      },
      {
        id: 'outstanding_payments',
        title: 'Outstanding Receivables',
        value: `$${totalOutstanding.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        rawNumericValue: totalOutstanding,
        change: `${unpaidInvoices.length} invoices`,
        changeType: totalOutstanding > 0 ? 'warning' : 'positive',
        changePeriod: `${overdueInvoices.length} overdue ($${totalOverdueAmount.toLocaleString()})`,
        iconName: 'AlertCircle',
        sparklineData: generateSparkline(totalOutstanding),
      },
    ];

    // Revenue Trajectory Chart (Monthly breakdown for the past 6 months)
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const revenueChart = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mIdx = d.getMonth();
      const yr = d.getFullYear();
      const mName = `${monthNames[mIdx]} ${yr}`;

      // Payments in that month
      const monthPayments = payments.filter((p) => {
        const pDate = new Date(p.payment_date || p.created_at);
        return pDate.getFullYear() === yr && pDate.getMonth() === mIdx;
      });
      const mCollected = monthPayments.reduce((s, p) => s + (Number(p.amount) || 0), 0);

      revenueChart.push({
        month: monthNames[mIdx],
        fullMonth: mName,
        monthlyRevenue: mCollected,
        recurringRevenue: Math.round(totalMRR),
      });
    }

    // Subscription Status Distribution
    const totalSubsCount = subscriptions.length;
    const subscriptionStatus = [
      {
        name: 'Active',
        status: 'Active',
        count: activeSubs.length,
        percentage: totalSubsCount ? Math.round((activeSubs.length / totalSubsCount) * 100) : 0,
        color: '#10B981',
      },
      {
        name: 'Paused',
        status: 'Paused',
        count: pausedSubs.length,
        percentage: totalSubsCount ? Math.round((pausedSubs.length / totalSubsCount) * 100) : 0,
        color: '#F59E0B',
      },
      {
        name: 'Closed',
        status: 'Closed',
        count: closedSubs.length,
        percentage: totalSubsCount ? Math.round((closedSubs.length / totalSubsCount) * 100) : 0,
        color: '#EF4444',
      },
      {
        name: 'Draft',
        status: 'Draft',
        count: draftSubs.length,
        percentage: totalSubsCount ? Math.round((draftSubs.length / totalSubsCount) * 100) : 0,
        color: '#64748B',
      },
    ];

    // Recent Invoices (latest 5)
    const sortedInvoices = [...invoices].sort(
      (a, b) => new Date(b.created_at) - new Date(a.created_at)
    );
    const recentInvoices = sortedInvoices.slice(0, 5).map((inv, idx) => ({
      id: inv.id,
      invoiceNumber: inv.invoice_number || `INV-${idx + 1}`,
      customer: customerMap[inv.customer_id] || 'Customer',
      email: 'customer@brightloop.com',
      plan: 'Subscription Plan',
      amount: `$${Number(inv.grand_total || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      status: (inv.payment_status || inv.status || 'UNPAID').toLowerCase(),
      date: inv.invoice_date || (inv.created_at ? inv.created_at.split('T')[0] : 'Today'),
      outstandingAmount: Number(inv.outstanding_amount || 0),
    }));

    // Recent Activity timeline (interleaving invoices, payments, subscriptions)
    const activities = [];

    payments.slice(-5).forEach((p) => {
      activities.push({
        id: `pmt-${p.id}`,
        type: 'payment_received',
        title: `Payment Received: $${Number(p.amount || 0).toLocaleString()}`,
        description: `Payment ${p.payment_number || ''} recorded via ${p.payment_method || 'Card'}`,
        timestamp: p.payment_date || p.created_at,
        icon: 'CreditCard',
        statusVariant: 'success',
      });
    });

    invoices.slice(-5).forEach((inv) => {
      activities.push({
        id: `inv-${inv.id}`,
        type: 'invoice_generated',
        title: `Invoice Generated: ${inv.invoice_number}`,
        description: `Billed $${Number(inv.grand_total || 0).toLocaleString()} for ${customerMap[inv.customer_id] || 'Customer'}`,
        timestamp: inv.invoice_date || inv.created_at,
        icon: 'FileText',
        statusVariant: inv.payment_status === 'PAID' ? 'success' : 'info',
      });
    });

    subscriptions.slice(-5).forEach((s) => {
      const line = subLineMap[s.id];
      activities.push({
        id: `sub-${s.id}`,
        type: 'subscription_created',
        title: `Subscription: ${s.subscription_number}`,
        description: `${line?.description || 'Plan'} (${s.status}) for ${customerMap[s.customer_id] || 'Customer'}`,
        timestamp: s.start_date || s.created_at,
        icon: 'RefreshCw',
        statusVariant: s.status === 'ACTIVE' ? 'success' : 'warning',
      });
    });

    const recentActivity = activities
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 8)
      .map((act) => ({
        ...act,
        timestamp: act.timestamp
          ? new Date(act.timestamp).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            })
          : 'Recent',
      }));

    return res.json({
      success: true,
      kpis,
      revenueChart,
      subscriptionStatus,
      recentInvoices,
      recentActivity,
      overdueInvoices: overdueInvoices.map((inv) => ({
        id: inv.id,
        invoiceNumber: inv.invoice_number,
        customer: customerMap[inv.customer_id] || 'Customer',
        dueDate: inv.due_date,
        amount: Number(inv.grand_total || 0),
        outstandingAmount: Number(inv.outstanding_amount || 0),
      })),
      dateRange: range,
    });
  } catch (error) {
    return next(error);
  }
};
