import { getDb } from '../config/firebase-admin.js';
import { askAI } from '../utils/ai_router.js';
import Parser from 'rss-parser';

const parser = new Parser();

async function getTrendingTopics() {
    console.log("[Insight Agent] Fetching real-time political trends from Google News...");
    try {
        // Search Google News for Indian political trends
        const feed = await parser.parseURL('https://news.google.com/rss/search?q=India+politics+elections+OR+policy+OR+controversy&hl=en-IN&gl=IN&ceid=IN:en');
        
        // Extract the top 15 news headlines
        const headlines = feed.items.slice(0, 15).map(item => item.title);
        console.log(`[Insight Agent] Found ${headlines.length} recent headlines.`);
        
        // Ask AI to pick the most interesting one and summarize the core issue
        const topicPrompt = `
        You are an expert political editor in India.
        Here are the latest real-time political news headlines from today:
        ${headlines.map(h => `- ${h}`).join('\n')}
        
        Select the ONE most impactful, interesting, and widely debated topic from this list that would make a great analytical blog post. 
        Formulate a 1-sentence prompt for a journalist to write about this specific topic. Do NOT write the article, just write the 1-sentence instruction.
        `;
        
        const selectedTopic = await askAI(topicPrompt);
        console.log(`[Insight Agent] AI Editor selected real-time topic: ${selectedTopic.trim()}`);
        return selectedTopic.trim();
    } catch (e) {
        console.error("[Insight Agent] Failed to fetch RSS trends, falling back to a general topic...", e);
        return "the most critical and currently debated political issue in India this week";
    }
}

async function writeInsight() {
  console.log("=========================================");
  console.log("📰 AI INSIGHT JOURNALIST (REAL-TIME TRENDS)");
  console.log("=========================================\n");
  
  const dynamicTopic = await getTrendingTopics();

  const prompt = `
  You are 'Opinar AI Journalist', a completely neutral, highly analytical political data journalist in India.
  Write a comprehensive, engaging 500-word blog post analyzing the following real-time topic:
  "${dynamicTopic}"
  
  Include some bold headers, bullet points, and a data-driven, analytical tone. Do not use markdown backticks around the whole text, just write the article using markdown for formatting.
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
