import app from './src/app.js';
import http from 'http';

const server = http.createServer(app);
server.listen(5001, async () => {
  console.log('Test server started on port 5001');
  try {
    const res = await fetch('http://localhost:5001/api/health');
    const data = await res.json();
    console.log('Health Endpoint Response:');
    console.log(JSON.stringify(data, null, 2));

    // Verify authentication guards on all user management & product endpoints
    const endpoints = [
      { path: '/api/auth/me', method: 'GET' },
      { path: '/api/users', method: 'GET' },
      { path: '/api/users/staff', method: 'GET' },
      { path: '/api/users/staff', method: 'POST', body: { email: 'test@example.com' } },
      { path: '/api/users/some-uuid', method: 'GET' },
      { path: '/api/users/some-uuid', method: 'PATCH', body: { full_name: 'Test' } },
      { path: '/api/users/some-uuid/status', method: 'PATCH', body: { status: 'ACTIVE' } },
      { path: '/api/products', method: 'GET' },
      { path: '/api/products', method: 'POST', body: { name: 'Test' } },
      { path: '/api/products/some-uuid', method: 'GET' },
      { path: '/api/products/some-uuid', method: 'PUT', body: { name: 'Test' } },
      { path: '/api/products/some-uuid/status', method: 'PATCH', body: { is_active: false } },
      { path: '/api/products/some-uuid/variants', method: 'GET' },
      { path: '/api/products/some-uuid/variants', method: 'POST', body: { variant_name: 'Test' } },
      { path: '/api/products/some-uuid/variants/var-uuid', method: 'GET' },
      { path: '/api/products/some-uuid/variants/var-uuid', method: 'PUT', body: { variant_name: 'Test' } },
      { path: '/api/products/some-uuid/variants/var-uuid/status', method: 'PATCH', body: { is_active: false } },
      { path: '/api/subscription-plans', method: 'GET' },
      { path: '/api/subscription-plans', method: 'POST', body: { name: 'Test' } },
      { path: '/api/subscription-plans/some-uuid', method: 'GET' },
      { path: '/api/subscription-plans/some-uuid', method: 'PUT', body: { name: 'Test' } },
      { path: '/api/subscription-plans/some-uuid/status', method: 'PATCH', body: { is_active: false } }
    ];

    console.log('\nTesting Unauthenticated Security Rejection:');
    for (const ep of endpoints) {
      const response = await fetch(`http://localhost:5001${ep.path}`, {
        method: ep.method,
        headers: { 'Content-Type': 'application/json' },
        ...(ep.body && { body: JSON.stringify(ep.body) })
      });
      console.log(`  ${ep.method} ${ep.path} -> Status ${response.status} (Expected 401)`);
    }
  } catch (err) {
    console.error('Test failed:', err);
  } finally {
    server.close(() => {
      console.log('Test server closed.');
      process.exit(0);
    });
  }
});
