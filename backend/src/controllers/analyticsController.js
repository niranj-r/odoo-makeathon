import { supabaseAdmin } from '../config/supabase.js';
import { getDateRange, calculateMonthlyEquivalent } from './dashboardController.js';

/**
 * GET /api/analytics
 * Enterprise SaaS BI and Growth Metrics for Management
 */
export const getAnalytics = async (req, res, next) => {
  try {
    const { range = 'Year', filter, startDate, endDate } = req.query;
    const dateBounds = getDateRange(filter || range, startDate, endDate);

    // Fetch required datasets concurrently
    const [subsRes, subLinesRes, plansRes, productsRes, paymentsRes, customersRes] = await Promise.all([
      supabaseAdmin.from('subscriptions').select('id, subscription_number, customer_id, billing_frequency, grand_total, status, created_at'),
      supabaseAdmin.from('subscription_lines').select('id, subscription_id, product_id, plan_id, description, line_total'),
      supabaseAdmin.from('subscription_plans').select('id, product_id, name, billing_interval, price, is_active'),
      supabaseAdmin.from('products').select('id, name, type, sales_price, is_active'),
      supabaseAdmin.from('payments').select('id, invoice_id, customer_id, amount, payment_date, created_at'),
      supabaseAdmin.from('customers').select('id, name, company_name, email, status, created_at'),
    ]);

    if (subsRes.error) throw subsRes.error;
    if (plansRes.error) throw plansRes.error;
    if (productsRes.error) throw productsRes.error;
    if (paymentsRes.error) throw paymentsRes.error;
    if (customersRes.error) throw customersRes.error;

    const subscriptions = subsRes.data || [];
    const subLines = subLinesRes.data || [];
    const plans = plansRes.data || [];
    const products = productsRes.data || [];
    const payments = paymentsRes.data || [];
    const customers = customersRes.data || [];

    const activeSubs = subscriptions.filter((s) => s.status === 'ACTIVE');
    const closedSubs = subscriptions.filter((s) => ['CLOSED', 'CANCELLED'].includes(s.status));

    // Map plans and products
    const planProductMap = {};
    const planMap = {};
    plans.forEach((p) => {
      planMap[p.id] = p;
      if (p.product_id) planProductMap[p.id] = p.product_id;
    });

    const productMap = {};
    products.forEach((pr) => {
      productMap[pr.id] = pr;
    });

    const customerMap = {};
    customers.forEach((c) => {
      customerMap[c.id] = c;
    });

    // 1. 12-Month Revenue Trend
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const now = new Date();
    const revenueTrend = [];

    const totalActiveMRR = activeSubs.reduce(
      (sum, s) => sum + calculateMonthlyEquivalent(s.grand_total, s.billing_frequency),
      0
    );

    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mIdx = d.getMonth();
      const yr = d.getFullYear();

      const mPayments = payments.filter((p) => {
        const pDate = new Date(p.payment_date || p.created_at);
        return pDate.getFullYear() === yr && pDate.getMonth() === mIdx;
      });
      const monthlyRevenue = mPayments.reduce((s, p) => s + (Number(p.amount) || 0), 0);

      revenueTrend.push({
        month: monthNames[mIdx],
        year: yr,
        monthlyRevenue: Math.round(monthlyRevenue),
        recurringRevenue: Math.round(totalActiveMRR),
        expectedRevenue: Math.round(totalActiveMRR * 1.05),
      });
    }

    // 2. Product Revenue Analysis
    const productRevenueAgg = {};
    subLines.forEach((line) => {
      const prod = productMap[line.product_id];
      const prodName = prod ? prod.name : (line.description || 'Other Services');
      if (!productRevenueAgg[prodName]) {
        productRevenueAgg[prodName] = 0;
      }
      productRevenueAgg[prodName] += Number(line.line_total || 0);
    });

    const totalSubRevenue = Object.values(productRevenueAgg).reduce((a, b) => a + b, 0) || (totalActiveMRR || 1);
    const colors = ['#2563EB', '#3B82F6', '#60A5FA', '#93C5FD', '#10B981', '#F59E0B'];
    let cIdx = 0;

    const productRevenue = Object.keys(productRevenueAgg).length > 0
      ? Object.entries(productRevenueAgg).map(([prodName, rev]) => ({
          product: prodName,
          revenue: Math.round(rev),
          percentage: Math.round((rev / totalSubRevenue) * 100),
          fill: colors[cIdx++ % colors.length],
        }))
      : products.map((pr, idx) => ({
          product: pr.name,
          revenue: 0,
          percentage: 0,
          fill: colors[idx % colors.length],
        }));

    // 3. Plan Revenue Analysis
    const planRevenueAgg = {};
    subLines.forEach((line) => {
      const plan = planMap[line.plan_id];
      const pName = plan ? plan.name : (line.description || 'Custom Tier');
      if (!planRevenueAgg[pName]) {
        planRevenueAgg[pName] = { revenue: 0, subscribers: 0 };
      }
      planRevenueAgg[pName].revenue += Number(line.line_total || 0);
      planRevenueAgg[pName].subscribers += 1;
    });

    let pIdx = 0;
    const planRevenue = Object.keys(planRevenueAgg).length > 0
      ? Object.entries(planRevenueAgg).map(([pName, info]) => ({
          name: pName,
          revenue: Math.round(info.revenue),
          subscribers: info.subscribers,
          percentage: Math.round((info.revenue / totalSubRevenue) * 100),
          color: colors[pIdx++ % colors.length],
        }))
      : plans.map((pl, idx) => ({
          name: pl.name,
          revenue: 0,
          subscribers: 0,
          percentage: 0,
          color: colors[idx % colors.length],
        }));

    // 4. Executive Subscription & SaaS BI Metrics
    const totalSubs = subscriptions.length || 1;
    const churnRate = ((closedSubs.length / totalSubs) * 100).toFixed(1);
    const activeCustCount = Object.keys(customerMap).length || 1;
    const arpu = (totalActiveMRR / activeCustCount).toFixed(2);
    const conversionRate = ((activeSubs.length / totalSubs) * 100).toFixed(1);

    const subscriptionMetrics = [
      {
        id: 'net_mrr',
        title: 'Net MRR Value',
        value: `$${totalActiveMRR.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
        trend: '+0.0%',
        trendType: 'positive',
        period: 'active subscriptions rate',
      },
      {
        id: 'logo_churn',
        title: 'Logo Churn Rate',
        value: `${churnRate}%`,
        trend: `${closedSubs.length} closed`,
        trendType: Number(churnRate) > 5 ? 'negative' : 'positive',
        period: 'all-time closed/cancelled',
      },
      {
        id: 'arpu',
        title: 'Avg Revenue Per Customer (ARPU)',
        value: `$${Number(arpu).toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
        trend: `$${totalActiveMRR.toLocaleString()}/mo`,
        trendType: 'positive',
        period: 'across active accounts',
      },
      {
        id: 'conversion_rate',
        title: 'Subscription Active Rate',
        value: `${conversionRate}%`,
        trend: `${activeSubs.length} of ${subscriptions.length} active`,
        trendType: 'positive',
        period: 'active vs total lifecycle',
      },
    ];

    // 5. Top Customers by Total Spend
    const customerSpend = {};
    payments.forEach((pmt) => {
      const cid = pmt.customer_id;
      if (!customerSpend[cid]) {
        customerSpend[cid] = {
          totalSpend: 0,
          paymentCount: 0,
          lastPayment: pmt.payment_date || pmt.created_at,
        };
      }
      customerSpend[cid].totalSpend += Number(pmt.amount || 0);
      customerSpend[cid].paymentCount += 1;
      if (new Date(pmt.payment_date || pmt.created_at) > new Date(customerSpend[cid].lastPayment)) {
        customerSpend[cid].lastPayment = pmt.payment_date || pmt.created_at;
      }
    });

    const topCustomers = Object.entries(customerSpend)
      .map(([cid, info], idx) => {
        const cust = customerMap[cid] || {};
        return {
          id: cid,
          rank: idx + 1,
          name: cust.name || 'Enterprise Customer',
          company: cust.company_name || cust.name || 'Enterprise Suite',
          email: cust.email || 'billing@acme.com',
          plan: 'Standard Subscription',
          totalSpend: `$${info.totalSpend.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
          mrrContribution: `$${info.totalSpend.toLocaleString()}`,
          paymentCount: info.paymentCount,
          lastPaymentDate: info.lastPayment ? info.lastPayment.split('T')[0] : 'N/A',
        };
      })
      .sort((a, b) => parseFloat(b.totalSpend.replace(/[^0-9.-]+/g, '')) - parseFloat(a.totalSpend.replace(/[^0-9.-]+/g, '')))
      .slice(0, 10);

    return res.json({
      success: true,
      revenueTrend,
      productRevenue,
      planRevenue,
      subscriptionMetrics,
      topCustomers,
    });
  } catch (error) {
    return next(error);
  }
};
