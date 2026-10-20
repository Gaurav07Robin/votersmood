import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Helper to safely load JSON
function loadData(relativePath) {
  try {
    const fullPath = path.resolve(__dirname, relativePath);
    if (fs.existsSync(fullPath)) {
      return JSON.parse(fs.readFileSync(fullPath, 'utf8'));
    }
  } catch (err) {
    console.error(`Failed to load ${relativePath}:`, err.message);
  }
  return [];
}

const lokSabhaData = loadData('../../client/src/data/lok_sabha_metadata.json');
const stateElectionsData = loadData('../../client/src/data/state_elections_metadata.json');
const municipalData = loadData('../../client/src/data/municipal_elections_data.json');

// GET /api/elections or /api/election
router.get(['/', '/summary'], (req, res) => {
  res.json({
    status: 'online',
    category: 'Indian Elections Intelligence',
    totalLokSabhaElections: lokSabhaData.length,
    totalStateAssembliesTracked: stateElectionsData.length,
    totalMunicipalBodies: municipalData.length,
    latestGeneralElectionYear: 2024,
    tiers: [
      { id: 'LOK_SABHA', name: 'Lok Sabha (General Elections 1952–2024)', count: lokSabhaData.length },
      { id: 'ASSEMBLY', name: 'State Assembly (Vidhan Sabha 1952–2026)', count: stateElectionsData.length },
      { id: 'BY_ELECTION', name: 'By-Election Radar (Bypolls)', active: true },
      { id: 'MUNICIPAL', name: 'Municipal Elections (Mahanagar Palika & Nagar Palika)', count: municipalData.length }
    ]
  });
});

// GET /api/elections/lok-sabha
router.get('/lok-sabha', (req, res) => {
  const { year } = req.query;
  if (year) {
    const target = lokSabhaData.find(d => String(d.year) === String(year));
    if (!target) return res.status(404).json({ error: `Lok Sabha election data for ${year} not found` });
    return res.json(target);
  }
  res.json(lokSabhaData);
});

// GET /api/elections/state
router.get('/state', (req, res) => {
  const { state, year } = req.query;
  let results = stateElectionsData;
  if (state) {
    results = results.filter(d => (d.state || '').toLowerCase() === state.toLowerCase());
  }
  if (year) {
    results = results.filter(d => String(d.year) === String(year));
  }
  res.json(results);
});

// GET /api/elections/municipal
router.get('/municipal', (req, res) => {
  const { tier, state, district, year } = req.query;
  let results = municipalData;
  if (tier && tier !== 'ALL') {
    results = results.filter(d => d.type === tier);
  }
  if (state && state !== 'ALL') {
    results = results.filter(d => (d.state || '').toLowerCase() === state.toLowerCase());
  }
  if (district && district !== 'ALL') {
    results = results.filter(d => (d.district || '').toLowerCase().includes(district.toLowerCase()));
  }
  if (year && year !== 'ALL') {
    results = results.filter(d => String(d.year) === String(year));
  }
  res.json(results);
});

export default router;
