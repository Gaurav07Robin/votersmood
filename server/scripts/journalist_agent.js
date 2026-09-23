import { getDb } from '../config/firebase-admin.js';
import { PLATFORM_VISION } from '../config/vision.js';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

export async function runJournalistAgent() {
  console.log('=============================================');
  console.log('✍️  OPINAR JOURNALIST AGENT INITIALIZING');
  console.log('=============================================');

  try {
    const db = await getDb();
    
    // 1. Fetch ALL unblogged elections (No Upper Limit)
    console.log("📊 Gathering unblogged intelligence...");
    const snap = await db.collection('live_elections').where('blogged', '!=', true).get();
    
    if (snap.empty) {
      console.log("⏭️ No new unblogged elections available. Journalist agent sleeping.");
      return;
    }

    console.log(`🧠 AI Editor found ${snap.size} new events. Writing individual articles...`);

    for (const doc of snap.docs) {
      const electionData = doc.data();
      console.log(`\n✍️  Drafting article for: ${electionData.electionName}...`);

      const systemPrompt = `
${PLATFORM_VISION}

You are the Lead Political Editor for Opinar. Your job is to write a highly compelling, factual, and insightful news article about the following election event.
Write with a unique, prestigious "aura" that captivates political junkies. Include deep insights, facts, and context.

Raw Data:
${JSON.stringify(electionData, null, 2)}

You also have the power to create an interactive Community Poll at the end of your article to gauge the public's mood on this specific election.

Output STRICT JSON matching this schema:
{
  "title": "A captivating, journalistic headline",
  "content": "The full multi-paragraph article text. Use \\n for paragraphs.",
  "hasPoll": true,
  "poll": {
    "question": "A thought-provoking poll question related to this election",
    "options": ["Option 1", "Option 2", "Option 3"]
  }
}
`;

      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${GEMINI_API_KEY}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: systemPrompt }] }],
          generationConfig: { response_mime_type: "application/json" }
        })
      });
      
      const data = await res.json();
      if (data.error) throw new Error(data.error.message);
      
      let textResult = data.candidates[0].content.parts[0].text;
      textResult = textResult.replace(/```json/g, '').replace(/```/g, '').trim();
      const blogPost = JSON.parse(textResult);

      // Save Article
      const articleDoc = {
        title: blogPost.title,
        content: blogPost.content,
        createdAt: new Date(),
        author: "Opinar Central Brain",
        verified: true,
        electionId: doc.id
      };
      const newArticleRef = db.collection('insights').doc();
      await newArticleRef.set(articleDoc);
      console.log(`✅ Published Article: "${blogPost.title}"`);

      // Save Poll if generated
      if (blogPost.hasPoll && blogPost.poll) {
        await db.collection('community_polls').add({
          title: blogPost.poll.question,
          options: blogPost.poll.options.map(opt => ({ text: opt, votes: 0 })),
          createdAt: new Date(),
          authorId: 'AI_AGENT',
          isActive: true
        });
        console.log(`📊 Published attached Community Poll!`);
      }

      // Mark as blogged
      await doc.ref.set({ blogged: true }, { merge: true });
      
      // Sleep to respect API rate limits
      await new Promise(r => setTimeout(r, 4500));
    }

    console.log('\n=============================================');
    console.log(`✅ Journalist Agent finished publishing ${snap.size} articles.`);

  } catch (error) {
    console.error("❌ Journalist Agent Failed:", error.message);
  }
}

// Execute if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runJournalistAgent().then(() => process.exit(0));
}
