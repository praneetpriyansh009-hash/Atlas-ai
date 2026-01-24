import admin from 'firebase-admin';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// specific check for service account file
const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || path.join(__dirname, '../../serviceAccountKey.json');

try {
    if (fs.existsSync(serviceAccountPath)) {
        const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            projectId: 'atlas-ai-c40b7' // Fix audience claim issue
        });
        console.log("Firebase Admin initialized with service account file.");
    } else {
        // Fallback or warning if no file found - maybe user is relying on Google Cloud auto-discovery
        // OR we can initialize without credentials if running in a Google Cloud environment (like App Engine)
        // For local development, this might fail for verifyIdToken if not authenticated.
        console.warn("Warning: serviceAccountKey.json not found and GOOGLE_APPLICATION_CREDENTIALS not set.");
        console.warn("Attempting to initialize with default application credentials.");
        try {
            admin.initializeApp();
        } catch (e) {
            console.error("Firebase Default Init Failed:", e.message);
        }
    }
} catch (error) {
    console.error("Firebase Admin Initialization Error:", error);
}

export default admin;
