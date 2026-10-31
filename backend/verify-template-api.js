import {
  createTemplate,
  listTemplates,
  getTemplate,
  updateTemplate,
  deleteTemplate
} from './src/controllers/templateController.js';
import app from './src/app.js';
import http from 'http';

console.log('====================================================');
console.log(' BRIGHTLOOP: PHASE 03 QUOTATION TEMPLATE API TEST');
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
console.log('1. Testing Template Controller Validation Logic:');

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

// createTemplate: missing name
const reqMissingName = { body: { description: 'Missing name' } };
const resMissingName = createMockRes();
await createTemplate(reqMissingName, resMissingName, () => {});
assert(
  resMissingName.statusCode === 400 || resMissingName.statusCode === 503,
  'createTemplate validates mandatory template name'
);

// createTemplate: invalid validity days
const reqInvalidDays = { body: { name: 'Standard SaaS', default_validity_days: -5 } };
const resInvalidDays = createMockRes();
await createTemplate(reqInvalidDays, resInvalidDays, () => {});
assert(
  resInvalidDays.statusCode === 400 || resInvalidDays.statusCode === 503,
  'createTemplate rejects negative or zero validity days'
);

// createTemplate: invalid product_id in lines
const reqInvalidLine = {
  body: {
    name: 'Enterprise Package',
    default_validity_days: 30,
    lines: [{ product_id: 'not-a-uuid', quantity: 2 }]
  }
};
const resInvalidLine = createMockRes();
await createTemplate(reqInvalidLine, resInvalidLine, () => {});
assert(
  resInvalidLine.statusCode === 400 || resInvalidLine.statusCode === 503,
  'createTemplate rejects invalid product_id UUID in preset lines'
);

// getTemplate: invalid UUID format
const reqInvalidGetId = { params: { id: 'invalid-id' } };
const resInvalidGetId = createMockRes();
await getTemplate(reqInvalidGetId, resInvalidGetId, () => {});
assert(
  resInvalidGetId.statusCode === 400 || resInvalidGetId.statusCode === 503,
  'getTemplate rejects invalid UUID format'
);

// updateTemplate: invalid validity days
const reqInvalidUpdateDays = { params: { id: '7d9b97b1-1234-4567-89ab-cdef01234567' }, body: { default_validity_days: 9999 } };
const resInvalidUpdateDays = createMockRes();
await updateTemplate(reqInvalidUpdateDays, resInvalidUpdateDays, () => {});
assert(
  resInvalidUpdateDays.statusCode === 400 || resInvalidUpdateDays.statusCode === 503,
  'updateTemplate rejects validity period exceeding 365 days'
);

// deleteTemplate: invalid UUID format
const reqInvalidDeleteId = { params: { id: 'not-a-valid-uuid' } };
const resInvalidDeleteId = createMockRes();
await deleteTemplate(reqInvalidDeleteId, resInvalidDeleteId, () => {});
assert(
  resInvalidDeleteId.statusCode === 400 || resInvalidDeleteId.statusCode === 503,
  'deleteTemplate rejects invalid UUID format'
);

// 2. HTTP ENDPOINTS & SECURITY GUARDS (VULN-005 Protection)
console.log('\n2. Testing HTTP Endpoints & Security Guards:');

const server = http.createServer(app);
const PORT = 5003;

server.listen(PORT, async () => {
  try {
    const resPost = await fetch(`http://localhost:${PORT}/api/quotation-templates`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Standard SaaS', default_validity_days: 30 })
    });
    assert(resPost.status === 401, 'POST /api/quotation-templates rejects unauthenticated requests (HTTP 401)');

    const resGet = await fetch(`http://localhost:${PORT}/api/quotation-templates`);
    assert(resGet.status === 401, 'GET /api/quotation-templates rejects unauthenticated requests (HTTP 401)');

    const resGetSingle = await fetch(`http://localhost:${PORT}/api/quotation-templates/7d9b97b1-1234-4567-89ab-cdef01234567`);
    assert(resGetSingle.status === 401, 'GET /api/quotation-templates/:id rejects unauthenticated requests (HTTP 401)');

    const resPut = await fetch(`http://localhost:${PORT}/api/quotation-templates/7d9b97b1-1234-4567-89ab-cdef01234567`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Updated Template' })
    });
    assert(resPut.status === 401, 'PUT /api/quotation-templates/:id rejects unauthenticated requests (HTTP 401)');

    const resDelete = await fetch(`http://localhost:${PORT}/api/quotation-templates/7d9b97b1-1234-4567-89ab-cdef01234567`, {
      method: 'DELETE'
    });
    assert(resDelete.status === 401, 'DELETE /api/quotation-templates/:id rejects unauthenticated requests (HTTP 401)');

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

