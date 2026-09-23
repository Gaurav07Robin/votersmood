import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import dotenv from 'dotenv';

dotenv.config();

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function clearPosts() {
  console.log("Fetching posts...");
  const snap = await getDocs(collection(db, 'posts'));
  console.log(`Found ${snap.docs.length} posts to delete.`);
  
  for (const d of snap.docs) {
    await deleteDoc(doc(db, 'posts', d.id));
  }
  console.log("All posts deleted.");
  process.exit(0);
}

clearPosts();
