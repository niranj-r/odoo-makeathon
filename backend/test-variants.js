import assert from 'assert';
import {
  calculateVariantPrice,
  listVariants,
  getVariantById,
  createVariant,
  updateVariant,
  updateVariantStatus
} from './src/controllers/variantController.js';

console.log('=== RUNNING PRODUCT VARIANT CONTROLLER & PRICING TESTS ===\n');

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

const validProductId = '11111111-1111-4111-8111-111111111111';
const validVariantId = '22222222-2222-4222-8222-222222222222';
const otherProductId = '33333333-3333-4333-8333-333333333333';

// 1. Tests for calculateVariantPrice()
await runTest('calculateVariantPrice: correctly calculates final price (Sales + Extra)', async () => {
  const mockDb = {
    from: (table) => {
      if (table === 'products') {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: () => Promise.resolve({
                data: { id: validProductId, name: 'Business ERP', sales_price: '500.00', is_active: true },
                error: null
              })
            })
          })
        };
      }
      if (table === 'product_variants') {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: () => Promise.resolve({
                data: {
                  id: validVariantId,
                  product_id: validProductId,
                  variant_name: 'SAP Edition',
                  attribute_name: 'Brand',
                  attribute_value: 'SAP',
                  price_extra: '1000.00',
                  sku: 'ERP-SAP',
                  is_active: true
                },
                error: null
              })
            })
          })
        };
      }
    }
  };

  const result = await calculateVariantPrice(validProductId, validVariantId, mockDb);
  assert.strictEqual(result.basePrice, 500);
  assert.strictEqual(result.priceExtra, 1000);
  assert.strictEqual(result.finalPrice, 1500);
  assert.strictEqual(result.variantName, 'SAP Edition');
});

await runTest('calculateVariantPrice: rejects cross-product variant access', async () => {
  const mockDb = {
    from: (table) => {
      if (table === 'products') {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: () => Promise.resolve({
                data: { id: validProductId, name: 'Business ERP', sales_price: '500.00', is_active: true },
                error: null
              })
            })
          })
        };
      }
      if (table === 'product_variants') {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: () => Promise.resolve({
                data: {
                  id: validVariantId,
                  product_id: otherProductId, // Mismatched!
                  variant_name: 'Intruder Variant',
                  price_extra: '100.00',
                  is_active: true
                },
                error: null
              })
            })
          })
        };
      }
    }
  };

  await assert.rejects(
    async () => {
      await calculateVariantPrice(validProductId, validVariantId, mockDb);
    },
    /Variant mismatch/i
  );
});

await runTest('calculateVariantPrice: rejects archived/inactive parent products', async () => {
  const mockDb = {
    from: (table) => {
      if (table === 'products') {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: () => Promise.resolve({
                data: { id: validProductId, name: 'Archived ERP', sales_price: '500.00', is_active: false },
                error: null
              })
            })
          })
        };
      }
    }
  };

  await assert.rejects(
    async () => {
      await calculateVariantPrice(validProductId, validVariantId, mockDb, { checkActive: true });
    },
    /archived or inactive product/i
  );
});

await runTest('calculateVariantPrice: rejects inactive variant when checkActive is true', async () => {
  const mockDb = {
    from: (table) => {
      if (table === 'products') {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: () => Promise.resolve({
                data: { id: validProductId, name: 'Business ERP', sales_price: '500.00', is_active: true },
                error: null
              })
            })
          })
        };
      }
      if (table === 'product_variants') {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: () => Promise.resolve({
                data: {
                  id: validVariantId,
                  product_id: validProductId,
                  variant_name: 'Retired Edition',
                  price_extra: '50.00',
                  is_active: false
                },
                error: null
              })
            })
          })
        };
      }
    }
  };

  await assert.rejects(
    async () => {
      await calculateVariantPrice(validProductId, validVariantId, mockDb, { checkActive: true });
    },
    /currently deactivated/i
  );
});

// 2. Validation tests for createVariant
await runTest('createVariant: rejects empty variant_name with 400', async () => {
  const req = {
    params: { id: validProductId },
    body: { variant_name: '   ', attribute_name: 'Brand', attribute_value: 'Odoo' },
    user: { role: 'ADMIN' },
    userClient: {
      from: () => ({
        select: () => ({
          eq: () => ({
            maybeSingle: () => Promise.resolve({ data: { id: validProductId, name: 'ERP', is_active: true } })
          })
        })
      })
    }
  };
  const res = createMockRes();
  await createVariant(req, res, () => {});
  assert.strictEqual(res.statusCode, 400);
  assert.match(res.body.message, /Variant name is required/i);
});

await runTest('createVariant: rejects negative additional price with 400', async () => {
  const req = {
    params: { id: validProductId },
    body: {
      variant_name: 'Discount Edition',
      attribute_name: 'Tier',
      attribute_value: 'Basic',
      price_extra: -150
    },
    user: { role: 'ADMIN' },
    userClient: {
      from: () => ({
        select: () => ({
          eq: () => ({
            maybeSingle: () => Promise.resolve({ data: { id: validProductId, name: 'ERP', is_active: true } })
          })
        })
      })
    }
  };
  const res = createMockRes();
  await createVariant(req, res, () => {});
  assert.strictEqual(res.statusCode, 400);
  assert.match(res.body.message, /non-negative number/i);
});

await runTest('createVariant: rejects creating variant on inactive product with 400', async () => {
  const req = {
    params: { id: validProductId },
    body: {
      variant_name: 'New Edition',
      attribute_name: 'Brand',
      attribute_value: 'Odoo',
      price_extra: 50
    },
    user: { role: 'ADMIN' },
    userClient: {
      from: () => ({
        select: () => ({
          eq: () => ({
            maybeSingle: () => Promise.resolve({ data: { id: validProductId, name: 'Archived ERP', is_active: false } })
          })
        })
      })
    }
  };
  const res = createMockRes();
  await createVariant(req, res, () => {});
  assert.strictEqual(res.statusCode, 400);
  assert.match(res.body.message, /Cannot create variants for inactive/i);
});

await runTest('createVariant: rejects duplicate SKU with 409 Conflict', async () => {
  const req = {
    params: { id: validProductId },
    body: {
      variant_name: 'Pro Edition',
      attribute_name: 'Tier',
      attribute_value: 'Pro',
      price_extra: 200,
      sku: 'SKU-DUPLICATE-01'
    },
    user: { role: 'ADMIN' },
    userClient: {
      from: (table) => {
        if (table === 'products') {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: () => Promise.resolve({ data: { id: validProductId, name: 'ERP', is_active: true } })
              })
            })
          };
        }
        if (table === 'product_variants') {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: () => Promise.resolve({
                  data: { id: 'other-id', sku: 'SKU-DUPLICATE-01', variant_name: 'Existing Variant' }
                })
              })
            })
          };
        }
      }
    }
  };
  const res = createMockRes();
  await createVariant(req, res, () => {});
  assert.strictEqual(res.statusCode, 409);
  assert.match(res.body.message, /already exists/i);
});

// 3. Tests for updateVariant & updateVariantStatus
await runTest('updateVariant: rejects cross-product update with 400', async () => {
  const req = {
    params: { id: validProductId, variantId: validVariantId },
    body: {
      variant_name: 'Hacked Edition',
      attribute_name: 'Brand',
      attribute_value: 'Odoo',
      price_extra: 100
    },
    user: { role: 'ADMIN' },
    userClient: {
      from: (table) => {
        if (table === 'products') {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: () => Promise.resolve({ data: { id: validProductId, name: 'ERP', is_active: true } })
              })
            })
          };
        }
        if (table === 'product_variants') {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: () => Promise.resolve({
                  data: { id: validVariantId, product_id: otherProductId, variant_name: 'Foreign Variant' }
                })
              })
            })
          };
        }
      }
    }
  };
  const res = createMockRes();
  await updateVariant(req, res, () => {});
  assert.strictEqual(res.statusCode, 400);
  assert.match(res.body.message, /Variant mismatch/i);
});

await runTest('updateVariantStatus: rejects non-boolean is_active with 400', async () => {
  const req = {
    params: { id: validProductId, variantId: validVariantId },
    body: { is_active: 'string_value' },
    user: { role: 'ADMIN' },
    userClient: {
      from: (table) => {
        if (table === 'products') {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: () => Promise.resolve({ data: { id: validProductId, name: 'ERP' } })
              })
            })
          };
        }
        if (table === 'product_variants') {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: () => Promise.resolve({
                  data: { id: validVariantId, product_id: validProductId, variant_name: 'Edition A', is_active: true }
                })
              })
            })
          };
        }
      }
    }
  };
  const res = createMockRes();
  await updateVariantStatus(req, res, () => {});
  assert.strictEqual(res.statusCode, 400);
  assert.match(res.body.message, /must be a boolean/i);
});

console.log(`\n=== SUMMARY: ${passed}/${total} TESTS PASSED ===\n`);
if (passed === total) {
  process.exit(0);
} else {
  process.exit(1);
}
