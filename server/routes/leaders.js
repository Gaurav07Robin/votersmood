import express from 'express';
import { db } from '../config/firebase.js';
import { collection, doc, setDoc, getDocs, getDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { verifyAuthToken, requireAdmin } from '../middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// 100% DATABASE-DRIVEN: Empty initial cache, synced exclusively from Cloud Firestore DB
export let LEADERS_CACHE = [];

// Helper to atomically update open questions count on leader documents
export const incrementLeaderQuestionCounts = async (leaderId, delta = 1) => {
  if (!leaderId) return;

  const targetId = leaderId.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-');
  
  // Update in-memory cache
  const leader = LEADERS_CACHE.find(l => l.id === targetId || l.id === leaderId);
  if (leader) {
    leader.openQuestionsCount = Math.max(0, (leader.openQuestionsCount || 0) + delta);
    leader.pendingCount = Math.max(0, (leader.pendingCount || 0) + delta);
  }

  // Update Cloud Firestore DB
  if (db) {
    try {
      const leaderRef = doc(db, 'leaders', targetId);
      const snap = await getDoc(leaderRef);
      if (snap.exists()) {
        const curOpen = snap.data().openQuestionsCount || 0;
        const curPending = snap.data().pendingCount || 0;
        const updatedOpen = Math.max(0, curOpen + delta);
        const updatedPending = Math.max(0, curPending + delta);

        await setDoc(leaderRef, {
          openQuestionsCount: updatedOpen,
          pendingCount: updatedPending
        }, { merge: true });
        console.log(`🔥 Firestore DB: Updated openQuestionsCount for leader [${targetId}] to ${updatedOpen}`);
      }
    } catch (e) {
      console.warn('⚠️ Leader open questions count update warning:', e.message);
    }
  }
};

// Async Sync from Cloud Firestore DB
const syncLeadersFromDB = async () => {
  const cacheFilePath = path.join(__dirname, '../data/leaders_cache.json');
  
  // 1. Try loading from local JSON file
  if (fs.existsSync(cacheFilePath)) {
    try {
      const data = fs.readFileSync(cacheFilePath, 'utf-8');
      LEADERS_CACHE = JSON.parse(data);
      console.log(`📦 Local Cache: Loaded ${LEADERS_CACHE.length} leader profiles from leaders_cache.json (Saved Firestore Reads)`);
      return;
    } catch (e) {
      console.warn('⚠️ Local cache read error:', e.message);
    }
  }

  // 2. Fallback to Firestore if local cache doesn't exist
  if (db) {
    try {
      const snap = await getDocs(collection(db, 'leaders'));
      if (snap.docs.length > 0) {
        LEADERS_CACHE = snap.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
        console.log(`🔥 Firestore DB: Synchronized ${LEADERS_CACHE.length} leader profiles from database`);
        
        // Save to local cache file for future restarts
        try {
          const dataDir = path.dirname(cacheFilePath);
          if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
          }
          fs.writeFileSync(cacheFilePath, JSON.stringify(LEADERS_CACHE, null, 2), 'utf-8');
          console.log(`📦 Local Cache: Saved leaders to leaders_cache.json`);
        } catch (fsErr) {
          console.warn('⚠️ Could not save leaders_cache.json:', fsErr.message);
        }
      }
    } catch (e) {
      console.warn('⚠️ Firestore leaders sync warning:', e.message);
    }
  }
};

// Initial sync from DB on server startup
syncLeadersFromDB();

// GET /api/leaders (Live Database Query, Ranking & Dynamic Filtering)
router.get('/', async (req, res) => {
  const { state, party, type, search, page, limit, sort } = req.query;
  
  if (db && LEADERS_CACHE.length === 0) {
    await syncLeadersFromDB();
  }

  let filtered = [...LEADERS_CACHE];

  if (state) {
    filtered = filtered.filter(l => l.state === state);
  }
  if (party) {
    filtered = filtered.filter(l => l.party === party);
  }
  if (type) {
    filtered = filtered.filter(l => l.type === type || l.repType === type);
  }
  if (search) {
    const q = search.toLowerCase().trim();
    filtered = filtered.filter(l => 
      (l.name && l.name.toLowerCase().includes(q)) || 
      (l.constituency && l.constituency.toLowerCase().includes(q)) || 
      (l.portfolio && l.portfolio.toLowerCase().includes(q)) ||
      (l.portfolios && Array.isArray(l.portfolios) && l.portfolios.some(p => p.toLowerCase().includes(q)))
    );
  }

  // Sort logic - Rank by openQuestionsCount descending
  if (sort === 'openQuestions' || !sort) {
    filtered.sort((a, b) => (b.openQuestionsCount || 0) - (a.openQuestionsCount || 0));
  } else if (sort === 'supported') {
    filtered.sort((a, b) => (b.agreeCount || 0) - (a.agreeCount || 0));
  }

  const total = filtered.length;
  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || (sort === 'openQuestions' ? 5 : 6);

  const startIndex = (pageNum - 1) * limitNum;
  const endIndex = startIndex + limitNum;
  const paginatedLeaders = filtered.slice(startIndex, endIndex);
  const hasMore = endIndex < total;

  if (page || limit) {
    return res.json({
      leaders: paginatedLeaders,
      total,
      hasMore,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum)
    });
  }

  res.json(filtered);
});

// GET /api/leaders/:id (Instant SEO Slug / ID Server Lookup from DB)
router.get('/:id', async (req, res) => {
  const param = req.params.id;
  const cleanSlug = param.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-');

  if (db) {
    try {
      const snap = await getDoc(doc(db, 'leaders', param));
      if (snap.exists()) {
        return res.json({ id: snap.id, ...snap.data() });
      }

      const snapSlug = await getDoc(doc(db, 'leaders', cleanSlug));
      if (snapSlug.exists()) {
        return res.json({ id: snapSlug.id, ...snapSlug.data() });
      }
    } catch (e) {}
  }

  // Lookup in synchronized memory cache by ID or normalized name slug
  const leader = LEADERS_CACHE.find(l => 
    l.id === param || 
    l.id === cleanSlug ||
    (l.name && l.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-') === cleanSlug) ||
    (l.name && l.name.toLowerCase().includes(param.toLowerCase()))
  );

  if (!leader) {
    return res.status(404).json({ error: 'Representative profile not found in database.' });
  }

  res.json(leader);
});

// POST /api/leaders - Dynamic Add Representative (Persisted & Merged in Firestore DB)
router.post('/', verifyAuthToken, requireAdmin, async (req, res) => {
  const data = req.body;
  if (!data.name || data.name.trim() === '') {
    return res.status(400).json({ error: 'Representative Name is required' });
  }

  const id = data.id || data.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-');
  
  const newLeader = {
    id,
    name: data.name.trim(),
    displayName: data.displayName || data.name,
    party: data.party || 'INDEPENDENT',
    state: data.state || 'MH',
    constituency: data.constituency || 'State Wide',
    type: data.type || 'MLA',
    chamber: data.chamber || (data.type === 'MP_LS' ? 'Lok Sabha' : data.type === 'MP_RS' ? 'Rajya Sabha' : data.type === 'MLC' ? 'Vidhan Parishad' : 'Vidhan Sabha'),
    
    gender: data.gender || 'Male',
    dob: data.dob || '',
    email: data.email || '',
    phone: data.phone || '',
    website: data.website || '',
    profilePhoto: data.profilePhoto || data.profilePhotoUrl || '',
    biography: data.biography || '',
    status: data.status || 'Active',
    verificationStatus: data.verificationStatus || 'Verified',

    seatType: data.seatType || 'General',
    electionMethod: data.electionMethod || 'Elected',
    nominatedBy: data.nominatedBy || '',
    mlcCategory: data.mlcCategory || '',
    termStart: data.termStart || '',
    termEnd: data.termEnd || '',
    electionYear: data.electionYear || '2024',

    governmentPositions: data.governmentPositions || [],
    portfolios: data.portfolios || (data.portfolio ? [data.portfolio] : ['Elected Representative']),
    committees: data.committees || [],
    portfolio: (data.portfolios && data.portfolios.length > 0) ? data.portfolios.join(', ') : (data.portfolio || 'Elected Representative'),

    agreeCount: data.agreeCount || 0,
    funnyCount: data.funnyCount || 0,
    openQuestionsCount: data.openQuestionsCount || 0,
    answeredCount: data.answeredCount || 0,
    pendingCount: data.pendingCount || 0,
    totalReactionsCount: data.totalReactionsCount || 0,
    totalCommentsCount: data.totalCommentsCount || 0,
    createdAt: Date.now(),
  };

  try {
    if (db) {
      await setDoc(doc(db, 'leaders', id), newLeader, { merge: true });
      console.log(`🔥 Firestore DB: Successfully persisted new representative [ID: ${id}]`);
    }
  } catch (e) {
    console.warn('⚠️ Firestore leaders write warning:', e.message);
  }

  // Update in-memory cache
  const idx = LEADERS_CACHE.findIndex(l => l.id === id);
  if (idx !== -1) {
    LEADERS_CACHE[idx] = newLeader;
  } else {
    LEADERS_CACHE.unshift(newLeader);
  }

  try {
    const cacheFilePath = path.join(__dirname, '../data/leaders_cache.json');
    if (fs.existsSync(cacheFilePath)) {
      fs.writeFileSync(cacheFilePath, JSON.stringify(LEADERS_CACHE, null, 2), 'utf-8');
    }
  } catch (e) {}

  res.status(201).json(newLeader);
});

// PUT /api/leaders/:id - Update Representative Profile (Persisted & Merged in Firestore DB)
router.put('/:id', verifyAuthToken, requireAdmin, async (req, res) => {
  const data = req.body;
  const id = req.params.id;

  const updatedLeader = {
    ...data,
    id,
    profilePhoto: data.profilePhoto || data.profilePhotoUrl || '',
    portfolio: (data.portfolios && data.portfolios.length > 0) ? data.portfolios.join(', ') : (data.portfolio || 'Elected Representative')
  };

  try {
    if (db) {
      await setDoc(doc(db, 'leaders', id), updatedLeader, { merge: true });
      console.log(`🔥 Firestore DB: Successfully updated representative profile [ID: ${id}]`);
    }
  } catch (e) {
    console.warn('⚠️ Firestore leaders update warning:', e.message);
  }

  const idx = LEADERS_CACHE.findIndex(l => l.id === id);
  if (idx !== -1) {
    LEADERS_CACHE[idx] = { ...LEADERS_CACHE[idx], ...updatedLeader };
  } else {
    LEADERS_CACHE.unshift(updatedLeader);
  }

  res.json({ success: true, id, leader: updatedLeader });
});

// DELETE /api/leaders/:id - Delete Representative Profile from Cloud Firestore DB
router.delete('/:id', verifyAuthToken, requireAdmin, async (req, res) => {
  const id = req.params.id;
  try {
    if (db) {
      await deleteDoc(doc(db, 'leaders', id));
      console.log(`🔥 Firestore DB: Successfully deleted leader profile [ID: ${id}]`);
    }
  } catch (e) {
    console.warn('⚠️ Firestore leaders delete warning:', e.message);
  }

  LEADERS_CACHE = LEADERS_CACHE.filter(l => l.id !== id);
  res.json({ success: true, id });
});

export default router;
