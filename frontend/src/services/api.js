import { supabase } from './supabase';

const API_BASE_URL = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || '/api';

/**
 * Generic Fetch Wrapper with automatic Supabase JWT attachment
 */
export const request = async (endpoint, options = {}) => {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;

  const headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(options.headers || {}),
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
    headers,
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

export const apiClient = request;

// ==============================================================================
// MEMBER 4: EXECUTIVE DASHBOARD, ANALYTICS & REPORTS APIs
// ==============================================================================

export const getDashboardSummary = async (params = {}) => {
  const query = new URLSearchParams();
  if (params.filter) query.append('filter', params.filter);
  if (params.startDate) query.append('startDate', params.startDate);
  if (params.endDate) query.append('endDate', params.endDate);
  const qs = query.toString();
  return request(`/dashboard/summary${qs ? `?${qs}` : ''}`);
};

export const getAnalytics = async (params = {}) => {
  const query = new URLSearchParams();
  if (params.range) query.append('range', params.range);
  if (params.filter) query.append('filter', params.filter);
  if (params.startDate) query.append('startDate', params.startDate);
  if (params.endDate) query.append('endDate', params.endDate);
  const qs = query.toString();
  return request(`/analytics${qs ? `?${qs}` : ''}`);
};

export const getReportsSummary = async (params = {}) => {
  const query = new URLSearchParams();
  if (params.filter) query.append('filter', params.filter);
  if (params.planFilter) query.append('planFilter', params.planFilter);
  if (params.statusFilter) query.append('statusFilter', params.statusFilter);
  if (params.search) query.append('search', params.search);
  if (params.startDate) query.append('startDate', params.startDate);
  if (params.endDate) query.append('endDate', params.endDate);
  const qs = query.toString();
  return request(`/reports/summary${qs ? `?${qs}` : ''}`);
};

export const exportReportCsv = async (type = 'subscriptions', filter = 'all') => {
  const url = `${API_BASE_URL}/reports/export?type=${type}&filter=${filter}`;
  const headers = {};
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    }
  } catch (err) {}

  const response = await fetch(url, { headers });
  if (!response.ok) {
    throw new Error(`Failed to export report CSV (HTTP ${response.status})`);
  }
  const blob = await response.blob();
  const downloadUrl = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = downloadUrl;
  a.download = `Brightloop_${type}_report_${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(downloadUrl);
};

// ==============================================================================
// MEMBER 4: CUSTOMER PORTAL APIs
// ==============================================================================

export const getPortalDashboard = async () => {
  return request('/portal/dashboard');
};

export const getPortalProfile = async () => {
  return request('/portal/profile');
};

export const updatePortalProfile = async (data) => {
  return request('/portal/profile', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
};

export const getPortalSubscriptions = async () => {
  return request('/portal/subscriptions');
};

export const getPortalSubscription = async (id) => {
  return request(`/portal/subscriptions/${id}`);
};

export const renewPortalSubscription = async (id) => {
  return request(`/portal/subscriptions/${id}/renew`, {
    method: 'POST',
  });
};

export const pausePortalSubscription = async (id, reason) => {
  return request(`/portal/subscriptions/${id}/pause`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
};

export const cancelPortalSubscription = async (id, reason) => {
  return request(`/portal/subscriptions/${id}/cancel`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
};

export const getPortalInvoices = async () => {
  return request('/portal/invoices');
};

export const getPortalInvoice = async (id) => {
  return request(`/portal/invoices/${id}`);
};

export const getPortalPayments = async () => {
  return request('/portal/payments');
};

export const getPortalPlans = async () => {
  return request('/portal/plans');
};

// ==============================================================================
// MEMBERS 1, 2, 3 CORE REST INTEGRATIONS
// ==============================================================================

export const getCustomers = async (params = {}) => {
  const query = new URLSearchParams(params);
  const qs = query.toString();
  return request(`/customers${qs ? `?${qs}` : ''}`);
};

export const getCustomer = async (id) => request(`/customers/${id}`);

export const createCustomer = async (data) =>
  request('/customers', { method: 'POST', body: JSON.stringify(data) });

export const updateCustomer = async (id, data) =>
  request(`/customers/${id}`, { method: 'PUT', body: JSON.stringify(data) });

export const getSubscriptions = async (params = {}) => {
  const query = new URLSearchParams(params);
  const qs = query.toString();
  return request(`/subscriptions${qs ? `?${qs}` : ''}`);
};

export const getSubscription = async (id) => request(`/subscriptions/${id}`);

export const pauseSubscription = async (id, pause_reason = '') =>
  request(`/subscriptions/${id}/pause`, { method: 'POST', body: JSON.stringify({ pause_reason }) });

export const resumeSubscription = async (id) =>
  request(`/subscriptions/${id}/resume`, { method: 'POST' });

export const renewSubscription = async (id) =>
  request(`/subscriptions/${id}/renew`, { method: 'POST' });

export const cancelSubscription = async (id, cancellation_reason = '') =>
  request(`/subscriptions/${id}/cancel`, { method: 'POST', body: JSON.stringify({ cancellation_reason }) });

export const getInvoices = async (params = {}) => {
  const query = new URLSearchParams(params);
  const qs = query.toString();
  return request(`/invoices${qs ? `?${qs}` : ''}`);
};

export const getInvoice = async (id) => request(`/invoices/${id}`);

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

export const getPayments = async (params = {}) => {
  const query = new URLSearchParams(params);
  const qs = query.toString();
  return request(`/payments${qs ? `?${qs}` : ''}`);
};

export const getPayment = async (id) => request(`/payments/${id}`);

export default request;
