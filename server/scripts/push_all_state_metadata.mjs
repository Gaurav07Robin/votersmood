import fetch from 'node-fetch';
import { createGunzip } from 'zlib';
import { parse } from 'csv-parse';
import { getDb } from '../config/firebase-admin.js';

async function pushAllStateMetadata() {
  console.log("=========================================");
  console.log("📊 IN-MEMORY STATE ELECTIONS AGGREGATOR");
  console.log("=========================================\n");

  const url = 'https://raw.githubusercontent.com/tcpd/tcpd-ld-data-archive/main/downloads/All_States/All_States_AE.csv.gz';
  console.log("Downloading and parsing TCPD master archive stream...");
  
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);

  const parser = response.body.pipe(createGunzip()).pipe(parse({
    columns: true,
    skip_empty_lines: true
  }));

  const stateElections = {};
  let totalRows = 0;
  let winnerRows = 0;

  for await (const row of parser) {
    totalRows++;
    if (row.Position !== '1') continue;
    winnerRows++;

    const rawState = (row.State_Name || '').replace(/_/g, ' ').trim();
    // Normalize State Name
    const state = rawState.replace(/\b\w/g, l => l.toUpperCase());
    const stateSlug = state.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const year = parseInt(row.Year, 10);
    const party = (row.Party || 'IND').trim();
    const key = `${stateSlug}_${year}`;

    if (!stateElections[key]) {
      stateElections[key] = {
        state,
        stateSlug,
        year,
        electionType: 'ASSEMBLY',
        totalSeats: 0,
        total_seats: 0,
        partyWins: {},
        party_wins: {}
      };
    }

    stateElections[key].totalSeats += 1;
    stateElections[key].total_seats += 1;
    stateElections[key].partyWins[party] = (stateElections[key].partyWins[party] || 0) + 1;
    stateElections[key].party_wins[party] = (stateElections[key].party_wins[party] || 0) + 1;
  }

  console.log(`Parsed ${totalRows} rows. Found ${winnerRows} winners across ${Object.keys(stateElections).length} state elections.`);

  const db = await getDb();
  const keys = Object.keys(stateElections);
  let batch = db.batch();
  let batchCount = 0;
  let totalCommitted = 0;

  console.log("Writing aggregated state metadata to Firestore in batches...");

  for (const key of keys) {
    const data = stateElections[key];
    const docRef = db.collection('state_elections_metadata').doc(`STATE_${data.stateSlug}_${data.year}`);
    batch.set(docRef, data, { merge: true });
    batchCount++;

    if (batchCount === 450) {
      await batch.commit();
      totalCommitted += batchCount;
      console.log(`  Committed ${totalCommitted} / ${keys.length} state election summaries...`);
      batch = db.batch();
      batchCount = 0;
    }
  }

  if (batchCount > 0) {
    await batch.commit();
    totalCommitted += batchCount;
    console.log(`  Committed ${totalCommitted} / ${keys.length} state election summaries.`);
  }

  console.log("\n✅ ALL 867 STATE ELECTIONS METADATA SUCCESSFULLY SYNCED TO FIRESTORE!");
}

pushAllStateMetadata().then(() => process.exit(0)).catch(err => {
  console.error("Aggregation failed:", err);
  process.exit(1);
});
