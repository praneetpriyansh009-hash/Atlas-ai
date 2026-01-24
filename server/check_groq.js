import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const URL = 'https://api.groq.com/openai/v1/models';

async function listModels() {
    if (!GROQ_API_KEY) {
        console.error("No GROQ_API_KEY found.");
        return;
    }

    try {
        const response = await fetch(URL, {
            headers: {
                'Authorization': `Bearer ${GROQ_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            console.error("Failed to fetch models:", await response.text());
            return;
        }

        const data = await response.json();
        console.log("AVAILABLE GROQ MODELS:");
        data.data.forEach(m => console.log(`- ${m.id}`));

    } catch (error) {
        console.error("Error:", error.message);
    }
}

listModels();
