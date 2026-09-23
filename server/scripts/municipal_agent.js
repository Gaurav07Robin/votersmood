import { db } from '../config/firebase.js';
import { doc, setDoc } from 'firebase/firestore';
import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// 1. Fetch URLs using Wikipedia API (Bypasses GitHub Actions DataCenter blocks)
async function getTopUrls(query) {
  try {
    // Simplify query for Wikipedia
    const cleanQuery = query.replace('ward wise winning candidates', '').trim();
    const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(cleanQuery)}&utf8=&format=json`;
    
    // Wikipedia API REQUIRES a User-Agent header for automated requests
    const res = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'VotersmoodBot/1.0 (https://github.com/Gaurav07Robin/votersmood)'
      }
    });
    
    if (!res.ok) {
      console.error(`Wikipedia API HTTP Error: ${res.status}`);
      return [];
    }
    
    const data = await res.json();
    
    if (!data.query || !data.query.search || data.query.search.length === 0) return [];
    
    // Get top 2 wikipedia pages
    let links = [];
    for(let i=0; i<Math.min(2, data.query.search.length); i++) {
      links.push(`https://en.wikipedia.org/wiki/?curid=${data.query.search[i].pageid}`);
    }
    return links;
  } catch (e) {
    console.error("Wikipedia API Error:", e.message);
    return [];
  }
}

// 2. Scrape raw text and tables from an article
async function scrapeArticle(url) {
  try {
    console.log(`   🌐 Scraping: ${url}`);
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const html = await res.text();
    const $ = cheerio.load(html);
    
    // Remove scripts, styles, nav, footer
    $('script, style, nav, footer, header, aside').remove();
    
    // Extract main text and tables
    let content = $('body').text().replace(/\s+/g, ' ').trim();
    return content;
  } catch (e) {
    return "";
  }
}

// 3. AI Data Structuring (Using Gemini 3.5 Flash for large context)
async function extractMunicipalData(rawText, corporationName) {
  const systemPrompt = `
You are a political data engineer. You are given raw, unstructured HTML text scraped from news articles about the election results for the ${corporationName}.
Your goal is to extract the WARD-WISE or OVERALL results of the Municipal Corporation / Mahanagar Palika election.

Extract a JSON object with this exact schema:
{
  "corporationName": "${corporationName}",
  "totalSeats": 0,
  "partyStandings": [
    { "party": "BJP", "seatsWon": 0 },
    { "party": "INC", "seatsWon": 0 }
  ],
  "wardResults": [
    { "wardNumberOrName": "Ward 1", "winningParty": "BJP", "candidates": ["Name 1", "Name 2"] }
  ]
}

Only return valid JSON. If ward-wise data is missing, leave the array empty but provide the overall partyStandings.
`;

  try {
    const safeText = rawText.substring(0, 30000); // Send up to 30k chars
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
    
    return JSON.parse(data.candidates[0].content.parts[0].text);
  } catch (error) {
    console.error(`   ❌ AI Error:`, error.message);
    return null;
  }
}

// 4. Main Runner
async function runMunicipalScraper(state, corporationName, year) {
  console.log(`\n🚀 Starting Municipal Agent for ${corporationName}, ${state} (${year})`);
  
  const query = `${corporationName} municipal corporation election results ${year} ward wise winning candidates list`;
  console.log(`🔍 Searching Web: "${query}"`);
  
  const urls = await getTopUrls(query);
  if (urls.length === 0) return console.log("❌ No search results found.");

  let combinedRawText = "";
  for (const url of urls) {
    const articleText = await scrapeArticle(url);
    combinedRawText += articleText + "\n\n";
  }

  console.log(`🧠 Feeding ${combinedRawText.length} characters of unstructured news data to AI...`);
  const structuredData = await extractMunicipalData(combinedRawText, corporationName);

  if (structuredData) {
    console.log(`✅ Success! Extracted data:`);
    console.log(`   🏆 Total Seats: ${structuredData.totalSeats}`);
    console.log(`   📊 Standings:`, structuredData.partyStandings);
    console.log(`   📍 Wards Found: ${structuredData.wardResults.length}`);

    // Save to Firestore
    const docId = `${state.toLowerCase()}-${corporationName.toLowerCase().replace(/\s+/g, '-')}-${year}`;
    await setDoc(doc(db, 'municipal_elections', docId), structuredData);
    console.log(`💾 Saved to Firestore 'municipal_elections/${docId}'`);
  }
}

// Execute for a test case
runMunicipalScraper("Gujarat", "Ahmedabad Municipal Corporation", "2021");
