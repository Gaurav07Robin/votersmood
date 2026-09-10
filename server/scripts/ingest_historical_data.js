import { db } from '../config/firebase.js';
import { doc, setDoc, writeBatch } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import csv from 'csv-parser';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '../data/historical_elections');

// Slugify string for doc ID (e.g., "Uttar Pradesh" -> "uttar-pradesh")
const slugify = (text) => text.toString().toLowerCase().trim()
  .replace(/\s+/g, '-')
  .replace(/[^\w\-]+/g, '')
  .replace(/\-\-+/g, '-');

async function ingestCsvData(filePath) {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => {
        results.push(data);
      })
      .on('end', () => resolve(results))
      .on('error', (err) => reject(err));
  });
}

async function processElections() {
  const files = fs.readdirSync(DATA_DIR).filter(f => f.endsWith('.csv'));
  
  for (const file of files) {
    console.log(`\n📄 Processing ${file}...`);
    const filePath = path.join(DATA_DIR, file);
    const rawData = await ingestCsvData(filePath);
    
    // Group by Year > State > Constituency
    const constituencies = {};
    const yearSummary = {
        totalSeats: 0,
        partyWins: {}
    };

    let electionYear = null;

    rawData.forEach(row => {
      const { year, state, constituency, candidate, party, votes, position } = row;
      electionYear = year;
      
      const key = `${year}_${slugify(state)}_${slugify(constituency)}`;
      
      if (!constituencies[key]) {
        constituencies[key] = {
          year: parseInt(year),
          state: state.trim(),
          constituency: constituency.trim(),
          total_votes: 0,
          candidates: []
        };
      }
      
      const votesNum = parseInt(votes) || 0;
      constituencies[key].total_votes += votesNum;
      
      constituencies[key].candidates.push({
        name: candidate.trim(),
        party: party.trim(),
        votes: votesNum,
        position: parseInt(position) || 99
      });
    });

    console.log(`📊 Found ${Object.keys(constituencies).length} constituencies in ${file}.`);

    const batchWrites = [];
    let batch = writeBatch(db);
    let opCount = 0;

    for (const [key, data] of Object.entries(constituencies)) {
      // Sort candidates by votes descending
      data.candidates.sort((a, b) => b.votes - a.votes);
      
      // Calculate percentages and margins
      let margin = 0;
      if (data.candidates.length > 1) {
        margin = data.candidates[0].votes - data.candidates[1].votes;
      }
      data.margin = margin;
      
      data.candidates.forEach(c => {
        c.percentage = data.total_votes > 0 ? parseFloat(((c.votes / data.total_votes) * 100).toFixed(2)) : 0;
      });
      
      // Keep only top 5 candidates
      data.candidates = data.candidates.slice(0, 5);

      // Update Summary logic
      yearSummary.totalSeats += 1;
      const winningParty = data.candidates[0].party;
      yearSummary.partyWins[winningParty] = (yearSummary.partyWins[winningParty] || 0) + 1;

      // Prepare Firestore Doc
      const docRef = doc(db, 'elections_constituencies', `LS_${key}`);
      batch.set(docRef, data);
      opCount++;

      // Commit batches of 400
      if (opCount >= 400) {
        batchWrites.push(batch.commit());
        batch = writeBatch(db); // Re-initialize the batch here
        opCount = 0;
      }
    }
    
    // Commit remaining batch
    if (opCount > 0) {
      batchWrites.push(batch.commit());
    }

    // Write Summary
    if (electionYear) {
      const summaryRef = doc(db, 'elections_metadata', `LS_${electionYear}_Summary`);
      batchWrites.push(setDoc(summaryRef, {
        year: parseInt(electionYear),
        total_seats: yearSummary.totalSeats,
        party_wins: yearSummary.partyWins,
        updatedAt: new Date().toISOString()
      }));
    }

    await Promise.all(batchWrites);
    console.log(`✅ Successfully pushed ${file} to Firestore!`);
  }
  console.log(`\n🎉 Data Ingestion Complete!`);
}

processElections().catch(console.error);
