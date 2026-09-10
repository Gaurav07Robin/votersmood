import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBlmppRcdQK9B8UVUp5zqFAG9f0EBbsCUM",
  authDomain: "votersmood78.firebaseapp.com",
  projectId: "votersmood78",
  storageBucket: "votersmood78.firebasestorage.app",
  messagingSenderId: "908059965361",
  appId: "1:908059965361:web:aa19dcaca58574f5cd6f90",
  measurementId: "G-KHJVV6ECP2"
};

// Initialize Firebase App for Client SDK
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
// Force Google popup to prompt account selection every time
googleProvider.setCustomParameters({ prompt: 'select_account' });

export { signInWithPopup };
