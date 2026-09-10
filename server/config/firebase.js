import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import dotenv from 'dotenv';

dotenv.config();

// Firebase JS SDK configuration loaded securely from server-side environment variables
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || 'AIzaSyBlmppRcdQK9B8UVUp5zqFAG9f0EBbsCUM',
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || 'votersmood78.firebaseapp.com',
  projectId: process.env.FIREBASE_PROJECT_ID || 'votersmood78',
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || 'votersmood78.firebasestorage.app',
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || '908059965361',
  appId: process.env.FIREBASE_APP_ID || '1:908059965361:web:aa19dcaca58574f5cd6f90',
  measurementId: process.env.FIREBASE_MEASUREMENT_ID || 'G-KHJVV6ECP2'
};

let app;
let db;

try {
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
    console.log(`✔ Initialized Server-Side Firebase Web SDK Connection [Project: ${firebaseConfig.projectId}]`);
  } else {
    app = getApps()[0];
  }
  db = getFirestore(app);

  // Connect to emulator if flag is set (backend equivalent of window.location.hostname === 'localhost')
  if (process.env.USE_FIREBASE_EMULATOR === 'true') {
    connectFirestoreEmulator(db, '127.0.0.1', 8080);
    console.log('🔗 Connected to Firestore Local Emulator on 127.0.0.1:8080');
  }
} catch (error) {
  console.warn('⚠️ Server-side Firebase DB connection warning:', error.message);
}

export { app, db, firebaseConfig };
