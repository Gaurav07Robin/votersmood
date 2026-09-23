import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { db } from '../config/firebase.js';
import { doc, writeBatch } from 'firebase/firestore';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pushLeadersBatched = async () => {
  const cacheFilePath = path.join(__dirname, '../data/leaders_cache.json');
  if (!fs.existsSync(cacheFilePath)) {
    console.error('No leaders_cache.json found!');
    process.exit(1);
  }

  const data = JSON.parse(fs.readFileSync(cacheFilePath, 'utf-8'));
  console.log(`Found ${data.length} leaders in local cache. Pushing to Firestore in batches...`);

  // Max 500 writes per batch in Firestore
  const BATCH_SIZE = 450; 
  let count = 0;

  for (let i = 0; i < data.length; i += BATCH_SIZE) {
    const chunk = data.slice(i, i + BATCH_SIZE);
    const batch = writeBatch(db);

    for (const leader of chunk) {
      if (!leader.id) continue;
      const leaderRef = doc(db, 'leaders', leader.id);
      batch.set(leaderRef, leader, { merge: true });
      count++;
    }

    await batch.commit();
    console.log(`Pushed ${count} / ${data.length}...`);
  }

  console.log(`✅ Successfully batched and pushed ${count} leaders to Firestore!`);
  process.exit(0);
};

pushLeadersBatched();
