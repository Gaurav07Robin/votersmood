const fs = require('fs');
const dotenv = require('dotenv');
const env = dotenv.parse(fs.readFileSync('server/.env'));

async function testGemini() {
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: 'Say OK' }] }] })
    });
    const data = await res.json();
    if (data.candidates) console.log('✅ GEMINI       : Working -', data.candidates[0].content.parts[0].text.trim());
    else console.log('❌ GEMINI       : Error -', data.error?.message);
  } catch (e) { console.log('❌ GEMINI       : Exception -', e.message); }
}

async function testGroq() {
  try {
    // First list available models
    const listRes = await fetch('https://api.groq.com/openai/v1/models', {
      headers: { 'Authorization': `Bearer ${env.GROQ_API_KEY}` }
    });
    const listData = await listRes.json();
    const firstModel = listData.data?.[0]?.id;
    console.log('   GROQ available models:', listData.data?.slice(0,3).map(m=>m.id).join(', '));

    if (!firstModel) { console.log('❌ GROQ         : No models found'); return; }

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${env.GROQ_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: firstModel, messages: [{ role: 'user', content: 'Say OK' }], max_tokens: 5 })
    });
    const data = await res.json();
    if (data.choices) console.log(`✅ GROQ         : Working (${firstModel}) -`, data.choices[0].message.content.trim());
    else console.log('❌ GROQ         : Error -', data.error?.message);
  } catch (e) { console.log('❌ GROQ         : Exception -', e.message); }
}

async function testOpenRouter() {
  try {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${env.OPENROUTER_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'google/gemma-3-4b-it:free', messages: [{ role: 'user', content: 'Say OK' }], max_tokens: 5 })
    });
    const data = await res.json();
    if (data.choices) console.log('✅ OPENROUTER   : Working -', data.choices[0].message.content.trim());
    else console.log('❌ OPENROUTER   : Error -', data.error?.message);
  } catch (e) { console.log('❌ OPENROUTER   : Exception -', e.message); }
}

async function testCloudflare() {
  try {
    const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${env.CLOUDFLARE_ACCOUNT_ID}/ai/run/@cf/meta/llama-3.1-8b-instruct`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${env.CLOUDFLARE_API_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: [{ role: 'user', content: 'Say OK' }], max_tokens: 5 })
    });
    const data = await res.json();
    if (data.result) console.log('✅ CLOUDFLARE   : Working -', data.result.response?.trim() || '(API OK)');
    else console.log('❌ CLOUDFLARE   : Error -', data.errors?.[0]?.message);
  } catch (e) { console.log('❌ CLOUDFLARE   : Exception -', e.message); }
}

console.log('🔍 Testing all API keys...\n');
Promise.all([testGemini(), testGroq(), testOpenRouter(), testCloudflare()])
  .then(() => console.log('\n✔ Done!'));
