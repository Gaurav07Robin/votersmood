import { getDb } from '../config/firebase-admin.js';
import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { runElectionScraper } from './election_agent.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// 1. Discover Ongoing/Recent Elections autonomously using Wikipedia
async function discoverElections(year, mode = 'LIVE') {
  console.log(`\n🔍 Scanning web for elections in ${year} (Mode: ${mode})...`);
  try {
    const wikiUrl = `https://en.wikipedia.org/wiki/${year}_elections_in_India`;
    const res = await fetch(wikiUrl);
    const html = await res.text();
    const $ = cheerio.load(html);
    
    // Extract main content to feed to Gemini
    $('#mw-content-text table, #mw-content-text p, #mw-content-text ul').each((i, el) => {
      // Just clean up references
      $(el).find('.reference').remove(); 
    });
    const textData = $('#mw-content-text').text().replace(/\s+/g, ' ').substring(0, 40000); // 40k chars max

    const includeInstruction = mode === 'LIVE' 
      ? `- "ASSEMBLY" (State Legislative Assembly)\n- "LOK_SABHA" (General Elections)\n- "MUNICIPAL" (Municipal Corporation / Mahanagar Palika)\n- "BY_ELECTION" (Lok Sabha or Assembly By-elections)`
      : `- "ASSEMBLY" (State Legislative Assembly)\n- "LOK_SABHA" (General Elections)`;

    const systemPrompt = `
You are an autonomous AI agent for an election tracking platform.
I am providing you with the Wikipedia page text for "Elections in India ${year}".
Analyze the text and extract all major state and local elections that have occurred recently or are ongoing this year.

Exclude: Panchayat, Zila Parishad, Gram Panchayat.
If mode is HISTORICAL, also exclude Municipal and By-elections. We only want major state/national data for history.

Include ONLY: 
${includeInstruction}

Return a strictly valid JSON array of objects in this exact format:
[
  {
    "type": "ASSEMBLY", 
    "name": "Haryana Assembly",
    "state": "Haryana",
    "year": "${year}"
  },
  {
    "type": "BY_ELECTION",
    "name": "Wayanad Lok Sabha",
    "state": "Kerala",
    "year": "${year}"
  }
]
`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${GEMINI_API_KEY}`;
    const geminiRes = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: systemPrompt + "\n\nRaw Text:\n" + textData }] }],
        generationConfig: { response_mime_type: "application/json" }
      })
    });
    
    const data = await geminiRes.json();
    if (data.error) throw new Error(data.error.message);
    
    let textResult = data.candidates[0].content.parts[0].text;
    textResult = textResult.replace(/```json/g, '').replace(/```/g, '').trim();
    const elections = JSON.parse(textResult);
    console.log(`🤖 AI discovered ${elections.length} major elections for ${year}.`);
    return elections;
  } catch (err) {
    console.error("❌ Failed to discover elections:", err.message);
    return [];
  }
}

// 2. Main Autonomous Loop
export async function runAutonomousTracker(targetYear = new Date().getFullYear(), mode = 'LIVE') {
  console.log('=============================================');
  console.log(`🤖 AUTONOMOUS ELECTION TRACKER INITIALIZING FOR YEAR: ${targetYear} (Mode: ${mode})`);
  console.log('=============================================');

  // Get currently tracked elections from Firestore
  console.log(`\n⏳ Checking existing database records...`);
  const existingDocs = new Set();
  try {
    const db = await getDb();
    const snap = await db.collection('live_elections').get();
    snap.forEach(doc => existingDocs.add(doc.id));
    console.log(`Found ${existingDocs.size} elections currently tracked in DB.`);
  } catch (e) {
    console.log(`⚠️ Warning: Could not read Firestore live_elections collection.`, e.message);
  }

  // Find elections for the target year
  const discoveredElections = await discoverElections(targetYear, mode);
  
  let newElectionsCount = 0;
  for (const election of discoveredElections) {
    const docId = `${election.state.toLowerCase()}-${election.name.toLowerCase().replace(/\s+/g, '-')}-${election.year}`;
    
    if (existingDocs.has(docId)) {
      console.log(`⏭️  Skipping [${docId}] - Already up to date in DB.`);
      continue;
    }

    console.log(`\n🚨 NEW ELECTION DETECTED: ${election.name} (${election.type})`);
    console.log(`   Dispatching Extraction Agent...`);
    
    // Call the extraction agent
    await runElectionScraper(election.type, election.name, election.state, election.year);
    newElectionsCount++;
    
    // Slight delay to respect rate limits
    await new Promise(resolve => setTimeout(resolve, 3000));
  }

  console.log(`\n=============================================`);
  console.log(`✅ TRACKER CYCLE COMPLETE.`);
  console.log(`   Processed ${newElectionsCount} new/updated elections.`);
  console.log(`=============================================`);
}

// Execute logic based on command line arguments if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const targetYear = args[0] ? parseInt(args[0]) : new Date().getFullYear();
  runAutonomousTracker(targetYear).then(() => process.exit(0));
}
