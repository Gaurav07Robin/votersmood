// Firebase DB Audit Script - checks all collections and their document counts
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';

dotenv.config({ path: 'server/.env' });

const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const projectId = process.env.FIREBASE_PROJECT_ID;

if (!privateKey || !clientEmail) {
  console.log('\n❌ No Firebase Admin credentials found in .env');
  console.log('   (FIREBASE_PRIVATE_KEY and FIREBASE_CLIENT_EMAIL are missing)');
  console.log('   The real DB can only be queried when these are set.\n');
  console.log('🔍 However, here is the full map of ALL Firestore collections our app uses:\n');
  
  const collections = [
    { name: 'users',                   usedBy: 'auth.js',           purpose: 'Google login / user profiles' },
    { name: 'leaders',                 usedBy: 'ai_agent.js, leaders.js, fallback_ai_agent.js', purpose: 'Politicians directory (name, party, portfolio, assets, criminal records)' },
    { name: 'insights',                usedBy: 'journalist_agent.js, insights.js', purpose: 'AI-written blog articles published to /insights route' },
    { name: 'live_elections',          usedBy: 'autonomous_tracker.js, central_brain.js, journalist_agent.js', purpose: 'Live/recent elections feed (now being DEPRECATED in favour of below)' },
    { name: 'elections_metadata',      usedBy: 'election_agent.js',  purpose: 'Lok Sabha national election data (partyWins, year, totalSeats)' },
    { name: 'state_elections_metadata',usedBy: 'election_agent.js, ingest_state_level.js', purpose: 'State Assembly election data → powers /elections/state timeline charts' },
    { name: 'official_elections',      usedBy: 'polls.js',           purpose: 'Official polls & election schedules' },
    { name: 'community_polls',         usedBy: 'polls.js, journalist_agent.js', purpose: 'User-created community polls' },
    { name: 'votes',                   usedBy: 'polls.js',           purpose: 'Individual vote records' },
    { name: 'posts',                   usedBy: 'posts.js',           purpose: 'User posts / social feed' },
    { name: 'comments',               usedBy: 'comments.js',        purpose: 'Comments on posts/elections' },
    { name: 'reactions',              usedBy: 'reactions.js',       purpose: 'Likes/reactions on content' },
    { name: 'system/central_brain_state', usedBy: 'central_brain.js', purpose: 'Brain memory: which year it scraped last (historicalSyncYear)' },
  ];

  console.log(collections.map((c, i) => 
    `  ${(i+1).toString().padStart(2)}. 📂 ${c.name.padEnd(30)} → ${c.purpose}`
  ).join('\n'));
  
  console.log('\n📌 To audit LIVE data counts, add FIREBASE_PRIVATE_KEY and FIREBASE_CLIENT_EMAIL to server/.env\n');
  process.exit(0);
}

// If credentials exist, actually query
const app = initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
const db = getFirestore(app);

const collectionsToCheck = [
  'users', 'leaders', 'insights', 'live_elections',
  'elections_metadata', 'state_elections_metadata',
  'official_elections', 'community_polls', 'votes', 'posts', 'comments', 'reactions'
];

console.log('\n🔍 Fetching live Firestore collection counts...\n');

for (const col of collectionsToCheck) {
  try {
    const snap = await db.collection(col).get();
    const count = snap.size;
    let sample = '';
    if (count > 0) {
      const firstDoc = snap.docs[0];
      const fields = Object.keys(firstDoc.data()).slice(0, 4).join(', ');
      sample = `  (fields: ${fields})`;
    }
    console.log(`  ✅ ${col.padEnd(30)} ${count.toString().padStart(5)} docs${sample}`);
  } catch (e) {
    console.log(`  ❌ ${col.padEnd(30)} Error: ${e.message}`);
  }
}

// Check brain state
try {
  const brain = await db.collection('system').doc('central_brain_state').get();
  if (brain.exists) {
    console.log('\n🧠 Central Brain State:', JSON.stringify(brain.data(), null, 2));
  }
} catch(e) {}

console.log('\n✔ Audit complete!\n');
