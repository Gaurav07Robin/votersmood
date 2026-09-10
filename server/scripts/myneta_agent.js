import { db } from '../config/firebase.js';
import { doc, setDoc } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import * as cheerio from 'cheerio';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const GROQ_API_KEY = process.env.GROQ_API_KEY || 'YOUR_GROQ_API_KEY_HERE';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'YOUR_GEMINI_API_KEY_HERE';

let AI_PROVIDER = 'gemini'; 

// ==========================================
// 1. MYNETA.INFO SCRAPER FALLBACK
// ==========================================
export async function getMyNetaText(searchQuery) {
  try {
    const url = `https://myneta.info/search_myneta.php?q=${encodeURIComponent(searchQuery)}`;
    const searchRes = await fetch(url);
    const searchHtml = await searchRes.text();
    const $ = cheerio.load(searchHtml);
    
    // Find the first link to a candidate profile
    const firstLink = $('table.w3-table a[href*="candidate.php"]').first().attr('href');
    if (!firstLink) return null;
    
    const profileUrl = firstLink.startsWith('http') ? firstLink : `https://myneta.info${firstLink.startsWith('/') ? '' : '/'}${firstLink}`;
    
    const profileRes = await fetch(profileUrl);
    const profileHtml = await profileRes.text();
    const $profile = cheerio.load(profileHtml);
    
    // Remove heavy and irrelevant tags to reduce token size
    $profile('script, style, noscript, nav, footer, iframe, img, head').remove();
    const rawText = $profile('body').text().replace(/\s+/g, ' ').trim();
    
    return rawText;
  } catch (error) {
    console.error(`❌ MyNeta Error for ${searchQuery}:`, error.message);
    return null;
  }
}

// ==========================================
// 2. AI TIMELINE EXTRACTOR
// ==========================================
export async function extractTimelineWithAI(rawText) {
  const systemPrompt = `
You are a political data extractor. Read the provided text which is extracted from a candidate's affidavit on MyNeta.info.
Extract their political timeline (elections contested, positions held, criminal cases if any major ones are mentioned).
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
      
      if (data.error) {
        if (data.error.message.toLowerCase().includes('rate limit') || data.error.message.toLowerCase().includes('quota') || res.status === 429) {
           console.log(`\n🛑 [QUOTA REACHED] Groq Free Tier Limit Hit! Stopping script safely.`);
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

// ==========================================
// 3. DATABASE INJECTION
// ==========================================
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
  const progressFile = path.join(__dirname, 'myneta_progress.json');
  let completedIds = new Set();
  
  if (fs.existsSync(progressFile)) {
    const savedProgress = JSON.parse(fs.readFileSync(progressFile, 'utf-8'));
    completedIds = new Set(savedProgress);
    console.log(`✅ Loaded ${completedIds.size} completed politicians from MyNeta local tracker.`);
  }

  console.log(`\n📥 Fetching all leaders from Firestore to check who is missing timelines...`);
  const { getDocs, collection } = await import('firebase/firestore');
  const snapshot = await getDocs(collection(db, 'leaders'));
  const allDbLeaders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  
  // Filter for those that don't have a timeline or have an empty one
  const missingTimelineLeaders = allDbLeaders.filter(l => !l.careerTimeline || l.careerTimeline.length === 0);
  console.log(`📊 Found ${missingTimelineLeaders.length} leaders missing timelines out of ${allDbLeaders.length}.`);

  const leadersToProcess = missingTimelineLeaders.filter(l => !completedIds.has(l.id));

  console.log(`\n🚀 Starting MyNeta Fallback Scraper...`);
  console.log(`📊 Processing ${leadersToProcess.length} remaining leaders...`);

  let count = 1;
  for (const leader of leadersToProcess) {
    console.log(`\n[${count}/${leadersToProcess.length}] 🔍 Processing: ${leader.name} (${leader.state || 'Unknown State'})...`);
    
    console.log(`   📥 Scraping MyNeta.info...`);
    // Search strictly with name and state for better accuracy on MyNeta
    const text = await getMyNetaText(`${leader.name} ${leader.state || ''}`);
    
    if (!text) {
      console.log(`   ⚠️ Could not find MyNeta page. Skipping.`);
    } else {
      console.log(`   🧠 Sending MyNeta data to ${AI_PROVIDER.toUpperCase()}...`);
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
  
  console.log(`\n🎉 MyNeta Pipeline Batch Complete!`);
  process.exit(0);
}

runBatch();
