import { getDb } from '../config/firebase-admin.js';
import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const STATE_FILE = path.join(__dirname, 'crawler_state.json');

function loadState() {
  if (fs.existsSync(STATE_FILE)) return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
  return {};
}

function saveState(stateData) {
  fs.writeFileSync(STATE_FILE, JSON.stringify(stateData, null, 2));
}

const TARGET_ELECTIONS = [];
['Uttar Pradesh', 'Maharashtra', 'West Bengal', 'Bihar', 'Tamil Nadu', 'Madhya Pradesh', 'Karnataka', 'Gujarat', 'Rajasthan', 'Andhra Pradesh'].forEach(state => {
    [2023, 2022, 2021, 2020, 2019, 2018, 2017].forEach(year => {
        TARGET_ELECTIONS.push({
            state: state,
            year: year,
            id: `${state}_${year}`,
            wikiTitle: `${year}_${state.replace(/ /g, '_')}_Legislative_Assembly_election`
        });
    });
});

async function extractMessyCSV(title) {
  try {
    const res = await fetch(`https://en.wikipedia.org/w/api.php?action=parse&page=${title}&prop=text&format=json`, {
      headers: {
        'User-Agent': 'VotersMoodBot/1.0 (admin@votersmood.com)'
      }
    });
    const json = await res.json();
    if (!json.parse || !json.parse.text) return null;
    const $ = cheerio.load(json.parse.text['*']);
    
    let targetTable = null;
    $('table.wikitable').each((i, el) => {
      const text = $(el).text().toLowerCase();
      if (text.includes('constituency') && text.includes('winner')) {
        targetTable = el;
        return false; // break
      }
    });

    if (!targetTable) return null;

    let csvRows = [];
    $(targetTable).find('tr').each((i, row) => {
      let cells = [];
      $(row).find('th, td').each((j, cell) => {
        let cellText = $(cell).text().trim().replace(/\n/g, ' ').replace(/,/g, '');
        if (!cellText) {
            const aTitle = $(cell).find('a').attr('title');
            if (aTitle) cellText = aTitle;
        }
        cells.push(cellText);
      });
      if (cells.length > 2) csvRows.push(cells.join(','));
    });
    
    return csvRows.join('\n');
  } catch (e) {
    console.log("Fetch error for " + title + ": " + e.message);
    return null;
  }
}

async function callAI(csvData, state, year) {
  const prompt = `
  You are a data normalization AI. I have extracted a messy CSV from Wikipedia for the ${state} ${year} Assembly Election.
  Due to rowspans (e.g. District names), some rows might be shifted by 1 column. 
  
  Identify the true 'Constituency', 'Winner', 'Party', and 'Margin' from each row.
  - Party should be a short abbreviation (e.g. 'BJP', 'INC', 'SP', 'AAP', 'TMC').
  - Ignore summary rows.
  - Return ONLY a raw JSON array of objects. Do not include markdown \`\`\`json blocks.
  
  Format:
  [{"constituency": "Agra", "winner": "John Doe", "party": "BJP", "margin": 15000}]
  
  Here is the messy CSV:
  ${csvData}
  `;

  try {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: 'openai/gpt-4o-mini',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0
        })
    });
    const response = await res.json();
    if (!response.choices) throw new Error(JSON.stringify(response));
    
    let text = response.choices[0].message.content.trim();
    if (text.startsWith('```json')) text = text.replace(/```json/g, '').replace(/```/g, '').trim();
    if (text.startsWith('```')) text = text.replace(/```/g, '').trim();
    return JSON.parse(text);
  } catch (e) {
    console.log("AI Failed or Rate Limited:", e.message);
    return null;
  }
}

async function run() {
  console.log("Starting Universal Hybrid AI Crawler...");
  const stateMemory = loadState();
  
  for (const election of TARGET_ELECTIONS) {
    if (stateMemory[election.id] === 'SUCCESS') {
        console.log(`Skipping ${election.id} (already success)`);
        continue;
    }
    
    console.log(`\n[${election.id}] Fetching Wikipedia...`);
    const csvData = await extractMessyCSV(election.wikiTitle);
    
    if (!csvData) {
        console.log(`[${election.id}] No results table found.`);
        stateMemory[election.id] = 'NO_DATA';
        saveState(stateMemory);
        continue;
    }
    
    console.log(`[${election.id}] Extracted messy CSV (${csvData.length} bytes). Sending to Gemini AI for normalization...`);
    
    const lines = csvData.split('\n');
    const header = lines[0];
    const dataLines = lines.slice(1);
    const chunkSize = 150; 
    let allResults = [];
    
    for (let i = 0; i < dataLines.length; i += chunkSize) {
        const chunkCsv = header + '\n' + dataLines.slice(i, i + chunkSize).join('\n');
        console.log(`  -> Sending chunk ${i/chunkSize + 1}...`);
        const json = await callAI(chunkCsv, election.state, election.year);
        if (json && Array.isArray(json)) {
            allResults = allResults.concat(json);
        } else {
            console.log("  -> Chunk failed.");
        }
        console.log("  -> Waiting 5 seconds to respect Gemini Free Tier limits...");
        await new Promise(r => setTimeout(r, 5000));
    }
    
    if (allResults.length > 0) {
        const db = await getDb();
        const batch = db.batch();
        const stateSlug = election.state.toLowerCase().replace(/ /g, '_');
        
        const partyWins = {};
        allResults.forEach(r => { partyWins[r.party || 'IND'] = (partyWins[r.party || 'IND'] || 0) + 1; });
        batch.set(db.collection('state_elections_metadata').doc(`STATE_${stateSlug}_${election.year}`), {
            state: election.state, year: election.year, electionType: 'ASSEMBLY', totalSeats: allResults.length, partyWins, lastUpdated: new Date().toISOString()
        });
        
        allResults.forEach(c => {
            if (!c.constituency) return;
            const cSlug = c.constituency.toLowerCase().replace(/[^a-z0-9]/g, '');
            if (!cSlug) return;
            batch.set(db.collection('elections_constituencies').doc(`${stateSlug}_${election.year}_${cSlug}`), {
                state: election.state, year: election.year, electionType: 'ASSEMBLY', constituency: c.constituency, winner: c.winner || '', party: c.party || 'IND', margin: parseInt(c.margin) || 0, timestamp: new Date().toISOString()
            });
        });
        
        await batch.commit();
        console.log(`[${election.id}] SUCCESS: Pushed ${allResults.length} constituencies to Firebase!`);
        stateMemory[election.id] = 'SUCCESS';
        saveState(stateMemory);
    } else {
        stateMemory[election.id] = 'FAILED_AI_PARSE';
        saveState(stateMemory);
    }
  }
}
run();
