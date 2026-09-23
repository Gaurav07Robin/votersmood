import { getDb } from '../config/firebase-admin.js';
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

// 🔑 PASTE YOUR FREE API KEYS HERE OR USE .env FILE:
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || 'YOUR_OPENROUTER_API_KEY_HERE';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'YOUR_GEMINI_API_KEY_HERE';
const GROQ_API_KEY = process.env.GROQ_API_KEY || 'YOUR_GROQ_API_KEY_HERE';
const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID || 'YOUR_CLOUDFLARE_ACCOUNT_ID_HERE';
const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN || 'YOUR_CLOUDFLARE_API_TOKEN_HERE';

// 🧠 CHOOSE YOUR PROVIDER ('openrouter', 'gemini', 'cloudflare', or 'groq')
// The script will automatically fall back down the chain if it hits a rate limit
let AI_PROVIDER = 'openrouter'; 

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

    if (AI_PROVIDER === 'openrouter') {
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`
        },
        body: JSON.stringify({
          model: "google/gemma-4-31b-it:free", // Using Gemma 4 31B via OpenRouter
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
           console.log(`\n⚠️ [QUOTA REACHED] OpenRouter Limit Hit! Switching automatically to Gemini...`);
           AI_PROVIDER = 'gemini';
           return await extractTimelineWithAI(rawText);
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
           console.log(`\n⚠️ [QUOTA REACHED] Gemini Free Tier Limit Hit! Switching automatically to Cloudflare AI...`);
           AI_PROVIDER = 'cloudflare';
           return await extractTimelineWithAI(rawText);
        }
        throw new Error(data.error.message);
      }
      
      const jsonString = data.candidates[0].content.parts[0].text;
      const parsedData = JSON.parse(jsonString);
      return parsedData.timeline || [];

    } else if (AI_PROVIDER === 'cloudflare') {
      const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/ai/v1/chat/completions`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`
        },
        body: JSON.stringify({
          model: "@cf/meta/llama-3.1-8b-instruct-fp8", 
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: `Text to analyze:\n${safeText}` } 
          ],
          temperature: 0.1
        })
      });
      const data = await res.json();
      
      // Auto-stop on Quota Limit
      if (data.errors && data.errors.length > 0) {
        if (res.status === 429 || data.errors[0].message.toLowerCase().includes('limit')) {
           console.log(`\n⚠️ [QUOTA REACHED] Cloudflare Daily Limit Hit! Switching automatically to Groq...`);
           AI_PROVIDER = 'groq';
           return await extractTimelineWithAI(rawText);
        }
        throw new Error(data.errors[0].message);
      }
      
      // Cloudflare sometimes includes markdown formatting, so we safely strip it
      let jsonString = data.choices[0].message.content;
      jsonString = jsonString.replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(jsonString).timeline || [];

    } else if (AI_PROVIDER === 'groq') {
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
           console.log(`\n⚠️ [QUOTA REACHED] Groq Free Tier Limit Hit! All 4 APIs exhausted. Stopping script safely.`);
           console.log(`Error message: ${data.error.message}`);
           process.exit(0);
        }
        throw new Error(data.error.message);
      }
      return JSON.parse(data.choices[0].message.content).timeline || [];
    }

  } catch (error) {
    console.error(`❌ AI Processing Error:`, error.message);
    return null;
  }
}

// 3. DATABASE INJECTION
export async function saveTimelineToDB(leaderId, timelineArray) {
  try {
    const db = await getDb();
    await db.collection('leaders').doc(leaderId).set({ careerTimeline: timelineArray }, { merge: true });
    console.log(`✅ Successfully saved structured timeline for [${leaderId}] to Firestore!`);
  } catch (error) {
    console.error(`❌ DB Error for ${leaderId}:`, error.message);
  }
}

// ==========================================
// 🚀 RUN THE PIPELINE FOR ALL 4,109 POLITICIANS
// ==========================================
async function runBatch() {
  if (AI_PROVIDER === 'openrouter' && OPENROUTER_API_KEY === 'YOUR_OPENROUTER_API_KEY_HERE') {
    console.log("⚠️ PLEASE STOP: Paste your OpenRouter API Key at the top of this file!");
    return;
  }
  if (AI_PROVIDER === 'gemini' && GEMINI_API_KEY === 'YOUR_GEMINI_API_KEY_HERE') {
    console.log("⚠️ PLEASE STOP: Paste your Gemini API Key at the top of this file!");
    return;
  }
  if (AI_PROVIDER === 'cloudflare' && CLOUDFLARE_API_TOKEN === 'YOUR_CLOUDFLARE_API_TOKEN_HERE') {
    console.log("⚠️ PLEASE STOP: Paste your Cloudflare Token at the top of this file!");
    return;
  }
  if (AI_PROVIDER === 'groq' && GROQ_API_KEY === 'YOUR_GROQ_API_KEY_HERE') {
    console.log("⚠️ PLEASE STOP: Paste your Groq API Key at the top of this file!");
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
  console.log(`⏳ Processing ${leadersToProcess.length} remaining leaders...`);

  let count = 1;
  for (const leader of leadersToProcess) {
    console.log(`\n[${count}/${leadersToProcess.length}] 🔍 Processing: ${leader.name} (${leader.state || 'Unknown State'})...`);
    
    console.log(`   🌐 Scraping Wikipedia...`);
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
        console.log(`   ❌ AI could not extract timeline.`);
      }
    }

    // Mark as completed locally so we NEVER repeat them
    completedIds.add(leader.id);
    fs.writeFileSync(progressFile, JSON.stringify(Array.from(completedIds)));

    if (AI_PROVIDER === 'openrouter') {
      console.log(`   ⏱️ Waiting 3 seconds to avoid OpenRouter limits...`);
      await new Promise(r => setTimeout(r, 3000));
    } else if (AI_PROVIDER === 'cloudflare') {
      console.log(`   ⏱️ Waiting 1 second for Cloudflare...`);
      await new Promise(r => setTimeout(r, 1000));
    } else if (AI_PROVIDER === 'groq') {
      console.log(`   ⏱️ Waiting 21 seconds to avoid Groq's 8K Tokens/Min limit...`);
      await new Promise(r => setTimeout(r, 21000));
    } else {
      console.log(`   ⏱️ Waiting 4.5 seconds to avoid Gemini's 15 RPM limit...`);
      await new Promise(r => setTimeout(r, 4500));
    }
    count++;
  }
  
  console.log(`\n🎉 Pipeline Batch Complete! All possible timelines have been upgraded.`);
  process.exit(0);
}

runBatch();
