import { getDb } from '../config/firebase-admin.js';
import { askAI } from '../utils/ai_router.js';
import Parser from 'rss-parser';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REELS_CACHE_PATH = path.join(__dirname, '../data/reels_cache.json');

const parser = new Parser({
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
  }
});

// ------------------------------------------------------------------
// MULTI-CHANNEL CRAWLER: Google News, YouTube & Reddit Political Feeds
// ------------------------------------------------------------------
const LIVE_SOURCES = [
  // 1. Google News: Targeted Investigative & Political Breaking Topics
  {
    type: 'Google News',
    name: 'CJP & Activist Cases',
    url: 'https://news.google.com/rss/search?q=(CJP+OR+"Citizens+for+Justice"+OR+"Teesta+Setalvad"+OR+"activist+arrest"+OR+"police+detained")+when:2d&hl=en-IN&gl=IN&ceid=IN:en'
  },
  {
    type: 'Google News',
    name: 'EC & Gyanesh Kumar',
    url: 'https://news.google.com/rss/search?q=("Gyanesh+Kumar"+OR+"Election+Commissioner"+OR+"ECI+press+conference"+OR+"seizures")+when:2d&hl=en-IN&gl=IN&ceid=IN:en'
  },
  {
    type: 'Google News',
    name: 'AAP Detentions & ED Raids',
    url: 'https://news.google.com/rss/search?q=(AAP+OR+"Arvind+Kejriwal"+OR+"Sanjay+Singh"+OR+"Atishi"+OR+"protest+detained"+OR+"ED+court")+when:2d&hl=en-IN&gl=IN&ceid=IN:en'
  },
  {
    type: 'Google News',
    name: 'Dhruv Rathee & Viral Narratives',
    url: 'https://news.google.com/rss/search?q=("Dhruv+Rathee"+OR+"press+conference"+OR+"viral+video"+OR+"BJP+spokesperson")+when:3d&hl=en-IN&gl=IN&ceid=IN:en'
  },
  {
    type: 'Google News',
    name: 'Modi Rallies & Deep State Debates',
    url: 'https://news.google.com/rss/search?q=(Modi+rally+speech+attack+OR+"deep+state"+OR+"foreign+funded"+OR+"George+Soros"+OR+"opposition+plot")+when:3d&hl=en-IN&gl=IN&ceid=IN:en'
  },
  {
    type: 'Google News',
    name: 'Maharashtra & Jharkhand Elections',
    url: 'https://news.google.com/rss/search?q=("Maharashtra+election"+OR+"Jharkhand+election"+OR+"Mahayuti"+OR+"MVA"+OR+"seat+sharing")+when:1d&hl=en-IN&gl=IN&ceid=IN:en'
  },

  // 2. YouTube RSS Feeds for Real-Time Soundbites & Viral Pressers
  {
    type: 'YouTube',
    name: 'Dhruv Rathee Channel',
    url: 'https://www.youtube.com/feeds/videos.xml?channel_id=UC9Pla4vI1_jSbg311p_w4xA'
  },
  {
    type: 'YouTube',
    name: 'ANI News Political Bureau',
    url: 'https://www.youtube.com/feeds/videos.xml?channel_id=UCtF0WJbWstgYPrqF6P_yU1w'
  },
  {
    type: 'YouTube',
    name: 'The Lallantop Politics',
    url: 'https://www.youtube.com/feeds/videos.xml?channel_id=UCx8Z14PpntdaxCt2hakbQLQ'
  },

  // 3. Reddit Indian Politics Trending RSS
  {
    type: 'Reddit',
    name: 'r/india Politics Hot',
    url: 'https://www.reddit.com/r/india/search.rss?q=flair:Politics&sort=hot&restrict_sr=1'
  },
  {
    type: 'Reddit',
    name: 'r/IndiaSpeaks Politics Hot',
    url: 'https://www.reddit.com/r/IndiaSpeaks/search.rss?q=flair:Politics&sort=hot&restrict_sr=1'
  }
];

async function crawlAllSources() {
  console.log("[Multi-Source Radar] Crawling Google News, YouTube channels, and Reddit feeds...");
  const rawItems = [];

  for (const src of LIVE_SOURCES) {
    try {
      const feed = await parser.parseURL(src.url);
      const items = (feed.items || []).slice(0, 5).map(it => {
        const title = (it.title || '').replace(/<[^>]+>/g, '').trim();
        const snippet = (it.contentSnippet || it.summary || '').substring(0, 150).replace(/\s+/g, ' ');
        return `[${src.name}]: ${title} ${snippet ? `(${snippet})` : ''}`;
      });
      rawItems.push(...items);
    } catch (err) {
      // Gracefully continue through other sources if one feed is blocked or slow
      console.warn(`[Multi-Source Radar] Warning on ${src.name}:`, err.message);
    }
  }

  return rawItems.filter(Boolean).slice(0, 35);
}

// Helper to remove any hashtags (#), asterisks (*), and emojis
const cleanText = (str) => {
  return String(str || '')
    .replace(/[#*]/g, '')
    .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E6}-\u{1F1FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}]/gu, '')
    .trim();
};

// ------------------------------------------------------------------
// GENERATE FACT-PACKED, REAL-TIME POLITICAL STORY
// ------------------------------------------------------------------
async function generateHourlyInsight() {
  console.log("=========================================");
  console.log("⚡ OPINAR REAL-TIME RADAR: HOURLY DISPATCH");
  console.log("=========================================\n");

  const liveFeeds = await crawlAllSources();

  console.log(`[Radar] Aggregated ${liveFeeds.length} live signals from YouTube, Reddit, and Newsdesks.`);

  const prompt = `
You are the Chief Investigative Political Editor for Opinar.
You write SHARP, FACT-DENSE, UNCOMPROMISING news snippets on Indian politics.

STRICT INSTRUCTIONS:
- NO generic philosophical essays ("Democracy is important", "Elections are a festival").
- Include SPECIFIC NAMES: Mention individuals directly like Gyanesh Kumar (CEC), Arvind Kejriwal, Sanjay Singh, Dhruv Rathee, CJP (Citizens for Justice and Peace), Narendra Modi, Amit Shah, Rahul Gandhi, Devendra Fadnavis, Hemant Soren.
- Include SPECIFIC FACTS & DATA: Exact numbers, FIR sections, court observations, polling dates, seat tallies (Maharashtra 288, Jharkhand 81, UP 10 bypolls), seizure amounts, or video claim points.
- Highlight REAL CONTROVERSIES: Police detentions, press conferences, anti-defection petitions, ED raids, deep state / foreign interference accusations, and ground alliance revolts.
- STRICTLY NO hashtags (#) and NO asterisks (*).
- STRICTLY NO emojis.
- Write in 3 direct, punchy, fact-loaded sentences/paragraphs.

Here is the real-time stream of headlines from the past hours:
${liveFeeds.map(f => `- ${f}`).join('\n')}

Select the most explosive or significant real-world political development and format STRICTLY as JSON:
{
  "title": "Clear, Fact-First Headline (Max 12 words)",
  "subtitle": "Immediate context and what is at stake (Max 18 words)",
  "category": "RALLIES & SPEECHES" | "CJI & COURTS" | "BJP VS OPPOSITION" | "CASTE CALCULUS" | "STATE BATTLEGROUNDS",
  "tag": "Short Topic Tag without hash (e.g. AAP Protests, Gyanesh Kumar ECI, Dhruv Rathee Video, Maharashtra 2024)",
  "bullets": [
    "Fact-packed point 1 stating exactly what happened, who was detained/arrested/addressed, and where.",
    "Fact-packed point 2 stating the political strategy, legal section, or reaction from rival parties.",
    "Fact-packed point 3 stating the electoral impact, vote numbers, seat numbers, or court date."
  ],
  "slug": "url-friendly-slug-with-hyphens"
}

Output ONLY valid JSON. No markdown fences.
`;

  try {
    let aiResponse = await askAI(prompt);

    if (aiResponse.startsWith('```json')) aiResponse = aiResponse.replace(/```json/g, '').replace(/```/g, '').trim();
    if (aiResponse.startsWith('```')) aiResponse = aiResponse.replace(/```/g, '').trim();

    const raw = JSON.parse(aiResponse);

    const cleanReel = {
      id: `live-${Date.now()}`,
      slug: cleanText(raw.slug || raw.title).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      title: cleanText(raw.title),
      subtitle: cleanText(raw.subtitle),
      category: cleanText(raw.category || 'POLITICS').toUpperCase(),
      tag: cleanText(raw.tag || 'Breaking'),
      timeAgo: 'Just now',
      bullets: (raw.bullets || []).map(cleanText),
      createdAt: new Date().toISOString(),
      source: 'HOURLY_LIVE_RADAR',
      type: 'REEL_STORY'
    };

    // 1. Save to local reels cache (offline & free-tier quota immunity)
    let localCache = [];
    try {
      if (fs.existsSync(REELS_CACHE_PATH)) {
        localCache = JSON.parse(fs.readFileSync(REELS_CACHE_PATH, 'utf8'));
      }
    } catch (_) {}

    localCache = [cleanReel, ...localCache.filter(r => r.slug !== cleanReel.slug)].slice(0, 30);
    fs.writeFileSync(REELS_CACHE_PATH, JSON.stringify(localCache, null, 2));
    console.log(`[Hourly Dispatch] Saved to local cache: ${cleanReel.title}`);

    // 2. Save to Firestore
    try {
      const db = await getDb();
      await db.collection('insights').doc(cleanReel.slug).set(cleanReel, { merge: true });
      console.log(`[Hourly Dispatch] Successfully pushed to Firestore insights/${cleanReel.slug}`);
    } catch (dbErr) {
      console.warn("[Hourly Dispatch] Firestore write bypassed (Quota or serverless offline):", dbErr.message);
    }

    console.log("⚡ Hourly newsroom cycle complete!");
    process.exit(0);
  } catch (err) {
    console.error("[Hourly Dispatch] Error during newsroom run:", err.message);
    process.exit(1);
  }
}

generateHourlyInsight();
