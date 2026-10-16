import { db } from '../config/firebase.js';
import { doc, deleteDoc, getDoc } from 'firebase/firestore';

// const DUMMY_LEADER_IDS = [
//   'rahul-gandhi',
//   'mamata-banerjee',
//   'devendra-fadnavis',
//   'nitin-gadkari',
//   'shashi-tharoor',
//   'akhilesh-yadav'
// ];

const removeDummyLeadersFromDB = async () => {
  console.log('📂 Checking and deleting dummy leader documents from Cloud Firestore DB...');

  if (!db) {
    console.error('Database connection unavailable!');
    return;
  }

  let deletedCount = 0;
  for (const id of DUMMY_LEADER_IDS) {
    try {
      const leaderRef = doc(db, 'leaders', id);
      const snap = await getDoc(leaderRef);
      if (snap.exists()) {
        await deleteDoc(leaderRef);
        deletedCount++;
        console.log(`🔥 Deleted dummy leader from Cloud Firestore DB: [ID: ${id}]`);
      } else {
        console.log(`ℹ Document [ID: ${id}] not found in Firestore DB.`);
      }
    } catch (e) {
      console.warn(`Error deleting ${id}:`, e.message);
    }
  }

  console.log('\n======================================================');
  console.log(`🎉 SUCCESS: Successfully deleted ${deletedCount} dummy leader documents from Cloud Firestore DB!`);
  console.log('======================================================\n');
};

removeDummyLeadersFromDB()
  .then(() => process.exit(0))
  .catch(e => {
    console.error('Failed to remove dummy leaders:', e);
    process.exit(1);
  });
