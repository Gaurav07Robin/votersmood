import { db } from '../config/firebase.js';
import { doc, setDoc } from 'firebase/firestore';
import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const STATE_FILE = path.join(__dirname, 'municipal_crawler_state.json');

// Registry of Urban Local Bodies (Excluding Gram Panchayats as requested)
export const URBAN_LOCAL_BODIES_TARGETS = [
  // 1. MAHANAGAR PALIKAS (Mega Behemoths)
  { name: 'Municipal Corporation of Delhi', state: 'Delhi', district: 'All Districts (Metro-wide)', type: 'MAHANAGAR_PALIKA', isBehemoth: true, year: 2022 },
  { name: 'Brihanmumbai Municipal Corporation', state: 'Maharashtra', district: 'Mumbai & Mumbai Suburban', type: 'MAHANAGAR_PALIKA', isBehemoth: true, year: 2017 },
  { name: 'Kolkata Municipal Corporation', state: 'West Bengal', district: 'Kolkata & South 24 Parganas', type: 'MAHANAGAR_PALIKA', isBehemoth: true, year: 2021 },
  { name: 'Greater Hyderabad Municipal Corporation', state: 'Telangana', district: 'Hyderabad, Rangareddy & Medchal', type: 'MAHANAGAR_PALIKA', isBehemoth: true, year: 2020 },
  { name: 'Bruhat Bengaluru Mahanagara Palike', state: 'Karnataka', district: 'Bengaluru Urban', type: 'MAHANAGAR_PALIKA', isBehemoth: true, year: 2015 },
  { name: 'Greater Chennai Corporation', state: 'Tamil Nadu', district: 'Chennai', type: 'MAHANAGAR_PALIKA', isBehemoth: true, year: 2022 },
  { name: 'Ahmedabad Municipal Corporation', state: 'Gujarat', district: 'Ahmedabad', type: 'MAHANAGAR_PALIKA', isBehemoth: true, year: 2021 },
  { name: 'Pune Municipal Corporation', state: 'Maharashtra', district: 'Pune', type: 'MAHANAGAR_PALIKA', isBehemoth: true, year: 2017 },
  { name: 'Surat Municipal Corporation', state: 'Gujarat', district: 'Surat', type: 'MAHANAGAR_PALIKA', isBehemoth: true, year: 2021 },
  { name: 'Nagpur Municipal Corporation', state: 'Maharashtra', district: 'Nagpur', type: 'MAHANAGAR_PALIKA', isBehemoth: true, year: 2017 },
  { name: 'Lucknow Municipal Corporation', state: 'Uttar Pradesh', district: 'Lucknow', type: 'MAHANAGAR_PALIKA', isBehemoth: true, year: 2023 },
  { name: 'Kanpur Municipal Corporation', state: 'Uttar Pradesh', district: 'Kanpur Nagar', type: 'MAHANAGAR_PALIKA', isBehemoth: true, year: 2023 },
  { name: 'Indore Municipal Corporation', state: 'Madhya Pradesh', district: 'Indore', type: 'MAHANAGAR_PALIKA', isBehemoth: true, year: 2022 },
  { name: 'Bhopal Municipal Corporation', state: 'Madhya Pradesh', district: 'Bhopal', type: 'MAHANAGAR_PALIKA', isBehemoth: true, year: 2022 },
  { name: 'Vadodara Municipal Corporation', state: 'Gujarat', district: 'Vadodara', type: 'MAHANAGAR_PALIKA', isBehemoth: true, year: 2021 },
  { name: 'Patna Municipal Corporation', state: 'Bihar', district: 'Patna', type: 'MAHANAGAR_PALIKA', isBehemoth: true, year: 2022 },
  { name: 'Thane Municipal Corporation', state: 'Maharashtra', district: 'Thane', type: 'MAHANAGAR_PALIKA', isBehemoth: true, year: 2017 },
  { name: 'Pimpri-Chinchwad Municipal Corporation', state: 'Maharashtra', district: 'Pune', type: 'MAHANAGAR_PALIKA', isBehemoth: true, year: 2017 },
  { name: 'Nashik Municipal Corporation', state: 'Maharashtra', district: 'Nashik', type: 'MAHANAGAR_PALIKA', isBehemoth: true, year: 2017 },
  { name: 'Varanasi Municipal Corporation', state: 'Uttar Pradesh', district: 'Varanasi', type: 'MAHANAGAR_PALIKA', isBehemoth: true, year: 2023 },
  { name: 'Ghaziabad Municipal Corporation', state: 'Uttar Pradesh', district: 'Ghaziabad', type: 'MAHANAGAR_PALIKA', isBehemoth: true, year: 2023 },
  { name: 'Municipal Corporation of Chandigarh', state: 'Chandigarh', district: 'Chandigarh', type: 'MAHANAGAR_PALIKA', isBehemoth: true, year: 2021 },
  { name: 'Guwahati Municipal Corporation', state: 'Assam', district: 'Kamrup Metropolitan', type: 'MAHANAGAR_PALIKA', isBehemoth: true, year: 2022 },
  { name: 'Shimla Municipal Corporation', state: 'Himachal Pradesh', district: 'Shimla', type: 'MAHANAGAR_PALIKA', isBehemoth: true, year: 2023 },
  { name: 'Greater Visakhapatnam Municipal Corporation', state: 'Andhra Pradesh', district: 'Visakhapatnam', type: 'MAHANAGAR_PALIKA', isBehemoth: true, year: 2021 },

  // 2. NAGAR PALIKAS (Municipal Councils)
  { name: 'Baramati Nagar Palika', state: 'Maharashtra', district: 'Pune', type: 'NAGAR_PALIKA', isBehemoth: false, year: 2021 },
  { name: 'Satara Nagar Palika', state: 'Maharashtra', district: 'Satara', type: 'NAGAR_PALIKA', isBehemoth: false, year: 2021 },
  { name: 'Alibaug Nagar Palika', state: 'Maharashtra', district: 'Raigad', type: 'NAGAR_PALIKA', isBehemoth: false, year: 2021 },
  { name: 'Rae Bareli Nagar Palika Parishad', state: 'Uttar Pradesh', district: 'Rae Bareli', type: 'NAGAR_PALIKA', isBehemoth: false, year: 2023 },
  { name: 'Rampur Nagar Palika Parishad', state: 'Uttar Pradesh', district: 'Rampur', type: 'NAGAR_PALIKA', isBehemoth: false, year: 2023 },
  { name: 'Sambhal Nagar Palika Parishad', state: 'Uttar Pradesh', district: 'Sambhal', type: 'NAGAR_PALIKA', isBehemoth: false, year: 2023 },
  { name: 'Muzaffarnagar Nagar Palika', state: 'Uttar Pradesh', district: 'Muzaffarnagar', type: 'NAGAR_PALIKA', isBehemoth: false, year: 2023 },
  { name: 'Anand Nagar Palika', state: 'Gujarat', district: 'Anand', type: 'NAGAR_PALIKA', isBehemoth: false, year: 2021 },
  { name: 'Morbi Nagar Palika', state: 'Gujarat', district: 'Morbi', type: 'NAGAR_PALIKA', isBehemoth: false, year: 2021 },
  { name: 'Beawar Municipal Council', state: 'Rajasthan', district: 'Beawar', type: 'NAGAR_PALIKA', isBehemoth: false, year: 2021 },
  { name: 'Sasaram Nagar Palika', state: 'Bihar', district: 'Rohtas', type: 'NAGAR_PALIKA', isBehemoth: false, year: 2022 },
  { name: 'Bettiah Nagar Palika', state: 'Bihar', district: 'West Champaran', type: 'NAGAR_PALIKA', isBehemoth: false, year: 2022 },
  { name: 'Udupi City Municipal Council', state: 'Karnataka', district: 'Udupi', type: 'NAGAR_PALIKA', isBehemoth: false, year: 2018 },
  { name: 'Darjeeling Municipality', state: 'West Bengal', district: 'Darjeeling', type: 'NAGAR_PALIKA', isBehemoth: false, year: 2022 },

  // 3. NAGAR PARISHADS (Town Municipal Councils)
  { name: 'Shirdi Nagar Parishad', state: 'Maharashtra', district: 'Ahmednagar', type: 'NAGAR_PARISHAD', isBehemoth: false, year: 2021 },
  { name: 'Lonavala Nagar Parishad', state: 'Maharashtra', district: 'Pune', type: 'NAGAR_PARISHAD', isBehemoth: false, year: 2021 },
  { name: 'Mount Abu Nagar Parishad', state: 'Rajasthan', district: 'Sirohi', type: 'NAGAR_PARISHAD', isBehemoth: false, year: 2021 },
  { name: 'Bodh Gaya Nagar Parishad', state: 'Bihar', district: 'Gaya', type: 'NAGAR_PARISHAD', isBehemoth: false, year: 2022 },

  // 4. NAGAR PANCHAYATS (Transitional Town Councils)
  { name: 'Kedarnath Nagar Panchayat', state: 'Uttarakhand', district: 'Rudraprayag', type: 'NAGAR_PANCHAYAT', isBehemoth: false, year: 2023 },
  { name: 'Badrinath Nagar Panchayat', state: 'Uttarakhand', district: 'Chamoli', type: 'NAGAR_PANCHAYAT', isBehemoth: false, year: 2023 },
  { name: 'Goshainganj Nagar Panchayat', state: 'Uttar Pradesh', district: 'Ayodhya', type: 'NAGAR_PANCHAYAT', isBehemoth: false, year: 2023 },
  { name: 'Barsana Nagar Panchayat', state: 'Uttar Pradesh', district: 'Mathura', type: 'NAGAR_PANCHAYAT', isBehemoth: false, year: 2023 },
  { name: 'Kalka Nagar Panchayat', state: 'Haryana', district: 'Panchkula', type: 'NAGAR_PANCHAYAT', isBehemoth: false, year: 2022 }
];

function loadCrawlerState() {
  try {
    if (fs.existsSync(STATE_FILE)) {
      return JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'));
    }
  } catch (e) {}
  return { lastIndex: 0, crawledBodies: {} };
}

function saveCrawlerState(state) {
  try {
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), 'utf-8');
  } catch (e) {}
}

// 1. Fetch URLs using Wikipedia API
async function getTopUrls(query) {
  try {
    const cleanQuery = query.replace('ward wise winning candidates list', '').trim();
    const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(cleanQuery)}&utf8=&format=json`;
    
    const res = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'VotersmoodBot/1.0 (https://github.com/Gaurav07Robin/votersmood)'
      }
    });
    
    if (!res.ok) return [];
    const data = await res.json();
    if (!data.query || !data.query.search || data.query.search.length === 0) return [];
    
    let links = [];
    for(let i = 0; i < Math.min(2, data.query.search.length); i++) {
      links.push(`https://en.wikipedia.org/wiki/?curid=${data.query.search[i].pageid}`);
    }
    return links;
  } catch (e) {
    return [];
  }
}

// 2. Scrape raw text from an article
async function scrapeArticle(url) {
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const html = await res.text();
    const $ = cheerio.load(html);
    $('script, style, nav, footer, header, aside, .mw-jump-link, .navbox').remove();
    return $('body').text().replace(/\s+/g, ' ').trim();
  } catch (e) {
    return "";
  }
}

// 3. AI Data Structuring using Gemini
async function extractMunicipalData(rawText, target) {
  const systemPrompt = `
You are a political data engineer. You are given raw text about the municipal election results for "${target.name}" in ${target.state} (Year: ${target.year}).
Extract the structured election data into valid JSON matching this schema:
{
  "name": "${target.name}",
  "type": "${target.type}",
  "tierLabel": "${target.type === 'MAHANAGAR_PALIKA' ? 'Mahanagar Palika' : target.type === 'NAGAR_PALIKA' ? 'Nagar Palika' : target.type === 'NAGAR_PARISHAD' ? 'Nagar Parishad' : 'Nagar Panchayat'}",
  "isBehemoth": ${target.isBehemoth},
  "state": "${target.state}",
  "district": "${target.district}",
  "year": ${target.year},
  "totalSeats": 0,
  "majoritySeats": 0,
  "status": "RESULT",
  "rulingParty": "Party Name or Coalition",
  "mayor": "Mayor or Council Head Name if known, else empty string",
  "partyStandings": [
    { "party": "PartyCode", "seats": 0, "voteShare": "0%" }
  ],
  "summary": "1-2 sentence neutral summary of the election results"
}

Rules:
1. Provide valid party codes like BJP, INC, AAP, SHS, NCP, SP, BSP, AITC, DMK, AIADMK, IND, etc.
2. Sum of seats in partyStandings should approximate totalSeats if available.
3. Return ONLY pure valid JSON, no markdown formatting.
`;

  try {
    const safeText = rawText.substring(0, 30000);
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${GEMINI_API_KEY}`;
    
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: systemPrompt + "\n\nRaw Text:\n" + safeText }] }],
        generationConfig: { response_mime_type: "application/json" }
      })
    });
    
    const data = await res.json();
    if (data.error) throw new Error(data.error.message);
    
    let text = data.candidates[0].content.parts[0].text;
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(text);
  } catch (error) {
    console.error(`   ❌ AI Error for ${target.name}:`, error.message);
    return null;
  }
}

// 4. Scrape Single Municipal Target
export async function scrapeSingleMunicipal(target) {
  const query = `${target.name} ${target.state} election results ${target.year} ward wise winning candidates`;
  console.log(`\n🏙️ Scraping [${target.type}]: ${target.name} (${target.state})`);
  
  const urls = await getTopUrls(query);
  if (urls.length === 0) {
    console.log(`   ⚠️ No Wikipedia records found for query: "${query}"`);
    return null;
  }

  let combinedRawText = "";
  for (const url of urls) {
    const articleText = await scrapeArticle(url);
    combinedRawText += articleText + "\n\n";
  }

  if (combinedRawText.length < 100) {
    console.log(`   ⚠️ Scraped text too short (${combinedRawText.length} chars)`);
    return null;
  }

  const structured = await extractMunicipalData(combinedRawText, target);
  if (structured && structured.totalSeats > 0) {
    const docId = `${target.state.toLowerCase()}-${target.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${target.year}`;
    const payload = {
      id: docId,
      ...structured,
      lastUpdated: new Date().toISOString()
    };

    await setDoc(doc(db, 'municipal_elections', docId), payload);
    console.log(`   💾 Saved to Firestore 'municipal_elections/${docId}' (${structured.totalSeats} seats, ${structured.partyStandings?.length || 0} parties)`);
    return payload;
  } else {
    console.log(`   ⚠️ LLM could not structure complete seat counts for ${target.name}`);
    return null;
  }
}

// 5. Main Batch Runner
export async function runMunicipalTracker(batchSize = 3) {
  console.log(`\n========================================`);
  console.log(`🚀 RUNNING MUNICIPAL ELECTION CRAWLER (Batch: ${batchSize})`);
  console.log(`========================================`);

  const state = loadCrawlerState();
  let currentIndex = state.lastIndex || 0;
  let processed = 0;

  for (let i = 0; i < batchSize; i++) {
    const target = URBAN_LOCAL_BODIES_TARGETS[currentIndex % URBAN_LOCAL_BODIES_TARGETS.length];
    currentIndex++;

    try {
      await scrapeSingleMunicipal(target);
      processed++;
    } catch (e) {
      console.error(`   ❌ Failed on target ${target.name}:`, e.message);
    }
  }

  state.lastIndex = currentIndex;
  state.lastRun = new Date().toISOString();
  saveCrawlerState(state);

  console.log(`\n✅ Municipal Crawler batch complete. Processed: ${processed}/${batchSize}. Next index: ${currentIndex}\n`);
}

// Direct execution CLI check
if (process.argv[1] && process.argv[1].endsWith('municipal_agent.js')) {
  runMunicipalTracker(3)
    .then(() => {
      console.log("🏁 Done. Exiting.");
      process.exit(0);
    })
    .catch((err) => {
      console.error("Fatal error in municipal agent:", err);
      process.exit(1);
    });
}
