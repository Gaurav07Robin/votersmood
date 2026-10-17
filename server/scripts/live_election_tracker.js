import { getDb } from '../config/firebase-admin.js';
import { askAI } from '../utils/ai_router.js';
import Parser from 'rss-parser';

const parser = new Parser();

export async function runLiveElectionTracker() {
  console.log("=========================================");
  console.log("📡 AI BY-ELECTION & BYPOLL RADAR INITIATED");
  console.log("=========================================\n");

  try {
    console.log("[Radar] Scanning Google News RSS for live by-election counts, dates and declared results...");

    // 3 targeted live queries to capture breaking results, counting leads, and newly announced dates
    const feeds = await Promise.allSettled([
      parser.parseURL('https://news.google.com/rss/search?q=India+by-election+OR+bypoll+result+winner+when:2d&hl=en-IN&gl=IN&ceid=IN:en'),
      parser.parseURL('https://news.google.com/rss/search?q=bypoll+counting+live+leads+margin+when:1d&hl=en-IN&gl=IN&ceid=IN:en'),
      parser.parseURL('https://news.google.com/rss/search?q=Election+Commission+of+India+by-election+dates+announced+when:3d&hl=en-IN&gl=IN&ceid=IN:en')
    ]);

    const allItems = [];
    feeds.forEach(f => {
      if (f.status === 'fulfilled' && f.value?.items) {
        allItems.push(...f.value.items);
      }
    });

    // Deduplicate headlines
    const seenTitles = new Set();
    const headlines = allItems
      .filter(item => {
        if (!item.title || seenTitles.has(item.title)) return false;
        seenTitles.add(item.title);
        return true;
      })
      .map(item => `- ${item.title} (${item.pubDate || ''})`)
      .slice(0, 25)
      .join('\n');

    if (!headlines) {
      console.log("[Radar] No bypoll news found in recent news window. Exiting.");
      return [];
    }

    console.log(`[Radar] Extracted ${seenTitles.size} unique news items. Handing over to AI for extraction and SEO enrichment...\n`);

    const prompt = `
    You are an expert political election intelligence engine and SEO strategist for Indian elections.
    Read the following news headlines from India:

    ${headlines}

    Task:
    Extract any ACTIVE, RECENTLY CONCLUDED (with declared winners), or UPCOMING BY-ELECTIONS (bypolls) mentioned.
    Determine:
    1. Constituency name & State.
    2. Election Level: "LOK_SABHA", "ASSEMBLY", or "MUNICIPAL".
    3. Status: 
       - "RESULT" (if election concluded and winner declared)
       - "COUNTING" (if live counting or leading candidate mentioned)
       - "UPCOMING" (if election date or polling scheduled)
    4. Winner details (if RESULT): winner name, party, margin, runner-up.
    5. Live Count details (if COUNTING): leading candidate, party, margin.
    6. High-CTR SEO Metadata:
       - SEO Title (High search intent: "{Constituency} By-Election Result {Year}: Winner, Margin & Vote Share")
       - Meta Description (150-160 chars containing primary and long-tail keywords)
       - Short-tail and long-tail keywords (array of 5-8 search phrases)

    Return a strict JSON array format. If no concrete by-elections are mentioned, return [].

    JSON Schema:
    [
      {
        "constituency": "Wayanad",
        "constituencySlug": "wayanad",
        "state": "Kerala",
        "stateSlug": "kerala",
        "type": "LOK_SABHA",
        "level": "Lok Sabha",
        "status": "RESULT",
        "date": "November 2024",
        "winner": "Priyanka Gandhi Vadra",
        "winningParty": "INC",
        "margin": "4,10,931 votes",
        "runnerUp": "Sathyan Mokeri",
        "runnerUpParty": "CPI",
        "leadCandidate": null,
        "leadParty": null,
        "leadMargin": null,
        "seoTitle": "Wayanad By-Election Result 2024: Priyanka Gandhi Wins by 4.1L Margin | Opinar",
        "seoDescription": "Wayanad Lok Sabha by-election 2024 result: Priyanka Gandhi Vadra (INC) won by 4,10,931 votes against CPI's Sathyan Mokeri. Full margin & vote share stats.",
        "seoKeywords": ["wayanad by election result 2024", "who won wayanad bypoll", "priyanka gandhi wayanad margin", "wayanad lok sabha by election"]
      }
    ]

    Return ONLY valid JSON. No markdown formatting.
    `;

    let aiResponse = await askAI(prompt);
    if (aiResponse.startsWith('```json')) aiResponse = aiResponse.replace(/```json/g, '').replace(/```/g, '').trim();
    if (aiResponse.startsWith('```')) aiResponse = aiResponse.replace(/```/g, '').trim();

    let extractedData = [];
    try {
      extractedData = JSON.parse(aiResponse);
    } catch (parseErr) {
      console.error("[Radar] Failed to parse AI JSON response:", parseErr.message);
      return [];
    }

    if (!Array.isArray(extractedData) || extractedData.length === 0) {
      console.log("[Radar] AI Analysis: No concrete by-elections extracted today.");
      return [];
    }

    console.log(`[Radar] AI Analysis: Successfully extracted ${extractedData.length} by-election(s)! Synchronizing to Firestore...`);

    const db = await getDb();
    const batch = db.batch();

    extractedData.forEach(election => {
      const sSlug = (election.stateSlug || election.state || 'india').toLowerCase().replace(/[^a-z0-9]/g, '-');
      const cSlug = (election.constituencySlug || election.constituency || 'unknown').toLowerCase().replace(/[^a-z0-9]/g, '-');
      const docId = `${sSlug}_${cSlug}_bypoll`;
      const docRef = db.collection('live_elections').doc(docId);

      batch.set(docRef, {
        ...election,
        constituencySlug: cSlug,
        stateSlug: sSlug,
        lastUpdated: new Date().toISOString(),
        source: 'AI_BYPOLL_RADAR'
      }, { merge: true });

      console.log(`  -> Tracked [${election.status}]: ${election.constituency} (${election.state}) - ${election.winner ? 'Winner: ' + election.winner : 'Upcoming'}`);
    });

    await batch.commit();
    console.log("[Radar] ✅ Successfully committed live by-election intelligence to Firestore.\n");
    return extractedData;

  } catch (err) {
    console.error("[Radar] Error during bypoll radar scan:", err.message);
    return [];
  }
}

// Auto-run if executed directly via CLI: `node server/scripts/live_election_tracker.js`
if (process.argv[1] && process.argv[1].endsWith('live_election_tracker.js')) {
  runLiveElectionTracker()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
