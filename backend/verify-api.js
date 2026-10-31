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

    // Also test 401 on /api/auth/me without token
    const meRes = await fetch('http://localhost:5001/api/auth/me');
    const meData = await meRes.json();
    console.log('Auth Me (Unauthenticated) Response [Status: ' + meRes.status + ']:');
    console.log(JSON.stringify(meData, null, 2));
  } catch (err) {
    console.error('Test failed:', err);
  } finally {
    server.close(() => {
      console.log('Test server closed.');
      process.exit(0);
    });
  }
});
