import { supabaseAdmin } from '../config/supabase.js';
import { calculateMonthlyEquivalent } from './dashboardController.js';

/**
 * Helper to resolve customer record from authenticated profile
 */
async function resolveCustomerForUser(user) {
  if (!user) return null;

  // Try finding customer by profile_id
  let { data: cust } = await supabaseAdmin
    .from('customers')
    .select('*')
    .eq('profile_id', user.id)
    .maybeSingle();

  // If not found, try matching by email
  if (!cust && user.email) {
    const { data: custByEmail } = await supabaseAdmin
      .from('customers')
      .select('*')
      .eq('email', user.email)
      .maybeSingle();

    if (custByEmail) {
      // Link customer to profile
      await supabaseAdmin
        .from('customers')
        .update({ profile_id: user.id })
        .eq('id', custByEmail.id);
      cust = custByEmail;
    }
  }

  // If still no customer record, create a linked customer record for this user
  if (!cust) {
    const { data: newCust, error: createErr } = await supabaseAdmin
      .from('customers')
      .insert([
        {
          profile_id: user.id,
          name: user.full_name || 'Customer Account',
          email: user.email,
          company_name: 'Customer Organization',
          status: 'ACTIVE',
        },
      ])
      .select()
      .single();

    if (!createErr && newCust) {
      cust = newCust;
    }
  }

  return cust;
}

/**
 * GET /api/portal/dashboard
 * Summary metrics for logged-in customer
 */
export const getPortalDashboard = async (req, res, next) => {
  try {
    const customer = await resolveCustomerForUser(req.user);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer record not found.' });
    }

    const [subsRes, invsRes, pmtsRes] = await Promise.all([
      supabaseAdmin
        .from('subscriptions')
        .select('*')
        .eq('customer_id', customer.id)
        .order('created_at', { ascending: false }),
      supabaseAdmin
        .from('invoices')
        .select('*')
        .eq('customer_id', customer.id)
        .order('created_at', { ascending: false }),
      supabaseAdmin
        .from('payments')
        .select('*')
        .eq('customer_id', customer.id)
        .order('created_at', { ascending: false }),
    ]);

    const subscriptions = subsRes.data || [];
    const invoices = invsRes.data || [];
    const payments = pmtsRes.data || [];

    const activeSubs = subscriptions.filter((s) => s.status === 'ACTIVE');
    const primarySub = activeSubs[0] || subscriptions[0] || null;

    const unpaidInvoices = invoices.filter(
      (i) => i.status !== 'CANCELLED' && ['UNPAID', 'PARTIALLY_PAID'].includes(i.payment_status)
    );
    const outstandingTotal = unpaidInvoices.reduce(
      (sum, i) => sum + Number(i.outstanding_amount || i.grand_total || 0),
      0
    );

    const kpis = [
      {
        id: 'kpi_active_subs',
        title: 'Active Subscriptions',
        value: String(activeSubs.length),
        subtitle: `${subscriptions.length} total enrolled`,
        change: activeSubs.length > 0 ? 'Active standing' : 'No active plans',
        changeType: activeSubs.length > 0 ? 'positive' : 'neutral',
      },
      {
        id: 'kpi_current_plan',
        title: 'Current Plan',
        value: primarySub ? (primarySub.subscription_number || 'Standard Plan') : 'None',
        subtitle: primarySub ? `$${Number(primarySub.grand_total || 0).toLocaleString()} / ${primarySub.billing_frequency}` : 'Explore available plans',
        change: primarySub?.auto_renew ? 'Auto-renew ON' : 'Manual renew',
        changeType: 'neutral',
      },
      {
        id: 'kpi_outstanding',
        title: 'Outstanding Balance',
        value: `$${outstandingTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
        subtitle: outstandingTotal === 0 ? 'All invoices settled' : `${unpaidInvoices.length} pending statements`,
        change: outstandingTotal === 0 ? '0 Overdue' : 'Payment required',
        changeType: outstandingTotal === 0 ? 'positive' : 'warning',
      },
      {
        id: 'kpi_next_billing',
        title: 'Next Billing Date',
        value: primarySub?.next_billing_date || primarySub?.end_date || 'N/A',
        subtitle: primarySub?.billing_frequency ? `${primarySub.billing_frequency.toUpperCase()} cycle` : 'Standard cycle',
        change: 'Upcoming charge',
        changeType: 'neutral',
      },
    ];

    return res.json({
      success: true,
      kpis,
      primarySubscription: primarySub,
      recentInvoices: invoices.slice(0, 5),
      recentPayments: payments.slice(0, 5),
      customer,
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * GET /api/portal/profile
 */
export const getPortalProfile = async (req, res, next) => {
  try {
    const customer = await resolveCustomerForUser(req.user);

    return res.json({
      success: true,
      profile: {
        id: req.user.id,
        customerId: customer?.id,
        name: customer?.name || req.user.full_name,
        email: req.user.email,
        company: customer?.company_name || 'Organization',
        phone: customer?.phone || '',
        billingAddress: {
          street: customer?.billing_address || '',
          city: '',
          state: '',
          zip: '',
          country: 'United States',
        },
        currency: 'USD',
        role: req.user.role,
      },
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * PUT /api/portal/profile
 */
export const updatePortalProfile = async (req, res, next) => {
  try {
    const { name, company, phone, billingAddress } = req.body;
    const customer = await resolveCustomerForUser(req.user);

    // Update profile
    if (name) {
      await supabaseAdmin
        .from('profiles')
        .update({ full_name: name, updated_at: new Date().toISOString() })
        .eq('id', req.user.id);
    }

    // Update customer record
    let addressStr = '';
    if (typeof billingAddress === 'string') {
      addressStr = billingAddress;
    } else if (billingAddress && typeof billingAddress === 'object') {
      addressStr = [
        billingAddress.street,
        billingAddress.city,
        billingAddress.state,
        billingAddress.zip,
        billingAddress.country,
      ]
        .filter(Boolean)
        .join(', ');
    }

    if (customer) {
      await supabaseAdmin
        .from('customers')
        .update({
          name: name || customer.name,
          company_name: company || customer.company_name,
          phone: phone || customer.phone,
          billing_address: addressStr || customer.billing_address,
          updated_at: new Date().toISOString(),
        })
        .eq('id', customer.id);
    }

    return res.json({
      success: true,
      message: 'Profile updated successfully.',
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * GET /api/portal/subscriptions
 */
export const getPortalSubscriptions = async (req, res, next) => {
  try {
    const customer = await resolveCustomerForUser(req.user);
    if (!customer) {
      return res.json({ success: true, subscriptions: [] });
    }

    const { data: subs, error } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .eq('customer_id', customer.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const { data: lines } = await supabaseAdmin
      .from('subscription_lines')
      .select('*');

    const linesBySub = (lines || []).reduce((acc, l) => {
      if (!acc[l.subscription_id]) acc[l.subscription_id] = [];
      acc[l.subscription_id].push(l);
      return acc;
    }, {});

    const mapped = (subs || []).map((s, idx) => {
      const subLines = linesBySub[s.id] || [];
      const planTitle = subLines[0]?.description || `Subscription ${s.subscription_number || idx + 1}`;
      return {
        id: s.id,
        subscriptionNumber: s.subscription_number || `SUB-${idx + 1}`,
        customerId: s.customer_id,
        customerName: customer.company_name || customer.name,
        plan: planTitle,
        interval: s.billing_frequency || 'monthly',
        amount: Number(s.grand_total || 0),
        monthlyEquivalent: calculateMonthlyEquivalent(s.grand_total, s.billing_frequency),
        currency: 'USD',
        status: s.status ? s.status.charAt(0).toUpperCase() + s.status.slice(1).toLowerCase() : 'Active',
        startDate: s.start_date || s.created_at?.split('T')[0],
        renewalDate: s.next_billing_date || s.end_date || 'Ongoing',
        autoRenew: s.auto_renew !== false,
        seatsIncluded: 15,
        seatsUsed: 1,
        apiUsageQuota: 250000,
        apiUsageCurrent: 1000,
        storageQuotaGb: 50,
        storageUsedGb: 5,
        productsIncluded: subLines.map((l) => l.description).filter(Boolean),
        timeline: [
          {
            event: `Subscription ${s.status}`,
            date: s.start_date || 'Today',
            description: `Current status is ${s.status}`,
          },
        ],
        billingHistory: [],
      };
    });

    return res.json({ success: true, subscriptions: mapped });
  } catch (error) {
    return next(error);
  }
};

/**
 * GET /api/portal/subscriptions/:id
 */
export const getPortalSubscriptionById = async (req, res, next) => {
  try {
    const customer = await resolveCustomerForUser(req.user);
    const { id } = req.params;

    const { data: s, error } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .eq('id', id)
      .eq('customer_id', customer.id)
      .single();

    if (error || !s) {
      return res.status(404).json({ success: false, message: 'Subscription not found.' });
    }

    const { data: lines } = await supabaseAdmin
      .from('subscription_lines')
      .select('*')
      .eq('subscription_id', s.id);

    return res.json({
      success: true,
      subscription: {
        id: s.id,
        subscriptionNumber: s.subscription_number,
        customerId: s.customer_id,
        customerName: customer.company_name || customer.name,
        plan: (lines && lines[0]?.description) || s.subscription_number,
        interval: s.billing_frequency,
        amount: Number(s.grand_total || 0),
        monthlyEquivalent: calculateMonthlyEquivalent(s.grand_total, s.billing_frequency),
        currency: 'USD',
        status: s.status ? s.status.charAt(0).toUpperCase() + s.status.slice(1).toLowerCase() : 'Active',
        startDate: s.start_date,
        renewalDate: s.next_billing_date || s.end_date || 'Ongoing',
        autoRenew: s.auto_renew !== false,
        timeline: [
          {
            event: 'Subscription Active',
            date: s.start_date,
            description: `Enrolled in subscription`,
          },
        ],
      },
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * POST /api/portal/subscriptions/:id/renew
 */
export const renewPortalSubscription = async (req, res, next) => {
  try {
    const customer = await resolveCustomerForUser(req.user);
    const { id } = req.params;

    const { data: s, error } = await supabaseAdmin
      .from('subscriptions')
      .update({
        status: 'ACTIVE',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('customer_id', customer.id)
      .select()
      .single();

    if (error) throw error;

    return res.json({
      success: true,
      message: `Subscription ${s.subscription_number} renewed successfully.`,
      subscription: s,
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * POST /api/portal/subscriptions/:id/pause
 */
export const pausePortalSubscription = async (req, res, next) => {
  try {
    const customer = await resolveCustomerForUser(req.user);
    const { id } = req.params;

    const { data: s, error } = await supabaseAdmin
      .from('subscriptions')
      .update({
        status: 'PAUSED',
        pause_reason: req.body.reason || 'Paused by customer via Customer Portal',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('customer_id', customer.id)
      .select()
      .single();

    if (error) throw error;

    return res.json({
      success: true,
      message: `Subscription ${s.subscription_number} paused.`,
      subscription: s,
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * POST /api/portal/subscriptions/:id/cancel
 */
export const cancelPortalSubscription = async (req, res, next) => {
  try {
    const customer = await resolveCustomerForUser(req.user);
    const { id } = req.params;

    const { data: s, error } = await supabaseAdmin
      .from('subscriptions')
      .update({
        status: 'CANCELLED',
        cancelled_at: new Date().toISOString(),
        cancellation_reason: req.body.reason || 'Cancelled by customer via Customer Portal',
        auto_renew: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('customer_id', customer.id)
      .select()
      .single();

    if (error) throw error;

    return res.json({
      success: true,
      message: `Subscription ${s.subscription_number} cancelled.`,
      subscription: s,
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * GET /api/portal/invoices
 */
export const getPortalInvoices = async (req, res, next) => {
  try {
    const customer = await resolveCustomerForUser(req.user);
    if (!customer) {
      return res.json({ success: true, invoices: [] });
    }

    const { data, error } = await supabaseAdmin
      .from('invoices')
      .select('*')
      .eq('customer_id', customer.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const mapped = (data || []).map((inv, idx) => ({
      id: inv.id,
      invoiceNumber: inv.invoice_number || `INV-${idx + 1}`,
      customerId: inv.customer_id,
      customerName: customer.company_name || customer.name,
      subscriptionId: inv.subscription_id,
      subscriptionPlan: 'Subscription Plan',
      issueDate: inv.invoice_date || inv.created_at?.split('T')[0],
      dueDate: inv.due_date,
      paidAt: inv.paid_at,
      status: inv.payment_status === 'PAID' ? 'Paid' : inv.due_date < new Date().toISOString().split('T')[0] ? 'Overdue' : 'Pending',
      amount: Number(inv.grand_total || 0),
      subtotal: Number(inv.subtotal || inv.grand_total || 0),
      discount: Number(inv.discount_amount || 0),
      taxAmount: Number(inv.tax_amount || 0),
      taxRate: '6.00%',
      total: Number(inv.grand_total || 0),
      amountPaid: Number(inv.amount_paid || 0),
      balanceDue: Number(inv.outstanding_amount || 0),
      items: [
        {
          id: `item-${idx}`,
          description: `Billing Statement ${inv.invoice_number}`,
          quantity: 1,
          unitPrice: Number(inv.grand_total || 0),
          amount: Number(inv.grand_total || 0),
        },
      ],
      paymentMethod: 'Credit Card',
    }));

    return res.json({ success: true, invoices: mapped });
  } catch (error) {
    return next(error);
  }
};

/**
 * GET /api/portal/invoices/:id
 */
export const getPortalInvoiceById = async (req, res, next) => {
  try {
    const customer = await resolveCustomerForUser(req.user);
    const { id } = req.params;

    const { data: inv, error } = await supabaseAdmin
      .from('invoices')
      .select('*')
      .eq('id', id)
      .eq('customer_id', customer.id)
      .single();

    if (error || !inv) {
      return res.status(404).json({ success: false, message: 'Invoice not found.' });
    }

    return res.json({
      success: true,
      invoice: {
        id: inv.id,
        invoiceNumber: inv.invoice_number,
        customerId: inv.customer_id,
        customerName: customer.company_name || customer.name,
        issueDate: inv.invoice_date || inv.created_at?.split('T')[0],
        dueDate: inv.due_date,
        paidAt: inv.paid_at,
        status: inv.payment_status === 'PAID' ? 'Paid' : 'Pending',
        amount: Number(inv.grand_total || 0),
        subtotal: Number(inv.subtotal || inv.grand_total || 0),
        discount: Number(inv.discount_amount || 0),
        taxAmount: Number(inv.tax_amount || 0),
        taxRate: '6.00%',
        total: Number(inv.grand_total || 0),
        amountPaid: Number(inv.amount_paid || 0),
        balanceDue: Number(inv.outstanding_amount || 0),
        items: [
          {
            id: `item-${inv.id}`,
            description: `Billing Statement ${inv.invoice_number}`,
            quantity: 1,
            unitPrice: Number(inv.grand_total || 0),
            amount: Number(inv.grand_total || 0),
          },
        ],
      },
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * GET /api/portal/payments
 */
export const getPortalPayments = async (req, res, next) => {
  try {
    const customer = await resolveCustomerForUser(req.user);
    if (!customer) {
      return res.json({ success: true, payments: [] });
    }

    const { data, error } = await supabaseAdmin
      .from('payments')
      .select('*')
      .eq('customer_id', customer.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const mapped = (data || []).map((p, idx) => ({
      id: p.id,
      paymentDate: p.payment_date || p.created_at?.split('T')[0],
      invoice: p.invoice_id || `INV-${idx + 1}`,
      amount: Number(p.amount || 0),
      method: p.payment_method || 'Credit Card',
      brand: 'Visa',
      referenceNumber: p.transaction_reference || p.payment_number,
      status: 'Success',
      currency: 'USD',
    }));

    return res.json({ success: true, payments: mapped });
  } catch (error) {
    return next(error);
  }
};

/**
 * GET /api/portal/plans
 * Available subscription plans for browsing & purchasing
 */
export const getPortalPlans = async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('subscription_plans')
      .select('*')
      .eq('is_active', true)
      .order('price', { ascending: true });

    if (error) throw error;

    const mapped = (data || []).map((p) => {
      const price = Number(p.price || 0);
      const isYearly = p.billing_interval === 'yearly';
      const monthlyEquiv = isYearly ? Math.round(price / 12) : price;
      return {
        id: p.id,
        name: p.name,
        tagline: `${p.name} recurring subscription plan`,
        billingInterval: p.billing_interval,
        monthlyPrice: monthlyEquiv,
        yearlyPrice: isYearly ? price : price * 12,
        yearlyMonthlyEquivalent: monthlyEquiv,
        popular: false,
        badge: null,
        seatsIncluded: p.min_quantity || 1,
        features: [
          'Enterprise Subscription Access',
          'Self-Service Customer Portal',
          'Automated Statement Generation',
          'Full Email Notifications',
        ],
        allowPause: p.allow_pause,
        allowRenewal: p.allow_renewal,
      };
    });

    return res.json({ success: true, plans: mapped });
  } catch (error) {
    return next(error);
  }
};
