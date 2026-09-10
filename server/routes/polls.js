import express from 'express';
import { db } from '../config/firebase.js';
import { collection, doc, setDoc, addDoc, getDocs, getDoc, deleteDoc, updateDoc, query, where, orderBy, limit } from 'firebase/firestore';
import { verifyAuthToken, requireAuth, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

let officialElectionsCache = [];
let communityPollsCache = [];
const userVotesMap = new Map();

// Async sync official election polls from Cloud Firestore DB
const syncOfficialElectionsFromDB = async () => {
  if (db) {
    try {
      const snap = await getDocs(query(collection(db, 'official_elections'), orderBy('createdAt', 'desc')));
      if (snap.docs.length > 0) {
        officialElectionsCache = snap.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
        console.log(`🔥 Firestore DB: Synchronized ${officialElectionsCache.length} official election polls from database`);
      }
    } catch (e) {
      console.warn('⚠️ Firestore official polls sync warning:', e.message);
    }
  }
};

// Async sync community polls from Cloud Firestore DB
const syncCommunityPollsFromDB = async () => {
  if (db) {
    try {
      const snap = await getDocs(query(collection(db, 'community_polls'), orderBy('createdAt', 'desc')));
      if (snap.docs.length > 0) {
        communityPollsCache = snap.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
        console.log(`🔥 Firestore DB: Synchronized ${communityPollsCache.length} community polls from database`);
      }
    } catch (e) {
      console.warn('⚠️ Firestore community polls sync warning:', e.message);
    }
  }
};

syncOfficialElectionsFromDB();
syncCommunityPollsFromDB();

// GET /api/polls/signals - Live Polling Signals, Recent Activity, Discussed Constituencies & Hashtags (Synced with Firestore DB)
router.get('/signals', async (req, res) => {
  try {
    let totalVotes = 0;
    let residentTotal = 0;
    let observerTotal = 0;
    let recentActivity = [];
    let constituencyCounts = {};
    let hashtags = new Set(['#ELECTIONS2026', '#CIVICFEEDBACK', '#PUBLICVOICE']);

    if (db) {
      try {
        // 1. Calculate live polling stats from official_elections (USE CACHE)
        officialElectionsCache.forEach(d => {
          const rVotes = Object.values(d.residentVotes || {}).reduce((a, b) => a + b, 0);
          const oVotes = Object.values(d.observerVotes || {}).reduce((a, b) => a + b, 0);
          residentTotal += rVotes;
          observerTotal += oVotes;
          totalVotes += (d.totalVotes || (rVotes + oVotes));
        });

        // 2. Fetch recent vote activity from votes collection (USE LIMIT)
        const snapVotes = await getDocs(query(collection(db, 'votes'), orderBy('votedAt', 'desc'), limit(5)));
        recentActivity = snapVotes.docs.map(docSnap => {
          const v = docSnap.data();
          const voterType = v.isResident !== false ? 'Verified Resident' : 'Observer';
          const loc = v.constituency ? `${v.constituency}` : `${v.state || 'MH'} Region`;
          
          let timeAgo = 'Just now';
          if (v.votedAt) {
            const diffMs = Date.now() - new Date(v.votedAt).getTime();
            const mins = Math.floor(diffMs / 60000);
            timeAgo = mins > 0 ? `${mins} min${mins > 1 ? 's' : ''} ago` : 'Just now';
          }
          return `• ${voterType} from ${loc} voted ${timeAgo}`;
        });

        // 3. Calculate most discussed constituencies from posts (USE LIMIT)
        const snapPosts = await getDocs(query(collection(db, 'posts'), limit(100)));
        snapPosts.docs.forEach(docSnap => {
          const p = docSnap.data();
          if (p.topicTag) hashtags.add(`#${p.topicTag.replace(/^#/, '')}`);
          
          if (p.targetLeaderName) {
            const constiName = p.targetLeaderName.replace(/ *\([^)]*\) */g, "");
            constituencyCounts[constiName] = (constituencyCounts[constiName] || 0) + 1;
          }
        });

      } catch (e) {
        console.warn('⚠️ Firestore signals calculate warning:', e.message);
      }
    }

    const grandTotal = totalVotes;
    const resCount = residentTotal;
    const obsCount = observerTotal;
    const resPct = grandTotal > 0 ? Math.round((resCount / grandTotal) * 100) : 50;
    const obsPct = grandTotal > 0 ? 100 - resPct : 50;

    const topConstituencies = Object.entries(constituencyCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);

    res.json({
      pollingStats: {
        totalVotes: grandTotal,
        residentVoters: resCount,
        residentPct: resPct,
        observerVoters: obsCount,
        observerPct: obsPct
      },
      recentActivity,
      discussedConstituencies: topConstituencies,
      trendingHashtags: Array.from(hashtags).slice(0, 6)
    });
  } catch (err) {
    res.json({
      pollingStats: { totalVotes: 0, residentVoters: 0, residentPct: 0, observerVoters: 0, observerPct: 0 },
      recentActivity: [],
      discussedConstituencies: [],
      trendingHashtags: ['#ELECTIONS2026', '#CIVICFEEDBACK']
    });
  }
});

// GET /api/polls/user-votes - Check all votes cast by the authenticated user in Cloud Firestore DB
router.get('/user-votes', verifyAuthToken, requireAuth, async (req, res) => {
  const userId = req.user.uid;
  try {
    const userVotes = {};
    if (db) {
      try {
        const snap = await getDocs(query(collection(db, 'votes'), where('userId', '==', userId)));
        snap.docs.forEach(docSnap => {
          const data = docSnap.data();
          if (data.electionId) {
            userVotes[data.electionId] = {
              candidateId: data.candidateId,
              isResident: data.isResident,
              votedAt: data.votedAt
            };
          } else if (data.pollId) {
            userVotes[data.pollId] = {
              optionId: data.optionId,
              votedAt: data.votedAt
            };
          }
        });
      } catch (e) {
        console.warn('⚠️ Firestore read user votes warning:', e.message);
      }
    }
    res.json({ success: true, userId, userVotes });
  } catch (error) {
    res.json({ success: true, userId, userVotes: {} });
  }
});

// GET /api/polls/official?category=... - Fetch official election polls from Firestore DB
router.get('/official', async (req, res) => {
  const { category } = req.query;
  try {
    if (db) {
      await syncOfficialElectionsFromDB();
    }

    let result = [...officialElectionsCache];
    if (category && category.toLowerCase() !== 'all') {
      result = result.filter(e => e.category === category.toLowerCase());
    }
    res.json(result);
  } catch (error) {
    res.json(officialElectionsCache);
  }
});

// GET /api/polls/official/:id
router.get('/official/:id', async (req, res) => {
  const id = req.params.id;
  try {
    if (db) {
      const snap = await getDoc(doc(db, 'official_elections', id));
      if (snap.exists()) {
        return res.json({ id: snap.id, ...snap.data() });
      }
    }
    const election = officialElectionsCache.find(e => e.id === id);
    if (!election) return res.status(404).json({ error: 'Election poll not found' });
    res.json(election);
  } catch (e) {
    const election = officialElectionsCache.find(e => e.id === id);
    if (!election) return res.status(404).json({ error: 'Election poll not found' });
    res.json(election);
  }
});

// POST /api/polls/official/vote - 5-Step Guided Voting Submission (Persisted to Firestore DB)
router.post('/official/vote', verifyAuthToken, requireAuth, async (req, res) => {
  let { electionId, candidateId, isResident, state, constituency } = req.body;
  const userId = req.user.uid;

  if (!electionId || !candidateId) {
    return res.status(400).json({ error: 'Election ID and Candidate ID are required to vote.' });
  }

  const voteKey = `${userId}_${electionId}`;

  // Check duplicate vote in Firestore DB
  if (db) {
    try {
      const voteRef = doc(db, 'votes', voteKey);
      const voteSnap = await getDoc(voteRef);
      if (voteSnap.exists()) {
        return res.status(400).json({ error: 'You have already voted in this official election poll.' });
      }
    } catch (e) {}
  } else if (userVotesMap.has(voteKey)) {
    return res.status(400).json({ error: 'You have already voted in this official election poll.' });
  }

  if (db) {
    try {
      const electionRef = doc(db, 'official_elections', electionId);
      const snap = await getDoc(electionRef);
      
      if (!snap.exists()) {
        return res.status(404).json({ error: 'Election poll not found in DB.' });
      }

      let data = snap.data();
      const residentVotes = data.residentVotes || {};
      const observerVotes = data.observerVotes || {};

      if (isResident) {
        residentVotes[candidateId] = (residentVotes[candidateId] || 0) + 1;
      } else {
        observerVotes[candidateId] = (observerVotes[candidateId] || 0) + 1;
      }

      const totalVotes = (data.totalVotes || 0) + 1;
      const updatedElection = { ...data, id: electionId, residentVotes, observerVotes, totalVotes };

      // Persist updated election counts to Firestore DB
      await setDoc(electionRef, updatedElection, { merge: true });

      // Save user vote record to Firestore DB
      const voteRef = doc(db, 'votes', voteKey);
      await setDoc(voteRef, {
        userId,
        electionId,
        candidateId,
        isResident,
        state: state || 'MH',
        constituency: constituency || 'Nagpur South West',
        votedAt: new Date().toISOString()
      });

      console.log(`🔥 Firestore DB: Vote successfully persisted for election [${electionId}] by user [${userId}] (Resident: ${isResident})`);
      userVotesMap.set(voteKey, candidateId);

      return res.json({
        success: true,
        message: 'Official Vote Confirmed & Segregated Successfully in DB',
        votedCandidateId: candidateId,
        isResident,
        election: updatedElection
      });
    } catch (dbErr) {
      console.warn('⚠️ Firestore vote update warning:', dbErr.message);
      return res.status(500).json({ error: dbErr.message });
    }
  }

  return res.status(400).json({ error: 'Database unavailable for voting' });
});

// POST /api/polls/official - Admin Dynamic Election Creator (Persisted to Firestore DB)
router.post('/official', verifyAuthToken, requireAdmin, async (req, res) => {
  const { title, category, description, state, states, constituencies, candidates, startDate, endDate, hasNota } = req.body;

  if (!title || !category || !candidates || candidates.length < 2) {
    return res.status(400).json({ error: 'Title, Category, and at least 2 Candidates are required' });
  }

  const formattedCandidates = candidates.map((c, i) => ({
    id: `c-${i + 1}-${Date.now()}`,
    name: c.name || c,
    party: c.party || 'Independent',
    color: c.color || '#0F172A'
  }));

  if (hasNota) {
    formattedCandidates.push({
      id: `c-nota-${Date.now()}`,
      name: 'None of the Above (NOTA)',
      party: 'Independent',
      color: '#71717A'
    });
  }

  const residentVotes = {};
  const observerVotes = {};
  formattedCandidates.forEach(c => {
    residentVotes[c.id] = 0;
    observerVotes[c.id] = 0;
  });

  const electionId = `election-${category.toLowerCase()}-${Date.now()}`;
  const newElection = {
    id: electionId,
    title: title.trim(),
    category: category.toLowerCase(),
    description: description || 'Official Admin Election Poll',
    startDate: startDate || new Date().toISOString().split('T')[0],
    endDate: endDate || '2026-12-31',
    status: 'published',
    isOfficial: true,
    state: state || 'MH',
    states: states || [state || 'MH'],
    constituencies: constituencies || ['Mumbai South'],
    candidates: formattedCandidates,
    residentVotes,
    observerVotes,
    totalVotes: 0,
    createdAt: Date.now()
  };

  try {
    if (db) {
      await setDoc(doc(db, 'official_elections', electionId), newElection);
      console.log(`🔥 Firestore DB: Created official election poll [ID: ${electionId}]`);
    }
    officialElectionsCache.unshift(newElection);
    res.status(201).json(newElection);
  } catch (error) {
    console.error('⚠️ Firestore official poll write error:', error);
    officialElectionsCache.unshift(newElection);
    res.status(201).json(newElection);
  }
});

// DELETE /api/polls/official/:id - Admin Delete Election Poll
router.delete('/official/:id', verifyAuthToken, requireAdmin, async (req, res) => {
  const id = req.params.id;
  try {
    if (db) {
      await deleteDoc(doc(db, 'official_elections', id));
      console.log(`🔥 Firestore DB: Deleted official election poll [ID: ${id}]`);
    }
    officialElectionsCache = officialElectionsCache.filter(e => e.id !== id);
    res.json({ success: true, id });
  } catch (e) {
    officialElectionsCache = officialElectionsCache.filter(e => e.id !== id);
    res.json({ success: true, id });
  }
});

// ==========================================
// COMMUNITY MINI ISSUE POLLS ENDPOINTS
// ==========================================

// GET /api/polls/community
router.get('/community', async (req, res) => {
  try {
    if (db) {
      await syncCommunityPollsFromDB();
    }
    res.json(communityPollsCache);
  } catch (error) {
    res.json(communityPollsCache);
  }
});

// POST /api/polls/community - User Creates Community Mini Issue Poll (Persisted to Firestore DB)
router.post('/community', verifyAuthToken, requireAuth, async (req, res) => {
  const { question, options } = req.body;

  if (!question || !options || !Array.isArray(options) || options.length < 2) {
    return res.status(400).json({ error: 'Question and at least 2 options are required' });
  }

  const newPoll = {
    question: question.trim(),
    options: options.map((opt, i) => ({
      id: `opt-${i}`,
      text: typeof opt === 'string' ? opt.trim() : opt.text,
      votes: 0
    })),
    authorName: (req.user.name || req.user.displayName || 'VERIFIED CITIZEN') + ' (Verified Citizen)',
    authorRole: 'user',
    isFeatured: false,
    isLocked: false,
    totalVotes: 0,
    agreeCount: 0,
    createdAt: Date.now()
  };

  try {
    if (db) {
      const docRef = await addDoc(collection(db, 'community_polls'), newPoll);
      console.log(`🔥 Firestore DB: Created community mini poll [ID: ${docRef.id}]`);
      const savedPoll = { id: docRef.id, ...newPoll };
      communityPollsCache.unshift(savedPoll);
      return res.status(201).json(savedPoll);
    }
    const mockPoll = { id: `comm-poll-${Date.now()}`, ...newPoll };
    communityPollsCache.unshift(mockPoll);
    res.status(201).json(mockPoll);
  } catch (error) {
    const mockPoll = { id: `comm-poll-${Date.now()}`, ...newPoll };
    communityPollsCache.unshift(mockPoll);
    res.status(201).json(mockPoll);
  }
});

// POST /api/polls/community/:id/vote - User Votes on Community Mini Issue Poll (1-Vote Per User Enforced)
router.post('/community/:id/vote', verifyAuthToken, requireAuth, async (req, res) => {
  const { optionId } = req.body;
  const pollId = req.params.id;
  const userId = req.user.uid;

  if (!optionId) {
    return res.status(400).json({ error: 'Option ID is required to cast a vote.' });
  }

  const voteKey = `${userId}_community_${pollId}`;

  // Enforce 1-vote limit per user per community poll in Cloud Firestore DB
  if (db) {
    try {
      const voteRef = doc(db, 'votes', voteKey);
      const voteSnap = await getDoc(voteRef);
      if (voteSnap.exists()) {
        return res.status(400).json({ error: 'You have already voted in this community poll.' });
      }
    } catch (e) {}
  } else if (userVotesMap.has(voteKey)) {
    return res.status(400).json({ error: 'You have already voted in this community poll.' });
  }

  try {
    if (db) {
      const pollRef = doc(db, 'community_polls', pollId);
      const snap = await getDoc(pollRef);
      
      let data = snap.exists() ? snap.data() : communityPollsCache.find(p => p.id === pollId);
      if (data) {
        const updatedOptions = (data.options || []).map(opt => {
          if (opt.id === optionId) {
            return { ...opt, votes: (opt.votes || 0) + 1 };
          }
          return opt;
        });

        const totalVotes = (data.totalVotes || 0) + 1;
        const updatedPoll = { ...data, id: pollId, options: updatedOptions, totalVotes };

        // Save updated counts to Firestore DB
        await setDoc(pollRef, updatedPoll, { merge: true });

        // Save user vote receipt to Firestore DB
        const voteRef = doc(db, 'votes', voteKey);
        await setDoc(voteRef, {
          userId,
          pollId,
          optionId,
          type: 'community',
          votedAt: new Date().toISOString()
        });

        console.log(`🔥 Firestore DB: Community poll vote recorded in DB [Poll: ${pollId}, User: ${userId}, Option: ${optionId}]`);
        userVotesMap.set(voteKey, optionId);

        return res.json({ success: true, poll: updatedPoll });
      }
    }

    const poll = communityPollsCache.find(p => p.id === pollId);
    if (!poll) return res.status(404).json({ error: 'Community poll not found' });
    const opt = poll.options.find(o => o.id === optionId);
    if (opt) {
      opt.votes += 1;
      poll.totalVotes = (poll.totalVotes || 0) + 1;
    }
    userVotesMap.set(voteKey, optionId);
    res.json({ success: true, poll });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// DELETE /api/polls/community/:id - Admin Delete Community Poll
router.delete('/community/:id', verifyAuthToken, requireAdmin, async (req, res) => {
  const id = req.params.id;
  try {
    if (db) {
      await deleteDoc(doc(db, 'community_polls', id));
      console.log(`🔥 Firestore DB: Deleted community poll [ID: ${id}]`);
    }
    communityPollsCache = communityPollsCache.filter(p => p.id !== id);
    res.json({ success: true, id });
  } catch (e) {
    communityPollsCache = communityPollsCache.filter(p => p.id !== id);
    res.json({ success: true, id });
  }
});

export default router;
