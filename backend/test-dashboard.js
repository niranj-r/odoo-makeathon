/**
 * BRIGHTLOOP - DASHBOARD CONTROLLER & ROUTE TESTS
 * Verifies live metric aggregation, schema integrity, and security checks.
 */

import { getDashboardStats } from './src/controllers/dashboardController.js';
import { verifyAuth } from './src/middleware/auth.js';
import { requireRoles } from './src/middleware/roles.js';

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

async function runDashboardTests() {
  console.log('=== RUNNING DASHBOARD METRICS & SECURITY TESTS ===\n');

  // Test 1: verifyAuth rejects unauthenticated requests
  {
    let statusCode = null;
    let responseData = null;
    const req = { headers: {} };
    const res = {
      status(code) {
        statusCode = code;
        return this;
      },
      json(data) {
        responseData = data;
        return this;
      }
    };
    await verifyAuth(req, res, () => {});
    assert(statusCode === 401, 'Security: verifyAuth rejects unauthenticated dashboard requests with 401');
  }

  // Test 2: requireRoles rejects unauthorized CUSTOMER role
  {
    let statusCode = null;
    let responseData = null;
    const req = { user: { role: 'CUSTOMER' } };
    const res = {
      status(code) {
        statusCode = code;
        return this;
      },
      json(data) {
        responseData = data;
        return this;
      }
    };
    requireRoles(['ADMIN', 'STAFF'])(req, res, () => {});
    assert(statusCode === 403, 'Security: requireRoles rejects CUSTOMER accessing dashboard metrics with 403');
  }

  // Test 3: requireRoles permits ADMIN
  {
    let calledNext = false;
    const req = { user: { role: 'ADMIN' } };
    const res = {};
    requireRoles(['ADMIN', 'STAFF'])(req, res, () => {
      calledNext = true;
    });
    assert(calledNext === true, 'Security: requireRoles allows ADMIN role access');
  }

  // Test 4: requireRoles permits STAFF
  {
    let calledNext = false;
    const req = { user: { role: 'STAFF' } };
    const res = {};
    requireRoles(['ADMIN', 'STAFF'])(req, res, () => {
      calledNext = true;
    });
    assert(calledNext === true, 'Security: requireRoles allows STAFF role access');
  }

  // Test 5: getDashboardStats structure test with mock db
  {
    const mockDb = {
      from(table) {
        return {
          select(cols, opts) {
            return {
              eq(col, val) {
                return Promise.resolve({ count: 3, error: null });
              },
              then(resolve) {
                return Promise.resolve({ count: 5, error: null }).then(resolve);
              }
            };
          }
        };
      }
    };

    let statusCode = null;
    let responseData = null;
    const req = { userClient: mockDb };
    const res = {
      status(code) {
        statusCode = code;
        return this;
      },
      json(data) {
        responseData = data;
        return this;
      }
    };

    await getDashboardStats(req, res, (err) => {});
    assert(statusCode === 200, 'getDashboardStats returns 200 HTTP OK');
    assert(responseData?.success === true, 'getDashboardStats response success is true');
    assert(typeof responseData?.stats?.products?.total === 'number', 'getDashboardStats returns products count');
    assert(typeof responseData?.stats?.plans?.total === 'number', 'getDashboardStats returns plans count');
    assert(typeof responseData?.stats?.taxes?.total === 'number', 'getDashboardStats returns taxes count');
    assert(typeof responseData?.stats?.discounts?.total === 'number', 'getDashboardStats returns discounts count');
    assert(typeof responseData?.stats?.staff?.total === 'number', 'getDashboardStats returns staff count');
  }

  console.log(`\n=== SUMMARY: ${passed}/${passed + failed} TESTS PASSED ===\n`);
  if (failed > 0) process.exit(1);
}

runDashboardTests().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});

