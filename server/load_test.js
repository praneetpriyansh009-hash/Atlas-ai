
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5010';

const runLoadTest = async (count, endpoint = '/') => {
    console.log(`\n--- Starting Load Test: ${count} requests to ${endpoint} ---`);
    const start = Date.now();

    const promises = [];
    for (let i = 0; i < count; i++) {
        promises.push(
            fetch(`${BASE_URL}${endpoint}`)
                .then(res => ({ status: res.status }))
                .catch(err => ({ status: 'error', error: err.message }))
        );
    }

    const results = await Promise.all(promises);
    const duration = Date.now() - start;

    const stats = results.reduce((acc, curr) => {
        acc[curr.status] = (acc[curr.status] || 0) + 1;
        return acc;
    }, {});

    console.log(`Completed in ${duration}ms`);
    console.log('Results:', stats);
    return stats;
};

const main = async () => {
    // 1. Test raw capacity (100 requests to /health - no rate limit expected)
    console.log("TEST 1: 100 requests to /health (Unlimited)");
    await runLoadTest(100, '/health');

    // 2. Test rate limiting (150 requests to /api/test - limit is 100)
    // Note: Since /api doesn't have a generic echo, we'll assume /api/something returns 404 but triggers limiter
    console.log("\nTEST 2: 150 requests to /api/nonexistent (Rate Limited @ 100)");
    await runLoadTest(150, '/api/nonexistent');

    // 3. Heavy Load (1000 requests to /health)
    console.log("\nTEST 3: 1000 requests to /health (Stress Test)");
    await runLoadTest(1000, '/health');
};

main();
