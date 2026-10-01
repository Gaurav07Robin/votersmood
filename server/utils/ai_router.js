import fetch from 'node-fetch';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const geminiKeys = [
    process.env.GEMINI_API_KEY,
    process.env.GEMINI_API_KEY_2,
    process.env.GEMINI_API_KEY_3,
    process.env.GEMINI_API_KEY_4
].filter(Boolean);

export async function askAI(prompt) {
    const providers = [
        // 1-4: Gemini Rotation
        ...geminiKeys.map((key, i) => async () => {
            console.log(`[AI Router] Attempting Gemini Key ${i + 1}...`);
            const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
            });
            if (!res.ok) throw new Error(`Gemini Error: ${res.status}`);
            const data = await res.json();
            return data.candidates[0].content.parts[0].text;
        }),

        // 5: OpenRouter (GPT-4o-mini)
        async () => {
            console.log(`[AI Router] Attempting OpenRouter (GPT-4o-mini)...`);
            if (!process.env.OPENROUTER_API_KEY) throw new Error("No OpenRouter Key");
            const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'openai/gpt-4o-mini',
                    messages: [{ role: 'user', content: prompt }]
                })
            });
            if (!res.ok) throw new Error(`OpenRouter Error: ${res.status}`);
            const data = await res.json();
            return data.choices[0].message.content;
        },

        // 6: Groq (Llama 3.1)
        async () => {
            console.log(`[AI Router] Attempting Groq (llama-3.1-8b-instant)...`);
            if (!process.env.GROQ_API_KEY) throw new Error("No Groq Key");
            const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'llama-3.1-8b-instant',
                    messages: [{ role: 'user', content: prompt }]
                })
            });
            if (!res.ok) throw new Error(`Groq Error: ${res.status}`);
            const data = await res.json();
            return data.choices[0].message.content;
        },

        // 7: Cloudflare Workers AI (Llama-3-8b)
        async () => {
            console.log(`[AI Router] Attempting Cloudflare AI...`);
            if (!process.env.CLOUDFLARE_API_KEY || !process.env.CLOUDFLARE_ACCOUNT_ID) throw new Error("No Cloudflare Key");
            const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/ai/run/@cf/meta/llama-3-8b-instruct`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${process.env.CLOUDFLARE_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    messages: [{ role: 'user', content: prompt }]
                })
            });
            if (!res.ok) throw new Error(`Cloudflare Error: ${res.status}`);
            const data = await res.json();
            return data.result.response;
        }
    ];

    let lastError;
    for (const provider of providers) {
        try {
            const text = await provider();
            if (text) return text.trim();
        } catch (error) {
            console.error(`[AI Router] Fallback triggered due to: ${error.message}`);
            lastError = error;
            // Continue to next provider
        }
    }

    throw new Error(`All 7 AI providers exhausted! Last error: ${lastError?.message}`);
}
