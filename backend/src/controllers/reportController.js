import { supabaseAdmin } from '../config/supabase.js';
import { getDateRange, calculateMonthlyEquivalent } from './dashboardController.js';

/**
 * GET /api/reports/summary
 * Master Reports dataset with multi-dimensional filtering
 */
export const getReportsSummary = async (req, res, next) => {
  try {
    const {
      filter = 'this_year',
      startDate,
      endDate,
      planFilter = 'all',
      statusFilter = 'all',
      search = '',
    } = req.query;

    const bounds = getDateRange(filter, startDate, endDate);

    const [subsRes, subLinesRes, plansRes, productsRes, invoicesRes, paymentsRes, custRes] = await Promise.all([
      supabaseAdmin.from('subscriptions').select('*'),
      supabaseAdmin.from('subscription_lines').select('*'),
      supabaseAdmin.from('subscription_plans').select('*'),
      supabaseAdmin.from('products').select('*'),
      supabaseAdmin.from('invoices').select('*'),
      supabaseAdmin.from('payments').select('*'),
      supabaseAdmin.from('customers').select('*'),
    ]);

    if (subsRes.error) throw subsRes.error;
    if (plansRes.error) throw plansRes.error;
    if (productsRes.error) throw productsRes.error;
    if (invoicesRes.error) throw invoicesRes.error;
    if (paymentsRes.error) throw paymentsRes.error;
    if (custRes.error) throw custRes.error;

    const subscriptions = subsRes.data || [];
    const subLines = subLinesRes.data || [];
    const plans = plansRes.data || [];
    const products = productsRes.data || [];
    const invoices = invoicesRes.data || [];
    const payments = paymentsRes.data || [];
    const customers = custRes.data || [];

    const custMap = customers.reduce((acc, c) => {
      acc[c.id] = c;
      return acc;
    }, {});

    const planMap = plans.reduce((acc, p) => {
      acc[p.id] = p;
      return acc;
    }, {});

    const prodMap = products.reduce((acc, pr) => {
      acc[pr.id] = pr;
      return acc;
    }, {});

    const subLineMap = subLines.reduce((acc, l) => {
      if (!acc[l.subscription_id]) acc[l.subscription_id] = [];
      acc[l.subscription_id].push(l);
      return acc;
    }, {});

    // Total collections
    const totalCollected = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
    const activeSubs = subscriptions.filter((s) => s.status === 'ACTIVE');
    const totalMRR = activeSubs.reduce(
      (sum, s) => sum + calculateMonthlyEquivalent(s.grand_total, s.billing_frequency),
      0
    );
    const totalARR = totalMRR * 12;

    const unpaidInvoices = invoices.filter(
      (i) => i.status !== 'CANCELLED' && ['UNPAID', 'PARTIALLY_PAID'].includes(i.payment_status)
    );
    const totalOutstanding = unpaidInvoices.reduce(
      (sum, i) => sum + Number(i.outstanding_amount || i.grand_total || 0),
      0
    );

    const summary = {
      totalRevenue: totalCollected,
      mrr: totalMRR,
      arr: totalARR,
      outstanding: totalOutstanding,
      activeSubscriptions: activeSubs.length,
      totalCustomers: customers.length,
    };

    // Product Reports
    const productAgg = {};
    subLines.forEach((l) => {
      const prod = prodMap[l.product_id];
      const pName = prod ? prod.name : (l.description || 'Custom Services');
      if (!productAgg[pName]) {
        productAgg[pName] = {
          name: pName,
          revenue: 0,
          subscriptionsCount: 0,
          activeCount: 0,
        };
      }
      productAgg[pName].revenue += Number(l.line_total || 0);
      productAgg[pName].subscriptionsCount += 1;
    });

    const productReports = Object.values(productAgg);

    // Plan Reports
    const planAgg = {};
    subLines.forEach((l) => {
      const plan = planMap[l.plan_id];
      const pName = plan ? plan.name : (l.description || 'Custom Tier');
      if (!planAgg[pName]) {
        planAgg[pName] = {
          name: pName,
          revenue: 0,
          subscriptionsCount: 0,
          activeCount: 0,
          frequency: plan?.billing_interval || 'monthly',
        };
      }
      planAgg[pName].revenue += Number(l.line_total || 0);
      planAgg[pName].subscriptionsCount += 1;
    });

    const planReports = Object.values(planAgg);

    // Detailed Table records (audit-grade subscription & billing ledger)
    let tableRecords = subscriptions.map((s, idx) => {
      const cust = custMap[s.customer_id] || {};
      const lines = subLineMap[s.id] || [];
      const linePlan = lines[0]?.plan_id ? planMap[lines[0].plan_id] : null;
      const planName = linePlan?.name || lines[0]?.description || 'Subscription Plan';

      return {
        id: s.id,
        subscriptionNumber: s.subscription_number || `SUB-${idx + 1}`,
        customerName: cust.company_name || cust.name || 'Enterprise Customer',
        customerEmail: cust.email || 'billing@acme.com',
        planName,
        billingFrequency: s.billing_frequency || 'monthly',
        amount: Number(s.grand_total || 0),
        status: s.status || 'ACTIVE',
        startDate: s.start_date || (s.created_at ? s.created_at.split('T')[0] : 'N/A'),
        endDate: s.end_date || 'Ongoing',
        autoRenew: s.auto_renew !== false,
      };
    });

    // Apply table filters
    if (statusFilter && statusFilter !== 'all') {
      tableRecords = tableRecords.filter((r) => r.status.toUpperCase() === statusFilter.toUpperCase());
    }
    if (planFilter && planFilter !== 'all') {
      tableRecords = tableRecords.filter((r) => r.planName.toLowerCase() === planFilter.toLowerCase());
    }
    if (search) {
      const q = search.toLowerCase();
      tableRecords = tableRecords.filter(
        (r) =>
          r.customerName.toLowerCase().includes(q) ||
          r.subscriptionNumber.toLowerCase().includes(q) ||
          r.planName.toLowerCase().includes(q)
      );
    }

    return res.json({
      success: true,
      summary,
      productReports,
      planReports,
      tableRecords,
      totalRecords: tableRecords.length,
      dateRange: bounds,
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * GET /api/reports/export
 * Server-side CSV report export generator
 */
export const exportReportCsv = async (req, res, next) => {
  try {
    const { type = 'subscriptions', filter = 'all' } = req.query;

    let headers = [];
    let rows = [];
    let filename = `Brightloop_${type}_Report_${new Date().toISOString().split('T')[0]}.csv`;

    if (type === 'products') {
      const { data: products } = await supabaseAdmin.from('products').select('*');
      headers = ['Product ID', 'Name', 'Type', 'Sales Price', 'Cost Price', 'Is Active'];
      rows = (products || []).map((p) => [
        p.id,
        `"${p.name.replace(/"/g, '""')}"`,
        p.type,
        p.sales_price,
        p.cost_price,
        p.is_active,
      ]);
    } else if (type === 'plans') {
      const { data: plans } = await supabaseAdmin.from('subscription_plans').select('*');
      headers = ['Plan ID', 'Name', 'Billing Interval', 'Price', 'Min Quantity', 'Is Active'];
      rows = (plans || []).map((pl) => [
        pl.id,
        `"${pl.name.replace(/"/g, '""')}"`,
        pl.billing_interval,
        pl.price,
        pl.min_quantity,
        pl.is_active,
      ]);
    } else if (type === 'invoices') {
      const { data: invoices } = await supabaseAdmin.from('invoices').select('*');
      headers = ['Invoice Number', 'Customer ID', 'Invoice Date', 'Due Date', 'Status', 'Payment Status', 'Grand Total', 'Amount Paid', 'Outstanding Amount'];
      rows = (invoices || []).map((i) => [
        i.invoice_number,
        i.customer_id,
        i.invoice_date,
        i.due_date,
        i.status,
        i.payment_status,
        i.grand_total,
        i.amount_paid,
        i.outstanding_amount,
      ]);
    } else {
      // Subscriptions
      const { data: subs } = await supabaseAdmin.from('subscriptions').select('*');
      headers = ['Subscription Number', 'Customer ID', 'Frequency', 'Start Date', 'End Date', 'Status', 'Grand Total', 'Auto Renew'];
      rows = (subs || []).map((s) => [
        s.subscription_number,
        s.customer_id,
        s.billing_frequency,
        s.start_date,
        s.end_date || 'Ongoing',
        s.status,
        s.grand_total,
        s.auto_renew,
      ]);
    }

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.status(200).send(csvContent);
  } catch (error) {
    return next(error);
  }
};
