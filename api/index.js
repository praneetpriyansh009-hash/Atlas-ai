import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fetch from 'node-fetch';

import aiRoutes from '../server/routes/ai.js';

dotenv.config();

const app = express();

// Middleware
app.use(cors({
    origin: true,
    credentials: true
}));
app.use(express.json());

// --- ROUTES ---
app.get('/api/health', (req, res) => res.json({ status: 'ok', mode: 'full-vercel-api' }));

// Mount all AI routes (/api/ai/podcast, /api/ai/groq, etc.)
app.use('/api/ai', aiRoutes);

// Export for Vercel Serverless
export default app;
