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

