// Auto-detect environment: Use relative path for Vercel, localhost for dev
const isProduction = import.meta.env.PROD;
export const API_BASE_URL = isProduction ? '/api' : 'http://localhost:5010/api';
export const GEMINI_API_URL = `${API_BASE_URL}/ai/gemini`;
export const GROQ_API_URL = `${API_BASE_URL}/ai/groq`;
export const PODCAST_API_URL = `${API_BASE_URL}/ai/podcast`;

export const formatGroqPayload = (userContent, systemContent) => {
    return {
        messages: [
            { role: "system", content: systemContent },
            { role: "user", content: userContent }
        ]
    };
};

// THE FIX: This allows your components to find the messaging tool
import { auth } from '../firebase';

export const retryableFetch = async (url, options = {}, retries = 3) => {
    try {
        const headers = { ...options.headers };

        if (auth.currentUser) {
            const token = await auth.currentUser.getIdToken();
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(url, { ...options, headers });
        const data = await response.json();

        // If response has an error, return it so caller can handle
        if (!response.ok) {
            return { error: data.error || data.message || `HTTP ${response.status}` };
        }

        return data;
    } catch (err) {
        if (retries > 0) return retryableFetch(url, options, retries - 1);
        throw err;
    }
};

// THE FIX: This keeps the screen from staying blank
export const useRetryableFetch = () => {
    return { retryableFetch };
};