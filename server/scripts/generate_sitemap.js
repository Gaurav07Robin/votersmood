import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DOMAIN = 'https://www.opinar.in';
const PUBLIC_DIR = path.join(__dirname, '../../client/public');
const cachePath = path.join(__dirname, '../data/leaders_cache.json');

console.log('🔍 Reading leaders database for Sitemap Generation...');
const leaders = JSON.parse(fs.readFileSync(cachePath, 'utf-8'));

// 1. Core Platform Pages & High-Intent Election Hubs (Priority 1.0)
const corePages = [
  { path: '/', priority: '1.0', changefreq: 'daily' },
  { path: '/directory', priority: '0.9', changefreq: 'daily' },
  { path: '/elections', priority: '1.0', changefreq: 'daily' },
  { path: '/elections/lok-sabha', priority: '0.9', changefreq: 'daily' },
  { path: '/elections/state', priority: '0.9', changefreq: 'daily' },
  { path: '/elections/by-elections', priority: '1.0', changefreq: 'daily' },
  { path: '/elections/municipal', priority: '0.9', changefreq: 'daily' },
  { path: '/polls', priority: '0.8', changefreq: 'daily' },
  { path: '/insights', priority: '0.8', changefreq: 'daily' },
  { path: '/privacy-policy', priority: '0.5', changefreq: 'monthly' }
];

// Generate sitemap-core.xml
let coreXml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
for (const p of corePages) {
  coreXml += `  <url>\n    <loc>${DOMAIN}${p.path}</loc>\n    <changefreq>${p.changefreq}</changefreq>\n    <priority>${p.priority}</priority>\n  </url>\n`;
}
coreXml += `</urlset>`;
fs.writeFileSync(path.join(PUBLIC_DIR, 'sitemap-core.xml'), coreXml, 'utf8');

// Top prominent leader slugs to prioritize for Googlebot
const topLeaderSlugs = new Set([
  'narendra-modi', 'rahul-gandhi', 'amit-shah', 'yogi-adityanath', 'mamata-banerjee',
  'akhilesh-yadav', 'nitin-gadkari', 'ashok-gehlot', 'devendra-fadnavis', 'eknath-sambhaji-shinde',
  'udhayanidhi-stalin', 'b-s-yediyurappa', 'shashi-tharoor', 'arvind-kejriwal', 'pinarayi-vijayan',
  'himanta-biswa-sarma', 'm-k-stalin', 'nitish-kumar', 'chandrababu-naidu', 'revanth-reddy',
  'siddaramaiah', 'd-k-shivakumar', 'priyanka-gandhi-vadra', 'mallikarjun-kharge', 'rajnath-singh',
  'smriti-irani', 'jyotiraditya-m-scindia', 'chirag-paswan', 'tejashwi-yadav', 'k-chandrashekar-rao'
]);

// 2. Split leaders into Top and All
const topLeaders = [];
const otherLeaders = [];

for (const leader of leaders) {
  if (!leader || !leader.id) continue;
  if (topLeaderSlugs.has(leader.id) || (leader.totalReactionsCount || 0) > 1000 || (leader.openQuestionsCount || 0) > 15) {
    topLeaders.push(leader);
  } else {
    otherLeaders.push(leader);
  }
}

// Generate sitemap-leaders-top.xml (Priority 0.9)
let topXml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
for (const leader of topLeaders) {
  topXml += `  <url>\n    <loc>${DOMAIN}/directory/${leader.id}</loc>\n    <changefreq>weekly</changefreq>\n    <priority>0.9</priority>\n  </url>\n`;
}
topXml += `</urlset>`;
fs.writeFileSync(path.join(PUBLIC_DIR, 'sitemap-leaders-top.xml'), topXml, 'utf8');

// Generate sitemap-leaders-all.xml (Priority 0.6)
let allXml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
for (const leader of otherLeaders) {
  allXml += `  <url>\n    <loc>${DOMAIN}/directory/${leader.id}</loc>\n    <changefreq>monthly</changefreq>\n    <priority>0.6</priority>\n  </url>\n`;
}
allXml += `</urlset>`;
fs.writeFileSync(path.join(PUBLIC_DIR, 'sitemap-leaders-all.xml'), allXml, 'utf8');

// 3. Generate Master Sitemap Index (sitemap_index.xml)
const now = new Date().toISOString().split('T')[0];
const sitemapIndexXml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${DOMAIN}/sitemap-core.xml</loc>
    <lastmod>${now}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${DOMAIN}/sitemap-leaders-top.xml</loc>
    <lastmod>${now}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${DOMAIN}/sitemap-leaders-all.xml</loc>
    <lastmod>${now}</lastmod>
  </sitemap>
</sitemapindex>`;
fs.writeFileSync(path.join(PUBLIC_DIR, 'sitemap_index.xml'), sitemapIndexXml, 'utf8');

// 4. Generate Unified sitemap.xml for backward compatibility
let unifiedXml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
for (const p of corePages) {
  unifiedXml += `  <url>\n    <loc>${DOMAIN}${p.path}</loc>\n    <changefreq>${p.changefreq}</changefreq>\n    <priority>${p.priority}</priority>\n  </url>\n`;
}
for (const leader of leaders) {
  if (leader.id) {
    unifiedXml += `  <url>\n    <loc>${DOMAIN}/directory/${leader.id}</loc>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;
  }
}
unifiedXml += `</urlset>`;
fs.writeFileSync(path.join(PUBLIC_DIR, 'sitemap.xml'), unifiedXml, 'utf8');

console.log(`✅ Success! Generated:`);
console.log(`   - sitemap_index.xml (Master Index)`);
console.log(`   - sitemap-core.xml (${corePages.length} core URLs, Priority 1.0)`);
console.log(`   - sitemap-leaders-top.xml (${topLeaders.length} top leaders, Priority 0.9)`);
console.log(`   - sitemap-leaders-all.xml (${otherLeaders.length} leaders, Priority 0.6)`);
console.log(`   - sitemap.xml (Unified fallback, ${corePages.length + leaders.length} URLs)`);
