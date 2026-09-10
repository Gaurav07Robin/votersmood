import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import csv from 'csv-parser';
import { stringify } from 'csv-stringify/sync';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '../data/historical_elections');
const RAW_FILE = path.join(DATA_DIR, 'raw_tcpd.csv');

// TCPD usually uses these headers or variations of them
const HEADER_MAP = {
  year: ['Year', 'year', 'YEAR'],
  state: ['State_Name', 'state_name', 'State', 'state', 'STATE'],
  constituency: ['Constituency_Name', 'constituency_name', 'Constituency', 'constituency', 'CONSTITUENCY'],
  candidate: ['Candidate', 'candidate', 'CANDIDATE', 'Candidate_Name'],
  party: ['Party', 'party', 'PARTY'],
  votes: ['Votes', 'votes', 'VOTES', 'Total_Votes'],
  position: ['Position', 'position', 'POSITION']
};

function getField(row, possibleKeys) {
  for (const key of possibleKeys) {
    if (row[key] !== undefined) return row[key];
  }
  return '';
}

async function processRawData() {
  if (!fs.existsSync(RAW_FILE)) {
    console.error(`ERROR: Could not find raw file at ${RAW_FILE}`);
    console.log(`Please download the TCPD or Kaggle dataset, name it 'raw_tcpd.csv', and place it in 'server/data/historical_elections/'`);
    process.exit(1);
  }

  console.log(`dY"S Parsing massive TCPD dataset...`);
  
  const yearlyData = {};

  fs.createReadStream(RAW_FILE)
    .pipe(csv())
    .on('data', (row) => {
      const year = getField(row, HEADER_MAP.year);
      const state = getField(row, HEADER_MAP.state);
      const constituency = getField(row, HEADER_MAP.constituency);
      const candidate = getField(row, HEADER_MAP.candidate);
      const party = getField(row, HEADER_MAP.party);
      const votes = getField(row, HEADER_MAP.votes);
      const position = getField(row, HEADER_MAP.position);
      const electionType = row['Election_Type'] || '';

      if (electionType === 'AE') return; // Skip Assembly Elections
      if (!year || !state || !constituency) return; // Skip invalid rows

      const cleanRow = { year, state, constituency, candidate, party, votes, position };

      if (!yearlyData[year]) {
        yearlyData[year] = [];
      }
      yearlyData[year].push(cleanRow);
    })
    .on('end', () => {
      console.log(`\no. Parsing complete. Found data for ${Object.keys(yearlyData).length} election years!`);
      
      for (const [year, rows] of Object.entries(yearlyData)) {
        const outPath = path.join(DATA_DIR, `LS_${year}.csv`);
        const csvString = stringify(rows, { header: true });
        fs.writeFileSync(outPath, csvString);
        console.log(`dY"C Created ${outPath} (${rows.length} candidates)`);
      }

      console.log(`\n🎉 Success! You can now run 'node server/scripts/ingest_historical_data.js' to push this to Firestore.`);
    })
    .on('error', (err) => {
      console.error(err);
    });
}

processRawData();
