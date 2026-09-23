import { db } from '../config/firebase.js';
import { doc, setDoc, collection, getDocs } from 'firebase/firestore';
import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'YOUR_GEMINI_API_KEY_HERE';

// 1. DuckDuckGo HTML Search Scraper (Free & Anonymous)
async function searchDDG(query) {
  try {
    const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
    });
    const html = await res.text();
    const $ = cheerio.load(html);
    
    let combinedText = '';
    $('.result__snippet').each((i, el) => {
      combinedText += $(el).text().trim() + '\n\n';
    });
    
    return combinedText;
  } catch (e) {
    console.error("DDG Search Error:", e.message);
    return null;
  }
}

// 2. AI Brain
async function extractTimelineWithAI(rawText) {
  const systemPrompt = `
You are a political data extractor. Read the provided search engine snippets about an Indian politician and extract their political timeline.
Return ONLY a valid JSON object with a single key "timeline" containing an array of objects.
Do not include markdown formatting.
Follow these strict rules for each object in the array:
1. Format dates as 'YYYY - YYYY' or 'YYYY - Present'.
2. Provide the 'place' (e.g., 'Amethi, UP' or 'New Delhi').
3. Keep the 'description' to a MAXIMUM of 2 sentences.
4. Output schema for each object in the timeline array: { "year": "", "place": "", "title": "", "description": "" }
`;

  try {
    const prompt = `${systemPrompt}\n\nText to analyze:\n${rawText.substring(0, 8000)}`;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${GEMINI_API_KEY}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { response_mime_type: "application/json" }
      })
    });
    
    const data = await res.json();
    if (data.error) throw new Error(data.error.message);
    
    const jsonString = data.candidates[0].content.parts[0].text;
    const parsedData = JSON.parse(jsonString);
    return parsedData.timeline || [];
  } catch (error) {
    console.error(`AI Error:`, error.message);
    return null;
  }
}

// 3. Main Runner
async function runFallbackBatch() {
  console.log("🔍 Fetching missing politicians from database...");
  const snap = await getDocs(collection(db, 'leaders'));
  let missingLeaders = [];

  snap.forEach(docSnap => {
    const data = docSnap.data();
    if (!data.careerTimeline || data.careerTimeline.length === 0) {
      missingLeaders.push(data);
    }
  });

  console.log(`⚠️ Found ${missingLeaders.length} politicians without timelines.`);

  let count = 1;
  for (const leader of missingLeaders) {
    console.log(`\n[${count}/${missingLeaders.length}] 🌐 Searching Web for: ${leader.name} (${leader.state})`);
    
    const query = `${leader.name} politician ${leader.state || ''} MLA MP career timeline biography`;
    const searchContext = await searchDDG(query);
    
    if (searchContext && searchContext.trim().length > 50) {
      console.log(`   🧠 Analyzing ${searchContext.length} characters of search data...`);
      const timeline = await extractTimelineWithAI(searchContext);

      if (timeline && timeline.length > 0) {
        console.log(`   ✅ Extracted ${timeline.length} timeline events! Saving to DB...`);
        const ref = doc(db, 'leaders', leader.id);
        await setDoc(ref, { careerTimeline: timeline }, { merge: true });
      } else {
        console.log(`   ❌ AI could not extract timeline from search results.`);
      }
    } else {
      console.log(`   ❌ No search results found.`);
    }

    console.log(`   ⏱️ Waiting 3 seconds to respect rate limits...`);
    await new Promise(resolve => setTimeout(resolve, 3000));
    count++;
  }

  console.log("🎉 Fallback pipeline complete!");
  process.exit(0);
}

runFallbackBatch();
