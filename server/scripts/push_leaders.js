import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { db } from '../config/firebase.js';
import { doc, setDoc } from 'firebase/firestore';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pushLeaders = async () => {
  const cacheFilePath = path.join(__dirname, '../data/leaders_cache.json');
  if (!fs.existsSync(cacheFilePath)) {
    console.error('No leaders_cache.json found!');
    process.exit(1);
  }

  const data = JSON.parse(fs.readFileSync(cacheFilePath, 'utf-8'));
  console.log(`Found ${data.length} leaders in local cache. Pushing to Firestore...`);

  let count = 0;
  for (const leader of data) {
    if (!leader.id) continue;
    try {
      await setDoc(doc(db, 'leaders', leader.id), leader, { merge: true });
      count++;
      if (count % 100 === 0) console.log(`Pushed ${count} / ${data.length}...`);
    } catch (e) {
      console.error(`Failed to push leader ${leader.id}: ${e.message}`);
    }
  }

  console.log(`✅ Successfully pushed ${count} leaders to Firestore!`);
  process.exit(0);
};

pushLeaders();
