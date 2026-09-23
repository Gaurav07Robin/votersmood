import { getDb } from '../config/firebase-admin.js';
import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// 1. Fetch URLs from DDG Search
async function getTopUrls(query) {
  try {
    const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const html = await res.text();
    const $ = cheerio.load(html);
    
    let links = [];
    $('.result__a').each((i, el) => {
      let href = $(el).attr('href');
      if (href) {
        // clean duckduckgo redirect url
        href = decodeURIComponent(href.replace('//duckduckgo.com/l/?uddg=', '').split('&rut=')[0]);
        if (href.startsWith('http') && !href.includes('youtube')) links.push(href);
      }
    });
    return links.slice(0, 3); // Top 3 links
  } catch (e) {
    console.error("DDG Error:", e.message);
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

// 3. AI Data Structuring (Using Gemini 3.5 Flash)
async function extractElectionData(rawText, electionType, electionName, state, year) {
  const systemPrompt = `
You are a political data engineer. You are given raw, unstructured HTML text scraped from news articles about election results.
Election Details:
- Type: ${electionType} (MUNICIPAL, ASSEMBLY, LOK_SABHA, or BY_ELECTION)
- Name: ${electionName}
- State: ${state}
- Year: ${year}

Your goal is to extract the detailed constituency/ward-wise and overall results.

Extract a JSON object with this exact schema:
{
  "electionType": "${electionType}",
  "electionName": "${electionName}",
  "state": "${state}",
  "year": "${year}",
  "totalSeats": 0,
  "partyStandings": [
    { "party": "BJP", "seatsWon": 0 }
  ],
  "constituencyResults": [
    { "constituencyOrWardName": "Ward 1 / Amethi", "winningParty": "BJP", "winningCandidate": "Name" }
  ]
}

Only return valid JSON without markdown wrapping. If constituency-wise data is missing, leave the array empty but provide the overall party standings.
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
    
    let textResult = data.candidates[0].content.parts[0].text;
    textResult = textResult.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(textResult);
  } catch (error) {
    console.error(`   ❌ AI Error:`, error.message);
    return null;
  }
}

export async function runElectionScraper(electionType, electionName, state, year) {
  console.log(`\n🚀 Starting Election Agent for [${electionType}] ${electionName}, ${state} (${year})`);
  
  let query = "";
  if (electionType === "MUNICIPAL") {
    query = `${electionName} municipal corporation election results ${year} ward wise winning candidates`;
  } else if (electionType === "BY_ELECTION") {
    query = `${electionName} by-election results ${year} winning candidate margin`;
  } else {
    query = `${electionName} ${electionType.toLowerCase()} election results ${year} constituency wise winning candidates`;
  }
  
  console.log(`🔍 Searching Web: "${query}"`);
  
  const urls = await getTopUrls(query);
  if (urls.length === 0) return console.log("❌ No search results found.");

  let combinedRawText = "";
  for (const url of urls) {
    const articleText = await scrapeArticle(url);
    combinedRawText += articleText + "\n\n";
  }

  console.log(`🧠 Feeding ${combinedRawText.length} characters of unstructured news data to AI...`);
  const structuredData = await extractElectionData(combinedRawText, electionType, electionName, state, year);

  if (structuredData) {
    console.log(`✅ Success! Extracted data:`);
    console.log(`   📊 Total Seats: ${structuredData.totalSeats}`);
    console.log(`   🏆 Standings:`, structuredData.partyStandings);
    console.log(`   📍 Constituencies Found: ${structuredData.constituencyResults.length}`);

    // Save to Firestore using Admin SDK
    const db = await getDb();
    const docId = `${state.toLowerCase()}-${electionName.toLowerCase().replace(/\s+/g, '-')}-${year}`;
    const collectionName = 'live_elections';
    
    await db.collection(collectionName).doc(docId).set(structuredData, { merge: true });
    console.log(`💾 Saved to Firestore '${collectionName}/${docId}'`);
    return structuredData;
  }
  return null;
}

// Execute logic based on command line arguments if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  if (args.length >= 4) {
    const [type, name, state, year] = args;
    runElectionScraper(type, name, state, year);
  } else {
    console.log("Running demo cases...");
    runElectionScraper("BY_ELECTION", "Wayanad Lok Sabha", "Kerala", "2024");
    runElectionScraper("ASSEMBLY", "Haryana Assembly", "Haryana", "2024");
  }
}
