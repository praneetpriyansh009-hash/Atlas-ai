import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('--- Atlas Backend Diagnostic ---');

// Check .env files
const rootEnv = path.join(__dirname, '..', '.env');
const serverEnv = path.join(__dirname, '.env');

console.log(`Searching for .env at: ${rootEnv} (Exists: ${fs.existsSync(rootEnv)})`);
console.log(`Searching for .env at: ${serverEnv} (Exists: ${fs.existsSync(serverEnv)})`);

dotenv.config(); // Loads from root or wherever it finds first
// Also try loading server .env specifically
dotenv.config({ path: serverEnv });

const GEMINI_KEY = process.env.GEMINI_API_KEY;
const GROQ_KEY = process.env.GROQ_API_KEY;
const PORT = process.env.PORT || 5001;

console.log(`Port: ${PORT}`);
console.log(`Gemini Key: ${GEMINI_KEY ? 'Present (starts with ' + GEMINI_KEY.substring(0, 4) + '...)' : 'MISSING'}`);
console.log(`Groq Key: ${GROQ_KEY ? 'Present (starts with ' + GROQ_KEY.substring(0, 4) + '...)' : 'MISSING'}`);

if (!GEMINI_KEY || !GROQ_KEY) {
    console.warn('\n[WARNING] One or more API keys are missing!');
}

console.log('--- End of Diagnostic ---');
