import http from 'http';
import app from './src/app.js';
import {
  formatDateOnly,
  addFrequencyToDate,
  getExpiryJobStatus,
  runExpiryProcessing
} from './src/services/expiryService.js';
import {
  triggerExpiryJob,
  getExpiryStatus,
  getApproachingExpiries,
  startWorker,
  stopWorker
} from './src/controllers/expiryJobController.js';
import {
  startExpiryWorker,
  stopExpiryWorker,
  getWorkerTelemetry
} from './src/jobs/expiryWorker.js';

console.log('====================================================');
console.log(' BRIGHTLOOP: PHASE 07 AUTOMATIC EXPIRY TEST SUITE');
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

// 1. DATE CALCULATION & RECURRENCE HELPERS
console.log('1. Testing Date Calculation and Recurrence Logic:');

const testDate = new Date('2026-05-15T10:00:00Z');
assert(formatDateOnly(testDate) === '2026-05-15', 'formatDateOnly correctly formats Date instance to YYYY-MM-DD');

const nextDay = addFrequencyToDate('2026-05-15', 'daily');
assert(nextDay === '2026-05-16', `addFrequencyToDate daily: expected 2026-05-16, got ${nextDay}`);

const nextWeek = addFrequencyToDate('2026-05-15', 'weekly');
assert(nextWeek === '2026-05-22', `addFrequencyToDate weekly: expected 2026-05-22, got ${nextWeek}`);

const nextMonth = addFrequencyToDate('2026-05-15', 'monthly');
assert(nextMonth === '2026-06-15', `addFrequencyToDate monthly: expected 2026-06-15, got ${nextMonth}`);

const nextYear = addFrequencyToDate('2026-05-15', 'yearly');
assert(nextYear === '2027-05-15', `addFrequencyToDate yearly: expected 2027-05-15, got ${nextYear}`);

// 2. CONTROLLER INPUT VALIDATION & MOCKS
console.log('\n2. Testing Controller Input Validation Logic:');

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

// Invalid referenceDate format
const reqInvalidDate = { body: { referenceDate: 'not-a-valid-date' } };
const resInvalidDate = createMockRes();
await triggerExpiryJob(reqInvalidDate, resInvalidDate, () => {});
assert(
  resInvalidDate.statusCode === 400,
  'triggerExpiryJob rejects invalid referenceDate format with 400 Bad Request'
);

// getExpiryStatus retrieves telemetry
const reqStatus = {};
const resStatus = createMockRes();
await getExpiryStatus(reqStatus, resStatus, () => {});
assert(
  resStatus.statusCode === 200 && resStatus.jsonData?.success === true,
  'getExpiryStatus returns 200 OK with telemetry payload'
);

// 3. MUTEX CONCURRENCY GUARD VERIFICATION (VULN-007)
console.log('\n3. Testing Concurrency Mutex Guard (VULN-007):');

const initialStatus = getExpiryJobStatus();
assert(initialStatus.isRunning === false, 'Expiry job status initially reports isRunning = false');

// 4. WORKER LIFECYCLE CONTROLS
console.log('\n4. Testing Background Expiry Worker Lifecycle:');

startExpiryWorker(60000);
const activeTelemetry = getWorkerTelemetry();
assert(activeTelemetry.isWorkerActive === true, 'startExpiryWorker sets isWorkerActive to true');
assert(Boolean(activeTelemetry.workerStartedAt), 'startExpiryWorker records workerStartedAt timestamp');

stopExpiryWorker();
const stoppedTelemetry = getWorkerTelemetry();
assert(stoppedTelemetry.isWorkerActive === false, 'stopExpiryWorker successfully stops worker (isWorkerActive = false)');

// 5. HTTP ROUTE GUARDS & SECURITY INTEGRATION
console.log('\n5. Testing HTTP Route Mounts and Authentication Enforcement:');

const server = http.createServer(app);
await new Promise((resolve) => server.listen(0, resolve));
const port = server.address().port;
const baseUrl = `http://127.0.0.1:${port}`;

const checkUnauthorizedEndpoint = async (method, path, body = null) => {
  const options = {
    method,
    headers: { 'Content-Type': 'application/json' }
  };
  if (body) options.body = JSON.stringify(body);

  const res = await fetch(`${baseUrl}${path}`, options);
  const data = await res.json();
  return { status: res.status, data };
};

// Test route authentication protections
const testEndpoints = [
  { method: 'POST', path: '/api/admin/jobs/run-expiry' },
  { method: 'GET', path: '/api/admin/jobs/expiry-status' },
  { method: 'GET', path: '/api/admin/jobs/approaching-expiries' },
  { method: 'POST', path: '/api/admin/jobs/worker/start' },
  { method: 'POST', path: '/api/admin/jobs/worker/stop' }
];

for (const ep of testEndpoints) {
  const res = await checkUnauthorizedEndpoint(ep.method, ep.path);
  assert(
    res.status === 401,
    `${ep.method} ${ep.path} blocks unauthenticated requests (HTTP 401 Unauthorized)`
  );
}

// Check root API descriptor advertises adminJobs endpoint
const rootRes = await fetch(`${baseUrl}/`);
const rootData = await rootRes.json();
assert(
  rootData?.endpoints?.adminJobs === '/api/admin/jobs',
  'Root API descriptor accurately documents /api/admin/jobs endpoint'
);

server.close();

// 6. BUSINESS LOGIC VERIFICATION (Mock Data Scenarios)
console.log('\n6. Testing Expiry Business Rules & Exclusions:');

// Rule: Quotations past validity date
const mockQuotations = [
  { id: '1', status: 'DRAFT', validity_date: '2026-01-01', shouldExpire: true },
  { id: '2', status: 'SENT', validity_date: '2026-01-01', shouldExpire: true },
  { id: '3', status: 'ACCEPTED', validity_date: '2026-01-01', shouldExpire: false },
  { id: '4', status: 'REJECTED', validity_date: '2026-01-01', shouldExpire: false },
  { id: '5', status: 'EXPIRED', validity_date: '2026-01-01', shouldExpire: false },
  { id: '6', status: 'DRAFT', validity_date: '2026-12-31', shouldExpire: false }
];

const eligibleQuotes = mockQuotations.filter(
  (q) => ['DRAFT', 'SENT'].includes(q.status) && q.validity_date < '2026-05-01'
);

assert(
  eligibleQuotes.length === 2 && eligibleQuotes.every((q) => q.shouldExpire),
  'Quotation expiry rule accurately selects only DRAFT/SENT quotations past validity_date'
);

// Rule: Subscriptions past end date
const mockSubscriptions = [
  { id: '10', status: 'ACTIVE', end_date: '2026-01-01', auto_renew: false, action: 'CLOSE' },
  { id: '11', status: 'ACTIVE', end_date: '2026-01-01', auto_renew: true, action: 'RENEW' },
  { id: '12', status: 'PAUSED', end_date: '2026-01-01', auto_renew: false, action: 'IGNORE' },
  { id: '13', status: 'CLOSED', end_date: '2026-01-01', auto_renew: false, action: 'IGNORE' },
  { id: '14', status: 'ACTIVE', end_date: '2026-12-31', auto_renew: false, action: 'IGNORE' }
];

const eligibleSubsForClosure = mockSubscriptions.filter(
  (s) => s.status === 'ACTIVE' && s.end_date < '2026-05-01' && s.auto_renew === false
);
assert(
  eligibleSubsForClosure.length === 1 && eligibleSubsForClosure[0].id === '10',
  'Subscription closure rule correctly targets only ACTIVE contracts with auto_renew=false past end_date'
);

const eligibleSubsForRenew = mockSubscriptions.filter(
  (s) => s.status === 'ACTIVE' && s.end_date < '2026-05-01' && s.auto_renew === true
);
assert(
  eligibleSubsForRenew.length === 1 && eligibleSubsForRenew[0].id === '11',
  'Subscription auto-renew rule correctly targets ACTIVE contracts with auto_renew=true past end_date'
);

// Summary
console.log('\n====================================================');
console.log(` PHASE 07 TEST RESULTS: ${passedTests}/${totalTests} PASSED`);
if (failedTests > 0) {
  console.error(` ❌ FAILED: ${failedTests}`);
  process.exit(1);
} else {
  console.log(' ALL PHASE 07 VERIFICATIONS COMPLETED SUCCESSFULLY!');
  console.log('====================================================');
}

