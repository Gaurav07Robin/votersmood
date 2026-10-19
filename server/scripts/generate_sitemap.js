import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ==========================================
// 🗺️ VOTERSMOOD SITEMAP GENERATOR
// ==========================================
// Run this whenever new politicians are added to update the Google Search Sitemap

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DOMAIN = 'https://www.opinar.in';

const cachePath = path.join(__dirname, '../data/leaders_cache.json');
const sitemapPath = path.join(__dirname, '../../client/public/sitemap.xml');

console.log('🔍 Reading leaders database...');
const leaders = JSON.parse(fs.readFileSync(cachePath, 'utf-8'));

let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

// 1. Add static important pages & Election Hubs
const corePages = [
  { path: '/', priority: '1.0', changefreq: 'daily' },
  { path: '/directory', priority: '0.9', changefreq: 'daily' },
  { path: '/elections', priority: '0.9', changefreq: 'daily' },
  { path: '/elections/lok-sabha', priority: '0.9', changefreq: 'daily' },
  { path: '/elections/state', priority: '0.9', changefreq: 'daily' },
  { path: '/elections/by-elections', priority: '0.9', changefreq: 'daily' },
  { path: '/elections/municipal', priority: '0.9', changefreq: 'daily' },
  { path: '/insights', priority: '0.8', changefreq: 'daily' }
];

for (const p of corePages) {
  xml += `  <url>\n    <loc>${DOMAIN}${p.path}</loc>\n    <changefreq>${p.changefreq}</changefreq>\n    <priority>${p.priority}</priority>\n  </url>\n`;
}

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
