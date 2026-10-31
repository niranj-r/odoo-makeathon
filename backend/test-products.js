import assert from 'assert';
import {
  createProduct,
  updateProduct,
  updateProductStatus,
  listProducts,
  getProductById
} from './src/controllers/productController.js';

console.log('=== RUNNING PRODUCT CONTROLLER UNIT TESTS ===\n');

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

// 1. Validation Tests for createProduct
await runTest('createProduct rejects empty product name with 400', async () => {
  const req = {
    body: { name: '   ', type: 'service', sales_price: 10, cost_price: 5 },
    user: { role: 'ADMIN' }
  };
  const res = createMockRes();
  await createProduct(req, res, () => {});
  assert.strictEqual(res.statusCode, 400);
  assert.strictEqual(res.body.success, false);
  assert.match(res.body.message, /Product name is required/i);
});

await runTest('createProduct rejects invalid product type with 400', async () => {
  const req = {
    body: { name: 'Valid Name', type: 'invalid_type', sales_price: 10, cost_price: 5 },
    user: { role: 'ADMIN' }
  };
  const res = createMockRes();
  await createProduct(req, res, () => {});
  assert.strictEqual(res.statusCode, 400);
  assert.strictEqual(res.body.success, false);
  assert.match(res.body.message, /Invalid product type/i);
});

await runTest('createProduct rejects negative sales_price with 400', async () => {
  const req = {
    body: { name: 'Valid Name', type: 'service', sales_price: -15.5, cost_price: 5 },
    user: { role: 'ADMIN' }
  };
  const res = createMockRes();
  await createProduct(req, res, () => {});
  assert.strictEqual(res.statusCode, 400);
  assert.strictEqual(res.body.success, false);
  assert.match(res.body.message, /non-negative number/i);
});

await runTest('createProduct rejects missing sales_price with 400', async () => {
  const req = {
    body: { name: 'Valid Name', type: 'service', cost_price: 5 },
    user: { role: 'ADMIN' }
  };
  const res = createMockRes();
  await createProduct(req, res, () => {});
  assert.strictEqual(res.statusCode, 400);
  assert.strictEqual(res.body.success, false);
  assert.match(res.body.message, /Sales price is required/i);
});

await runTest('createProduct rejects negative cost_price with 400', async () => {
  const req = {
    body: { name: 'Valid Name', type: 'service', sales_price: 20, cost_price: -2 },
    user: { role: 'ADMIN' }
  };
  const res = createMockRes();
  await createProduct(req, res, () => {});
  assert.strictEqual(res.statusCode, 400);
  assert.strictEqual(res.body.success, false);
  assert.match(res.body.message, /non-negative number/i);
});

await runTest('createProduct rejects missing cost_price with 400', async () => {
  const req = {
    body: { name: 'Valid Name', type: 'service', sales_price: 20 },
    user: { role: 'ADMIN' }
  };
  const res = createMockRes();
  await createProduct(req, res, () => {});
  assert.strictEqual(res.statusCode, 400);
  assert.strictEqual(res.body.success, false);
  assert.match(res.body.message, /Cost price is required/i);
});

await runTest('createProduct rejects non-array variants with 400', async () => {
  const req = {
    body: { name: 'Valid Name', type: 'service', sales_price: 20, cost_price: 10, variants: 'not-an-array' },
    user: { role: 'ADMIN' }
  };
  const res = createMockRes();
  await createProduct(req, res, () => {});
  assert.strictEqual(res.statusCode, 400);
  assert.strictEqual(res.body.success, false);
  assert.match(res.body.message, /Variants must be an array/i);
});

await runTest('createProduct rejects variant with missing variant_name with 400', async () => {
  const req = {
    body: {
      name: 'Valid Name',
      type: 'service',
      sales_price: 20,
      cost_price: 10,
      variants: [{ attribute_name: 'Size', attribute_value: 'Large' }]
    },
    user: { role: 'ADMIN' }
  };
  const res = createMockRes();
  await createProduct(req, res, () => {});
  assert.strictEqual(res.statusCode, 400);
  assert.strictEqual(res.body.success, false);
  assert.match(res.body.message, /variant_name is required/i);
});

await runTest('createProduct rejects variant with negative price_extra with 400', async () => {
  const req = {
    body: {
      name: 'Valid Name',
      type: 'service',
      sales_price: 20,
      cost_price: 10,
      variants: [{ variant_name: 'Custom', attribute_name: 'Size', attribute_value: 'Large', price_extra: -5 }]
    },
    user: { role: 'ADMIN' }
  };
  const res = createMockRes();
  await createProduct(req, res, () => {});
  assert.strictEqual(res.statusCode, 400);
  assert.strictEqual(res.body.success, false);
  assert.match(res.body.message, /price_extra must be a valid non-negative number/i);
});

await runTest('createProduct rejects duplicate SKUs within initial variants list with 409', async () => {
  const req = {
    body: {
      name: 'Valid Name',
      type: 'service',
      sales_price: 20,
      cost_price: 10,
      variants: [
        { variant_name: 'V1', attribute_name: 'Tier', attribute_value: 'Pro', sku: 'DUPLICATE-SKU' },
        { variant_name: 'V2', attribute_name: 'Tier', attribute_value: 'Max', sku: 'DUPLICATE-SKU' }
      ]
    },
    user: { role: 'ADMIN' }
  };
  const res = createMockRes();
  await createProduct(req, res, () => {});
  assert.strictEqual(res.statusCode, 409);
  assert.strictEqual(res.body.success, false);
  assert.match(res.body.message, /Duplicate SKU/i);
});

// 2. Validation Tests for updateProduct & getProductById
await runTest('getProductById rejects non-UUID format with 400', async () => {
  const req = {
    params: { id: 'invalid-not-a-uuid-123' },
    user: { role: 'ADMIN' }
  };
  const res = createMockRes();
  await getProductById(req, res, () => {});
  assert.strictEqual(res.statusCode, 400);
  assert.strictEqual(res.body.success, false);
  assert.match(res.body.message, /Invalid product ID format/i);
});

await runTest('updateProduct rejects non-UUID format with 400', async () => {
  const req = {
    params: { id: '12345' },
    body: { name: 'Updated Name', type: 'goods', sales_price: 10, cost_price: 5 },
    user: { role: 'ADMIN' }
  };
  const res = createMockRes();
  await updateProduct(req, res, () => {});
  assert.strictEqual(res.statusCode, 400);
  assert.strictEqual(res.body.success, false);
  assert.match(res.body.message, /Invalid product ID format/i);
});

await runTest('updateProductStatus rejects non-boolean is_active with 400', async () => {
  // A valid UUID format
  const validUUID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
  const req = {
    params: { id: validUUID },
    body: { is_active: 'not_a_boolean' },
    user: { role: 'ADMIN' },
    userClient: {
      from: () => ({
        select: () => ({
          eq: () => ({
            maybeSingle: () => Promise.resolve({ data: { id: validUUID, name: 'Sample', is_active: true } })
          })
        })
      })
    }
  };
  const res = createMockRes();
  await updateProductStatus(req, res, () => {});
  assert.strictEqual(res.statusCode, 400);
  assert.strictEqual(res.body.success, false);
  assert.match(res.body.message, /must be a boolean/i);
});

// 3. Security Redaction Tests
await runTest('Security Check: Staff users never receive cost_price in listProducts', async () => {
  const sampleProducts = [
    {
      id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      name: 'Cloud Server',
      type: 'service',
      sales_price: '100.00',
      cost_price: '40.00',
      is_active: true,
      product_variants: [{ id: 'v1' }, { id: 'v2' }]
    }
  ];

  const req = {
    query: { page: '1', limit: '10' },
    user: { role: 'STAFF' },
    userClient: {
      from: () => ({
        select: () => ({
          order: () => ({
            range: () => Promise.resolve({ data: sampleProducts, count: 1, error: null })
          })
        })
      })
    }
  };

  const res = createMockRes();
  await listProducts(req, res, () => {});

  assert.strictEqual(res.statusCode, 200);
  const returnedProduct = res.body.products[0];
  assert.strictEqual(returnedProduct.cost_price, undefined, 'cost_price must NOT be accessible to STAFF');
  assert.strictEqual(returnedProduct.sales_price, 100);
  assert.strictEqual(returnedProduct.variant_count, 2);
});

await runTest('Security Check: Admin users receive full cost_price in listProducts', async () => {
  const sampleProducts = [
    {
      id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      name: 'Cloud Server',
      type: 'service',
      sales_price: '100.00',
      cost_price: '40.00',
      is_active: true,
      product_variants: []
    }
  ];

  const req = {
    query: { page: '1', limit: '10' },
    user: { role: 'ADMIN' },
    userClient: {
      from: () => ({
        select: () => ({
          order: () => ({
            range: () => Promise.resolve({ data: sampleProducts, count: 1, error: null })
          })
        })
      })
    }
  };

  const res = createMockRes();
  await listProducts(req, res, () => {});

  assert.strictEqual(res.statusCode, 200);
  const returnedProduct = res.body.products[0];
  assert.strictEqual(returnedProduct.cost_price, 40, 'cost_price must be accessible to ADMIN');
  assert.strictEqual(returnedProduct.sales_price, 100);
  assert.strictEqual(returnedProduct.variant_count, 0);
});

console.log(`\n=== SUMMARY: ${passed}/${total} TESTS PASSED ===\n`);
if (passed === total) {
  process.exit(0);
} else {
  process.exit(1);
}

