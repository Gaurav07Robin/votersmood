import { getDb } from '../config/firebase-admin.js';

async function runVerifier() {
  console.log("=========================================");
  console.log("🔍 OPINAR DATA VERIFIER INITIATED");
  console.log("=========================================\n");

  const db = await getDb();
  const metadataSnap = await db.collection('state_elections_metadata').get();
  
  if (metadataSnap.empty) {
    console.log("❌ No election metadata found. Database is empty.");
    return;
  }

  let totalErrors = 0;
  let totalVerified = 0;

  for (const metaDoc of metadataSnap.docs) {
    const meta = metaDoc.data();
    const expectedSeats = meta.totalSeats;
    const state = meta.state;
    const year = meta.year;

    console.log(`\nVerifying ${state} ${year}...`);
    
    // Check 1: Constituency Count Match
    const constSnap = await db.collection('elections_constituencies')
      .where('state', '==', state)
      .where('year', '==', year)
      .get();
      
    const actualSeats = constSnap.size;
    
    if (actualSeats !== expectedSeats) {
        console.log(`  ❌ COUNT MISMATCH: Expected ${expectedSeats} seats, found ${actualSeats} in database.`);
        totalErrors++;
    } else {
        console.log(`  ✅ COUNT MATCH: ${actualSeats} / ${expectedSeats} seats verified.`);
    }

    // Check 2: Data Integrity (No blank winners, no null margins)
    let badDocs = 0;
    constSnap.forEach(doc => {
        const d = doc.data();
        if (!d.winner || d.winner.trim() === '' || typeof d.margin !== 'number' || isNaN(d.margin) || !d.party) {
            badDocs++;
        }
    });

    if (badDocs > 0) {
        console.log(`  ❌ INTEGRITY FAILURE: ${badDocs} constituencies have missing winners, null margins, or empty parties.`);
        totalErrors++;
    } else {
        console.log(`  ✅ DATA INTEGRITY: All ${actualSeats} records have clean winner/margin/party formatting.`);
    }
    
    totalVerified += actualSeats;
  }

  console.log("\n=========================================");
  if (totalErrors === 0) {
      console.log(`🏆 ALL DATA VERIFIED! Successfully audited ${totalVerified} constituencies with 0 errors.`);
  } else {
      console.log(`⚠️ VERIFICATION FAILED: Found ${totalErrors} architectural anomalies across ${totalVerified} constituencies.`);
  }
  console.log("=========================================\n");
}

runVerifier().catch(console.error);
