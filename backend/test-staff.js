/**
 * BRIGHTLOOP - STAFF MANAGEMENT & STAFF PORTAL UNIT AND SECURITY TESTS
 * Verifies staff administration, staff portal operations, permission checks, and RBAC security.
 */

import { requirePermission, DEFAULT_STAFF_PERMISSIONS } from './src/middleware/permissions.js';
import { verifyAuth } from './src/middleware/auth.js';
import { requireRole, requireRoles } from './src/middleware/roles.js';
import {
  listStaff,
  getStaffById,
  inviteOrAddStaff,
  updateStaff,
  updateStaffStatus
} from './src/controllers/adminStaffController.js';
import {
  getStaffDashboardOverview,
  createQuotation,
  updateQuotationStatus,
  createSubscription,
  updateStaffProfile
} from './src/controllers/staffPortalController.js';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`✓ [PASS] ${message}`);
    passed++;
  } else {
    console.error(`✗ [FAIL] ${message}`);
    failed++;
  }
}

async function runStaffTests() {
  console.log('=== RUNNING STAFF MANAGEMENT & STAFF PORTAL UNIT AND SECURITY TESTS ===\n');

  // 1. Permission Middleware: requirePermission rejects unauthenticated requests
  {
    let statusCode = null;
    const req = {};
    const res = { status: (c) => { statusCode = c; return { json: () => {} }; } };
    requirePermission('customers.view')(req, res, () => {});
    assert(statusCode === 401, 'requirePermission rejects unauthenticated requests with 401');
  }

  // 2. Permission Middleware: requirePermission rejects inactive user
  {
    let statusCode = null;
    const req = { user: { role: 'STAFF', status: 'INACTIVE' } };
    const res = { status: (c) => { statusCode = c; return { json: () => {} }; } };
    requirePermission('customers.view')(req, res, () => {});
    assert(statusCode === 403, 'requirePermission rejects inactive staff with 403');
  }

  // 3. Permission Middleware: requirePermission rejects CUSTOMER role
  {
    let statusCode = null;
    const req = { user: { role: 'CUSTOMER', status: 'ACTIVE' } };
    const res = { status: (c) => { statusCode = c; return { json: () => {} }; } };
    requirePermission('customers.view')(req, res, () => {});
    assert(statusCode === 403, 'requirePermission rejects CUSTOMER accessing staff operations with 403');
  }

  // 4. Permission Middleware: requirePermission allows ADMIN unconditionally
  {
    let calledNext = false;
    const req = { user: { role: 'ADMIN', status: 'ACTIVE' } };
    const res = {};
    requirePermission('any.internal.action')(req, res, () => { calledNext = true; });
    assert(calledNext === true, 'requirePermission grants ADMIN full superuser access');
  }

  // 5. Permission Middleware: requirePermission allows STAFF for default permissions
  {
    let calledNext = false;
    const req = { user: { role: 'STAFF', status: 'ACTIVE' } };
    const res = {};
    requirePermission('quotations.create')(req, res, () => { calledNext = true; });
    assert(calledNext === true, 'requirePermission grants STAFF default operational permission');
  }

  // 6. Permission Middleware: requirePermission rejects STAFF for ungranted actions
  {
    let statusCode = null;
    const req = { user: { role: 'STAFF', status: 'ACTIVE' } };
    const res = { status: (c) => { statusCode = c; return { json: () => {} }; } };
    requirePermission('admin.delete_system_database')(req, res, () => {});
    assert(statusCode === 403, 'requirePermission blocks STAFF from ungranted administrative capabilities');
  }

  // 7. Admin Staff Controller: getStaffById rejects invalid UUID
  {
    let statusCode = null;
    let responseData = null;
    const req = { params: { id: 'invalid-uuid-format' }, user: { role: 'ADMIN' } };
    const res = {
      status: (c) => { statusCode = c; return { json: (d) => { responseData = d; } }; }
    };
    await getStaffById(req, res, () => {});
    assert(statusCode === 400, 'getStaffById rejects invalid UUID format with 400');
  }

  // 8. Admin Staff Controller: inviteOrAddStaff rejects missing required fields
  {
    let statusCode = null;
    const req = { body: { email: '', full_name: '' }, user: { role: 'ADMIN' } };
    const res = {
      status: (c) => { statusCode = c; return { json: () => {} }; }
    };
    await inviteOrAddStaff(req, res, () => {});
    assert(statusCode === 400, 'inviteOrAddStaff rejects missing email or full_name with 400');
  }

  // 9. Admin Staff Controller: inviteOrAddStaff rejects weak password
  {
    let statusCode = null;
    const req = {
      body: { email: 'staff@example.com', full_name: 'Staff Member', method: 'password', password: 'weak' },
      user: { role: 'ADMIN' }
    };
    const res = {
      status: (c) => { statusCode = c; return { json: () => {} }; }
    };
    await inviteOrAddStaff(req, res, () => {});
    assert(statusCode === 400, 'inviteOrAddStaff rejects password < 8 characters or lacking criteria with 400');
  }

  // 10. Admin Staff Controller: updateStaff rejects empty full_name
  {
    let statusCode = null;
    const req = {
      params: { id: '7d9b97b1-2134-4b5c-8901-abcdef012345' },
      body: { full_name: '   ' },
      user: { role: 'ADMIN' }
    };
    const res = {
      status: (c) => { statusCode = c; return { json: () => {} }; }
    };
    await updateStaff(req, res, () => {});
    assert(statusCode === 400, 'updateStaff rejects whitespace or empty full_name with 400');
  }

  // 11. Admin Staff Controller: updateStaffStatus rejects invalid status
  {
    let statusCode = null;
    const req = {
      params: { id: '7d9b97b1-2134-4b5c-8901-abcdef012345' },
      body: { status: 'DELETED' },
      user: { id: 'admin-id', role: 'ADMIN' }
    };
    const res = {
      status: (c) => { statusCode = c; return { json: () => {} }; }
    };
    await updateStaffStatus(req, res, () => {});
    assert(statusCode === 400, 'updateStaffStatus rejects statuses outside ACTIVE/INACTIVE with 400');
  }

  // 12. Admin Staff Controller: updateStaffStatus blocks admin self-deactivation
  {
    let statusCode = null;
    const adminId = '7d9b97b1-2134-4b5c-8901-abcdef012345';
    const req = {
      params: { id: adminId },
      body: { status: 'INACTIVE' },
      user: { id: adminId, role: 'ADMIN' }
    };
    const res = {
      status: (c) => { statusCode = c; return { json: () => {} }; }
    };
    await updateStaffStatus(req, res, () => {});
    assert(statusCode === 400, 'updateStaffStatus blocks administrator self-deactivation with 400');
  }

  // 13. Staff Portal: createQuotation rejects missing customer
  {
    let statusCode = null;
    const req = { body: { customer_id: '', items: [{ product_id: 'prod-1' }] }, user: { role: 'STAFF' } };
    const res = {
      status: (c) => { statusCode = c; return { json: () => {} }; }
    };
    await createQuotation(req, res, () => {});
    assert(statusCode === 400, 'createQuotation rejects missing customer with 400');
  }

  // 14. Staff Portal: createQuotation rejects empty items list
  {
    let statusCode = null;
    const req = { body: { customer_id: 'cust-uuid', items: [] }, user: { role: 'STAFF' } };
    const res = {
      status: (c) => { statusCode = c; return { json: () => {} }; }
    };
    await createQuotation(req, res, () => {});
    assert(statusCode === 400, 'createQuotation rejects empty items array with 400');
  }

  // 15. Staff Portal: updateQuotationStatus rejects invalid status
  {
    let statusCode = null;
    const req = { params: { id: 'quote-uuid' }, body: { status: 'DESTROYED' }, user: { role: 'STAFF' } };
    const res = {
      status: (c) => { statusCode = c; return { json: () => {} }; }
    };
    await updateQuotationStatus(req, res, () => {});
    assert(statusCode === 400, 'updateQuotationStatus rejects unrecognized quotation status with 400');
  }

  // 16. Staff Portal: createSubscription rejects missing customer
  {
    let statusCode = null;
    const req = { body: { customer_id: '' }, user: { role: 'STAFF' } };
    const res = {
      status: (c) => { statusCode = c; return { json: () => {} }; }
    };
    await createSubscription(req, res, () => {});
    assert(statusCode === 400, 'createSubscription rejects missing customer with 400');
  }

  // 17. Staff Portal: updateStaffProfile rejects empty full name
  {
    let statusCode = null;
    const req = { body: { full_name: '' }, user: { id: 'staff-1', role: 'STAFF' } };
    const res = {
      status: (c) => { statusCode = c; return { json: () => {} }; }
    };
    await updateStaffProfile(req, res, () => {});
    assert(statusCode === 400, 'updateStaffProfile rejects empty full_name with 400');
  }

  // 18. Security: Staff role cannot access Admin Staff management endpoints
  {
    let statusCode = null;
    const req = { user: { role: 'STAFF' } };
    const res = {
      status: (c) => { statusCode = c; return { json: () => {} }; }
    };
    requireRole('ADMIN')(req, res, () => {});
    assert(statusCode === 403, 'Security: requireRole(ADMIN) prevents STAFF accessing admin staff routes');
  }

  // 19. Security: Customer cannot access Staff Portal endpoints
  {
    let statusCode = null;
    const req = { user: { role: 'CUSTOMER' } };
    const res = {
      status: (c) => { statusCode = c; return { json: () => {} }; }
    };
    requireRoles(['STAFF', 'ADMIN'])(req, res, () => {});
    assert(statusCode === 403, 'Security: requireRoles(STAFF, ADMIN) prevents CUSTOMER from accessing staff portal');
  }

  console.log(`\n=== SUMMARY: ${passed}/${passed + failed} TESTS PASSED ===\n`);
  if (failed > 0) process.exit(1);
}

runStaffTests().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});

