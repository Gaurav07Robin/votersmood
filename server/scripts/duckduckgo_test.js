import fetch from 'node-fetch';
import * as cheerio from 'cheerio';

async function searchDDG(query) {
  try {
    const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      }
    });
    const html = await res.text();
    const $ = cheerio.load(html);
    
    let combinedText = '';
    $('.result__snippet').each((i, el) => {
      combinedText += $(el).text() + '\n\n';
    });
    
    console.log("Search Results:\n", combinedText);
  } catch (e) {
    console.log("Error:", e);
  }
}
searchDDG("Gujarat municipal corporation election results 2026 official state election commission sec");
