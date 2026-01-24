const https = require('https');

const data = JSON.stringify({
    model: "llama-3.3-70b-versatile",
    messages: [{ role: "user", content: "test" }]
});

const options = {
    hostname: 'api.groq.com',
    path: '/openai/v1/chat/completions',
    method: 'POST',
    headers: {
        'Authorization': 'Bearer YOUR_GROQ_API_KEY_PLACEHOLDER',
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
};

console.log("Testing Groq API...");

const req = https.request(options, (res) => {
    console.log(`STATUS: ${res.statusCode}`);
    let body = '';
    res.on('data', (chunk) => body += chunk);
    res.on('end', () => {
        console.log('BODY: ' + body);
    });
});

req.on('error', (e) => {
    console.error(`problem with request: ${e.message}`);
});

req.write(data);
req.end();
