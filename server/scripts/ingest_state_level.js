import { db } from '../config/firebase.js';
import { doc, setDoc, writeBatch, collection, getDocs, deleteDoc } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import csv from 'csv-parser';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CSV_FILE = path.join(__dirname, '../data/historical_elections/TCPD_GE_All_States_2026-9-8.csv/All_States_GE.csv');

const slugify = (text) => text.toString().toLowerCase().trim()
  .replace(/\s+/g, '-')
  .replace(/[^\w\-]+/g, '')
  .replace(/\-\-+/g, '-');

async function processStateWiseElections() {
  console.log(`Clearing existing state_elections_metadata...`);
  const collRef = collection(db, 'state_elections_metadata');
  const snap = await getDocs(collRef);
  let delBatch = writeBatch(db);
  let delCount = 0;
  for (const doc of snap.docs) {
      delBatch.delete(doc.ref);
      delCount++;
      if (delCount >= 400) {
          await delBatch.commit();
          delBatch = writeBatch(db);
          delCount = 0;
      }
  }
  if (delCount > 0) {
      await delBatch.commit();
  }
  console.log(`Cleared existing data.`);

  console.log(`\nStarting Data Ingestion from ${CSV_FILE}`);
  
  if (!fs.existsSync(CSV_FILE)) {
    console.error("File not found:", CSV_FILE);
    return;
  }

  const stateSummary = {};

  return new Promise((resolve, reject) => {
    let rowCount = 0;
    fs.createReadStream(CSV_FILE)
      .pipe(csv())
      .on('data', (row) => {
        rowCount++;
        
        // ONLY PROCESS REGULAR ELECTIONS (Poll_No == 0)
        if (row.Poll_No !== '0') return;

        const state = row.State_Name;
        const year = row.Year;
        const party = row.Party;
        const position = parseInt(row.Position);

        if (!state || !year || !party || isNaN(position)) return;

        const key = `${slugify(state)}_${year}`;

        if (!stateSummary[key]) {
          stateSummary[key] = {
            state: state.replace(/_/g, ' '),
            stateSlug: slugify(state),
            year: parseInt(year),
            totalSeats: 0,
            partyWins: {}
          };
        }

        if (position === 1) {
          stateSummary[key].totalSeats += 1;
          stateSummary[key].partyWins[party] = (stateSummary[key].partyWins[party] || 0) + 1;
        }
      })
      .on('end', async () => {
        console.log(`\nFinished reading CSV. Processed ${rowCount} rows.`);
        console.log(`Found ${Object.keys(stateSummary).length} state-year summaries.`);

        const batchWrites = [];
        let batch = writeBatch(db);
        let opCount = 0;

        for (const [key, data] of Object.entries(stateSummary)) {
          const docRef = doc(db, 'state_elections_metadata', `STATE_${key}`);
          
          batch.set(docRef, {
            ...data,
            updatedAt: new Date().toISOString()
          });
          
          opCount++;

          if (opCount >= 400) {
            batchWrites.push(batch.commit());
            batch = writeBatch(db);
            opCount = 0;
          }
        }

        if (opCount > 0) {
          batchWrites.push(batch.commit());
        }

        await Promise.all(batchWrites);
        console.log(`Successfully pushed state summaries to Firestore!`);
        resolve();
      })
      .on('error', reject);
  });
}

processStateWiseElections().catch(console.error);
