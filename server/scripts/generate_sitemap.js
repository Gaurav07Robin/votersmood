import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ==========================================
// 🗺️ VOTERSMOOD SITEMAP GENERATOR
// ==========================================
// Run this whenever new politicians are added to update the Google Search Sitemap

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DOMAIN = 'https://opinar.in';

const cachePath = path.join(__dirname, '../data/leaders_cache.json');
const sitemapPath = path.join(__dirname, '../../client/public/sitemap.xml');

console.log('🔍 Reading leaders database...');
const leaders = JSON.parse(fs.readFileSync(cachePath, 'utf-8'));

let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

// 1. Add static important pages
xml += `  <url>\n    <loc>${DOMAIN}/</loc>\n    <changefreq>daily</changefreq>\n    <priority>1.0</priority>\n  </url>\n`;
xml += `  <url>\n    <loc>${DOMAIN}/directory</loc>\n    <changefreq>daily</changefreq>\n    <priority>0.9</priority>\n  </url>\n`;

// 2. Add all 4,109 politician profile pages
let count = 0;
for (const leader of leaders) {
  if (leader.id) {
    xml += `  <url>\n`;
    // Using the correct /directory/[slug] hierarchy we established for SEO
    xml += `    <loc>${DOMAIN}/directory/${leader.id}</loc>\n`;
    xml += `    <changefreq>weekly</changefreq>\n`;
    xml += `    <priority>0.8</priority>\n`;
    xml += `  </url>\n`;
    count++;
  }
}

xml += `</urlset>`;

fs.writeFileSync(sitemapPath, xml);
console.log(`✅ Success! sitemap.xml generated with ${count + 2} URLs at client/public/sitemap.xml`);
