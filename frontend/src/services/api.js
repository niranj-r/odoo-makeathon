import { supabase } from './supabase';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

/**
 * Generic Fetch Wrapper with automatic Supabase JWT attachment
 */
const request = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  // Attach Supabase access token if session exists
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    }
  } catch (err) {
    console.warn('Could not retrieve Supabase session token:', err);
  }

  const response = await fetch(url, {
    ...options,
    headers
  });

  const contentType = response.headers.get('content-type');
  let result = null;
  if (contentType && contentType.includes('application/json')) {
    result = await response.json();
  } else {
    result = { message: await response.text() };
  }

  if (!response.ok) {
    const errorMsg = result?.message || result?.error || `HTTP ${response.status}: Request failed`;
    const error = new Error(errorMsg);
    error.status = response.status;
    error.data = result;
    throw error;
  }

  return result;
};

// ==============================================================================
// 1. CUSTOMERS API
// ==============================================================================
export const getCustomers = async (params = {}) => {
  const query = new URLSearchParams();
  if (params.page) query.append('page', params.page);
  if (params.limit) query.append('limit', params.limit);
  if (params.search) query.append('search', params.search);
  if (params.status) query.append('status', params.status);

  const qs = query.toString();
  return request(`/customers${qs ? `?${qs}` : ''}`);
};

export const getCustomer = async (id) => {
  return request(`/customers/${id}`);
};

export const createCustomer = async (data) => {
  return request('/customers', {
    method: 'POST',
    body: JSON.stringify(data)
  });
};

export const updateCustomer = async (id, data) => {
  return request(`/customers/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
};

export const updateCustomerStatus = async (id, status) => {
  return request(`/customers/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status })
  });
};

// ==============================================================================
// 2. QUOTATION TEMPLATES API
// ==============================================================================
export const getTemplates = async (params = {}) => {
  const query = new URLSearchParams();
  if (params.search) query.append('search', params.search);
  const qs = query.toString();
  return request(`/quotation-templates${qs ? `?${qs}` : ''}`);
};

export const getTemplate = async (id) => {
  return request(`/quotation-templates/${id}`);
};

export const createTemplate = async (data) => {
  return request('/quotation-templates', {
    method: 'POST',
    body: JSON.stringify(data)
  });
};

export const updateTemplate = async (id, data) => {
  return request(`/quotation-templates/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
};

export const deleteTemplate = async (id) => {
  return request(`/quotation-templates/${id}`, {
    method: 'DELETE'
  });
};

// ==============================================================================
// 3. QUOTATIONS API
// ==============================================================================
export const getQuotations = async (params = {}) => {
  const query = new URLSearchParams();
  if (params.page) query.append('page', params.page);
  if (params.limit) query.append('limit', params.limit);
  if (params.status) query.append('status', params.status);
  if (params.customer_id) query.append('customer_id', params.customer_id);
  if (params.search) query.append('search', params.search);

  const qs = query.toString();
  return request(`/quotations${qs ? `?${qs}` : ''}`);
};

export const getQuotation = async (id) => {
  return request(`/quotations/${id}`);
};

export const createQuotation = async (data) => {
  return request('/quotations', {
    method: 'POST',
    body: JSON.stringify(data)
  });
};

export const updateQuotation = async (id, data) => {
  return request(`/quotations/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
};

export const sendQuotation = async (id) => {
  return request(`/quotations/${id}/send`, {
    method: 'POST'
  });
};

export const acceptQuotation = async (id) => {
  return request(`/quotations/${id}/accept`, {
    method: 'POST'
  });
};

export const rejectQuotation = async (id) => {
  return request(`/quotations/${id}/reject`, {
    method: 'POST'
  });
};

// ==============================================================================
// 4. SUBSCRIPTIONS & CONVERSION API
// ==============================================================================
export const convertQuotationToSubscription = async (quotationId) => {
  return request(`/subscriptions/from-quotation/${quotationId}`, {
    method: 'POST'
  });
};

export const getSubscriptions = async (params = {}) => {
  const query = new URLSearchParams();
  if (params.page) query.append('page', params.page);
  if (params.limit) query.append('limit', params.limit);
  if (params.status) query.append('status', params.status);
  if (params.customer_id) query.append('customer_id', params.customer_id);
  if (params.search) query.append('search', params.search);

  const qs = query.toString();
  return request(`/subscriptions${qs ? `?${qs}` : ''}`);
};

export const getSubscription = async (id) => {
  return request(`/subscriptions/${id}`);
};

export const createSubscription = async (data) => {
  return request('/subscriptions', {
    method: 'POST',
    body: JSON.stringify(data)
  });
};

export const updateSubscription = async (id, data) => {
  return request(`/subscriptions/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
};

// ==============================================================================
// 5. SUBSCRIPTION LIFECYCLE API
// ==============================================================================
export const confirmSubscription = async (id) => {
  return request(`/subscriptions/${id}/confirm`, {
    method: 'POST'
  });
};

export const activateSubscription = async (id) => {
  return request(`/subscriptions/${id}/activate`, {
    method: 'POST'
  });
};

export const pauseSubscription = async (id, pause_reason = '') => {
  return request(`/subscriptions/${id}/pause`, {
    method: 'POST',
    body: JSON.stringify({ pause_reason })
  });
};

export const resumeSubscription = async (id) => {
  return request(`/subscriptions/${id}/resume`, {
    method: 'POST'
  });
};

export const renewSubscription = async (id) => {
  return request(`/subscriptions/${id}/renew`, {
    method: 'POST'
  });
};

export const cancelSubscription = async (id, cancellation_reason = '') => {
  return request(`/subscriptions/${id}/cancel`, {
    method: 'POST',
    body: JSON.stringify({ cancellation_reason })
  });
};

export const closeSubscription = async (id) => {
  return request(`/subscriptions/${id}/close`, {
    method: 'POST'
  });
};

export const getSubscriptionHistory = async (id) => {
  return request(`/subscriptions/${id}/history`);
};

// ==============================================================================
// 6. CATALOG LOOKUP HELPERS (Products, Plans, Taxes)
// ==============================================================================
export const getCatalogProducts = async () => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('id, name, description, unit_price, is_active')
      .eq('is_active', true)
      .order('name');
    if (!error && data) return data;
  } catch (err) {
    console.warn('Could not fetch products from supabase directly:', err);
  }
  return [];
};

export const getCatalogPlans = async () => {
  try {
    const { data, error } = await supabase
      .from('subscription_plans')
      .select('id, name, billing_frequency, price, is_active')
      .eq('is_active', true)
      .order('price');
    if (!error && data) return data;
  } catch (err) {
    console.warn('Could not fetch plans from supabase directly:', err);
  }
  return [];
};

export const getCatalogTaxes = async () => {
  try {
    const { data, error } = await supabase
      .from('taxes')
      .select('id, name, percentage, is_active')
      .eq('is_active', true)
      .order('percentage');
    if (!error && data) return data;
  } catch (err) {
    console.warn('Could not fetch taxes from supabase directly:', err);
  }
  return [];
};



// ==============================================================================
// 7. INVOICES API (Member 3 - Financial Operations)
// ==============================================================================
export const getInvoices = async (params = {}) => {
  const query = new URLSearchParams();
  if (params.page) query.append('page', params.page);
  if (params.limit) query.append('limit', params.limit);
  if (params.status) query.append('status', params.status);
  if (params.payment_status) query.append('payment_status', params.payment_status);
  if (params.customer_id) query.append('customer_id', params.customer_id);
  if (params.subscription_id) query.append('subscription_id', params.subscription_id);
  if (params.search) query.append('search', params.search);
  if (params.start_date) query.append('start_date', params.start_date);
  if (params.end_date) query.append('end_date', params.end_date);

  const qs = query.toString();
  return request(`/invoices${qs ? `?${qs}` : ''}`);
};

export const getInvoice = async (id) => {
  return request(`/invoices/${id}`);
};

export const createInvoice = async (data) => {
  return request('/invoices', {
    method: 'POST',
    body: JSON.stringify(data)
  });
};

export const generateInvoiceFromSubscription = async (subscriptionId, data = {}) => {
  return request(`/invoices/generate-from-subscription/${subscriptionId}`, {
    method: 'POST',
    body: JSON.stringify(data)
  });
};

export const confirmInvoice = async (id) => {
  return request(`/invoices/${id}/confirm`, {
    method: 'POST'
  });
};

export const cancelInvoice = async (id) => {
  return request(`/invoices/${id}/cancel`, {
    method: 'POST'
  });
};

export const sendInvoiceEmail = async (id) => {
  return request(`/invoices/${id}/send`, {
    method: 'POST'
  });
};

export const downloadInvoicePdf = async (id, invoiceNumber = 'invoice') => {
  const url = `${API_BASE_URL}/invoices/${id}/pdf`;
  const headers = {};
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    }
  } catch (err) {}

  const response = await fetch(url, { headers });
  if (!response.ok) {
    throw new Error(`Failed to download PDF (HTTP ${response.status})`);
  }
  const blob = await response.blob();
  const downloadUrl = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = downloadUrl;
  a.download = `Invoice-${invoiceNumber}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(downloadUrl);
};

// ==============================================================================
// 8. PAYMENTS API (Member 3 - Financial Operations)
// ==============================================================================
export const recordPayment = async (data) => {
  return request('/payments', {
    method: 'POST',
    body: JSON.stringify(data)
  });
};

export const getPayments = async (params = {}) => {
  const query = new URLSearchParams();
  if (params.page) query.append('page', params.page);
  if (params.limit) query.append('limit', params.limit);
  if (params.invoice_id) query.append('invoice_id', params.invoice_id);
  if (params.customer_id) query.append('customer_id', params.customer_id);
  if (params.payment_method) query.append('payment_method', params.payment_method);
  if (params.search) query.append('search', params.search);
  if (params.start_date) query.append('start_date', params.start_date);
  if (params.end_date) query.append('end_date', params.end_date);

  const qs = query.toString();
  return request(`/payments${qs ? `?${qs}` : ''}`);
};

export const getPayment = async (id) => {
  return request(`/payments/${id}`);
};

export const getInvoicePayments = async (invoiceId) => {
  return request(`/payments/invoice/${invoiceId}`);
};

export const getCustomerPayments = async (customerId) => {
  return request(`/payments/customer/${customerId}`);
};

// ==============================================================================
// 9. BILLING SCHEDULER API (Member 3 - Financial Operations)
// ==============================================================================
export const runBillingScheduler = async (referenceDate) => {
  return request('/admin/billing/run-scheduler', {
    method: 'POST',
    body: JSON.stringify({ referenceDate })
  });
};

export const getDueSubscriptions = async (referenceDate) => {
  const query = new URLSearchParams();
  if (referenceDate) query.append('referenceDate', referenceDate);
  const qs = query.toString();
  return request(`/admin/billing/due-subscriptions${qs ? `?${qs}` : ''}`);
};

export const getBillingStatus = async () => {
  return request('/admin/billing/status');
};

export const startBillingWorker = async (intervalMinutes = 60) => {
  return request('/admin/billing/worker/start', {
    method: 'POST',
    body: JSON.stringify({ intervalMinutes })
  });
};

export const stopBillingWorker = async () => {
  return request('/admin/billing/worker/stop', {
    method: 'POST'
  });
};

// ==============================================================================
// 10. EMAIL NOTIFICATIONS API
// ==============================================================================
export const getEmailNotifications = async (params = {}) => {
  const query = new URLSearchParams();
  if (params.page) query.append('page', params.page);
  if (params.limit) query.append('limit', params.limit);
  if (params.type) query.append('type', params.type);
  if (params.invoice_id) query.append('invoice_id', params.invoice_id);
  if (params.payment_id) query.append('payment_id', params.payment_id);
  const qs = query.toString();
  return request(`/emails${qs ? `?${qs}` : ''}`);
};
