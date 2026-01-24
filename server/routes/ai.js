import express from 'express';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import { verifyToken } from '../middleware/auth.js';
import { validateAIRequest } from '../middleware/validation.js';

dotenv.config();

const router = express.Router();

// --- Configuration ---
const GROQ_API_KEY = (process.env.GROQ_API_KEY || "").trim();
const GEMINI_API_KEY = (process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY || "").trim();
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = "llama-3.3-70b-versatile"; // Latest replacement for decommissioned 3.1 model
const REQUEST_TIMEOUT = 9000; // 9 seconds to fit within Vercel's 10s limit

// Log key status for debugging
console.log(`[AI Service] Groq Key Loaded: ${!!GROQ_API_KEY}`);
console.log(`[AI Service] Gemini Key Loaded: ${!!GEMINI_API_KEY}`);

// --- Helper: Fetch with Timeout ---
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

// --- Helper: Call Groq ---
const callGroq = async (prompt) => {
    console.log("[Groq Request] Starting...");
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
        const err = await response.json();
        throw new Error(`Groq API Error: ${err.error?.message || response.statusText}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || "";
};

// --- Helper: Call Gemini REST ---
const callGemini = async (prompt, modelName = "gemini-1.5-flash") => {
    const versions = ['v1beta', 'v1'];
    const models = [modelName, 'gemini-1.5-flash-latest', 'gemini-pro'];
    let lastError = null;

    for (const ver of versions) {
        for (const mod of models) {
            try {
                const url = `https://generativelanguage.googleapis.com/${ver}/models/${mod}:generateContent?key=${GEMINI_API_KEY}`;
                console.log(`[Gemini Request] Trying ${ver}/${mod}...`);
                const response = await fetchWithTimeout(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
                });

                if (response.ok) {
                    const data = await response.json();
                    return data.candidates?.[0]?.content?.parts?.[0]?.text;
                }
            } catch (err) {
                lastError = err;
            }
        }
    }
    throw new Error(lastError ? lastError.message : "Gemini inaccessible");
};

// --- Route: Podcast ---
router.post('/podcast', verifyToken, async (req, res) => {
    const { content, topics, mode, syllabus, provider = 'auto' } = req.body;

    try {
        let promptText = `
            You are an expert podcast script writer. 
            Create a highly engaging dialogue between Alex (beginner/curious) and Sam (expert/calm).
            
            ${mode === 'syllabus' && syllabus ? `
                SUBJECT: ${syllabus.subject}
                TOPIC: ${syllabus.topic}
                LEVEL: ${syllabus.level}
            ` : `
                CONTENT: ${content || 'No content provided'}
                FOCAL POINTS: ${topics || 'General overview'}
            `}
            
            STRICT RULES:
            - Output ONLY a JSON object with a 'script' key.
            - The value of 'script' MUST be an array of objects.
            - Each object: { "speaker": "Alex" | "Sam", "text": "..." }
            - Make the conversation highly technical, detailed, and insightful.
            - Sam should explain concepts using "first principles".
            - Alex should ask follow-up questions that probe deeper into "why" and "how".
            - 8-12 exchanges total (concise and high-impact).
            - Do not be generic; use specific examples and data points.
            - Valid JSON object/array only.
        `;

        let resultText = "";
        let usedProvider = "";

        // Try selected provider or Gemini first in auto mode
        if (provider === 'groq' || (provider === 'auto' && !GEMINI_API_KEY)) {
            resultText = await callGroq(promptText);
            usedProvider = "groq";
        } else {
            try {
                resultText = await callGemini(promptText);
                usedProvider = "gemini";
            } catch (gemError) {
                console.warn("[Podcast] Gemini failed, falling back to Groq:", gemError.message);
                if (GROQ_API_KEY) {
                    resultText = await callGroq(promptText);
                    usedProvider = "groq";
                } else {
                    throw gemError;
                }
            }
        }

        // Cleanup and Parse
        console.log(`[Podcast] Raw result length: ${resultText.length}`);
        const cleanedText = resultText.replace(/```json|```/g, '').trim();
        let finalJson;
        try {
            finalJson = JSON.parse(cleanedText);
            console.log(`[Podcast] Successfully parsed JSON with ${finalJson.script?.length || 0} lines`);
        } catch (e) {
            console.error("[Podcast] JSON Parse Error. Raw text snippet:", cleanedText.substring(0, 100));
            const match = cleanedText.match(/\[\s*\{.*\}\s*\]/s);
            if (match) {
                finalJson = { script: JSON.parse(match[0]) };
                console.log("[Podcast] Recovered via regex match");
            }
            else throw new Error("AI returned invalid JSON structure");
        }

        res.json({
            script: finalJson.script || finalJson,
            provider: usedProvider
        });

    } catch (error) {
        console.error('[AI Route] Podcast Failure:', error.message);
        res.status(500).json({ error: 'Generation Failed', message: error.message });
    }
});

// --- Route: Gemini (legacy) ---
router.post('/gemini', verifyToken, validateAIRequest, async (req, res) => {
    try {
        const lastMsg = req.body.messages?.[req.body.messages.length - 1]?.content || "Hello";
        const result = await callGemini(lastMsg);
        res.json({ choices: [{ message: { content: result, role: 'assistant' } }] });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- Route: Groq ---
router.post('/groq', verifyToken, validateAIRequest, async (req, res) => {
    try {
        if (!GROQ_API_KEY) return res.status(500).json({ error: 'Groq Key Missing' });
        const response = await fetchWithTimeout(GROQ_URL, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${GROQ_API_KEY}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...req.body, model: req.body.model || GROQ_MODEL })
        });
        const data = await response.json();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
