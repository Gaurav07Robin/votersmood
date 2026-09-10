import { db } from '../config/firebase.js';
import { collection, getDocs } from 'firebase/firestore';
import fs from 'fs';

(async () => {
  console.log("Downloading 436 completed IDs to local tracker file...");
  const snapshot = await getDocs(collection(db, 'leaders'));
  const ids = [];
  snapshot.forEach(doc => { 
    if (doc.data().careerTimeline && doc.data().careerTimeline.length > 0) {
        ids.push(doc.id); 
    }
  });
  fs.writeFileSync('./scraping_progress.json', JSON.stringify(ids));
  console.log("✅ Done! Local file created with", ids.length, "IDs.");
  process.exit(0);
})();
