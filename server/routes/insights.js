import express from 'express';
import { db } from '../config/firebase.js';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const q = query(collection(db, 'insights'), orderBy('createdAt', 'desc'), limit(50));
    const snapshot = await getDocs(q);
    const insights = [];
    snapshot.forEach(doc => {
      insights.push({ id: doc.id, ...doc.data() });
    });
    res.json(insights);
  } catch (error) {
    console.warn("No insights collection yet or error:", error.message);
    res.json([]);
  }
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
