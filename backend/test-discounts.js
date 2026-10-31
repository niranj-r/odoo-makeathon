import assert from 'assert';
import {
  calculateDiscount,
  roundToTwoDecimals,
  normalizeDiscountCode,
  applyDiscountUsage
} from './src/services/discountService.js';
import {
  createDiscount,
  updateDiscount,
  updateDiscountStatus,
  getDiscountById,
  listDiscounts,
  validateDiscountCode
} from './src/controllers/discountController.js';
import { verifyAuth } from './src/middleware/auth.js';
import { requireRole } from './src/middleware/roles.js';

console.log('=== RUNNING DISCOUNT SERVICE, CONTROLLER & VALIDATION TESTS ===\n');

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

const VALID_UUID_1 = '11111111-1111-4111-8111-111111111111';
const VALID_UUID_2 = '22222222-2222-4222-8222-222222222222';

// ==============================================================================
// 1. DISCOUNT CALCULATION SERVICE TESTS
// ==============================================================================

await runTest('calculateDiscount: accurately computes percentage discount on whole transaction', async () => {
  const mockDiscount = {
    id: VALID_UUID_1,
    code: 'SAVE15',
    type: 'percentage',
    value: 15,
    min_quantity: 1,
    min_amount: 0,
    applies_to: 'all',
    is_active: true
  };

  const result = await calculateDiscount(mockDiscount, { totalAmount: 1000, totalQuantity: 1 });
  assert.strictEqual(result.isValid, true);
  assert.strictEqual(result.originalAmount, 1000);
  assert.strictEqual(result.eligibleAmount, 1000);
  assert.strictEqual(result.discountAmount, 150);
  assert.strictEqual(result.finalAmount, 850);
});

await runTest('calculateDiscount: accurately computes fixed monetary discount', async () => {
  const mockDiscount = {
    id: VALID_UUID_1,
    code: 'FLAT250',
    type: 'fixed',
    value: 250,
    min_quantity: 1,
    min_amount: 0,
    applies_to: 'all',
    is_active: true
  };

  const result = await calculateDiscount(mockDiscount, { totalAmount: 1200, totalQuantity: 2 });
  assert.strictEqual(result.isValid, true);
  assert.strictEqual(result.discountAmount, 250);
  assert.strictEqual(result.finalAmount, 950);
});

await runTest('calculateDiscount: prevents negative final amount by capping fixed discount at eligible amount', async () => {
  const mockDiscount = {
    id: VALID_UUID_1,
    code: 'MEGA500',
    type: 'fixed',
    value: 500,
    min_quantity: 1,
    min_amount: 0,
    applies_to: 'all',
    is_active: true
  };

  const result = await calculateDiscount(mockDiscount, { totalAmount: 300, totalQuantity: 1 });
  assert.strictEqual(result.isValid, true);
  assert.strictEqual(result.originalAmount, 300);
  assert.strictEqual(result.eligibleAmount, 300);
  assert.strictEqual(result.discountAmount, 300); // capped at 300
  assert.strictEqual(result.finalAmount, 0);       // strictly non-negative
});

await runTest('calculateDiscount: eliminates floating point precision errors', async () => {
  const mockDiscount = {
    id: VALID_UUID_1,
    code: 'ODD33',
    type: 'percentage',
    value: 33.33,
    min_quantity: 1,
    min_amount: 0,
    applies_to: 'all',
    is_active: true
  };

  const result = await calculateDiscount(mockDiscount, { totalAmount: 99.99, totalQuantity: 1 });
  assert.strictEqual(result.isValid, true);
  assert.strictEqual(typeof result.discountAmount, 'number');
  assert.strictEqual(typeof result.finalAmount, 'number');
  assert.strictEqual(result.discountAmount, 33.33);
  assert.strictEqual(result.finalAmount, 66.66);
});

await runTest('calculateDiscount: rejects inactive discounts', async () => {
  const mockDiscount = {
    id: VALID_UUID_1,
    code: 'INACTIVE10',
    type: 'percentage',
    value: 10,
    is_active: false
  };

  const result = await calculateDiscount(mockDiscount, { totalAmount: 500 });
  assert.strictEqual(result.isValid, false);
  assert(result.error.toLowerCase().includes('inactive'));
  assert.strictEqual(result.discountAmount, 0);
  assert.strictEqual(result.finalAmount, 0);
});

await runTest('calculateDiscount: rejects future-starting discount codes', async () => {
  const futureDate = new Date(Date.now() + 86400000 * 10).toISOString().split('T')[0];
  const mockDiscount = {
    id: VALID_UUID_1,
    code: 'FUTURE10',
    type: 'percentage',
    value: 10,
    start_date: futureDate,
    is_active: true
  };

  const result = await calculateDiscount(mockDiscount, { totalAmount: 500 });
  assert.strictEqual(result.isValid, false);
  assert(result.error.toLowerCase().includes('not active yet'));
});

await runTest('calculateDiscount: rejects expired discount codes', async () => {
  const pastDate = new Date(Date.now() - 86400000 * 5).toISOString().split('T')[0];
  const mockDiscount = {
    id: VALID_UUID_1,
    code: 'EXPIRED10',
    type: 'percentage',
    value: 10,
    end_date: pastDate,
    is_active: true
  };

  const result = await calculateDiscount(mockDiscount, { totalAmount: 500 });
  assert.strictEqual(result.isValid, false);
  assert(result.error.toLowerCase().includes('expired'));
});

await runTest('calculateDiscount: rejects when max_usage limit is exhausted', async () => {
  const mockDiscount = {
    id: VALID_UUID_1,
    code: 'MAXED10',
    type: 'percentage',
    value: 10,
    max_usage: 5,
    current_usage: 5,
    is_active: true
  };

  const result = await calculateDiscount(mockDiscount, { totalAmount: 500 });
  assert.strictEqual(result.isValid, false);
  assert(result.error.toLowerCase().includes('limit has been exhausted'));
});

await runTest('calculateDiscount: enforces min_quantity threshold', async () => {
  const mockDiscount = {
    id: VALID_UUID_1,
    code: 'BULK3',
    type: 'percentage',
    value: 20,
    min_quantity: 3,
    is_active: true
  };

  const result = await calculateDiscount(mockDiscount, { totalAmount: 500, totalQuantity: 2 });
  assert.strictEqual(result.isValid, false);
  assert(result.error.toLowerCase().includes('minimum quantity'));
});

await runTest('calculateDiscount: enforces min_amount threshold', async () => {
  const mockDiscount = {
    id: VALID_UUID_1,
    code: 'BIGSPEND',
    type: 'fixed',
    value: 200,
    min_amount: 1500,
    is_active: true
  };

  const result = await calculateDiscount(mockDiscount, { totalAmount: 1200, totalQuantity: 1 });
  assert.strictEqual(result.isValid, false);
  assert(result.error.toLowerCase().includes('below the required minimum'));
});

await runTest('calculateDiscount: calculates discount only against eligible product items', async () => {
  const mockDiscount = {
    id: VALID_UUID_1,
    code: 'PRODONLY',
    type: 'percentage',
    value: 20,
    applies_to: 'product',
    target_id: VALID_UUID_1,
    is_active: true
  };

  // Line item 1: Eligible product (Price ₹500, Qty 1)
  // Line item 2: Ineligible product (Price ₹500, Qty 1)
  const items = [
    { product_id: VALID_UUID_1, price: 500, quantity: 1 },
    { product_id: VALID_UUID_2, price: 500, quantity: 1 }
  ];

  const result = await calculateDiscount(mockDiscount, { items });
  assert.strictEqual(result.isValid, true);
  assert.strictEqual(result.originalAmount, 1000);
  assert.strictEqual(result.eligibleAmount, 500); // Only line item 1 is eligible!
  assert.strictEqual(result.discountAmount, 100);  // 20% of ₹500 = ₹100
  assert.strictEqual(result.finalAmount, 900);     // ₹1000 - ₹100 = ₹900
});

await runTest('normalizeDiscountCode: trims and converts to uppercase', () => {
  assert.strictEqual(normalizeDiscountCode('  festive_2026  '), 'FESTIVE_2026');
  assert.strictEqual(normalizeDiscountCode('diwali-50'), 'DIWALI-50');
  assert.strictEqual(normalizeDiscountCode(''), '');
});

// ==============================================================================
// 2. CONTROLLER INPUT VALIDATION TESTS
// ==============================================================================

await runTest('createDiscount: rejects empty discount code with 400', async () => {
  const req = { body: { code: '', type: 'percentage', value: 10 } };
  const res = createMockRes();
  await createDiscount(req, res, () => {});
  assert.strictEqual(res.statusCode, 400);
  assert(res.body.message.includes('required'));
});

await runTest('createDiscount: rejects invalid discount type with 400', async () => {
  const req = { body: { code: 'TEST10', type: 'bogo', value: 10 } };
  const res = createMockRes();
  await createDiscount(req, res, () => {});
  assert.strictEqual(res.statusCode, 400);
  assert(res.body.message.includes('either "percentage" or "fixed"'));
});

await runTest('createDiscount: rejects negative discount value with 400', async () => {
  const req = { body: { code: 'TEST10', type: 'percentage', value: -10 } };
  const res = createMockRes();
  await createDiscount(req, res, () => {});
  assert.strictEqual(res.statusCode, 400);
  assert(res.body.message.includes('greater than zero'));
});

await runTest('createDiscount: rejects percentage discount value > 100 with 400', async () => {
  const req = { body: { code: 'TEST150', type: 'percentage', value: 150 } };
  const res = createMockRes();
  await createDiscount(req, res, () => {});
  assert.strictEqual(res.statusCode, 400);
  assert(res.body.message.includes('cannot exceed 100%'));
});

await runTest('createDiscount: rejects end_date earlier than start_date with 400', async () => {
  const req = {
    body: {
      code: 'BACKWARD',
      type: 'fixed',
      value: 50,
      start_date: '2026-12-01',
      end_date: '2026-11-01'
    }
  };
  const res = createMockRes();
  await createDiscount(req, res, () => {});
  assert.strictEqual(res.statusCode, 400);
  assert(res.body.message.includes('earlier than start date'));
});

await runTest('getDiscountById: rejects non-UUID id with 400', async () => {
  const req = { params: { id: 'invalid-uuid-string' } };
  const res = createMockRes();
  await getDiscountById(req, res, () => {});
  assert.strictEqual(res.statusCode, 400);
  assert(res.body.message.includes('UUID'));
});

await runTest('updateDiscountStatus: rejects non-boolean is_active with 400', async () => {
  const req = { params: { id: VALID_UUID_1 }, body: { is_active: 'yes' } };
  const res = createMockRes();
  await updateDiscountStatus(req, res, () => {});
  assert.strictEqual(res.statusCode, 400);
  assert(res.body.message.includes('boolean'));
});

await runTest('validateDiscountCode: rejects empty code with 400', async () => {
  const req = { body: { code: '   ' } };
  const res = createMockRes();
  await validateDiscountCode(req, res, () => {});
  assert.strictEqual(res.statusCode, 400);
  assert.strictEqual(res.body.isValid, false);
});

// ==============================================================================
// 3. SECURITY & ROLE AUTHORIZATION TESTS
// ==============================================================================

await runTest('Security Check: verifyAuth rejects unauthenticated requests with 401', async () => {
  const req = { headers: {} };
  const res = createMockRes();
  await verifyAuth(req, res, () => {});
  assert.strictEqual(res.statusCode, 401);
  assert(res.body.message.includes('token missing'));
});

await runTest('Security Check: requireRole rejects STAFF attempting discount mutations with 403', () => {
  const middleware = requireRole('ADMIN');
  const req = { user: { role: 'STAFF', email: 'staff@example.com' } };
  const res = createMockRes();
  let nextCalled = false;
  middleware(req, res, () => { nextCalled = true; });
  assert.strictEqual(res.statusCode, 403);
  assert.strictEqual(nextCalled, false);
});

console.log(`\n=== SUMMARY: ${passed}/${total} TESTS PASSED ===\n`);

if (passed !== total) {
  process.exit(1);
}

