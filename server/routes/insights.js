import express from 'express';
import { db } from '../config/firebase.js';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';

const router = express.Router();

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REELS_CACHE_PATH = path.join(__dirname, '../data/reels_cache.json');

router.get('/', async (req, res) => {
  try {
    const q = query(collection(db, 'insights'), orderBy('createdAt', 'desc'), limit(50));
    const snapshot = await getDocs(q);
    const insights = [];
    snapshot.forEach(doc => {
      insights.push({ id: doc.id, ...doc.data() });
    });
    if (insights.length > 0) {
      return res.json(insights);
    }
  } catch (error) {
    console.warn("Firestore insights read error/quota:", error.message);
  }

  // Fallback to local reels cache
  try {
    if (fs.existsSync(REELS_CACHE_PATH)) {
      const cached = JSON.parse(fs.readFileSync(REELS_CACHE_PATH, 'utf8'));
      return res.json(cached);
    }
  } catch (fsErr) {
    console.warn("Error reading reels cache:", fsErr.message);
  }

  res.json([]);
});

router.get('/live-elections', async (req, res) => {
  try {
    const snapshot = await getDocs(collection(db, 'live_elections'));
    const elections = [];
    snapshot.forEach(doc => {
      elections.push({ id: doc.id, ...doc.data() });
    });
    res.json(elections);
  } catch (error) {
    console.error("Error fetching live elections:", error.message);
    res.status(500).json({ error: 'Failed to fetch live elections' });
  }
});

export default router;
