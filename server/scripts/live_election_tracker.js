import { getDb } from '../config/firebase-admin.js';
import { askAI } from '../utils/ai_router.js';
import Parser from 'rss-parser';

const parser = new Parser();

async function trackLiveElections() {
    console.log("=========================================");
    console.log("📡 LIVE ELECTION & BYPOLL RADAR INITIATED");
    console.log("=========================================\n");

    try {
        console.log("[Radar] Scanning Google News for 'India by-election' and 'Election Commission dates'...");
        
        // Fetch real-time news from Google News RSS to bypass AI knowledge cutoffs
        const feed1 = await parser.parseURL('https://news.google.com/rss/search?q=India+by-election+OR+bypoll+when:1d&hl=en-IN&gl=IN&ceid=IN:en');
        const feed2 = await parser.parseURL('https://news.google.com/rss/search?q=Election+Commission+of+India+announces+dates+when:1d&hl=en-IN&gl=IN&ceid=IN:en');
        
        const headlines = [...feed1.items, ...feed2.items]
            .map(item => `- ${item.title} (${item.pubDate})`)
            .slice(0, 15) // take top 15 news items
            .join('\n');

        if (!headlines) {
            console.log("[Radar] No election news found in the last 24 hours. Sleeping.");
            process.exit(0);
        }

        console.log("[Radar] Found recent headlines. Handing over to AI for intelligent extraction...\n");

        const prompt = `
        You are an intelligent political data extractor. Read the following news headlines from the last 24 hours in India.
        Determine if there are any ACTIVE elections, UPCOMING by-elections (bypolls), or newly ANNOUNCED election dates mentioned.
        
        Headlines:
        ${headlines}
        
        If there are any elections/bypolls mentioned, extract them into a strict JSON array format.
        If there are NO concrete bypolls or elections announced or happening based ONLY on these headlines, return an empty array [].
        
        Output format must be exactly this JSON:
        [
          {
             "title": "Bypoll for Wayanad Lok Sabha",
             "state": "Kerala",
             "constituency": "Wayanad",
             "type": "BY-ELECTION",
             "status": "ANNOUNCED",
             "date": "October 2026"
          }
        ]
        
        Return ONLY valid JSON. No markdown backticks.
        `;

        let aiResponse = await askAI(prompt);
        
        // Clean markdown backticks if AI hallucinates them
        if (aiResponse.startsWith('```json')) aiResponse = aiResponse.replace(/```json/g, '').replace(/```/g, '').trim();
        if (aiResponse.startsWith('```')) aiResponse = aiResponse.replace(/```/g, '').trim();

        const extractedData = JSON.parse(aiResponse);

        if (extractedData.length === 0) {
            console.log("[Radar] AI Analysis: No concrete by-elections or elections found today. Shutting down radar.");
            process.exit(0);
        }

        console.log(`[Radar] AI Analysis: Found ${extractedData.length} active/upcoming election(s)! Saving to database...`);
        
        const db = await getDb();
        const batch = db.batch();

        extractedData.forEach(election => {
            const docId = `${election.state}_${election.constituency}_live`.toLowerCase().replace(/[^a-z0-9]/g, '_');
            const docRef = db.collection('live_elections').doc(docId);
            batch.set(docRef, {
                ...election,
                lastUpdated: new Date().toISOString(),
                source: 'AI_RADAR'
            }, { merge: true });
            
            console.log(`  -> Tracked: ${election.title} (${election.date})`);
        });

        await batch.commit();
        console.log("\n[Radar] ✅ Successfully synchronized live election data. Radar shutting down until tomorrow.");
        process.exit(0);

    } catch (err) {
        console.error("[Radar] Fatal Error during scan:", err);
        process.exit(1);
    }
}

trackLiveElections();
