import { google } from 'googleapis';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const KEY_FILE = path.join(__dirname, '../config/gsc-service-account.json');
export const DEFAULT_SITE_URL = 'sc-domain:opinar.in';

let authClient = null;

export function getGscAuth() {
  if (!authClient) {
    authClient = new google.auth.GoogleAuth({
      keyFile: KEY_FILE,
      scopes: [
        'https://www.googleapis.com/auth/webmasters.readonly',
        'https://www.googleapis.com/auth/webmasters'
      ]
    });
  }
  return authClient;
}

export function getGscClient() {
  const auth = getGscAuth();
  return google.searchconsole({ version: 'v1', auth });
}

/**
 * List all verified sites for the service account
 */
export async function listSites() {
  const sc = getGscClient();
  const res = await sc.sites.list();
  return res.data.siteEntry || [];
}

/**
 * Inspect indexing status of a single URL
 */
export async function inspectUrl(inspectionUrl, siteUrl = DEFAULT_SITE_URL) {
  const sc = getGscClient();
  const res = await sc.urlInspection.index.inspect({
    requestBody: {
      inspectionUrl,
      siteUrl
    }
  });
  return res.data.inspectionResult || {};
}

/**
 * Fetch search performance queries and keyword rankings
 */
export async function getSearchPerformance({
  siteUrl = DEFAULT_SITE_URL,
  startDate,
  endDate,
  dimensions = ['query'],
  rowLimit = 25
} = {}) {
  const sc = getGscClient();
  const today = new Date();
  const defEnd = endDate || new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const defStart = startDate || new Date(today.getTime() - 16 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const res = await sc.searchanalytics.query({
    siteUrl,
    requestBody: {
      startDate: defStart,
      endDate: defEnd,
      dimensions,
      rowLimit
    }
  });
  return res.data.rows || [];
}

/**
 * List submitted sitemaps and their indexing count
 */
export async function listSitemaps(siteUrl = DEFAULT_SITE_URL) {
  const sc = getGscClient();
  const res = await sc.sitemaps.list({ siteUrl });
  return res.data.sitemap || [];
}

/**
 * Submit a sitemap to Google Search Console
 */
export async function submitSitemap(feedpath, siteUrl = DEFAULT_SITE_URL) {
  const sc = getGscClient();
  await sc.sitemaps.submit({ siteUrl, feedpath });
  return { success: true, feedpath };
}
