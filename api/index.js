import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fetch from 'node-fetch';
import admin from 'firebase-admin';
import { z } from 'zod';

dotenv.config();

// --- FIREBASE ADMIN INIT ---
const serviceAccountEnv = process.env.FIREBASE_SERVICE_ACCOUNT;
try {
    if (serviceAccountEnv && !admin.apps.length) {
        const serviceAccount = JSON.parse(serviceAccountEnv);
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            projectId: serviceAccount.project_id
        });
        console.log("Firebase Admin Initialized for Vercel");
    }
} catch (error) {
    console.error("Firebase Admin Error:", error.message);
}

const app = express();

// --- SCHEMAS & MIDDLEWARE ---
const chatSchema = z.object({
    messages: z.array(z.object({
        role: z.enum(['system', 'user', 'assistant']),
        content: z.string().min(1).max(20000)
    })).min(1),
    model: z.string().optional()
});

const verifyToken = async (req, res, next) => {
    // If Firebase Admin is not initialized, skip auth (allows app to work without config)
    if (!admin.apps.length) {
        console.warn('[Auth] Firebase not configured - skipping token verification');
        req.user = { uid: 'anonymous', email: 'guest@atlas.app' };
        return next();
    }

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }
    const token = authHeader.split(' ')[1];
    try {
        const decodedToken = await admin.auth().verifyIdToken(token);
        req.user = decodedToken;
        next();
    } catch (error) {
        console.warn('Token verification failed:', error.message);
        return res.status(403).json({ error: 'Forbidden: Invalid token' });
    }
};

const validateAIRequest = (req, res, next) => {
    try {
        req.body = chatSchema.parse(req.body);
        next();
    } catch (error) {
        return res.status(400).json({ error: 'Invalid input data' });
    }
};

// Middleware
app.use(cors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' }));

// --- AI CONFIG ---
const GROQ_API_KEY = (process.env.GROQ_API_KEY || "").trim();
const GEMINI_API_KEY = (process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY || "").trim();
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = "llama-3.3-70b-versatile";
const REQUEST_TIMEOUT = 9500; // Just under Vercel 10s limit

// --- HELPERS ---
const fetchWithTimeout = async (url, options) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
    try {
        const response = await fetch(url, { ...options, signal: controller.signal });
        clearTimeout(timeoutId);
        return response;
    } catch (error) {
        clearTimeout(timeoutId);
        throw error;
    }
};

const callGroq = async (prompt) => {
    const response = await fetchWithTimeout(GROQ_URL, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${GROQ_API_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            messages: [{ role: "user", content: prompt }],
            model: GROQ_MODEL,
            temperature: 0.7,
            response_format: { type: "json_object" }
        })
    });

    if (!response.ok) {
        const err = await response.text();
        throw new Error(`Groq API Error: ${response.status} - ${err}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || "";
};

const callGemini = async (prompt) => {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
    const response = await fetchWithTimeout(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });

    if (!response.ok) {
        const err = await response.text();
        throw new Error(`Gemini API Error: ${response.status} - ${err}`);
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text;
};

// --- ROUTES ---

// Health Check
app.get('/api/health', (req, res) => res.json({ status: 'ok', mode: 'standalone-vercel' }));

// Groq Route (Used by Doubts Solver)
app.post('/api/ai/groq', verifyToken, validateAIRequest, async (req, res) => {
    try {
        if (!GROQ_API_KEY) throw new Error("Missing GROQ_API_KEY");
        const response = await fetchWithTimeout(GROQ_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${GROQ_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                ...req.body,
                model: req.body.model || GROQ_MODEL
            })
        });

        if (!response.ok) {
            const err = await response.text();
            throw new Error(`Groq API Error: ${response.status} - ${err}`);
        }

        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error("Groq Route Error:", error.message);
        res.status(500).json({ error: error.message });
    }
});

// Podcast Route
app.post('/api/ai/podcast', verifyToken, async (req, res) => {
    const { content, topics, mode, syllabus, provider = 'auto' } = req.body;
    try {
        let promptText = `
            You are an expert podcast script writer. 
            Create a highly engaging dialogue behind Alex and Sam.
            ${mode === 'syllabus' ? `Topic: ${syllabus.subject} - ${syllabus.topic}` : `Content: ${content?.substring(0, 8000)}`}
            Focal Points: ${topics || 'General'}
            
            RULES:
            - Output ONLY JSON { "script": [ { "speaker": "Alex"|"Sam", "text": "..." } ] }
            - 8-10 exchanges total. Concise and fast.
        `;

        let resultText = "";
        let usedProvider = "";

        if (provider === 'groq' || (provider === 'auto' && !GEMINI_API_KEY)) {
            resultText = await callGroq(promptText);
            usedProvider = "groq";
        } else {
            resultText = await callGemini(promptText);
            usedProvider = "gemini";
        }

        const clean = resultText.replace(/```json|```/g, '').trim();
        const finalJson = JSON.parse(clean.match(/\{.*\}/s)?.[0] || clean);

        res.json({
            script: finalJson.script || finalJson,
            provider: usedProvider
        });
    } catch (error) {
        console.error("Podcast Route Error:", error.message);
        res.status(500).json({ error: error.message });
    }
});

// Gemini Route (Legacy)
app.post('/api/ai/gemini', async (req, res) => {
    try {
        if (!GEMINI_API_KEY) throw new Error("Missing GEMINI_API_KEY");
        const lastMsg = req.body.messages?.[req.body.messages.length - 1]?.content || "Hello";
        const result = await callGemini(lastMsg);
        res.json({ choices: [{ message: { content: result, role: 'assistant' } }] });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default app;
