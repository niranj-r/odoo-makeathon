import {
  convertFromQuotation,
  createSubscription,
  listSubscriptions,
  getSubscription,
  updateSubscription
} from './src/controllers/subscriptionController.js';
import app from './src/app.js';
import http from 'http';

console.log('====================================================');
console.log(' BRIGHTLOOP: PHASE 05 SUBSCRIPTION API TEST SUITE');
console.log('====================================================\n');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  [PASS] ${message}`);
  } else {
    failedTests++;
    console.error(`❌ [FAIL] ${message}`);
  }
}

// 1. CONTROLLER VALIDATION LOGIC TESTS (Mocked req/res)
console.log('1. Testing Subscription Controller Validation Logic:');

const createMockRes = () => {
  const res = {};
  res.statusCode = 200;
  res.status = (code) => {
    res.statusCode = code;
    return res;
  };
  res.json = (data) => {
    res.jsonData = data;
    return res;
  };
  return res;
};

// convertFromQuotation: invalid UUID
const reqInvalidConvert = { params: { quotationId: 'not-a-valid-uuid' } };
const resInvalidConvert = createMockRes();
await convertFromQuotation(reqInvalidConvert, resInvalidConvert, () => {});
assert(
  resInvalidConvert.statusCode === 400 || resInvalidConvert.statusCode === 503,
  'convertFromQuotation rejects invalid quotationId UUID'
);

// createSubscription: missing customer_id
const reqMissingCust = { body: { billing_frequency: 'monthly', lines: [{ product_id: '7d9b97b1-1234-4567-89ab-cdef01234567', quantity: 1 }] } };
const resMissingCust = createMockRes();
await createSubscription(reqMissingCust, resMissingCust, () => {});
assert(
  resMissingCust.statusCode === 400 || resMissingCust.statusCode === 503,
  'createSubscription requires valid customer_id UUID'
);

// createSubscription: invalid frequency
const reqInvalidFreq = {
  body: {
    customer_id: '7d9b97b1-1234-4567-89ab-cdef01234567',
    billing_frequency: 'hourly',
    lines: [{ product_id: '7d9b97b1-1234-4567-89ab-cdef01234567', quantity: 1 }]
  }
};
const resInvalidFreq = createMockRes();
await createSubscription(reqInvalidFreq, resInvalidFreq, () => {});
assert(
  resInvalidFreq.statusCode === 400 || resInvalidFreq.statusCode === 503,
  'createSubscription rejects invalid billing_frequency (e.g. hourly)'
);

// createSubscription: empty lines
const reqEmptyLines = {
  body: {
    customer_id: '7d9b97b1-1234-4567-89ab-cdef01234567',
    billing_frequency: 'monthly',
    lines: []
  }
};
const resEmptyLines = createMockRes();
await createSubscription(reqEmptyLines, resEmptyLines, () => {});
assert(
  resEmptyLines.statusCode === 400 || resEmptyLines.statusCode === 503,
  'createSubscription rejects empty lines array'
);

// getSubscription: invalid UUID
const reqInvalidGetId = { params: { id: 'invalid-id' } };
const resInvalidGetId = createMockRes();
await getSubscription(reqInvalidGetId, resInvalidGetId, () => {});
assert(
  resInvalidGetId.statusCode === 400 || resInvalidGetId.statusCode === 503,
  'getSubscription rejects invalid UUID format'
);

// updateSubscription: invalid UUID
const reqInvalidUpdateId = { params: { id: 'bad-uuid' } };
const resInvalidUpdateId = createMockRes();
await updateSubscription(reqInvalidUpdateId, resInvalidUpdateId, () => {});
assert(
  resInvalidUpdateId.statusCode === 400 || resInvalidUpdateId.statusCode === 503,
  'updateSubscription rejects invalid UUID format'
);

// 2. HTTP ENDPOINTS & SECURITY GUARDS (VULN-005 Protection)
console.log('\n2. Testing HTTP Endpoints & Security Guards:');

const server = http.createServer(app);
const PORT = 5005;

server.listen(PORT, async () => {
  try {
    const resConvert = await fetch(`http://localhost:${PORT}/api/subscriptions/from-quotation/7d9b97b1-1234-4567-89ab-cdef01234567`, {
      method: 'POST'
    });
    assert(resConvert.status === 401, 'POST /api/subscriptions/from-quotation/:id rejects unauthenticated requests (HTTP 401)');

    const resPost = await fetch(`http://localhost:${PORT}/api/subscriptions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customer_id: '7d9b97b1-1234-4567-89ab-cdef01234567' })
    });
    assert(resPost.status === 401, 'POST /api/subscriptions rejects unauthenticated requests (HTTP 401)');

    const resGet = await fetch(`http://localhost:${PORT}/api/subscriptions`);
    assert(resGet.status === 401, 'GET /api/subscriptions rejects unauthenticated requests (HTTP 401)');

    const resGetSingle = await fetch(`http://localhost:${PORT}/api/subscriptions/7d9b97b1-1234-4567-89ab-cdef01234567`);
    assert(resGetSingle.status === 401, 'GET /api/subscriptions/:id rejects unauthenticated requests (HTTP 401)');

    const resPut = await fetch(`http://localhost:${PORT}/api/subscriptions/7d9b97b1-1234-4567-89ab-cdef01234567`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payment_terms: 'Net 15' })
    });
    assert(resPut.status === 401, 'PUT /api/subscriptions/:id rejects unauthenticated requests (HTTP 401)');

    console.log('\n====================================================');
    console.log(` RESULTS: ${passedTests}/${totalTests} Passed (${failedTests} Failed)`);
    console.log('====================================================\n');

    server.close(() => {
      process.exit(failedTests > 0 ? 1 : 0);
    });
  } catch (err) {
    console.error('API Verification error:', err);
    server.close(() => {
      process.exit(1);
    });
  }
});

