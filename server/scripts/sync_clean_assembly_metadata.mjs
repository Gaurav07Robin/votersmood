import fetch from 'node-fetch';
import { createGunzip } from 'zlib';
import { parse } from 'csv-parse';
import { getDb } from '../config/firebase-admin.js';

async function syncCleanAssemblyMetadata() {
  console.log("=========================================");
  console.log("🏛️ SYNCING 5-YEAR & DISSOLUTION GENERAL ELECTIONS ONLY");
  console.log("=========================================\n");

  const url = 'https://raw.githubusercontent.com/tcpd/tcpd-ld-data-archive/main/downloads/All_States/All_States_AE.csv.gz';
  console.log("Streaming TCPD archive and filtering Poll_No === '0' (excluding by-elections)...");

  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);

  const parser = response.body.pipe(createGunzip()).pipe(parse({
    columns: true,
    skip_empty_lines: true
  }));

  const cleanElections = {};

  for await (const row of parser) {
    if (row.Position !== '1') continue;
    // CRITICAL: Filter out by-elections, keep ONLY main general assembly elections & dissolved mid-term general elections
    if (row.Poll_No !== '0') continue;

    const rawState = (row.State_Name || '').replace(/_/g, ' ').trim();
    const state = rawState.replace(/\b\w/g, l => l.toUpperCase());
    const stateSlug = state.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const year = parseInt(row.Year, 10);
    const party = (row.Party || 'IND').trim();
    const key = `STATE_${stateSlug}_${year}`;

    if (!cleanElections[key]) {
      cleanElections[key] = {
        state,
        stateSlug,
        year,
        electionType: 'ASSEMBLY',
        isGeneralElection: true,
        totalSeats: 0,
        total_seats: 0,
        partyWins: {},
        party_wins: {}
      };
    }

    cleanElections[key].totalSeats += 1;
    cleanElections[key].total_seats += 1;
    cleanElections[key].partyWins[party] = (cleanElections[key].partyWins[party] || 0) + 1;
    cleanElections[key].party_wins[party] = (cleanElections[key].party_wins[party] || 0) + 1;
  }

  const cleanKeys = new Set(Object.keys(cleanElections));
  console.log(`Found ${cleanKeys.size} authentic General Assembly elections nationwide.`);

  const db = await getDb();
  console.log("Auditing existing state_elections_metadata in Firestore to remove by-election clutter...");

  const existingSnap = await db.collection('state_elections_metadata').get();
  let delBatch = db.batch();
  let delCount = 0;

  for (const doc of existingSnap.docs) {
    if (!cleanKeys.has(doc.id)) {
      delBatch.delete(doc.ref);
      delCount++;
      if (delCount >= 400) {
        await delBatch.commit();
        delBatch = db.batch();
        delCount = 0;
      }
    }
  }
  if (delCount > 0) {
    await delBatch.commit();
  }
  console.log(`Removed ${delCount} by-election / clutter records from state_elections_metadata.`);

  console.log("Upserting clean general elections into Firestore...");
  let setBatch = db.batch();
  let setCount = 0;
  let totalSaved = 0;

  for (const docId of cleanKeys) {
    const data = cleanElections[docId];
    setBatch.set(db.collection('state_elections_metadata').doc(docId), data, { merge: true });
    setCount++;

    if (setCount >= 400) {
      await setBatch.commit();
      totalSaved += setCount;
      console.log(`  Committed ${totalSaved} / ${cleanKeys.size}...`);
      setBatch = db.batch();
      setCount = 0;
    }
  }

  if (setCount > 0) {
    await setBatch.commit();
    totalSaved += setCount;
    console.log(`  Committed ${totalSaved} / ${cleanKeys.size}.`);
  }

  console.log("\n✅ CLEAN GENERAL ELECTIONS SYNCED! Timeline is now strictly 5-year cycles & genuine assembly dissolutions.");
}

syncCleanAssemblyMetadata().then(() => process.exit(0)).catch(err => {
  console.error("Sync failed:", err);
  process.exit(1);
});
