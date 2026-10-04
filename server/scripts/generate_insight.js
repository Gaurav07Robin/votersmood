import { getDb } from '../config/firebase-admin.js';
import { askAI } from '../utils/ai_router.js';

const TOPICS = [
  "how shifting caste equations in Bihar are reshaping regional alliances ahead of 2025 Assembly elections",
  "the rising influence of women voters in Indian elections and how political parties are tailoring welfare schemes to attract them",
  "the potential political consequences of the upcoming delimitation exercise on Southern Indian states like Tamil Nadu and Kerala",
  "an in-depth analysis of anti-incumbency factors in the upcoming Maharashtra State Assembly elections",
  "how youth voters and first-time voters (Gen Z) are changing the campaign strategies of major political parties in India",
  "a data-driven look at the decline of the Left Front in West Bengal and the rise of bipolar politics",
  "the electoral impact of farmers' movements and agrarian distress on voting patterns in Punjab and Haryana",
  "the evolving dynamics of coalition politics and the future of the INDIA bloc vs the NDA",
  "how digital penetration and social media echo chambers are influencing voter behavior in rural India",
  "the historical shift in voting patterns of the Scheduled Caste (SC) communities in Uttar Pradesh",
  "the impact of urban voter apathy on voter turnout in metropolitan cities like Mumbai, Bengaluru, and Delhi",
  "the phenomenon of 'Double Engine' governance as an electoral pitch: Does it actually work?",
  "how regional parties like TMC, DMK, and AAP are expanding their footprint beyond their home states",
  "an analysis of the Muslim vote bank: Fragmentation vs Consolidation in states like UP, Bihar, and Assam",
  "the role of the RSS ground machinery in driving voter mobilization during critical elections",
  "economic indicators vs emotional appeals: What actually drives the Indian voter's choice?",
  "how the politics of freebies (Rewari culture) is impacting state exchequers and electoral outcomes",
  "the significance of the tribal (ST) vote in states like Jharkhand, Chhattisgarh, and Madhya Pradesh",
  "a look back at historic by-election upsets that foreshadowed major national political shifts",
  "the changing political landscape of Jammu & Kashmir post-Article 370 abrogation"
];

async function writeInsight() {
  console.log("[Insight Agent] Generating AI Insight Blog Post via 7-Stage Router...");
  
  // Pick a random topic
  const randomTopic = TOPICS[Math.floor(Math.random() * TOPICS.length)];
  console.log(`[Insight Agent] Selected Topic: ${randomTopic}`);

  const prompt = `
  You are 'Opinar AI Journalist', a completely neutral, highly analytical political data journalist in India.
  Write a comprehensive, engaging 500-word blog post analyzing ${randomTopic}.
  Include some bold headers, bullet points, and data-driven tone. Do not use markdown backticks around the whole text, just write the article using markdown for formatting.
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
        topic_seed: randomTopic
      });
      
      console.log("[Insight Agent] Successfully published Insight to Firebase!");
      process.exit(0);
  } catch(e) {
      console.error("[Insight Agent] Fatal Error (All APIs Exhausted):", e);
      process.exit(1);
  }
}

writeInsight();
