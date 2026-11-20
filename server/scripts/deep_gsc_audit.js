import { getGscClient, DEFAULT_SITE_URL } from '../utils/gsc.js';

async function deepAudit() {
  const sc = getGscClient();
  const siteUrl = DEFAULT_SITE_URL;

  console.log('====================================================');
  console.log('   DEEP GOOGLE SEARCH CONSOLE AUDIT FOR OPINAR.IN   ');
  console.log('====================================================\n');

  const today = new Date();
  const endDate = new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const startDate30 = new Date(today.getTime() - 32 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const startDate90 = new Date(today.getTime() - 92 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  // 1. Overall Aggregates (Past 30 Days)
  console.log('1. OVERALL TOTALS (Last 30 Days):');
  const totalsRes = await sc.searchanalytics.query({
    siteUrl,
    requestBody: {
      startDate: startDate30,
      endDate: endDate
    }
  });
  console.log(totalsRes.data.rows || 'No overall row data');

  // 2. Query + Page combinations (What queries lead to what URLs?)
  console.log('\n2. TOP QUERY + PAGE COMBINATIONS (Last 90 Days):');
  const queryPageRes = await sc.searchanalytics.query({
    siteUrl,
    requestBody: {
      startDate: startDate90,
      endDate: endDate,
      dimensions: ['query', 'page'],
      rowLimit: 50
    }
  });
  const qpRows = queryPageRes.data.rows || [];
  console.log(`Found ${qpRows.length} query+page pairs:`);
  qpRows.slice(0, 30).forEach(r => {
    console.log(`- Query: "${r.keys[0]}" | Page: ${r.keys[1]} | Clicks: ${r.clicks} | Impr: ${r.impressions} | CTR: ${(r.ctr*100).toFixed(1)}% | Pos: ${r.position.toFixed(1)}`);
  });

  // 3. Top Pages Ranking on Google
  console.log('\n3. TOP PAGES BY IMPRESSIONS (Last 90 Days):');
  const pagesRes = await sc.searchanalytics.query({
    siteUrl,
    requestBody: {
      startDate: startDate90,
      endDate: endDate,
      dimensions: ['page'],
      rowLimit: 30
    }
  });
  const pageRows = pagesRes.data.rows || [];
  pageRows.forEach(r => {
    console.log(`- ${r.keys[0]} -> Impr: ${r.impressions}, Clicks: ${r.clicks}, CTR: ${(r.ctr*100).toFixed(1)}%, Pos: ${r.position.toFixed(1)}`);
  });

  // 4. Low-Hanging Fruit: High Impressions (>10) but Low CTR (<2%) or Positions 5 to 20
  console.log('\n4. LOW-HANGING OPPORTUNITIES (Position 4-20, Impr >= 5):');
  const opportunities = qpRows.filter(r => r.position >= 4 && r.position <= 20 && r.impressions >= 5);
  opportunities.forEach(r => {
    console.log(`* Potential Winner: "${r.keys[0]}" on ${r.keys[1]} (Pos: ${r.position.toFixed(1)}, Impr: ${r.impressions}, Clicks: ${r.clicks})`);
  });

  // 5. Device Breakdown
  console.log('\n5. DEVICE BREAKDOWN (Last 90 Days):');
  const deviceRes = await sc.searchanalytics.query({
    siteUrl,
    requestBody: {
      startDate: startDate90,
      endDate: endDate,
      dimensions: ['device']
    }
  });
  console.log(deviceRes.data.rows || []);

  // 6. Country Breakdown
  console.log('\n6. TOP COUNTRIES (Last 90 Days):');
  const countryRes = await sc.searchanalytics.query({
    siteUrl,
    requestBody: {
      startDate: startDate90,
      endDate: endDate,
      dimensions: ['country'],
      rowLimit: 10
    }
  });
  console.log(countryRes.data.rows || []);

  // 7. Sitemaps Status Check
  console.log('\n7. SITEMAPS STATUS:');
  const sitemapsRes = await sc.sitemaps.list({ siteUrl });
  console.log(JSON.stringify(sitemapsRes.data.sitemap || [], null, 2));

  // 8. Inspect 8 diverse URLs across the platform
  console.log('\n8. BATCH URL INSPECTION SAMPLING:');
  const sampleUrls = [
    'https://www.opinar.in/',
    'https://www.opinar.in/directory',
    'https://www.opinar.in/elections',
    'https://www.opinar.in/polls',
    'https://www.opinar.in/insights',
    'https://www.opinar.in/directory/narendra-modi',
    'https://www.opinar.in/directory/rahul-gandhi',
    'https://www.opinar.in/directory/aadhav-arjuna',
    'https://www.opinar.in/directory/a-d-thomas',
    'https://www.opinar.in/elections/lok-sabha'
  ];

  for (const u of sampleUrls) {
    try {
      const insp = await sc.urlInspection.index.inspect({
        requestBody: { inspectionUrl: u, siteUrl }
      });
      const st = insp.data.inspectionResult?.indexStatusResult;
      console.log(`URL: ${u}`);
      console.log(`  Verdict: ${st?.verdict} | Coverage: ${st?.coverageState} | Crawled: ${st?.lastCrawlTime || 'Never'} | GoogleCanonical: ${st?.googleCanonical || 'None'}`);
    } catch (e) {
      console.log(`URL: ${u} -> Inspection error: ${e.message}`);
    }
  }
}

deepAudit().catch(console.error);
