const fetch = require('node-fetch');

async function testBackend() {
    try {
        console.log("Testing Backend Connection to http://localhost:5000/api/ai/groq...");

        const response = await fetch('http://localhost:5000/api/ai/groq', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                messages: [{ role: 'user', content: 'Hello, are you online?' }]
            })
        });

        if (!response.ok) {
            console.error(`Status ${response.status}: ${await response.text()}`);
            return;
        }

        const data = await response.json();
        console.log("Success!");
        console.log("Response:", JSON.stringify(data, null, 2));

    } catch (error) {
        console.error("Connection Failed:", error.message);
    }
}

testBackend();
