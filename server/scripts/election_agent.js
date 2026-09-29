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
const SERPER_API_KEY = process.env.SERPER_API_KEY;

// 1. Serper API Search (Custom Google Search)
async function searchWeb(query) {
  try {
    console.log(`[SERPER] Searching for: "${query}"`);
    const res = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: {
        'X-API-KEY': SERPER_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ q: query, num: 3 })
    });
    
    if (!res.ok) {
      console.error(`[SERPER] HTTP Error: ${res.status}`);
      return [];
    }
    
    const data = await res.json();
    return data.organic?.map(r => r.link) || [];
  } catch (e) {
    console.error("[SERPER] Error:", e.message);
    return [];
  }
}

// 2. Fetch content (handles HTML and attempts to read raw CSV if small)
async function fetchContent(url) {
  try {
    console.log(`[FETCH] Downloading from: ${url}`);
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
    });
    
    const contentType = res.headers.get('content-type') || '';
    
    if (contentType.includes('text/csv') || url.endsWith('.csv')) {
      const text = await res.text();
      // Truncate CSV if it's absurdly large (over 50,000 chars) to prevent payload crash
      return text.substring(0, 50000); 
    } else if (contentType.includes('application/pdf')) {
      return `[PDF File Detected at ${url} - Skipping raw text extraction]`;
    } else {
      const html = await res.text();
      const $ = cheerio.load(html);
      let text = $('table').text() + '\n' + $('p').text();
      return text.replace(/\s+/g, ' ').substring(0, 25000);
    }
  } catch(e) {
    return "";
  }
}

// 3. Resilient Gemini API Call
async function callGemini(prompt, retries = 1) {
  const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${GEMINI_API_KEY}`;
  const cfUrl = `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/ai/run/@cf/meta/llama-3.1-8b-instruct`;
  
  try {
    const res = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt.substring(0, 50000) }] }] })
    });
    const data = await res.json();
    if (!data.error && data.candidates) {
      let text = data.candidates[0].content.parts[0].text.replace(/`json/g, '').replace(/`/g, '').trim();
      return JSON.parse(text);
    }
    console.error('[DEBUG GEMINI] Error data:', data); throw new Error('Gemini failed or busy');
  } catch(e) {
    console.log('[AI ROUTER] Gemini failed. Hot-swapping to Cloudflare Llama 3.1...');
    const res = await fetch(cfUrl, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: [{ role: 'user', content: prompt.substring(0, 15000) }], max_tokens: 1000 })
    });
    const data = await res.json();
    if (data.result && data.result.response) {
      let text = data.result.response.replace(/`json/g, '').replace(/`/g, '').trim();
      // Simple parse attempt for Llama 3 JSON
      try { return JSON.parse(text); } catch(err) { throw new Error('Cloudflare JSON parse failed'); }
    }
    console.error('[DEBUG CLOUDFLARE] Error e:', e.message, data); throw new Error('Both Gemini and Cloudflare failed.');
  }
}

// 4. Main Agent Function
export async function runElectionAgent(state, year, type) {
  console.log(`=============================================`);
  console.log(`🕵️ OPINAR ELECTION AGENT (Powered by Serper)`);
  console.log(`📡 Target: ${state} ${year} ${type}`);
  console.log(`=============================================`);

  try {
    const db = await getDb();
    
    // Build an advanced "Google Dork" query
    const query = `${state} ${year} ${type} election constituency wise results filetype:csv OR site:ashoka.edu.in OR site:eci.gov.in OR site:wikipedia.org`;
    
    const links = await searchWeb(query);
    if (links.length === 0) {
      console.log("❌ No sources found.");
      return;
    }

    let combinedData = "";
    for (const link of links) {
      const text = await fetchContent(link);
      if (text.length > 500) {
        combinedData += `\n\n--- SOURCE: ${link} ---\n${text}`;
      }
    }

    if (combinedData.length < 500) {
      console.log("❌ Failed to extract enough usable data from sources.");
      return;
    }

    console.log("[AI] Analyzing raw data with Gemini...");
    const prompt = `You are an expert political data analyst for India.
I have scraped data from Google for the ${state} ${year} ${type} elections.
Extract the exact total seats and party standings.

RAW DATA:
${combinedData}

Return ONLY a valid JSON object matching this schema EXACTLY:
{
  "state": "${state}",
  "year": ${year},
  "total_seats": 403,
  "party_wins": {
    "BJP": 255,
    "SP": 111,
    "INC": 2
  }
}`;

    const structuredData = await callGemini(prompt);
    console.log("\n✅ AI Extracted Structured Data:");
    console.log(structuredData);

    const docId = type === 'ASSEMBLY' 
      ? `STATE_${state.toLowerCase().replace(/ /g, '_')}_${year}` 
      : `LS_${year}`;
      
    const collectionName = type === 'ASSEMBLY' ? 'state_elections_metadata' : 'elections_metadata';
    
    // Safety Mapping (timeline chart expects totalSeats and partyWins instead of snake_case)
    const finalDoc = {
      state: structuredData.state,
      stateSlug: structuredData.state.toLowerCase().replace(/ /g, '-'),
      year: structuredData.year,
      totalSeats: structuredData.total_seats,
      partyWins: structuredData.party_wins,
      updatedAt: new Date().toISOString()
    };

    console.log(`[DB] Writing to ${collectionName}/${docId}...`);
    await db.collection(collectionName).doc(docId).set(finalDoc, { merge: true });
    console.log("🎉 Successfully saved to Firestore!");

  } catch (error) {
    console.error("❌ Election Agent Failed:", error.message);
  }
}

// Manual Execution block
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1].endsWith('election_agent.js')) {
  // Let's test it with a fresh election
  runElectionAgent('Goa', 2022, 'ASSEMBLY').then(() => process.exit(0));
}









