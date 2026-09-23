import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const GROQ_API_KEY = process.env.GROQ_API_KEY;

async function askGroq(promptText) {
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${GROQ_API_KEY}`
    },
    body: JSON.stringify({
      model: "llama3-70b-8192",
      messages: [{ role: "user", content: promptText }],
      temperature: 0,
      response_format: { type: "json_object" }
    })
  });
  
  const data = await response.json();
  if (data.error) {
    console.error("API Error:", data.error);
    return null;
  }
  return JSON.parse(data.choices[0].message.content);
}

async function runGathering() {
  console.log("Gathering data from AI...");
  
  const prompt = `
  You are an expert Indian political data system.
  Return a JSON object containing the current political leaders in India.
  Format the JSON strictly as follows:
  {
    "prime_minister": { "name": "Name", "portfolio": "Prime Minister of India" },
    "cabinet_ministers": [
      { "name": "Name", "portfolio": "Cabinet Minister - [Department]" }
    ],
    "chief_ministers": [
      { "name": "Name", "state": "State Name" }
    ],
    "state_ministers": [
      { "name": "Name", "state": "State Name", "portfolio": "Minister of [Department]" }
    ]
  }
  
  Include:
  1. The Prime Minister (Narendra Modi).
  2. Around 20 prominent Union Cabinet Ministers (e.g. Amit Shah, Rajnath Singh, S. Jaishankar, Nirmala Sitharaman, Nitin Gadkari).
  3. All 30 Chief Ministers of States/UTs.
  4. The 4 or 5 most prominent state cabinet ministers for EACH state.
  `;
  
  const result = await askGroq(prompt);
  if (!result) return;
  
  fs.writeFileSync(path.join(__dirname, 'gathered_ministers.json'), JSON.stringify(result, null, 2));
  console.log("Successfully gathered ministers and saved to gathered_ministers.json!");
}

runGathering();
