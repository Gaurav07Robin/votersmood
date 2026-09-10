import { db } from '../config/firebase.js';
import { collection, getDocs } from 'firebase/firestore';

async function checkProgress() {
  console.log("🔍 Connecting to Firestore database to check AI progress...");
  try {
    const snapshot = await getDocs(collection(db, 'leaders'));
    let total = 0;
    let scraped = 0;
    
    snapshot.forEach(doc => {
      total++;
      const data = doc.data();
      // Check if the AI successfully added the careerTimeline array
      if (data.careerTimeline && data.careerTimeline.length > 0) {
        scraped++;
      }
    });
    
    console.log(`\n======================================`);
    console.log(`📊 AI SCRAPING PROGRESS REPORT`);
    console.log(`======================================`);
    console.log(`👥 Total Leaders in DB: ${total}`);
    console.log(`✅ Timelines Successfully Scraped: ${scraped}`);
    console.log(`⏳ Still waiting / Missing Wikipedia: ${total - scraped}`);
    console.log(`======================================\n`);
    
  } catch (error) {
    console.error("❌ Error fetching data:", error);
  }
  process.exit(0);
}

checkProgress();
