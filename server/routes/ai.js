import express from 'express';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { verifyToken } from '../middleware/auth.js';
import { validateAIRequest } from '../middleware/validation.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from server directory
const envPath = path.join(__dirname, '..', '.env');
console.log(`[AI Service] Loading env from: ${envPath}`);
const result = dotenv.config({ path: envPath });
if (result.error) {
    console.log(`[AI Service] Dotenv error: ${result.error.message}`);
} else {
    console.log(`[AI Service] Env loaded successfully, GROQ in env:`, !!process.env.GROQ_API_KEY);
}

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
router.post('/podcast', async (req, res) => {
    const { content, topics, mode, syllabus, tier = 'basic' } = req.body;
    const isPro = tier === 'pro' || tier === 'dev';

    try {
        // Define podcast parameters based on tier
        const podcastConfig = isPro ? {
            exchanges: '20-25',
            duration: '10-15 minutes',
            depth: 'comprehensive and thoroughly detailed',
            style: 'Use first-principles thinking, dive deep into underlying mechanisms, provide real-world examples, historical context, and practical applications. Each response should be substantive (3-5 sentences minimum).',
            rules: `
                - Make this a PREMIUM deep-dive lasting 10-15 minutes when spoken aloud.
                - Sam should explain concepts from first principles, building up understanding layer by layer.
                - Include specific examples, case studies, analogies, and real-world applications.
                - Alex should ask probing follow-up questions that explore edge cases and deeper implications.
                - Cover the topic COMPREHENSIVELY - don't skip any important subtopics.
                - End with actionable takeaways and connections to other fields.
            `
        } : {
            exchanges: '10-12',
            duration: '7 minutes',
            depth: 'clear and engaging',
            style: 'Be concise but informative. Focus on the key concepts and main takeaways.',
            rules: `
                - Make this an engaging podcast lasting approximately 7 minutes when spoken aloud.
                - Cover the main concepts clearly without going too deep into details.
                - Sam should explain concepts simply and Alex should ask clarifying questions.
                - Focus on the most important 3-4 key points of the topic.
            `
        };

        let promptText = `
            You are an expert podcast script writer creating a ${isPro ? 'PREMIUM' : 'standard'} educational podcast.
            Create a highly engaging dialogue between Alex (beginner/curious) and Sam (expert/calm).
            
            ${mode === 'syllabus' && syllabus ? `
                SUBJECT: ${syllabus.subject}
                TOPIC: ${syllabus.topic}
                LEVEL: ${syllabus.level}
            ` : `
                CONTENT: ${content || 'No content provided'}
                FOCAL POINTS: ${topics || 'General overview'}
            `}
            
            PODCAST PARAMETERS:
            - Target Duration: ${podcastConfig.duration}
            - Number of Exchanges: ${podcastConfig.exchanges} exchanges total
            - Depth Level: ${podcastConfig.depth}
            - Style: ${podcastConfig.style}
            
            STRICT RULES:
            - Output ONLY a valid JSON object with a 'script' key.
            - The value of 'script' MUST be an array of objects.
            - Each object: { "speaker": "Alex" | "Sam", "text": "..." }
            ${podcastConfig.rules}
            - Valid JSON object/array only.
        `;

        let resultText = "";
        let usedProvider = "";

        // Always use Groq as per user request
        resultText = await callGroq(promptText);
        usedProvider = "groq";

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
router.post('/gemini', validateAIRequest, async (req, res) => {
    try {
        const lastMsg = req.body.messages?.[req.body.messages.length - 1]?.content || "Hello";
        const result = await callGemini(lastMsg);
        res.json({ choices: [{ message: { content: result, role: 'assistant' } }] });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- Route: Groq ---
router.post('/groq', validateAIRequest, async (req, res) => {
    try {
        if (!GROQ_API_KEY) return res.status(500).json({ error: 'Groq Key Missing' });
        const response = await fetchWithTimeout(GROQ_URL, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${GROQ_API_KEY}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...req.body, model: req.body.model || GROQ_MODEL })
        });
        const data = await response.json();

        // Forward API errors properly
        if (!response.ok) {
            console.error('[Groq Route] API Error:', data);
            return res.status(response.status).json(data);
        }

        res.json(data);
    } catch (error) {
        console.error('[Groq Route] Server Error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

export default router;
