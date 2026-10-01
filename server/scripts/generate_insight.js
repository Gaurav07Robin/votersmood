import { getDb } from '../config/firebase-admin.js';
import { askAI } from '../utils/ai_router.js';

async function writeInsight() {
  console.log("[Insight Agent] Generating AI Insight Blog Post via 7-Stage Router...");
  
  const prompt = `
  You are 'Opinar AI Journalist', a completely neutral, highly analytical political data journalist in India.
  Write a comprehensive, engaging 500-word blog post analyzing the upcoming 2029 Lok Sabha elections, focusing on how demographic shifts in Uttar Pradesh and Maharashtra could decide the outcome.
  Include some bold headers, bullet points, and data-driven tone. Do not use markdown backticks around the whole text, just write the article using markdown for formatting.
  Your title should be catchy.
  Return it strictly as a JSON object: { "title": "Catchy Title", "content": "Full markdown content..." }
  `;

  try {
      let text = await askAI(prompt);
      
      if (text.startsWith('```json')) text = text.replace(/```json/g, '').replace(/```/g, '').trim();
      if (text.startsWith('```')) text = text.replace(/```/g, '').trim();
      
      const blog = JSON.parse(text);
      
      const db = await getDb();
      await db.collection('insights').add({
        title: blog.title,
        content: blog.content,
        createdAt: new Date(),
        author: 'Opinar AI Journalist',
        type: 'EDITORIAL'
      });
      
      console.log("[Insight Agent] Successfully published Insight to Firebase!");
      process.exit(0);
  } catch(e) {
      console.error("[Insight Agent] Fatal Error (All APIs Exhausted):", e);
  }
}

writeInsight();
