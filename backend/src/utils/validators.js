/**
 * Input Validation & Sanitization Helpers
 * Enforces security boundaries and prevents injection / malformed payloads.
 */

export const validateEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  const trimmed = email.trim().toLowerCase();
  if (trimmed.length > 255) return false;
  // RFC 5322 compliant practical regex
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  return emailRegex.test(trimmed);
};

export const validatePhone = (phone) => {
  if (!phone) return true; // Optional field
  if (typeof phone !== 'string') return false;
  const trimmed = phone.trim();
  if (trimmed.length < 7 || trimmed.length > 25) return false;
  const phoneRegex = /^\+?[0-9\s\-().]{7,25}$/;
  return phoneRegex.test(trimmed);
};

export const sanitizeString = (val, maxLength = 255) => {
  if (val === undefined || val === null) return null;
  if (typeof val !== 'string') return String(val).trim().slice(0, maxLength);
  return val.trim().replace(/\0/g, '').slice(0, maxLength);
};

export const isValidUUID = (id) => {
  if (!id || typeof id !== 'string') return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id.trim());
};

export const parsePagination = (query) => {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 10));
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  return { page, limit, from, to };
};
