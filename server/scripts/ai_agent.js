import { db } from '../config/firebase.js';
import { doc, setDoc, collection, getDocs } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// ==========================================
// 🤖 VOTERSMOOD AI DATA AGENT (FREE TIER)
// ==========================================
// To run: node scripts/ai_agent.js

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

// 🔴 PASTE YOUR FREE API KEYS HERE OR USE .env FILE:
const GROQ_API_KEY = process.env.GROQ_API_KEY || 'YOUR_GROQ_API_KEY_HERE';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'YOUR_GEMINI_API_KEY_HERE';

// 👉 CHOOSE YOUR PROVIDER ('groq' or 'gemini')
let AI_PROVIDER = 'gemini'; 

// 1. WIKIPEDIA SCRAPER
export async function getWikipediaText(searchQuery) {
  try {
    const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(searchQuery)}&utf8=&format=json`;
    const searchRes = await fetch(searchUrl);
    const searchData = await searchRes.json();

    if (!searchData.query.search || searchData.query.search.length === 0) return null;

    const pageId = searchData.query.search[0].pageid;
    const textUrl = `https://en.wikipedia.org/w/api.php?action=query&prop=extracts&explaintext=1&pageids=${pageId}&format=json`;
    
    const textRes = await fetch(textUrl);
    const textData = await textRes.json();
    return textData.query.pages[pageId].extract;
  } catch (error) {
    console.error(`❌ Wikipedia Error for ${searchQuery}:`, error.message);
    return null;
  }
}

// 2. AI BRAIN 
export async function extractTimelineWithAI(rawText) {
  const systemPrompt = `
You are a political data extractor. Read the provided text about an Indian politician and extract their political timeline.
Return ONLY a valid JSON object with a single key "timeline" containing an array of objects.
Do not include markdown formatting.
Follow these strict rules for each object in the array:
1. Format dates as 'YYYY - YYYY' or 'YYYY - Present'.
2. Provide the 'place' (e.g., 'Amethi, UP' or 'New Delhi').
3. Keep the 'description' to a MAXIMUM of 2 sentences. Do NOT include vote margins, counts, or percentages. Just mention who they defeated if relevant.
4. Output schema for each object in the timeline array: { "year": "", "place": "", "title": "", "description": "" }
`;

  try {
    const safeText = rawText.substring(0, 8000); 

    if (AI_PROVIDER === 'groq') {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${GROQ_API_KEY}`
        },
        body: JSON.stringify({
          model: "openai/gpt-oss-120b", 
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: `Text to analyze:\n${safeText}` } 
          ],
          response_format: { type: "json_object" },
          temperature: 0.1
        })
      });
      const data = await res.json();
      
      // Auto-stop on Quota Limit
      if (data.error) {
        if (data.error.message.toLowerCase().includes('rate limit') || data.error.message.toLowerCase().includes('quota') || res.status === 429) {
           console.log(`\n🛑 [QUOTA REACHED] Groq Free Tier Limit Hit! Stopping script safely.`);
           console.log(`Error message: ${data.error.message}`);
           process.exit(0);
        }
        throw new Error(data.error.message);
      }
      return JSON.parse(data.choices[0].message.content).timeline || [];

    } else if (AI_PROVIDER === 'gemini') {
      const prompt = `${systemPrompt}\n\nText to analyze:\n${safeText}`;
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
      
      // Auto-stop on Quota Limit
      if (data.error) {
        if (data.error.message.toLowerCase().includes('quota') || data.error.message.toLowerCase().includes('exhausted') || res.status === 429) {
           console.log(`\n⚠️ [QUOTA REACHED] Gemini Free Tier Limit Hit! Switching automatically to Groq...`);
           AI_PROVIDER = 'groq';
           return await extractTimelineWithAI(rawText);
        }
        throw new Error(data.error.message);
      }
      
      const jsonString = data.candidates[0].content.parts[0].text;
      const parsedData = JSON.parse(jsonString);
      return parsedData.timeline || [];
    }

  } catch (error) {
    console.error(`❌ AI Processing Error:`, error.message);
    return null;
  }
}

// 3. DATABASE INJECTION
export async function saveTimelineToDB(leaderId, timelineArray) {
  try {
    const ref = doc(db, 'leaders', leaderId);
    await setDoc(ref, { careerTimeline: timelineArray }, { merge: true });
    console.log(`✅ Successfully saved structured timeline for [${leaderId}] to Firestore!`);
  } catch (error) {
    console.error(`❌ DB Error for ${leaderId}:`, error.message);
  }
}

// ==========================================
// 🚀 RUN THE PIPELINE FOR ALL 4,109 POLITICIANS
// ==========================================
async function runBatch() {
  if (AI_PROVIDER === 'groq' && GROQ_API_KEY === 'YOUR_GROQ_API_KEY_HERE') {
    console.log("⚠️ PLEASE STOP: Paste your Groq API Key at the top of this file!");
    return;
  }
  if (AI_PROVIDER === 'gemini' && GEMINI_API_KEY === 'YOUR_GEMINI_API_KEY_HERE') {
    console.log("⚠️ PLEASE STOP: Paste your Gemini API Key at the top of this file!");
    return;
  }

  // 1. Fetch current status efficiently using a LOCAL tracker file (0 Database Reads!)
  const progressFile = path.join(__dirname, 'scraping_progress.json');
  let completedIds = new Set();
  
  if (fs.existsSync(progressFile)) {
    const savedProgress = JSON.parse(fs.readFileSync(progressFile, 'utf-8'));
    completedIds = new Set(savedProgress);
    console.log(`✅ Loaded ${completedIds.size} completed politicians from local tracker.`);
  }

  // 2. Load all 4109 leaders from cache
  const cacheFilePath = path.join(__dirname, '../data/leaders_cache.json');
  if (!fs.existsSync(cacheFilePath)) {
    console.log("❌ Could not find leaders_cache.json.");
    return;
  }

  const allLeaders = JSON.parse(fs.readFileSync(cacheFilePath, 'utf-8'));
  
  // 3. Filter out the ones we already did
  const leadersToProcess = allLeaders.filter(l => !completedIds.has(l.id));

  console.log(`\n🚀 Starting ${AI_PROVIDER.toUpperCase()} AI Data Agent Pipeline...`);
  console.log(`📊 Processing ${leadersToProcess.length} remaining leaders...`);

  let count = 1;
  for (const leader of leadersToProcess) {
    console.log(`\n[${count}/${leadersToProcess.length}] 🔍 Processing: ${leader.name} (${leader.state || 'Unknown State'})...`);
    
    console.log(`   📥 Scraping Wikipedia...`);
    const text = await getWikipediaText(`${leader.name} politician India ${leader.state || ''}`);
    
    if (!text) {
      console.log(`   ⚠️ Could not find Wikipedia page. Skipping.`);
    } else {
      console.log(`   🧠 Sending raw text to ${AI_PROVIDER.toUpperCase()}...`);
      const timeline = await extractTimelineWithAI(text);

      if (timeline && timeline.length > 0) {
        console.log(`   💾 Extracted ${timeline.length} timeline events. Pushing to Firestore...`);
        await saveTimelineToDB(leader.id, timeline);
      } else {
        console.log(`   ⚠️ AI could not extract timeline.`);
      }
    }

    // Mark as completed locally so we NEVER repeat them
    completedIds.add(leader.id);
    fs.writeFileSync(progressFile, JSON.stringify(Array.from(completedIds)));

    if (AI_PROVIDER === 'groq') {
      console.log(`   ⏳ Waiting 21 seconds to avoid Groq's 8K Tokens/Min limit...`);
      await new Promise(r => setTimeout(r, 21000));
    } else {
      console.log(`   ⏳ Waiting 4.5 seconds to avoid Gemini's 15 RPM limit...`);
      await new Promise(r => setTimeout(r, 4500));
    }
    count++;
  }
  
  console.log(`\n🎉 Pipeline Batch Complete! All possible timelines have been upgraded.`);
  process.exit(0);
}

runBatch();
