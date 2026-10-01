import { getDb } from '../config/firebase-admin.js';
import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

const statesList = [
  'Uttar Pradesh', 'Maharashtra', 'West Bengal', 'Bihar', 'Tamil Nadu',
  'Madhya Pradesh', 'Karnataka', 'Gujarat', 'Andhra Pradesh', 'Rajasthan',
  'Odisha', 'Kerala', 'Telangana', 'Assam', 'Jharkhand',
  'Punjab', 'Chhattisgarh', 'Haryana', 'Delhi', 'Jammu and Kashmir',
  'Uttarakhand', 'Himachal Pradesh', 'Tripura', 'Meghalaya', 'Manipur',
  'Nagaland', 'Goa', 'Arunachal Pradesh', 'Puducherry', 'Mizoram', 'Sikkim'
];

// Target recent elections (2014-2023) to keep it manageable but large enough for continuous running
const TARGET_ELECTIONS = [];
statesList.forEach(state => {
    // Generate some recent election years for each state as an approximation 
    // (Wikipedia redirects or handles slight year mismatches sometimes, but we will just try a few recent years)
    [2023, 2022, 2021, 2020, 2019, 2018, 2017].forEach(year => {
        const stateUrlStr = state.replace(/ /g, '_');
        TARGET_ELECTIONS.push({
            state: state,
            year: year,
            wikiTitle: `${year}_${stateUrlStr}_Legislative_Assembly_election`
        });
    });
});


async function extractTablesFromWiki(title) {
  console.log(`Fetching Wikipedia page for ${title}...`);
  const res = await fetch(`https://en.wikipedia.org/w/api.php?action=parse&page=${title}&prop=text&format=json`);
  const json = await res.json();
  if (!json.parse || !json.parse.text) return null;
  const html = json.parse.text['*'];
  const $ = cheerio.load(html);
  
  let tablesHtml = '';
  $('table.wikitable').each((i, el) => {
    tablesHtml += $.html(el) + '\n\n';
  });
  return tablesHtml;
}

// Groq Fallback
async function callGroq(prompt) {
  console.log("--> Falling back to GROQ API (llama3-70b-8192)...");
  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama3-70b-8192",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.1
      })
    });
    const json = await response.json();
    if (!json.choices || !json.choices[0]) throw new Error("Invalid Groq Response");
    return json.choices[0].message.content;
  } catch (error) {
    console.error("Groq fallback failed:", error.message);
    throw error;
  }
}

// OpenRouter Fallback
async function callOpenRouter(prompt) {
  console.log("--> Falling back to OPENROUTER API (anthropic/claude-3-haiku)...");
  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "anthropic/claude-3-haiku",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.1
      })
    });
    const json = await response.json();
    if (!json.choices || !json.choices[0]) throw new Error("Invalid OpenRouter Response");
    return json.choices[0].message.content;
  } catch (error) {
    console.error("OpenRouter fallback failed:", error.message);
    throw error;
  }
}



// Cloudflare Workers AI Fallback
async function callCloudflare(prompt) {
  console.log("--> Falling back to CLOUDFLARE API (@cf/meta/llama-3-8b-instruct)...");
  try {
    const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/ai/run/@cf/meta/llama-3-8b-instruct`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${CLOUDFLARE_API_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        messages: [{ role: "user", content: prompt }]
      })
    });
    const json = await response.json();
    if (!json.success) throw new Error("Invalid Cloudflare Response");
    return json.result.response;
  } catch (error) {
    console.error("Cloudflare fallback failed:", error.message);
    throw error;
  }
}

async function parseWithAI(tablesHtml, state, year) {
  console.log(`Sending data to AI to extract constituency results for ${state} ${year}...`);
  const prompt = `
You are a highly accurate data extraction bot.
I am providing you with the HTML tables from the Wikipedia page for the ${year} ${state} Legislative Assembly election.
Find the table that contains the "Results by constituency" or the detailed list of winning candidates per constituency.

Extract ALL the constituencies listed.
Return a STRICT JSON array of objects. NO MARKDOWN. NO BACKTICKS. JUST THE RAW JSON ARRAY.
Each object must match this schema:
{
  "constituency": "Name of constituency",
  "winner": "Name of winning candidate",
  "party": "Abbreviation of winning party (e.g. BJP, INC, AAP, TMC, SP, BSP)",
  "runner_up": "Name of runner up candidate",
  "runner_up_party": "Abbreviation of runner up party",
  "margin": integer (the vote margin, if available, otherwise 0)
}

Make sure to extract EVERY constituency in the table. 
HTML Tables:
${tablesHtml.substring(0, 50000)}
`;

  let text = '';
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { temperature: 0.1 }
    });
    text = response.text;
  } catch (error) {
    console.error(`Gemini extraction failed:`, error.message);
    try {
      text = await callGroq(prompt);
    } catch (groqErr) {
      try {
        text = await callOpenRouter(prompt);
      } catch (orErr) {
        try {
          text = await callCloudflare(prompt);
        } catch (cfErr) {
          console.error("All 4 APIs (Gemini, Groq, OpenRouter, Cloudflare) exhausted for this state.");
          return [];
        }
      }
    }
  }

  try {
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const lastBracket = text.lastIndexOf(']');
    const firstBracket = text.indexOf('[');
    if (firstBracket !== -1 && lastBracket !== -1) {
      text = text.substring(firstBracket, lastBracket + 1);
    }
    return JSON.parse(text);
  } catch (parseError) {
    console.error("JSON Parsing failed! The table was probably too large or cut off.");
    return [];
  }
}

async function processElection(election) {
  console.log(`\n--- Starting processing for ${election.state} ${election.year} ---`);
  
  const tablesHtml = await extractTablesFromWiki(election.wikiTitle);
  if (!tablesHtml) {
    console.log(`Could not fetch Wikipedia page for ${election.state} ${election.year}. Skipping.`);
    return;
  }
  
  const results = await parseWithAI(tablesHtml, election.state, election.year);
  if (results.length === 0) {
      console.log(`Failed to extract constituencies for ${election.state} ${election.year}.`);
      return;
  }
  
  console.log(`Successfully extracted ${results.length} constituencies for ${election.state} ${election.year}.`);

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
      runnerUp: c.runner_up || '',
      runnerUpParty: c.runner_up_party || '',
      margin: parseInt(c.margin) || 0,
      timestamp: new Date().toISOString()
    });
  }

  await batch.commit();
  console.log(`Successfully pushed ${results.length} constituencies and metadata to Firebase.`);
}

async function run() {
  console.log("Starting Continuous Autonomous State Assembly Extraction Workflow...");
  for (const election of TARGET_ELECTIONS) {
    await processElection(election);
    // Rate limit prevention
    await new Promise(resolve => setTimeout(resolve, 4000));
  }
  console.log("Workflow Complete (All Target States Attempted)!");
  process.exit(0);
}

run();
