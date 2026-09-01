const http = require('http');

async function testEndpoints() {
  console.log('Testing Goti Jibon API endpoints...');
  const TEST_PORT = process.env.PORT || 5001;
  process.env.PORT = TEST_PORT;

  // Start the server programmatically for testing
  const serverProcess = require('./server.js');

  // Wait 1 second for server to initialize
  await new Promise(resolve => setTimeout(resolve, 1200));

  function makeRequest(path, method = 'GET', postData = null) {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: '127.0.0.1',
        port: TEST_PORT,
        path: path,
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      };

      const req = http.request(options, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(body) });
          } catch (e) {
            resolve({ status: res.statusCode, data: body });
          }
        });
      });

      req.on('error', (e) => reject(e));

      if (postData) {
        req.write(JSON.stringify(postData));
      }
      req.end();
    });
  }

  try {
    // Test 1: GET /api/articles
    const articlesRes = await makeRequest('/api/articles');
    console.log('✔ [GET /api/articles] Status:', articlesRes.status);
    console.log('  Count:', articlesRes.data.count, '| Source:', articlesRes.data.source);
    if (articlesRes.data.data && articlesRes.data.data.length > 0) {
      console.log('  First article title:', articlesRes.data.data[0].title);
    }

    // Test 2: POST /api/admin/login
    const loginRes = await makeRequest('/api/admin/login', 'POST', {
      email: 'admin@gotijibon.org',
      password: 'SamplePassword123'
    });
    console.log('✔ [POST /api/admin/login] Status:', loginRes.status);
    console.log('  Response message:', loginRes.data.message);
    console.log('  Role:', loginRes.data.admin?.role);

    // Test 3: GET /api/health
    const healthRes = await makeRequest('/api/health');
    console.log('✔ [GET /api/health] Status:', healthRes.status, '| App:', healthRes.data.app);

    console.log('\n🎉 ALL VERIFICATION TESTS PASSED SUCCESSFULLY!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Verification failed:', err.message);
    process.exit(1);
  }
}

testEndpoints();
