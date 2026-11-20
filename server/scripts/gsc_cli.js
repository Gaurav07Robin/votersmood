import { listSites, inspectUrl, getSearchPerformance, listSitemaps } from '../utils/gsc.js';

const cmd = process.argv[2] || 'status';
const param = process.argv[3];

async function main() {
  switch (cmd) {
    case 'status':
    case 'sites': {
      console.log('--- Verified Sites in GSC ---');
      const sites = await listSites();
      console.table(sites.map(s => ({ siteUrl: s.siteUrl, permissionLevel: s.permissionLevel })));
      break;
    }

    case 'sitemaps': {
      console.log('--- Submitted Sitemaps ---');
      const sitemaps = await listSitemaps();
      console.log(JSON.stringify(sitemaps, null, 2));
      break;
    }

    case 'queries': {
      console.log('--- Top Search Queries & Rankings (Past 14 Days) ---');
      const rows = await getSearchPerformance({ rowLimit: 20 });
      console.table(rows.map(r => ({
        query: r.keys[0],
        clicks: r.clicks,
        impressions: r.impressions,
        ctr: (r.ctr * 100).toFixed(1) + '%',
        position: r.position.toFixed(1)
      })));
      break;
    }

    case 'inspect': {
      const url = param || 'https://www.opinar.in/';
      console.log(`--- Inspecting URL: ${url} ---`);
      const result = await inspectUrl(url);
      const idx = result.indexStatusResult;
      console.log({
        verdict: idx?.verdict,
        coverageState: idx?.coverageState,
        indexingState: idx?.indexingState,
        lastCrawlTime: idx?.lastCrawlTime,
        pageFetchState: idx?.pageFetchState,
        googleCanonical: idx?.googleCanonical,
        crawledAs: idx?.crawledAs
      });
      break;
    }

    default:
      console.log(`Unknown command: ${cmd}. Available: sites, sitemaps, queries, inspect <url>`);
  }
}

main().catch(err => {
  console.error('GSC CLI Error:', err.message);
  process.exit(1);
});
