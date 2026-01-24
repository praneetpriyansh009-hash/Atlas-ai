import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

const app = express();
const PORT = 5000;

// Middleware
app.use(cors({
    origin: ['http://localhost:8080', 'http://localhost:5173', 'http://127.0.0.1:8080'],
    credentials: true
}));
app.use(express.json());

// --- AI CONFIG ---
const GROQ_API_KEY = process.env.GROQ_API_KEY || "";
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = "llama-3.3-70b-versatile";

console.log("-----------------------------------------");
console.log("GROQ-ONLY SERVER STARTING");
console.log("Groq Key Present:", !!GROQ_API_KEY);
console.log("-----------------------------------------");

// --- ROUTES ---

app.get('/health', (req, res) => res.json({ status: 'ok', mode: 'groq-only' }));

app.get('/', (req, res) => {
    res.send('<h1>Atlas Groq Server Running</h1><p>Gemini has been removed.</p>');
});

// Primary Groq Route
app.post('/api/ai/groq', async (req, res) => {
    await handleGroqRequest(req, res);
});

// Legacy Gemini Route -> Redirects to Groq
app.post('/api/ai/gemini', async (req, res) => {
    console.log("[Legacy Gemini Endpoint] Redirecting request to Groq...");
    await handleGroqRequest(req, res);
});

async function handleGroqRequest(req, res) {
    try {
        if (!GROQ_API_KEY) throw new Error("Missing Groq Key");

        const response = await fetch(GROQ_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${GROQ_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: GROQ_MODEL,
                messages: req.body.messages || []
            })
        });

        if (!response.ok) {
            const err = await response.text();
            throw new Error(`Groq API Error: ${err}`);
        }

        const data = await response.json();
        console.log("[Groq] Success. Response chars:", JSON.stringify(data).length);
        res.json(data);

    } catch (error) {
        console.error("[Groq] Error:", error.message);
        res.status(500).json({ error: error.message, details: "Check server logs" });
    }
}

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Groq Server running on http://localhost:${PORT}`);
});
