import { getDb } from '../config/firebase-admin.js';
import { runAutonomousTracker } from './autonomous_tracker.js';
import { runJournalistAgent } from './journalist_agent.js';
import { PLATFORM_VISION } from '../config/vision.js';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

// Goal-Oriented AGI Thought Loop
async function getBrainDecision(stats) {
  const prompt = `
${PLATFORM_VISION}

You are the Artificial General Intelligence (AGI) orchestrating Opinar. It is 5:30 AM.
Your goal is to progressively build the ultimate database by maximizing free-tier API efficiency. 

Here is our Multi-Phase Data Collection Roadmap:
- PHASE 1 (Current): Build Core Architecture. Scrape basic historical results for Lok Sabha & State Assemblies.
- PHASE 2 (Future): Expand depth. Scrape historical Municipal/Panchayat local bodies.
- PHASE 3 (Future): Granular Demographics. Parse GBs of ECI PDFs for delimitation, age, sex, and voter turnout.
- PHASE 4 (Future): Insight Extraction. Connect demographic shifts to voting patterns.

Here is the current state of our database:
- Tracked Elections: ${stats.trackedElections}
- Historical Sync Year Pointer: ${stats.historicalSyncYear}
- Articles Published: ${stats.publishedArticles}

Analyze the database state. If Phase 1 is not complete (pointer hasn't reached 1951), you MUST prioritize Phase 1. 
If Phase 1 is complete, you should advance to the next phase.

Choose EXACTLY ONE task to execute today to optimize our API usage and progress the roadmap:
1. "SCRAPE_LIVE": Scrape the current year (${new Date().getFullYear()}) for any breaking news.
2. "SCRAPE_HISTORICAL_CORE": (Phase 1) Scrape Lok Sabha & Assemblies for year ${stats.historicalSyncYear}.
3. "SCRAPE_HISTORICAL_LOCAL": (Phase 2) Scrape Municipal elections.
4. "EXTRACT_ECI_PDF": (Phase 3) Trigger the ECI Delimitation and Demographic PDF parser.
5. "WRITE_INSIGHTS": Dispatch Journalist Agent to analyze data.

Respond strictly in JSON format:
{
  "thought": "Your deep reasoning for why this task maximizes our roadmap progress.",
  "task": "TASK_NAME_HERE"
}
`;

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${process.env.GEMINI_API_KEY}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { response_mime_type: "application/json" }
      })
    });
    const data = await res.json();
    let textResult = data.candidates[0].content.parts[0].text;
    textResult = textResult.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(textResult);
  } catch (e) {
    console.error("❌ Central Brain LLM failed to think. Defaulting to SCRAPE_LIVE.", e.message);
    return { thought: "LLM failure. Falling back to default safety protocol.", task: "SCRAPE_LIVE" };
  }
}

async function startCentralBrain() {
  console.log("🧠 OPINAR AGI CENTRAL BRAIN: WAKING UP");
  const db = await getDb();
  
  console.log("📊 Auditing database state...");
  const snap = await db.collection('live_elections').get();
  const articlesSnap = await db.collection('insights').get();
  
  const brainStateRef = db.collection('system').doc('central_brain_state');
  const brainStateSnap = await brainStateRef.get();
  let currentHistoricalYear = 2023; 
  if (brainStateSnap.exists && brainStateSnap.data().historicalSyncYear) {
    currentHistoricalYear = brainStateSnap.data().historicalSyncYear;
  }

  const stats = {
    trackedElections: snap.size,
    historicalSyncYear: currentHistoricalYear,
    publishedArticles: articlesSnap.size
  };

  console.log("🤔 Consulting Multi-Phase Roadmap...");
  const decision = await getBrainDecision(stats);
  console.log(`\n🧠 Deep Thought: "${decision.thought}"`);
  console.log(`🎯 Chosen Task: ${decision.task}\n`);

  if (decision.task === 'SCRAPE_LIVE') {
    await runAutonomousTracker(new Date().getFullYear(), 'LIVE');
  } 
  else if (decision.task === 'SCRAPE_HISTORICAL_CORE') {
    if (currentHistoricalYear >= 1951) {
      console.log(`📚 PHASE 1: EXECUTING HISTORICAL ARCHIVIST FOR ${currentHistoricalYear} (Assemblies & Lok Sabha)`);
      await runAutonomousTracker(currentHistoricalYear, 'HISTORICAL');
      await brainStateRef.set({ historicalSyncYear: currentHistoricalYear - 1 }, { merge: true });
    } else {
      console.log(`⚠️ Phase 1 Complete! Doing SCRAPE_LIVE until AGI chooses Phase 2.`);
      await runAutonomousTracker(new Date().getFullYear(), 'LIVE');
    }
  }
  else if (decision.task === 'SCRAPE_HISTORICAL_LOCAL') {
    console.log(`🚀 PHASE 2: Dispatching Municipal Tracker (Script under construction)`);
  }
  else if (decision.task === 'EXTRACT_ECI_PDF') {
    console.log(`🚀 PHASE 3: Dispatching ECI PDF Parser for Demographic Data (Script under construction)`);
  }
  else if (decision.task === 'WRITE_INSIGHTS') {
    console.log(`✍️ DISPATCHING JOURNALIST AGENT`);
    await runJournalistAgent();
  }

  console.log("\n💤 Central Brain shutdown. Goodnight.");
  process.exit(0);
}

startCentralBrain();
