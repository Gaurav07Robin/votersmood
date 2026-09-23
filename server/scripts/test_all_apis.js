import fetch from 'node-fetch';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const tests = [
  {
    name: 'Gemini (Google)',
    run: async () => {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${process.env.GEMINI_API_KEY}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: "Reply exactly with the word SUCCESS" }] }] })
      });
      const data = await res.json();
      return data.candidates[0].content.parts[0].text.trim();
    }
  },
  {
    name: 'Groq (Llama)',
    run: async () => {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.GROQ_API_KEY}` },
        body: JSON.stringify({ model: 'openai/gpt-oss-120b', messages: [{ role: 'user', content: 'Reply exactly with the word SUCCESS' }] })
      });
      const data = await res.json();
      return data.choices[0].message.content.trim();
    }
  },
  {
    name: 'OpenRouter (Gemma 4 31B)',
    run: async () => {
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}` },
        body: JSON.stringify({ model: 'google/gemma-4-31b-it:free', messages: [{ role: 'user', content: 'Reply exactly with the word SUCCESS' }] })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error.message);
      return data.choices[0].message.content.trim();
    }
  },
  {
    name: 'Cloudflare (Llama 3.1 8B)',
    run: async () => {
      const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/ai/v1/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.CLOUDFLARE_API_TOKEN}` },
        body: JSON.stringify({ model: '@cf/meta/llama-3.1-8b-instruct-fp8', messages: [{ role: 'user', content: 'Reply exactly with the word SUCCESS' }] })
      });
      const data = await res.json();
      if (data.errors && data.errors.length > 0) throw new Error(data.errors[0].message);
      return data.choices[0].message.content.trim();
    }
  }
];

async function runTests() {
  console.log("Starting full diagnostic of all 4 AI brains...\n");
  for (const test of tests) {
    try {
      const result = await test.run();
      console.log(`✅ ${test.name}: ONLINE -> Responded: "${result}"`);
    } catch (e) {
      console.log(`⚠️ ${test.name}: RATE LIMITED / FAILED -> Error: ${e.message}`);
    }
  }
}
runTests();
