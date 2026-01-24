import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';
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
const GEMINI_API_KEY = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY || "";
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = "llama-3.1-8b-instant";

console.log("-----------------------------------------");
console.log("STANDALONE SERVER STARTING");
console.log("Groq Key Present:", !!GROQ_API_KEY);
console.log("Gemini Key Present:", !!GEMINI_API_KEY);
console.log("-----------------------------------------");

// --- ROUTES ---

// Health Check
app.get('/health', (req, res) => {
    console.log("[Health] Check received");
    res.json({ status: 'ok', mode: 'standalone' });
});

// Root Route (Visual Confirmation)
app.get('/', (req, res) => {
    res.send('<h1>Atlas Server is RUNNING!</h1><p>The API is active. You can go back to the app.</p>');
});

// Gemini Route (Direct REST API)
app.post('/api/ai/gemini', async (req, res) => {
    console.log("[Gemini] Request received (REST Mode)");
    try {
        if (!GEMINI_API_KEY) throw new Error("Missing Gemini Key");

        // Construct the prompt from the messages array
        const messages = req.body.messages || [];
        const lastMsg = messages[messages.length - 1];
        const userPrompt = lastMsg?.content || "";
        const systemMsg = messages.find(m => m.role === 'system')?.content || "";

        // Combine system prompt and user prompt
        const fullText = systemMsg ? `${systemMsg}\n\nUser: ${userPrompt}` : userPrompt;

        // Use direct REST API to bypass SDK issues
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: fullText }]
                }]
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Gemini API Error (${response.status}): ${errorText}`);
        }

        const data = await response.json();
        const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || "No response generated.";

        console.log("[Gemini] Success");
        res.json({ choices: [{ message: { content: responseText, role: 'assistant' } }] });

    } catch (error) {
        console.error("[Gemini] Error:", error.message);
        res.status(500).json({ error: error.message });
    }
});

// Groq Route
app.post('/api/ai/groq', async (req, res) => {
    console.log("[Groq] Request received");
    try {
        if (!GROQ_API_KEY) throw new Error("Missing Groq Key");

        const response = await fetch(GROQ_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${GROQ_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ ...req.body, model: GROQ_MODEL })
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`Groq API Error: ${errText}`);
        }

        const data = await response.json();
        console.log("[Groq] Success");
        res.json(data);
    } catch (error) {
        console.error("[Groq] Error:", error.message);
        res.status(500).json({ error: error.message });
    }
});

// Start
app.listen(PORT, () => {
    console.log(`Standalone Server running on http://localhost:${PORT}`);
});
