import express from 'express';
import { getDb } from '../config/firebase-admin.js';

const router = express.Router();

const withTimeout = (promise, ms = 300) => {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('DB Timeout')), ms))
  ]);
};

const BASE_TOPICS = [
  {
    id: 'maharashtra-elections-2026',
    title: 'MAHARASHTRAELECTIONS2026',
    category: 'ELECTION',
    description: 'Maharashtra Assembly Elections & Local Governance coverage, key constituency polls, and candidate manifestos.',
    postCount: 1420,
    relatedState: 'MAHARASHTRA • MUMBAI SOUTH',
    reactionsLast24h: 1250,
    reactionsLast48h: 2840,
  },
  {
    id: 'union-budget-2026',
    title: 'UNIONBUDGET2026',
    category: 'POLICY',
    description: 'Central Union Fiscal Budget & Tax Reforms. Parliamentary debates in Lok Sabha & Rajya Sabha on income tax, infrastructure, and inflation.',
    postCount: 2310,
    relatedState: 'NATIONAL • LOK SABHA',
    reactionsLast24h: 1890,
    reactionsLast48h: 3950,
  },
  {
    id: 'up-election-polls-2026',
    title: 'UPELECTIONPOLLS2026',
    category: 'ELECTION',
    description: 'Uttar Pradesh Urban Development & Regional Polls. Debates on law & order, expressways, and upcoming state election candidates.',
    postCount: 980,
    relatedState: 'UTTAR PRADESH • GORAKHPUR URBAN',
    reactionsLast24h: 870,
    reactionsLast48h: 1720,
  },
  {
    id: 'urban-transport-policy',
    title: 'URBANTRANSPORTPOLICY',
    category: 'POLICY',
    description: 'Metro Rail & Highway Expansion Across States. Evaluation of MLA performance in road maintenance, public transit, and smart cities.',
    postCount: 650,
    relatedState: 'NATIONAL • VIDHAN SABHA',
    reactionsLast24h: 420,
    reactionsLast48h: 910,
  }
];

// GET /api/topics?window=24 or 48
router.get('/', async (req, res) => {
  const windowHours = parseInt(req.query.window, 10) || 48;
  const cutoffTime = Date.now() - (windowHours * 60 * 60 * 1000);

  try {
    let topicsMap = new Map();

    const db = await getDb();
    if (db) {
      const postsSnap = await withTimeout(
        db.collection('posts').where('createdAt', '>=', cutoffTime).get(),
        300
      );

      postsSnap.docs.forEach(doc => {
        const post = doc.data();
        const tag = (post.topicTag || 'GENERAL').replace(/^#/, '').toUpperCase();
        const reactions = (post.agreeCount || 0) + (post.funnyCount || 0);

        if (!topicsMap.has(tag)) {
          topicsMap.set(tag, {
            id: tag.toLowerCase(),
            title: tag,
            category: 'TRENDING',
            description: `Active political debate topic with high citizen reaction volume over the last ${windowHours} hours.`,
            postCount: 0,
            reactionsLast24h: 0,
            reactionsLast48h: 0,
            relatedState: post.leaderTag || 'NATIONAL',
          });
        }

        const t = topicsMap.get(tag);
        t.postCount += 1;
        t.reactionsLast48h += reactions;
        if (post.createdAt >= Date.now() - (24 * 60 * 60 * 1000)) {
          t.reactionsLast24h += reactions;
        }
      });
    }

    let resultTopics = Array.from(topicsMap.values());

    if (resultTopics.length === 0) {
      resultTopics = BASE_TOPICS;
    }

    resultTopics.sort((a, b) => {
      const valA = windowHours <= 24 ? (a.reactionsLast24h || 0) : (a.reactionsLast48h || 0);
      const valB = windowHours <= 24 ? (b.reactionsLast24h || 0) : (b.reactionsLast48h || 0);
      return valB - valA;
    });

    const rankedTopics = resultTopics.map((topic, index) => ({
      ...topic,
      rank: index + 1,
      windowHours,
      activeReactionScore: windowHours <= 24 ? (topic.reactionsLast24h || 0) : (topic.reactionsLast48h || 0),
      windowLabel: `MOST REACTED (${windowHours}H WINDOW)`
    }));

    res.json(rankedTopics);
  } catch (error) {
    const sortedFallback = BASE_TOPICS.sort((a, b) => (b.reactionsLast48h || 0) - (a.reactionsLast48h || 0)).map((t, i) => ({
      ...t,
      rank: i + 1,
      windowHours,
      activeReactionScore: windowHours <= 24 ? t.reactionsLast24h : t.reactionsLast48h,
      windowLabel: `MOST REACTED (${windowHours}H WINDOW)`
    }));
    res.json(sortedFallback);
  }
});

export default router;
