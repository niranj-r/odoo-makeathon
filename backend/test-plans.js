import assert from 'assert';
import {
  createSubscriptionPlan,
  updateSubscriptionPlan,
  updateSubscriptionPlanStatus,
  getSubscriptionPlanById,
  listSubscriptionPlans,
  formatPlan
} from './src/controllers/subscriptionPlanController.js';

console.log('=== RUNNING SUBSCRIPTION PLAN CONTROLLER & SECURITY TESTS ===\n');

// Mock response creator
const createMockRes = () => {
  const res = {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.body = data;
      return this;
    }
  };
  return res;
};

let passed = 0;
let total = 0;

const runTest = async (name, testFn) => {
  total++;
  try {
    await testFn();
    console.log(`✓ [PASS] ${name}`);
    passed++;
  } catch (err) {
    console.error(`✗ [FAIL] ${name}`);
    console.error(`  Error: ${err.message}`);
  }
};

const VALID_UUID = '11111111-1111-4111-8111-111111111111';

// Reusable mock DB with active product
const mockActiveProductDb = {
  from(table) {
    return {
      select() {
        return {
          eq() {
            return {
              maybeSingle: async () => ({
                data: { id: VALID_UUID, name: 'Active Product', is_active: true, sales_price: 100 },
                error: null
              })
            };
          }
        };
      }
    };
  }
};

// 1. Validation Tests for createSubscriptionPlan
await runTest('createSubscriptionPlan rejects empty plan name with 400', async () => {
  const req = {
    body: { name: '   ', product_id: VALID_UUID, billing_interval: 'monthly', price: 100 },
    user: { role: 'ADMIN' },
    userClient: mockActiveProductDb
  };
  const res = createMockRes();
  await createSubscriptionPlan(req, res, () => {});
  assert.strictEqual(res.statusCode, 400);
  assert.strictEqual(res.body.success, false);
  assert.match(res.body.message, /Plan name is required/i);
});

await runTest('createSubscriptionPlan rejects invalid product_id format with 400', async () => {
  const req = {
    body: { name: 'Pro Plan', product_id: 'not-a-uuid', billing_interval: 'monthly', price: 100 },
    user: { role: 'ADMIN' },
    userClient: mockActiveProductDb
  };
  const res = createMockRes();
  await createSubscriptionPlan(req, res, () => {});
  assert.strictEqual(res.statusCode, 400);
  assert.strictEqual(res.body.success, false);
  assert.match(res.body.message, /valid product ID/i);
});

await runTest('createSubscriptionPlan rejects invalid billing interval with 400', async () => {
  const req = {
    body: { name: 'Pro Plan', product_id: VALID_UUID, billing_interval: 'hourly', price: 100 },
    user: { role: 'ADMIN' },
    userClient: mockActiveProductDb
  };
  const res = createMockRes();
  await createSubscriptionPlan(req, res, () => {});
  assert.strictEqual(res.statusCode, 400);
  assert.strictEqual(res.body.success, false);
  assert.match(res.body.message, /Invalid billing interval/i);
});

await runTest('createSubscriptionPlan rejects negative price with 400', async () => {
  const req = {
    body: { name: 'Pro Plan', product_id: VALID_UUID, billing_interval: 'monthly', price: -50 },
    user: { role: 'ADMIN' },
    userClient: mockActiveProductDb
  };
  const res = createMockRes();
  await createSubscriptionPlan(req, res, () => {});
  assert.strictEqual(res.statusCode, 400);
  assert.strictEqual(res.body.success, false);
  assert.match(res.body.message, /non-negative number/i);
});

await runTest('createSubscriptionPlan rejects min_quantity < 1 with 400', async () => {
  const req = {
    body: { name: 'Pro Plan', product_id: VALID_UUID, billing_interval: 'monthly', price: 100, min_quantity: 0 },
    user: { role: 'ADMIN' },
    userClient: mockActiveProductDb
  };
  const res = createMockRes();
  await createSubscriptionPlan(req, res, () => {});
  assert.strictEqual(res.statusCode, 400);
  assert.strictEqual(res.body.success, false);
  assert.match(res.body.message, /positive integer of 1 or greater/i);
});

await runTest('createSubscriptionPlan rejects end_date earlier than start_date with 400', async () => {
  const req = {
    body: {
      name: 'Pro Plan',
      product_id: VALID_UUID,
      billing_interval: 'monthly',
      price: 100,
      start_date: '2027-01-01',
      end_date: '2026-01-01'
    },
    user: { role: 'ADMIN' },
    userClient: mockActiveProductDb
  };
  const res = createMockRes();
  await createSubscriptionPlan(req, res, () => {});
  assert.strictEqual(res.statusCode, 400);
  assert.strictEqual(res.body.success, false);
  assert.match(res.body.message, /End date cannot be earlier than start date/i);
});

// 2. Mock DB check for inactive product rejection
await runTest('createSubscriptionPlan rejects creating plan on inactive product with 400', async () => {
  const mockDb = {
    from(table) {
      return {
        select() {
          return {
            eq() {
              return {
                maybeSingle: async () => ({
                  data: { id: VALID_UUID, name: 'Archived ERP', is_active: false, sales_price: 100 },
                  error: null
                })
              };
            }
          };
        }
      };
    }
  };

  const req = {
    body: { name: 'Pro Plan', product_id: VALID_UUID, billing_interval: 'monthly', price: 100 },
    user: { role: 'ADMIN' },
    userClient: mockDb
  };
  const res = createMockRes();
  await createSubscriptionPlan(req, res, () => {});
  assert.strictEqual(res.statusCode, 400);
  assert.strictEqual(res.body.success, false);
  assert.match(res.body.message, /archived or inactive product/i);
});

// 3. ID format validation on GET / PUT / PATCH
await runTest('getSubscriptionPlanById rejects non-UUID ID with 400', async () => {
  const req = { params: { id: 'bad-id-123' }, user: { role: 'ADMIN' } };
  const res = createMockRes();
  await getSubscriptionPlanById(req, res, () => {});
  assert.strictEqual(res.statusCode, 400);
  assert.strictEqual(res.body.success, false);
});

await runTest('updateSubscriptionPlan rejects non-UUID ID with 400', async () => {
  const req = { params: { id: 'bad-id-123' }, body: { name: 'New Name' }, user: { role: 'ADMIN' } };
  const res = createMockRes();
  await updateSubscriptionPlan(req, res, () => {});
  assert.strictEqual(res.statusCode, 400);
  assert.strictEqual(res.body.success, false);
});

await runTest('updateSubscriptionPlanStatus rejects invalid status format with 400', async () => {
  const req = { params: { id: VALID_UUID }, body: { status: 'INVALID_STATUS' }, user: { role: 'ADMIN' } };
  const res = createMockRes();
  await updateSubscriptionPlanStatus(req, res, () => {});
  assert.strictEqual(res.statusCode, 400);
  assert.strictEqual(res.body.success, false);
  assert.match(res.body.message, /must be "ACTIVE" or "INACTIVE"/i);
});

import { verifyAuth } from './src/middleware/auth.js';
import { requireRole } from './src/middleware/roles.js';

// 4. Role & Auth Security Middleware Tests
await runTest('Security Check: verifyAuth rejects unauthenticated request with 401', async () => {
  const req = { headers: {} };
  const res = createMockRes();
  let calledNext = false;
  await verifyAuth(req, res, () => { calledNext = true; });
  assert.strictEqual(calledNext, false);
  assert.strictEqual(res.statusCode, 401);
  assert.strictEqual(res.body.success, false);
  assert.match(res.body.message, /Authorization token missing/i);
});

await runTest('Security Check: requireRole rejects STAFF accessing ADMIN plan mutations with 403', async () => {
  const middleware = requireRole('ADMIN');
  const req = { user: { role: 'STAFF' } };
  const res = createMockRes();
  let calledNext = false;
  middleware(req, res, () => { calledNext = true; });
  assert.strictEqual(calledNext, false);
  assert.strictEqual(res.statusCode, 403);
  assert.strictEqual(res.body.success, false);
  assert.match(res.body.message, /Requires ADMIN privilege/i);
});

console.log(`\n=== SUMMARY: ${passed}/${total} TESTS PASSED ===\n`);
if (passed !== total) {
  process.exit(1);
}
