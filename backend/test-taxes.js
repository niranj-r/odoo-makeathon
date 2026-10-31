import assert from 'assert';
import {
  calculateTaxes,
  roundToTwoDecimals
} from './src/services/taxService.js';
import {
  createTax,
  updateTax,
  updateTaxStatus,
  getTaxById,
  listTaxes,
  getProductTaxes,
  assignProductTaxes
} from './src/controllers/taxController.js';
import { verifyAuth } from './src/middleware/auth.js';
import { requireRole } from './src/middleware/roles.js';

console.log('=== RUNNING TAX SERVICE, CONTROLLER & SECURITY TESTS ===\n');

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
// 1. TAX CALCULATION SERVICE TESTS
// ==============================================================================

await runTest('calculateTaxes: accurately computes single exclusive percentage tax', () => {
  const taxes = [{ id: VALID_UUID_1, name: 'GST 18%', rate_percentage: 18, computation_type: 'percentage' }];
  const result = calculateTaxes(1000, taxes, { taxMode: 'exclusive', quantity: 1 });

  assert.strictEqual(result.subtotal, 1000);
  assert.strictEqual(result.totalTax, 180);
  assert.strictEqual(result.totalAmount, 1180);
  assert.strictEqual(result.taxBreakdown.length, 1);
  assert.strictEqual(result.taxBreakdown[0].taxAmount, 180);
});

await runTest('calculateTaxes: accurately computes fixed tax with quantity multiplier', () => {
  const taxes = [{ id: VALID_UUID_1, name: 'Eco Fee', rate_percentage: 25, computation_type: 'fixed' }];
  const result = calculateTaxes(500, taxes, { taxMode: 'exclusive', quantity: 3 });

  // 3 units * ₹500 = ₹1,500; 3 units * ₹25 fixed = ₹75
  assert.strictEqual(result.subtotal, 1500);
  assert.strictEqual(result.totalTax, 75);
  assert.strictEqual(result.totalAmount, 1575);
});

await runTest('calculateTaxes: accurately computes multiple combined taxes (percentage + fixed)', () => {
  const taxes = [
    { id: VALID_UUID_1, name: 'CGST 9%', rate_percentage: 9, computation_type: 'percentage' },
    { id: VALID_UUID_2, name: 'SGST 9%', rate_percentage: 9, computation_type: 'percentage' },
    { id: '33333333-3333-4333-8333-333333333333', name: 'Regulatory Cess', rate_percentage: 50, computation_type: 'fixed' }
  ];
  const result = calculateTaxes(2000, taxes, { taxMode: 'exclusive', quantity: 1 });

  // 9% of 2000 = 180, 9% of 2000 = 180, fixed = 50 -> total tax = 410 -> total = 2410
  assert.strictEqual(result.subtotal, 2000);
  assert.strictEqual(result.totalTax, 410);
  assert.strictEqual(result.totalAmount, 2410);
  assert.strictEqual(result.taxBreakdown.length, 3);
});

await runTest('calculateTaxes: eliminates decimal precision errors on fractional amounts', () => {
  const taxes = [{ id: VALID_UUID_1, name: 'GST 18%', rate_percentage: 18, computation_type: 'percentage' }];
  const result = calculateTaxes(49999.98, taxes, { taxMode: 'exclusive', quantity: 1 });

  // 49999.98 * 0.18 = 8999.9964 -> rounds safely to 9000.00 -> total 58999.98
  assert.strictEqual(result.subtotal, 49999.98);
  assert.strictEqual(result.totalTax, 9000.00);
  assert.strictEqual(result.totalAmount, 58999.98);
});

await runTest('calculateTaxes: supports inclusive tax mode backwards decomposition', () => {
  const taxes = [{ id: VALID_UUID_1, name: 'VAT 20%', rate_percentage: 20, computation_type: 'percentage' }];
  const result = calculateTaxes(120, taxes, { taxMode: 'inclusive', quantity: 1 });

  // Gross = 120 -> Net base = 120 / 1.2 = 100 -> Tax = 20
  assert.strictEqual(result.totalAmount, 120);
  assert.strictEqual(result.netAmount, 100);
  assert.strictEqual(result.totalTax, 20);
});

// ==============================================================================
// 2. TAX CONTROLLER VALIDATION TESTS
// ==============================================================================

await runTest('createTax rejects empty tax name with 400', async () => {
  const req = {
    body: { name: '   ', rate_percentage: 18, computation_type: 'percentage' },
    user: { role: 'ADMIN' }
  };
  const res = createMockRes();
  await createTax(req, res, () => {});
  assert.strictEqual(res.statusCode, 400);
  assert.strictEqual(res.body.success, false);
  assert.match(res.body.message, /Tax name is required/i);
});

await runTest('createTax rejects invalid computation_type with 400', async () => {
  const req = {
    body: { name: 'GST', rate_percentage: 18, computation_type: 'tiered' },
    user: { role: 'ADMIN' }
  };
  const res = createMockRes();
  await createTax(req, res, () => {});
  assert.strictEqual(res.statusCode, 400);
  assert.strictEqual(res.body.success, false);
  assert.match(res.body.message, /percentage.*fixed/i);
});

await runTest('createTax rejects negative rate_percentage with 400', async () => {
  const req = {
    body: { name: 'GST', rate_percentage: -5, computation_type: 'percentage' },
    user: { role: 'ADMIN' }
  };
  const res = createMockRes();
  await createTax(req, res, () => {});
  assert.strictEqual(res.statusCode, 400);
  assert.strictEqual(res.body.success, false);
  assert.match(res.body.message, /non-negative number/i);
});

await runTest('createTax rejects percentage rate > 100 with 400', async () => {
  const req = {
    body: { name: 'Super Tax', rate_percentage: 150, computation_type: 'percentage' },
    user: { role: 'ADMIN' }
  };
  const res = createMockRes();
  await createTax(req, res, () => {});
  assert.strictEqual(res.statusCode, 400);
  assert.strictEqual(res.body.success, false);
  assert.match(res.body.message, /cannot exceed 100%/i);
});

await runTest('getTaxById rejects invalid UUID format with 400', async () => {
  const req = { params: { id: 'bad-uuid-123' }, user: { role: 'ADMIN' } };
  const res = createMockRes();
  await getTaxById(req, res, () => {});
  assert.strictEqual(res.statusCode, 400);
  assert.strictEqual(res.body.success, false);
});

await runTest('updateTax rejects invalid UUID format with 400', async () => {
  const req = { params: { id: 'bad-uuid-123' }, body: { name: 'New Tax' }, user: { role: 'ADMIN' } };
  const res = createMockRes();
  await updateTax(req, res, () => {});
  assert.strictEqual(res.statusCode, 400);
  assert.strictEqual(res.body.success, false);
});

await runTest('updateTaxStatus rejects non-boolean or invalid status with 400', async () => {
  const req = { params: { id: VALID_UUID_1 }, body: { status: 'UNKNOWN' }, user: { role: 'ADMIN' } };
  const res = createMockRes();
  await updateTaxStatus(req, res, () => {});
  assert.strictEqual(res.statusCode, 400);
  assert.strictEqual(res.body.success, false);
  assert.match(res.body.message, /ACTIVE.*INACTIVE/i);
});

// ==============================================================================
// 3. PRODUCT-TAX ASSOCIATION VALIDATION TESTS
// ==============================================================================

await runTest('getProductTaxes rejects invalid product UUID with 400', async () => {
  const req = { params: { productId: 'invalid-prod-id' }, user: { role: 'ADMIN' } };
  const res = createMockRes();
  await getProductTaxes(req, res, () => {});
  assert.strictEqual(res.statusCode, 400);
  assert.strictEqual(res.body.success, false);
});

await runTest('assignProductTaxes rejects non-array tax_ids with 400', async () => {
  const req = {
    params: { productId: VALID_UUID_1 },
    body: { tax_ids: 'not-an-array' },
    user: { role: 'ADMIN' }
  };
  const res = createMockRes();
  await assignProductTaxes(req, res, () => {});
  assert.strictEqual(res.statusCode, 400);
  assert.strictEqual(res.body.success, false);
  assert.match(res.body.message, /array of tax UUIDs/i);
});

await runTest('assignProductTaxes rejects malformed tax UUID inside tax_ids with 400', async () => {
  const req = {
    params: { productId: VALID_UUID_1 },
    body: { tax_ids: ['malformed-tax-id'] },
    user: { role: 'ADMIN' }
  };
  const res = createMockRes();
  await assignProductTaxes(req, res, () => {});
  assert.strictEqual(res.statusCode, 400);
  assert.strictEqual(res.body.success, false);
  assert.match(res.body.message, /Invalid tax ID/i);
});

// ==============================================================================
// 4. SECURITY & ROLE AUTHORIZATION TESTS
// ==============================================================================

await runTest('Security Check: verifyAuth rejects unauthenticated requests with 401', async () => {
  const req = { headers: {} };
  const res = createMockRes();
  let calledNext = false;
  await verifyAuth(req, res, () => { calledNext = true; });
  assert.strictEqual(calledNext, false);
  assert.strictEqual(res.statusCode, 401);
  assert.strictEqual(res.body.success, false);
});

await runTest('Security Check: requireRole rejects STAFF attempting tax mutations with 403', async () => {
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
