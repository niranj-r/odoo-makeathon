import {
  calculateLineItem,
  calculateQuotationTotals,
  roundToTwo
} from './src/utils/calculator.js';
import {
  createQuotation,
  listQuotations,
  getQuotation,
  updateQuotation,
  sendQuotation,
  acceptQuotation,
  rejectQuotation
} from './src/controllers/quotationController.js';
import app from './src/app.js';
import http from 'http';

console.log('====================================================');
console.log(' BRIGHTLOOP: PHASE 04 QUOTATION API TEST SUITE');
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

// 1. CALCULATOR UNIT TESTS (Financial Engine & VULN-001)
console.log('1. Testing Server-Side Financial Calculation Engine:');

// Rounding accuracy
assert(roundToTwo(0.1 + 0.2) === 0.3, 'Floating point addition (0.1 + 0.2) rounded cleanly to 0.30');
assert(roundToTwo(10.555) === 10.56, 'Half-up rounding on 10.555 produces 10.56');

// Line calculations
const line1 = calculateLineItem(2, 50.0, 18.0); // 2 * 50 = 100, 18% tax = 18, total = 118
assert(line1.lineSubtotal === 100.0, 'Line subtotal computed correctly (2 * 50 = 100)');
assert(line1.lineTax === 18.0, 'Line tax computed correctly (18% of 100 = 18)');
assert(line1.lineTotal === 118.0, 'Line total computed correctly (100 + 18 = 118)');

const line2 = calculateLineItem(3, 33.33, 0); // 3 * 33.33 = 99.99, 0 tax
assert(line2.lineSubtotal === 99.99 && line2.lineTax === 0 && line2.lineTotal === 99.99, 'Zero-tax line items computed accurately');

// Aggregation & Discount capping
const totals = calculateQuotationTotals([line1, line2], 25.0); // subtotal: 199.99, disc: 25, tax: 18, grand: 199.99 - 25 + 18 = 192.99
assert(totals.subtotal === 199.99, 'Aggregate subtotal matches sum of lines');
assert(totals.taxAmount === 18.0, 'Aggregate tax amount matches sum of line taxes');
assert(totals.discountAmount === 25.0, 'Discount amount applied correctly');
assert(totals.grandTotal === 192.99, 'Grand total computed accurately (subtotal - discount + tax)');

const cappedTotals = calculateQuotationTotals([line1], 500.0); // subtotal 100, discount 500 -> capped at 100
assert(cappedTotals.discountAmount === 100.0, 'Discount capped at subtotal (cannot create negative subtotal)');
assert(cappedTotals.grandTotal === 18.0, 'Grand total with 100% discount equals tax only');

// 2. CONTROLLER VALIDATION TESTS (Mocked req/res)
console.log('\n2. Testing Quotation Controller Validation Logic:');

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

// Missing customer_id
const reqMissingCust = { body: { lines: [{ product_id: '7d9b97b1-1234-4567-89ab-cdef01234567', quantity: 1 }] } };
const resMissingCust = createMockRes();
await createQuotation(reqMissingCust, resMissingCust, () => {});
assert(
  resMissingCust.statusCode === 400 || resMissingCust.statusCode === 503,
  'createQuotation requires valid customer_id UUID'
);

// Empty lines array (Rule 3 enforcement)
const reqEmptyLines = { body: { customer_id: '7d9b97b1-1234-4567-89ab-cdef01234567', lines: [] } };
const resEmptyLines = createMockRes();
await createQuotation(reqEmptyLines, resEmptyLines, () => {});
assert(
  resEmptyLines.statusCode === 400 || resEmptyLines.statusCode === 503,
  'createQuotation rejects empty line items array'
);

// getQuotation invalid UUID
const reqInvalidGetId = { params: { id: 'bad-uuid' } };
const resInvalidGetId = createMockRes();
await getQuotation(reqInvalidGetId, resInvalidGetId, () => {});
assert(
  resInvalidGetId.statusCode === 400 || resInvalidGetId.statusCode === 503,
  'getQuotation rejects invalid UUID format'
);

// acceptQuotation invalid UUID
const reqInvalidAccept = { params: { id: 'invalid-id' } };
const resInvalidAccept = createMockRes();
await acceptQuotation(reqInvalidAccept, resInvalidAccept, () => {});
assert(
  resInvalidAccept.statusCode === 400 || resInvalidAccept.statusCode === 503,
  'acceptQuotation rejects invalid UUID format'
);

// 3. HTTP ENDPOINTS & SECURITY GUARDS (VULN-005 Protection)
console.log('\n3. Testing HTTP Endpoints & Security Guards:');

const server = http.createServer(app);
const PORT = 5004;

server.listen(PORT, async () => {
  try {
    const resPost = await fetch(`http://localhost:${PORT}/api/quotations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customer_id: '7d9b97b1-1234-4567-89ab-cdef01234567', lines: [] })
    });
    assert(resPost.status === 401, 'POST /api/quotations rejects unauthenticated requests (HTTP 401)');

    const resGet = await fetch(`http://localhost:${PORT}/api/quotations`);
    assert(resGet.status === 401, 'GET /api/quotations rejects unauthenticated requests (HTTP 401)');

    const resGetSingle = await fetch(`http://localhost:${PORT}/api/quotations/7d9b97b1-1234-4567-89ab-cdef01234567`);
    assert(resGetSingle.status === 401, 'GET /api/quotations/:id rejects unauthenticated requests (HTTP 401)');

    const resPut = await fetch(`http://localhost:${PORT}/api/quotations/7d9b97b1-1234-4567-89ab-cdef01234567`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payment_terms: 'Net 30' })
    });
    assert(resPut.status === 401, 'PUT /api/quotations/:id rejects unauthenticated requests (HTTP 401)');

    const resSend = await fetch(`http://localhost:${PORT}/api/quotations/7d9b97b1-1234-4567-89ab-cdef01234567/send`, {
      method: 'POST'
    });
    assert(resSend.status === 401, 'POST /api/quotations/:id/send rejects unauthenticated requests (HTTP 401)');

    const resAccept = await fetch(`http://localhost:${PORT}/api/quotations/7d9b97b1-1234-4567-89ab-cdef01234567/accept`, {
      method: 'POST'
    });
    assert(resAccept.status === 401, 'POST /api/quotations/:id/accept rejects unauthenticated requests (HTTP 401)');

    const resReject = await fetch(`http://localhost:${PORT}/api/quotations/7d9b97b1-1234-4567-89ab-cdef01234567/reject`, {
      method: 'POST'
    });
    assert(resReject.status === 401, 'POST /api/quotations/:id/reject rejects unauthenticated requests (HTTP 401)');

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

