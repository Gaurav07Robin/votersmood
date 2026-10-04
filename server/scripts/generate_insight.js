import { getDb } from '../config/firebase-admin.js';
import { askAI } from '../utils/ai_router.js';
import Parser from 'rss-parser';

const parser = new Parser();

// ------------------------------------------------------------------
// DESK 1: REAL-TIME TRENDS (Google News)
// ------------------------------------------------------------------
async function getTrendingTopic() {
    console.log("[Insight Agent] 📡 Mode: REAL-TIME TRENDS");
    try {
        const feed = await parser.parseURL('https://news.google.com/rss/search?q=India+politics+elections+OR+policy&hl=en-IN&gl=IN&ceid=IN:en');
        const headlines = feed.items.slice(0, 15).map(item => item.title);
        
        const prompt = `
        You are a political editor. Here are today's headlines:
        ${headlines.map(h => `- ${h}`).join('\n')}
        Select the most impactful topic and formulate a 1-sentence prompt for a journalist to write about it.
        `;
        const topic = await askAI(prompt);
        return topic.trim();
    } catch (e) {
        return "the most critical political debate in India today";
    }
}

// ------------------------------------------------------------------
// DESK 2: LONG-TERM VISION & DEMOGRAPHICS
// ------------------------------------------------------------------
const VISIONARY_TOPICS = [
    "the long-term impact of the 2026 Delimitation exercise on the political power balance between North and South India",
    "how the changing demographics of Gen-Z and first-time voters will fundamentally reshape the 2029 Lok Sabha elections",
    "the future of regional alliances and whether the INDIA bloc can sustain long-term relevance against national parties",
    "the shifting voting patterns of women across rural India and how gender-specific welfare is replacing traditional caste math",
    "the impending crisis of urban voter apathy in metropolitan cities and its effect on local governance by 2030",
    "predictive analysis on how climate change, agrarian distress, and farm laws will dictate the future of Punjab and Haryana politics",
    "the evolution of the 'Double Engine' government pitch and its diminishing returns in future state assembly elections",
    "how deepfakes and AI-driven propaganda will completely alter the landscape of Indian election campaigns by 2029"
];

function getVisionaryTopic() {
    console.log("[Insight Agent] 🔭 Mode: LONG-TERM VISION & DEMOGRAPHICS");
    return VISIONARY_TOPICS[Math.floor(Math.random() * VISIONARY_TOPICS.length)];
}

// ------------------------------------------------------------------
// DESK 3: STATE-BY-STATE DEEP DIVE
// ------------------------------------------------------------------
const STATES = ["Uttar Pradesh", "Maharashtra", "Bihar", "West Bengal", "Tamil Nadu", "Karnataka", "Gujarat", "Kerala", "Assam"];
function getStateDeepDiveTopic() {
    console.log("[Insight Agent] 🗺️ Mode: REGIONAL DEEP DIVE");
    const state = STATES[Math.floor(Math.random() * STATES.length)];
    return `a deep-dive analysis into the unique micro-demographics, caste equations, and anti-incumbency factors shaping the future of ${state} politics`;
}

// ------------------------------------------------------------------
// MAIN ROUTER
// ------------------------------------------------------------------
async function writeInsight() {
  console.log("=========================================");
  console.log("📰 OPINAR MULTI-DESK NEWSROOM INITIATED");
  console.log("=========================================\n");
  
  // Randomly assign the AI to one of the 3 "Desks"
  const deskRoll = Math.random();
  let dynamicTopic = "";
  let deskName = "";

  if (deskRoll < 0.4) {
      // 40% chance of Breaking News
      dynamicTopic = await getTrendingTopic();
      deskName = "Trending News";
  } else if (deskRoll < 0.7) {
      // 30% chance of Future Vision / Demographics
      dynamicTopic = getVisionaryTopic();
      deskName = "Demographics & Future Vision";
  } else {
      // 30% chance of State Deep Dive
      dynamicTopic = getStateDeepDiveTopic();
      deskName = "Regional Analysis";
  }

  console.log(`[Insight Agent] Final Selected Topic: ${dynamicTopic}`);

  const prompt = `
  You are 'Opinar AI Journalist', a completely neutral, highly analytical political data journalist in India.
  Write a comprehensive, engaging 500-word blog post analyzing the following topic:
  "${dynamicTopic}"
  
  Your analysis MUST be data-driven, visionary, and look at the bigger picture (historical context or future implications).
  Include bold headers and bullet points. Do not use markdown backticks around the whole text, just write the article using markdown for formatting.
  Your title should be catchy.
  Return it strictly as a JSON object: { "title": "Catchy Title", "content": "Full markdown content..." }
  `;

  try {
      let text = await askAI(prompt);
      
      if (text.startsWith('\`\`\`json')) text = text.replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '').trim();
      if (text.startsWith('\`\`\`')) text = text.replace(/\`\`\`/g, '').trim();
      
      const blog = JSON.parse(text);
      
      const db = await getDb();
      await db.collection('insights').add({
        title: blog.title,
        content: blog.content,
        createdAt: new Date(),
        author: 'Opinar AI Journalist',
        type: 'EDITORIAL',
        desk: deskName,
        topic_seed: dynamicTopic
      });
      
      console.log(`[Insight Agent] Successfully published: "${blog.title}"`);
      process.exit(0);
  } catch(e) {
      console.error("[Insight Agent] Fatal Error (All APIs Exhausted):", e);
      process.exit(1);
  }
}

writeInsight();
