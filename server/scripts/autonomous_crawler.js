import { getDb } from '../config/firebase-admin.js';
import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const STATE_FILE = path.join(__dirname, 'crawler_state.json');

// Persistent Memory Loader
function loadState() {
  if (fs.existsSync(STATE_FILE)) {
    return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
  }
  return {};
}

function saveState(stateData) {
  fs.writeFileSync(STATE_FILE, JSON.stringify(stateData, null, 2));
}

const statesList = [
  'Uttar Pradesh', 'Maharashtra', 'West Bengal', 'Bihar', 'Tamil Nadu',
  'Madhya Pradesh', 'Karnataka', 'Gujarat', 'Andhra Pradesh', 'Rajasthan',
  'Odisha', 'Kerala', 'Telangana', 'Assam', 'Jharkhand',
  'Punjab', 'Chhattisgarh', 'Haryana', 'Delhi', 'Jammu and Kashmir',
  'Uttarakhand', 'Himachal Pradesh', 'Tripura', 'Meghalaya', 'Manipur',
  'Nagaland', 'Goa', 'Arunachal Pradesh', 'Puducherry', 'Mizoram', 'Sikkim'
];

// Target recent elections
const TARGET_ELECTIONS = [];
statesList.forEach(state => {
    [2023, 2022, 2021, 2020, 2019, 2018, 2017].forEach(year => {
        const stateUrlStr = state.replace(/ /g, '_');
        TARGET_ELECTIONS.push({
            state: state,
            year: year,
            id: `${state}_${year}`,
            wikiTitle: `${year}_${stateUrlStr}_Legislative_Assembly_election`
        });
    });
});

async function extractFromDOM(title) {
  console.log(`Fetching Wikipedia page for ${title}...`);
  const res = await fetch(`https://en.wikipedia.org/w/api.php?action=parse&page=${title}&prop=text&format=json`);
  const json = await res.json();
  if (!json.parse || !json.parse.text) return null;
  const html = json.parse.text['*'];
  const $ = cheerio.load(html);
  
  let targetTable = null;
  $('table.wikitable').each((i, el) => {
    const headers = $(el).find('th').map((j, th) => $(th).text().trim().toLowerCase()).get();
    if (headers.some(h => h.includes('constituency')) && headers.some(h => h.includes('winner') || h.includes('member') || h.includes('candidate'))) {
      targetTable = el;
      return false; // break
    }
  });

  if (!targetTable) return null;

  const results = [];
  const rows = $(targetTable).find('tr');
  
  let colIndex = { constituency: -1, winner: -1, party: -1, margin: -1 };
  
  // Find column indices
  $(rows[0]).find('th, td').each((i, el) => {
      const text = $(el).text().toLowerCase().trim();
      if (text.includes('constituency')) colIndex.constituency = i;
      else if (text.includes('winner') || text.includes('member') || (text.includes('candidate') && colIndex.winner === -1)) colIndex.winner = i;
      else if (text.includes('party')) colIndex.party = i;
      else if (text.includes('margin')) colIndex.margin = i;
  });

  // Second row might have the sub-headers if colspan was used
  if (colIndex.constituency === -1) {
     $(rows[1]).find('th, td').each((i, el) => {
        const text = $(el).text().toLowerCase().trim();
        if (text.includes('constituency')) colIndex.constituency = i;
        else if (text.includes('winner') || text.includes('member') || (text.includes('candidate') && colIndex.winner === -1)) colIndex.winner = i;
        else if (text.includes('party')) colIndex.party = i;
        else if (text.includes('margin')) colIndex.margin = i;
    });
  }

  if (colIndex.constituency === -1 || colIndex.winner === -1) {
      console.log("Could not reliably map columns using DOM. Needs AI fallback.");
      return null; 
  }

  for (let i = 1; i < rows.length; i++) {
    const cells = $(rows[i]).find('td, th');
    if (cells.length < 3) continue; // Skip malformed rows
    
    // Some tables have District rowspan which throws off index by 1 for subsequent rows.
    // We will do a fuzzy extraction: assume constituency is string, winner is string.
    const rowTexts = cells.map((j, c) => $(c).text().trim().replace(/\\n/g, '')).get();
    
    let constituency = rowTexts[colIndex.constituency];
    let winner = rowTexts[colIndex.winner];
    let party = colIndex.party !== -1 ? rowTexts[colIndex.party] : 'IND';
    let marginText = colIndex.margin !== -1 ? rowTexts[colIndex.margin] : '0';

    // If offset due to rowspan (first column missing)
    if (!constituency || constituency.match(/^\d+$/)) {
        // Shift right if the first col was a district that got rowspan'd out
        constituency = rowTexts[colIndex.constituency - 1] || constituency;
        winner = rowTexts[colIndex.winner - 1] || winner;
        party = colIndex.party !== -1 ? (rowTexts[colIndex.party - 1] || party) : party;
    }
    
    if (constituency && winner && constituency.length > 2 && isNaN(parseInt(constituency))) {
        results.push({
            constituency: constituency,
            winner: winner,
            party: party.substring(0, 10), // clamp length
            margin: parseInt(marginText.replace(/,/g, '')) || 0
        });
    }
  }

  return results.length > 0 ? results : null;
}

async function processElection(election, stateMemory) {
  if (stateMemory[election.id] === 'SUCCESS') {
      return; // Skip already done
  }
  
  console.log(`\n--- Processing ${election.state} ${election.year} ---`);
  
  let results = await extractFromDOM(election.wikiTitle);
  
  if (!results) {
      console.log(`DOM extraction failed or returned 0 rows for ${election.id}. Marking as FAILED_NEEDS_AI`);
      stateMemory[election.id] = 'FAILED_NEEDS_AI';
      saveState(stateMemory);
      return;
  }
  
  console.log(`Extracted ${results.length} constituencies via lightning-fast DOM traversal!`);

  const partyWins = {};
  results.forEach(r => {
    const party = r.party || 'IND';
    partyWins[party] = (partyWins[party] || 0) + 1;
  });

  const metadata = {
    state: election.state,
    year: election.year,
    electionType: 'ASSEMBLY',
    totalSeats: results.length,
    partyWins: partyWins,
    lastUpdated: new Date().toISOString()
  };

  const db = await getDb();
  const batch = db.batch();
  
  const stateSlug = election.state.toLowerCase().replace(/ /g, '_');
  const metaRef = db.collection('state_elections_metadata').doc(`STATE_${stateSlug}_${election.year}`);
  batch.set(metaRef, metadata);

  let validCount = 0;
  for (const c of results) {
    if (!c.constituency) continue;
    const cSlug = c.constituency.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (!cSlug) continue;
    
    const cRef = db.collection('elections_constituencies').doc(`${stateSlug}_${election.year}_${cSlug}`);
    batch.set(cRef, {
      state: election.state,
      year: election.year,
      electionType: 'ASSEMBLY',
      constituency: c.constituency,
      winner: c.winner || '',
      party: c.party || 'IND',
      margin: parseInt(c.margin) || 0,
      timestamp: new Date().toISOString()
    });
    validCount++;
  }

  await batch.commit();
  console.log(`Pushed ${validCount} constituencies to Firebase.`);
  
  stateMemory[election.id] = 'SUCCESS';
  saveState(stateMemory);
}

async function run() {
  console.log("Starting Self-Healing DOM Crawler...");
  const stateMemory = loadState();
  
  for (const election of TARGET_ELECTIONS) {
    await processElection(election, stateMemory);
    await new Promise(resolve => setTimeout(resolve, 500)); // Blazing fast
  }
  console.log("Workflow Complete!");
  process.exit(0);
}

run();
