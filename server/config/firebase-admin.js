import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

let db = null;
let auth = null;
let initPromise = null;

const initAdminSDK = async () => {
  if (process.env.VERCEL === '1' || process.env.VERCEL_ENV) {
    return;
  }

  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (clientEmail && privateKey) {
    try {
      const { initializeApp, getApps, cert } = await import('firebase-admin/app');
      const { getFirestore } = await import('firebase-admin/firestore');
      const { getAuth } = await import('firebase-admin/auth');

      if (!getApps().length) {
        initializeApp({
          credential: cert({
            projectId: process.env.FIREBASE_PROJECT_ID || 'votersmood78',
            clientEmail,
            privateKey,
          }),
        });
        console.log('🔥 Initialized Firebase Admin SDK with Service Account');
      }
      db = getFirestore();
      auth = getAuth();
    } catch (error) {
      console.warn('⚠️ Firebase Admin SDK serverless bypass active:', error.message);
    }
  } else {
    console.warn('⚠️ FIREBASE_CLIENT_EMAIL or FIREBASE_PRIVATE_KEY is missing from environment variables.');
  }
};

export const getDb = async () => {
  if (!initPromise) initPromise = initAdminSDK();
  await initPromise;
  if (!db) throw new Error("Firebase Admin DB not initialized. Check your Service Account keys.");
  return db;
};

export const getAuthAdmin = async () => {
  if (!initPromise) initPromise = initAdminSDK();
  await initPromise;
  return auth;
};
