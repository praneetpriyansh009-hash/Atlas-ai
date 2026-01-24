import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

const app = express();

// Middleware
app.use(cors({
    origin: true, // Allow all origins (Vercel automatic handling)
    credentials: true
}));
app.use(express.json());

// --- AI CONFIG ---
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = "llama-3.3-70b-versatile";

// --- ROUTES ---

app.get('/api/health', (req, res) => res.json({ status: 'ok', mode: 'groq-vercel' }));

// Primary Groq Route
app.post('/api/ai/groq', async (req, res) => {
    await handleGroqRequest(req, res);
});

async function handleGroqRequest(req, res) {
    try {
        if (!GROQ_API_KEY) {
            console.error("Missing GROQ_API_KEY");
            throw new Error("Server configuration error: Missing API Key");
        }

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
        res.json(data);

    } catch (error) {
        console.error("[Groq] Error:", error.message);
        res.status(500).json({ error: error.message });
    }
}

// Export for Vercel Serverless
export default app;
