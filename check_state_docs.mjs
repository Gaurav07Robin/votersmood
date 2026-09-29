import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import dotenv from 'dotenv';
dotenv.config({ path: 'server/.env' });

const app = getApps().length === 0 ? initializeApp({ credential: cert({
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
}) }) : getApps()[0];

const db = getFirestore();

// Check a sample state election doc
const snap = await db.collection('state_elections_metadata').limit(3).get();
console.log('\n📋 Sample state_elections_metadata docs:\n');
snap.forEach(doc => {
  const d = doc.data();
  console.log('ID:', doc.id);
  console.log('Fields:', Object.keys(d));
  console.log('state:', d.state);
  console.log('year:', d.year);
  console.log('totalSeats:', d.totalSeats);
  console.log('partyWins:', d.partyWins);
  console.log('party_wins:', d.party_wins);
  console.log('---');
});
