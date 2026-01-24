import admin from 'firebase-admin';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// specific check for service account file or environment variable
const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || path.join(__dirname, '../../serviceAccountKey.json');
const serviceAccountEnv = process.env.FIREBASE_SERVICE_ACCOUNT;

try {
    if (serviceAccountEnv) {
        // Option 1: Initialize from environment variable (JSON string)
        const serviceAccount = JSON.parse(serviceAccountEnv);
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            projectId: serviceAccount.project_id
        });
        console.log("Firebase Admin initialized from environment variable.");
    } else if (fs.existsSync(serviceAccountPath)) {
        // Option 2: Initialize from service account file
        const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            projectId: serviceAccount.project_id || 'atlas-ai-c40b7'
        });
        console.log("Firebase Admin initialized with service account file.");
    } else {
        // Fallback: Initialize with default credentials
        console.warn("Warning: No Firebase credentials found (env or file). Using default fallback.");
        admin.initializeApp();
    }
} catch (error) {
    console.error("Firebase Admin Initialization Error:", error.message);
}

export default admin;
