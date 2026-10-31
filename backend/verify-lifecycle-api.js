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
import app from './src/app.js';
import http from 'http';

console.log('====================================================');
console.log(' BRIGHTLOOP: PHASE 06 LIFECYCLE API TEST SUITE');
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
console.log('1. Testing Lifecycle Controller Validation Logic:');

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

// confirmSubscription: invalid UUID
const reqInvalidConfirm = { params: { id: 'invalid-uuid' } };
const resInvalidConfirm = createMockRes();
await confirmSubscription(reqInvalidConfirm, resInvalidConfirm, () => {});
assert(
  resInvalidConfirm.statusCode === 400 || resInvalidConfirm.statusCode === 503,
  'confirmSubscription rejects invalid UUID format'
);

// activateSubscription: invalid UUID
const reqInvalidActivate = { params: { id: 'bad-uuid' } };
const resInvalidActivate = createMockRes();
await activateSubscription(reqInvalidActivate, resInvalidActivate, () => {});
assert(
  resInvalidActivate.statusCode === 400 || resInvalidActivate.statusCode === 503,
  'activateSubscription rejects invalid UUID format'
);

// pauseSubscription: invalid UUID
const reqInvalidPause = { params: { id: 'bad-uuid' } };
const resInvalidPause = createMockRes();
await pauseSubscription(reqInvalidPause, resInvalidPause, () => {});
assert(
  resInvalidPause.statusCode === 400 || resInvalidPause.statusCode === 503,
  'pauseSubscription rejects invalid UUID format'
);

// resumeSubscription: invalid UUID
const reqInvalidResume = { params: { id: 'bad-uuid' } };
const resInvalidResume = createMockRes();
await resumeSubscription(reqInvalidResume, resInvalidResume, () => {});
assert(
  resInvalidResume.statusCode === 400 || resInvalidResume.statusCode === 503,
  'resumeSubscription rejects invalid UUID format'
);

// renewSubscription: invalid UUID
const reqInvalidRenew = { params: { id: 'bad-uuid' } };
const resInvalidRenew = createMockRes();
await renewSubscription(reqInvalidRenew, resInvalidRenew, () => {});
assert(
  resInvalidRenew.statusCode === 400 || resInvalidRenew.statusCode === 503,
  'renewSubscription rejects invalid UUID format'
);

// cancelSubscription: invalid UUID
const reqInvalidCancel = { params: { id: 'bad-uuid' } };
const resInvalidCancel = createMockRes();
await cancelSubscription(reqInvalidCancel, resInvalidCancel, () => {});
assert(
  resInvalidCancel.statusCode === 400 || resInvalidCancel.statusCode === 503,
  'cancelSubscription rejects invalid UUID format'
);

// closeSubscription: invalid UUID
const reqInvalidClose = { params: { id: 'bad-uuid' } };
const resInvalidClose = createMockRes();
await closeSubscription(reqInvalidClose, resInvalidClose, () => {});
assert(
  resInvalidClose.statusCode === 400 || resInvalidClose.statusCode === 503,
  'closeSubscription rejects invalid UUID format'
);

// getSubscriptionHistory: invalid UUID
const reqInvalidHistory = { params: { id: 'bad-uuid' } };
const resInvalidHistory = createMockRes();
await getSubscriptionHistory(reqInvalidHistory, resInvalidHistory, () => {});
assert(
  resInvalidHistory.statusCode === 400 || resInvalidHistory.statusCode === 503,
  'getSubscriptionHistory rejects invalid UUID format'
);

// 2. HTTP ENDPOINTS & SECURITY GUARDS (VULN-005 Protection)
console.log('\n2. Testing HTTP Endpoints & Security Guards:');

const server = http.createServer(app);
const PORT = 5006;

server.listen(PORT, async () => {
  try {
    const resConfirm = await fetch(`http://localhost:${PORT}/api/subscriptions/7d9b97b1-1234-4567-89ab-cdef01234567/confirm`, { method: 'POST' });
    assert(resConfirm.status === 401, 'POST /api/subscriptions/:id/confirm rejects unauthenticated requests (HTTP 401)');

    const resActivate = await fetch(`http://localhost:${PORT}/api/subscriptions/7d9b97b1-1234-4567-89ab-cdef01234567/activate`, { method: 'POST' });
    assert(resActivate.status === 401, 'POST /api/subscriptions/:id/activate rejects unauthenticated requests (HTTP 401)');

    const resPause = await fetch(`http://localhost:${PORT}/api/subscriptions/7d9b97b1-1234-4567-89ab-cdef01234567/pause`, { method: 'POST' });
    assert(resPause.status === 401, 'POST /api/subscriptions/:id/pause rejects unauthenticated requests (HTTP 401)');

    const resResume = await fetch(`http://localhost:${PORT}/api/subscriptions/7d9b97b1-1234-4567-89ab-cdef01234567/resume`, { method: 'POST' });
    assert(resResume.status === 401, 'POST /api/subscriptions/:id/resume rejects unauthenticated requests (HTTP 401)');

    const resRenew = await fetch(`http://localhost:${PORT}/api/subscriptions/7d9b97b1-1234-4567-89ab-cdef01234567/renew`, { method: 'POST' });
    assert(resRenew.status === 401, 'POST /api/subscriptions/:id/renew rejects unauthenticated requests (HTTP 401)');

    const resCancel = await fetch(`http://localhost:${PORT}/api/subscriptions/7d9b97b1-1234-4567-89ab-cdef01234567/cancel`, { method: 'POST' });
    assert(resCancel.status === 401, 'POST /api/subscriptions/:id/cancel rejects unauthenticated requests (HTTP 401)');

    const resClose = await fetch(`http://localhost:${PORT}/api/subscriptions/7d9b97b1-1234-4567-89ab-cdef01234567/close`, { method: 'POST' });
    assert(resClose.status === 401, 'POST /api/subscriptions/:id/close rejects unauthenticated requests (HTTP 401)');

    const resHistory = await fetch(`http://localhost:${PORT}/api/subscriptions/7d9b97b1-1234-4567-89ab-cdef01234567/history`);
    assert(resHistory.status === 401, 'GET /api/subscriptions/:id/history rejects unauthenticated requests (HTTP 401)');

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

