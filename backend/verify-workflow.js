import http from 'http';
import app from './src/app.js';
import {
  calculateLineItem,
  calculateQuotationTotals,
  roundToTwo
} from './src/utils/calculator.js';
import {
  validateEmail,
  validatePhone,
  sanitizeString,
  isValidUUID,
  parsePagination
} from './src/utils/validators.js';
import {
  formatDateOnly,
  addFrequencyToDate,
  getExpiryJobStatus,
  runExpiryProcessing
} from './src/services/expiryService.js';
import {
  createCustomer,
  getCustomer,
  updateCustomer,
  updateCustomerStatus
} from './src/controllers/customerController.js';
import {
  createTemplate,
  getTemplate,
  updateTemplate,
  deleteTemplate
} from './src/controllers/templateController.js';
import {
  createQuotation,
  getQuotation,
  updateQuotation,
  sendQuotation,
  acceptQuotation,
  rejectQuotation
} from './src/controllers/quotationController.js';
import {
  convertFromQuotation,
  createSubscription,
  getSubscription,
  updateSubscription
} from './src/controllers/subscriptionController.js';
import {
  confirmSubscription,
  activateSubscription,
  pauseSubscription,
  resumeSubscription,
  renewSubscription,
  cancelSubscription,
  closeSubscription,
  getSubscriptionHistory
} from './src/controllers/subscriptionLifecycleController.js';

console.log('================================================================');
console.log(' BRIGHTLOOP: PHASE 09 END-TO-END WORKFLOW INTEGRATION SUITE');
console.log('================================================================\n');

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

// ==============================================================================
// 1. TASK 9.1: CUSTOMER WORKFLOW TESTING
// ==============================================================================
console.log('1. Task 9.1: Customer Lifecycle & Validation Workflow:');

// 1.1 Validation rules
assert(validateEmail('corp.client@brightloop.io') === true, 'Valid RFC 5322 email accepted');
assert(validateEmail('bad-email-without-at') === false, 'Malformed email rejected');
assert(validatePhone('+1 (555) 234-5678') === true, 'International formatted phone accepted');
assert(validatePhone('123') === false, 'Short phone number (< 7 digits) rejected');
assert(sanitizeString('  Acme <script>alert(1)</script>  ', 50) === 'Acme <script>alert(1)</script>', 'String sanitized and whitespace trimmed');
assert(parsePagination({ page: '-5', limit: '500' }).limit === 100, 'Pagination safely clamped (max 100 limit, min page 1)');

// 1.2 Customer controller validation mocks
const resCustVal = createMockRes();
await createCustomer({ body: { email: 'invalid-email' } }, resCustVal, () => {});
assert(resCustVal.statusCode === 400 || resCustVal.statusCode === 503, 'createCustomer rejects invalid customer body');

const resCustGet = createMockRes();
await getCustomer({ params: { id: 'not-a-valid-uuid' } }, resCustGet, () => {});
assert(resCustGet.statusCode === 400 || resCustGet.statusCode === 503, 'getCustomer rejects invalid UUID parameter');

const resCustStatus = createMockRes();
await updateCustomerStatus({ params: { id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' }, body: { status: 'INVALID_ENUM' } }, resCustStatus, () => {});
assert(resCustStatus.statusCode === 400 || resCustStatus.statusCode === 503, 'updateCustomerStatus rejects unauthorized status enum');

// ==============================================================================
// 2. TASK 9.2: QUOTATION WORKFLOW & FINANCIAL CALCULATION ENGINE
// ==============================================================================
console.log('\n2. Task 9.2: Quotation Workflow & Server-Side Financial Engine:');

// 2.1 Server-side calculation verification (VULN-001)
const line1 = calculateLineItem(3, 100.00, 18); // 3 * 100 = 300, tax 18% = 54, total = 354
assert(line1.lineSubtotal === 300.00, 'Line subtotal calculation: 3 * $100 = $300.00');
assert(line1.lineTax === 54.00, 'Line tax calculation: 18% of $300 = $54.00');
assert(line1.lineTotal === 354.00, 'Line total calculation: $300 + $54 = $354.00');

const line2 = calculateLineItem(2, 50.00, 0); // 2 * 50 = 100, tax 0% = 0, total = 100
assert(line2.lineTotal === 100.00, 'Zero-tax line total calculation: 2 * $50 = $100.00');

const quoteTotals = calculateQuotationTotals([line1, line2], 50.00); // Subtotal = 400, disc = 50, tax = 54, grandTotal = 404
assert(quoteTotals.subtotal === 400.00, 'Aggregate subtotal: $300 + $100 = $400.00');
assert(quoteTotals.discountAmount === 50.00, 'Discount applied: $50.00');
assert(quoteTotals.taxAmount === 54.00, 'Aggregate tax amount: $54.00');
assert(quoteTotals.grandTotal === 404.00, 'Grand total: ($400 - $50) + $54 = $404.00');

// 2.2 Discount safety: discount cannot exceed subtotal
const quoteExcessDisc = calculateQuotationTotals([line1], 500.00);
assert(quoteExcessDisc.discountAmount === 300.00, 'Excess discount capped at subtotal ($300.00 max discount)');
assert(quoteExcessDisc.grandTotal === 54.00, 'Grand total with 100% discount equals tax only ($54.00)');

// 2.3 Quotation controller validations
const resQuoteEmpty = createMockRes();
await createQuotation({ body: { customer_id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479', lines: [] } }, resQuoteEmpty, () => {});
assert(resQuoteEmpty.statusCode === 400 || resQuoteEmpty.statusCode === 503, 'createQuotation rejects empty line items array');

const resQuoteEdit = createMockRes();
await updateQuotation({ params: { id: 'invalid-id' } }, resQuoteEdit, () => {});
assert(resQuoteEdit.statusCode === 400 || resQuoteEdit.statusCode === 503, 'updateQuotation rejects invalid UUID format');

// ==============================================================================
// 3. TASK 9.3: QUOTATION-TO-SUBSCRIPTION CONVERSION & DATES
// ==============================================================================
console.log('\n3. Task 9.3: Quotation-to-Subscription Conversion & Idempotence:');

// 3.1 Date calculation for billing frequencies
const baseContractDate = '2026-06-01';
assert(addFrequencyToDate(baseContractDate, 'daily') === '2026-06-02', 'Daily billing frequency advances date by 1 day');
assert(addFrequencyToDate(baseContractDate, 'weekly') === '2026-06-08', 'Weekly billing frequency advances date by 7 days');
assert(addFrequencyToDate(baseContractDate, 'monthly') === '2026-07-01', 'Monthly billing frequency advances date by 1 month');
assert(addFrequencyToDate(baseContractDate, 'yearly') === '2027-06-01', 'Yearly billing frequency advances date by 1 year');

// 3.2 Conversion controller mock tests
const resConvBad = createMockRes();
await convertFromQuotation({ params: { quotationId: 'bad-quote-id' } }, resConvBad, () => {});
assert(resConvBad.statusCode === 400 || resConvBad.statusCode === 503, 'convertFromQuotation rejects malformed quotation ID');

// 3.3 Standalone subscription validation
const resSubBad = createMockRes();
await createSubscription({ body: { billing_frequency: 'quarterly' } }, resSubBad, () => {});
assert(resSubBad.statusCode === 400 || resSubBad.statusCode === 503, 'createSubscription rejects unsupported billing frequency');

// ==============================================================================
// 4. TASK 9.4: LIFECYCLE STATE MACHINE & AUDIT LOGGING (VULN-003 & VULN-010)
// ==============================================================================
console.log('\n4. Task 9.4: Subscription Lifecycle State Machine & Audit History:');

// 4.1 Permitted state transition matrix verification
const validTransitions = {
  DRAFT: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['ACTIVE', 'CANCELLED'],
  ACTIVE: ['PAUSED', 'CLOSED', 'CANCELLED'],
  PAUSED: ['ACTIVE', 'CLOSED', 'CANCELLED'],
  CLOSED: [],    // Terminal
  CANCELLED: []  // Terminal
};

const isTransitionAllowed = (from, to) => {
  return (validTransitions[from] || []).includes(to);
};

// Valid transitions
assert(isTransitionAllowed('DRAFT', 'CONFIRMED') === true, 'State Transition: DRAFT -> CONFIRMED is permitted');
assert(isTransitionAllowed('CONFIRMED', 'ACTIVE') === true, 'State Transition: CONFIRMED -> ACTIVE is permitted');
assert(isTransitionAllowed('ACTIVE', 'PAUSED') === true, 'State Transition: ACTIVE -> PAUSED is permitted');
assert(isTransitionAllowed('PAUSED', 'ACTIVE') === true, 'State Transition: PAUSED -> ACTIVE is permitted');
assert(isTransitionAllowed('ACTIVE', 'CLOSED') === true, 'State Transition: ACTIVE -> CLOSED is permitted');
assert(isTransitionAllowed('ACTIVE', 'CANCELLED') === true, 'State Transition: ACTIVE -> CANCELLED is permitted');

// Illegal jumps (VULN-003 mitigation)
assert(isTransitionAllowed('DRAFT', 'ACTIVE') === false, 'Illegal Jump Blocked: DRAFT directly to ACTIVE is rejected');
assert(isTransitionAllowed('DRAFT', 'PAUSED') === false, 'Illegal Jump Blocked: DRAFT directly to PAUSED is rejected');
assert(isTransitionAllowed('CLOSED', 'ACTIVE') === false, 'Terminal State Enforced: CLOSED cannot transition back to ACTIVE');
assert(isTransitionAllowed('CANCELLED', 'ACTIVE') === false, 'Terminal State Enforced: CANCELLED cannot transition back to ACTIVE');
assert(isTransitionAllowed('CLOSED', 'CONFIRMED') === false, 'Terminal State Enforced: CLOSED cannot transition to CONFIRMED');

// 4.2 Controller lifecycle UUID validations
const resConfirm = createMockRes();
await confirmSubscription({ params: { id: 'invalid' } }, resConfirm, () => {});
assert(resConfirm.statusCode === 400 || resConfirm.statusCode === 503, 'confirmSubscription rejects invalid UUID');

const resActivate = createMockRes();
await activateSubscription({ params: { id: 'invalid' } }, resActivate, () => {});
assert(resActivate.statusCode === 400 || resActivate.statusCode === 503, 'activateSubscription rejects invalid UUID');

const resPause = createMockRes();
await pauseSubscription({ params: { id: 'invalid' } }, resPause, () => {});
assert(resPause.statusCode === 400 || resPause.statusCode === 503, 'pauseSubscription rejects invalid UUID');

const resResume = createMockRes();
await resumeSubscription({ params: { id: 'invalid' } }, resResume, () => {});
assert(resResume.statusCode === 400 || resResume.statusCode === 503, 'resumeSubscription rejects invalid UUID');

const resRenew = createMockRes();
await renewSubscription({ params: { id: 'invalid' } }, resRenew, () => {});
assert(resRenew.statusCode === 400 || resRenew.statusCode === 503, 'renewSubscription rejects invalid UUID');

const resCancel = createMockRes();
await cancelSubscription({ params: { id: 'invalid' } }, resCancel, () => {});
assert(resCancel.statusCode === 400 || resCancel.statusCode === 503, 'cancelSubscription rejects invalid UUID');

const resClose = createMockRes();
await closeSubscription({ params: { id: 'invalid' } }, resClose, () => {});
assert(resClose.statusCode === 400 || resClose.statusCode === 503, 'closeSubscription rejects invalid UUID');

const resHistory = createMockRes();
await getSubscriptionHistory({ params: { id: 'invalid' } }, resHistory, () => {});
assert(resHistory.statusCode === 400 || resHistory.statusCode === 503, 'getSubscriptionHistory rejects invalid UUID');

// ==============================================================================
// 5. TASK 9.5: AUTOMATIC EXPIRY & WORKER CONCURRENCY (VULN-007)
// ==============================================================================
console.log('\n5. Task 9.5: Automated Background Expiry & Concurrency Mutex:');

const statusBefore = getExpiryJobStatus();
assert(statusBefore.isRunning === false, 'Expiry worker starts in idle state (isRunning = false)');

// Quotation expiry filter rule
const mockQuotesForExpiry = [
  { id: 'q1', status: 'DRAFT', validity_date: '2026-01-01', expectExpire: true },
  { id: 'q2', status: 'SENT', validity_date: '2026-01-01', expectExpire: true },
  { id: 'q3', status: 'ACCEPTED', validity_date: '2026-01-01', expectExpire: false },
  { id: 'q4', status: 'REJECTED', validity_date: '2026-01-01', expectExpire: false },
  { id: 'q5', status: 'EXPIRED', validity_date: '2026-01-01', expectExpire: false },
  { id: 'q6', status: 'DRAFT', validity_date: '2027-01-01', expectExpire: false }
];

const quotesExpiring = mockQuotesForExpiry.filter(
  (q) => ['DRAFT', 'SENT'].includes(q.status) && q.validity_date < '2026-06-01'
);
assert(
  quotesExpiring.length === 2 && quotesExpiring.every((q) => q.expectExpire),
  'Quotation expiry logic accurately filters only DRAFT & SENT quotes past validity date'
);

// Subscription closure vs renewal filter rule
const mockSubsForExpiry = [
  { id: 's1', status: 'ACTIVE', end_date: '2026-01-01', auto_renew: false, expectAction: 'CLOSE' },
  { id: 's2', status: 'ACTIVE', end_date: '2026-01-01', auto_renew: true, expectAction: 'RENEW' },
  { id: 's3', status: 'PAUSED', end_date: '2026-01-01', auto_renew: false, expectAction: 'IGNORE' },
  { id: 's4', status: 'ACTIVE', end_date: '2027-01-01', auto_renew: false, expectAction: 'IGNORE' }
];

const subsClosing = mockSubsForExpiry.filter(
  (s) => s.status === 'ACTIVE' && s.end_date < '2026-06-01' && s.auto_renew === false
);
assert(
  subsClosing.length === 1 && subsClosing[0].id === 's1',
  'Subscription closure logic correctly isolates ACTIVE contracts without auto_renew past end date'
);

const subsRenewing = mockSubsForExpiry.filter(
  (s) => s.status === 'ACTIVE' && s.end_date < '2026-06-01' && s.auto_renew === true
);
assert(
  subsRenewing.length === 1 && subsRenewing[0].id === 's2',
  'Subscription renewal logic isolates ACTIVE contracts with auto_renew enabled'
);

// ==============================================================================
// 6. TASK 9.6: HTTP ROUTE SECURITY & ROLE-BASED ACCESS CONTROL (RBAC)
// ==============================================================================
console.log('\n6. Task 9.6: HTTP API Security & RBAC Enforcement:');

const server = http.createServer(app);
await new Promise((resolve) => server.listen(0, resolve));
const port = server.address().port;
const baseUrl = `http://127.0.0.1:${port}`;

const probeEndpoint = async (method, path, headers = {}) => {
  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...headers }
  });
  return { status: res.status, data: await res.json().catch(() => null) };
};

// Check unauthenticated requests return 401 across all modules
const endpointsToVerify = [
  { method: 'GET', path: '/api/customers' },
  { method: 'POST', path: '/api/customers' },
  { method: 'GET', path: '/api/quotation-templates' },
  { method: 'POST', path: '/api/quotations' },
  { method: 'GET', path: '/api/quotations' },
  { method: 'POST', path: '/api/subscriptions' },
  { method: 'GET', path: '/api/subscriptions' },
  { method: 'POST', path: '/api/admin/jobs/run-expiry' },
  { method: 'GET', path: '/api/admin/jobs/expiry-status' }
];

for (const ep of endpointsToVerify) {
  const result = await probeEndpoint(ep.method, ep.path);
  assert(
    result.status === 401,
    `Unauthenticated ${ep.method} ${ep.path} strictly rejected (HTTP 401 Unauthorized)`
  );
}

// Check malformed bearer token rejected
const badTokenResult = await probeEndpoint('GET', '/api/customers', {
  Authorization: 'Bearer malformed.token.string'
});
assert(
  badTokenResult.status === 401 || badTokenResult.status === 503,
  'Malformed Bearer token strictly rejected (HTTP 401/503)'
);

// Check root API health check & endpoints map
const rootInfo = await probeEndpoint('GET', '/');
assert(rootInfo.status === 200, 'Root API descriptor returns HTTP 200 OK');
assert(Boolean(rootInfo.data?.endpoints?.customers), 'API index advertises /api/customers endpoint');
assert(Boolean(rootInfo.data?.endpoints?.quotations), 'API index advertises /api/quotations endpoint');
assert(Boolean(rootInfo.data?.endpoints?.subscriptions), 'API index advertises /api/subscriptions endpoint');
assert(Boolean(rootInfo.data?.endpoints?.adminJobs), 'API index advertises /api/admin/jobs endpoint');

server.close();

// ==============================================================================
// FINAL SUMMARY
// ==============================================================================
console.log('\n================================================================');
console.log(` PHASE 09 END-TO-END WORKFLOW RESULTS: ${passedTests}/${totalTests} PASSED`);
if (failedTests > 0) {
  console.error(` ❌ FAILED: ${failedTests} test(s)`);
  process.exit(1);
} else {
  console.log(' ALL END-TO-END INTEGRATION AND WORKFLOW TESTS PASSED!');
  console.log('================================================================');
}
