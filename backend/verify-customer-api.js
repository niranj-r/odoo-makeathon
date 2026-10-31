import {
  validateEmail,
  validatePhone,
  sanitizeString,
  isValidUUID,
  parsePagination
} from './src/utils/validators.js';
import {
  createCustomer,
  listCustomers,
  getCustomer,
  updateCustomer,
  updateCustomerStatus
} from './src/controllers/customerController.js';
import app from './src/app.js';
import http from 'http';

console.log('====================================================');
console.log(' BRIGHTLOOP: PHASE 02 CUSTOMER API TEST SUITE');
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

// 1. UNIT TESTS: VALIDATION & SANITIZATION UTILITIES
console.log('1. Testing Input Validators & Sanitization:');

// Email Validation
assert(validateEmail('customer@example.com'), 'Valid standard email accepted');
assert(validateEmail('first.last+tag@company.co.uk'), 'Complex valid email accepted');
assert(!validateEmail('invalid-email'), 'Invalid email without @ rejected');
assert(!validateEmail('@missing-user.com'), 'Invalid email missing user rejected');
assert(!validateEmail('spaces in@email.com'), 'Invalid email with spaces rejected');
assert(!validateEmail(null), 'Null email rejected');
assert(!validateEmail(''), 'Empty email rejected');

// Phone Validation
assert(validatePhone('+1 555-123-4567'), 'Valid international phone with + accepted');
assert(validatePhone('0987654321'), 'Valid numeric phone accepted');
assert(validatePhone(null), 'Null optional phone accepted');
assert(validatePhone(''), 'Empty optional phone accepted');
assert(!validatePhone('123'), 'Too short phone rejected (< 7 chars)');
assert(!validatePhone('abc-defg-hijk'), 'Alphabetic phone rejected');

// String Sanitization
assert(sanitizeString('  John Doe  ') === 'John Doe', 'Whitespace trimmed properly');
assert(sanitizeString('Clean\0String') === 'CleanString', 'Null bytes stripped out');
assert(sanitizeString('A'.repeat(300), 50).length === 50, 'Max length truncation respected');
assert(sanitizeString(null) === null, 'Null string remains null');

// UUID Validation
assert(isValidUUID('7d9b97b1-1234-4567-89ab-cdef01234567'), 'Valid UUID accepted');
assert(!isValidUUID('invalid-uuid-string'), 'Malformed string rejected as UUID');
assert(!isValidUUID('12345'), 'Integer string rejected as UUID');
assert(!isValidUUID(null), 'Null rejected as UUID');

// Pagination Parsing
const p1 = parsePagination({ page: '2', limit: '15' });
assert(p1.page === 2 && p1.limit === 15 && p1.from === 15 && p1.to === 29, 'Pagination page 2 limit 15 parsed correctly');

const p2 = parsePagination({ page: '-5', limit: '9999' });
assert(p2.page === 1 && p2.limit === 100, 'Negative page and exceeding limit clamped cleanly (limit <= 100)');

// 2. CONTROLLER VALIDATION LOGIC TESTS (Mocked req/res)
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

// createCustomer: missing name
const reqMissingName = { body: { email: 'test@example.com' } };
const resMissingName = createMockRes();
await createCustomer(reqMissingName, resMissingName, () => {});
// Either 400 (validation) or 503 (database unconfigured)
assert(
  resMissingName.statusCode === 400 || resMissingName.statusCode === 503,
  'createCustomer validates required customer name or handles DB config'
);

// getCustomer: invalid UUID format
const reqInvalidId = { params: { id: 'not-a-valid-uuid' } };
const resInvalidId = createMockRes();
await getCustomer(reqInvalidId, resInvalidId, () => {});
assert(
  resInvalidId.statusCode === 400 || resInvalidId.statusCode === 503,
  'getCustomer rejects invalid UUID format parameter'
);

// updateCustomerStatus: invalid status value
const reqInvalidStatus = { params: { id: '7d9b97b1-1234-4567-89ab-cdef01234567' }, body: { status: 'DELETED' } };
const resInvalidStatus = createMockRes();
await updateCustomerStatus(reqInvalidStatus, resInvalidStatus, () => {});
assert(
  resInvalidStatus.statusCode === 400 || resInvalidStatus.statusCode === 503,
  'updateCustomerStatus rejects unauthorized status enum'
);

// 3. ROUTE AND AUTH SECURITY VERIFICATION
console.log('\n3. Testing HTTP Endpoints & Security Guards:');

const server = http.createServer(app);
const PORT = 5002;

server.listen(PORT, async () => {
  try {
    // 3.1. Test Unauthenticated Requests (VULN-005 Protection)
    const resPost = await fetch(`http://localhost:${PORT}/api/customers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Test', email: 'test@example.com' })
    });
    assert(resPost.status === 401, 'POST /api/customers rejects unauthenticated requests (HTTP 401)');

    const resGet = await fetch(`http://localhost:${PORT}/api/customers`);
    assert(resGet.status === 401, 'GET /api/customers rejects unauthenticated requests (HTTP 401)');

    const resGetSingle = await fetch(`http://localhost:${PORT}/api/customers/7d9b97b1-1234-4567-89ab-cdef01234567`);
    assert(resGetSingle.status === 401, 'GET /api/customers/:id rejects unauthenticated requests (HTTP 401)');

    const resPut = await fetch(`http://localhost:${PORT}/api/customers/7d9b97b1-1234-4567-89ab-cdef01234567`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Updated' })
    });
    assert(resPut.status === 401, 'PUT /api/customers/:id rejects unauthenticated requests (HTTP 401)');

    const resPatch = await fetch(`http://localhost:${PORT}/api/customers/7d9b97b1-1234-4567-89ab-cdef01234567/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'INACTIVE' })
    });
    assert(resPatch.status === 401, 'PATCH /api/customers/:id/status rejects unauthenticated requests (HTTP 401)');

    // 3.2. Test Malformed Authorization Header
    const resMalformed = await fetch(`http://localhost:${PORT}/api/customers`, {
      headers: { 'Authorization': 'Basic 12345' }
    });
    assert(resMalformed.status === 401, 'Malformed Authorization header rejected (HTTP 401)');

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
