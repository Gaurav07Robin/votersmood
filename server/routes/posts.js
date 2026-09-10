import express from 'express';
import { db } from '../config/firebase.js';
import { collection, addDoc, getDocs, doc, deleteDoc, updateDoc, query, where, getDoc, increment } from 'firebase/firestore';
import { verifyAuthToken, requireAuth } from '../middleware/auth.js';
import { trackUserActivity } from './auth.js';

const router = express.Router();

let IN_MEMORY_POSTS = [
  {
    id: 'w3k9tvLmOzjT4GxYaSkp',
    content: 'When will the 24x7 water pipeline augmentation project in our constituency be fully commissioned? Citizens are experiencing low pressure during morning supply hours.',
    authorId: 'voter_1',
    authorName: 'SURESH PATIL',
    authorAvatar: 'https://api.dicebear.com/10.x/avataaars/svg?seed=Suresh',
    isVerified: true,
    isOpenQuestion: true,
    targetLeaderId: null,
    targetLeaderName: 'Elected Representative',
    questionCategory: 'Water Supply',
    responseStatus: 'pending',
    officialResponse: null,
    leaderTag: 'CONSTITUENCY QUESTION',
    topicTag: 'CITIZENVOICE',
    poll: null,
    agreeCount: 1,
    funnyCount: 0,
    commentCount: 3,
    isApproved: true,
    createdAt: Date.now() - 3600000,
  }
];

// Helper to increment/decrement leader openQuestionsCount & pendingCount in Cloud Firestore DB
const incrementLeaderQuestionCounts = async (leaderId, delta) => {
  if (!db || !leaderId) return;
  try {
    const leaderRef = doc(db, 'leaders', leaderId);
    await updateDoc(leaderRef, {
      openQuestionsCount: increment(delta),
      pendingCount: increment(delta)
    });
    console.log(`🔥 Firestore DB: Updated leader [${leaderId}] openQuestionsCount by ${delta}`);
  } catch (e) {
    console.warn(`⚠️ Leader question count update error for [${leaderId}]:`, e.message);
  }
};

let POSTS_CACHE_FETCHED = false;

// GET /api/posts - Fetch Posts / Discussions from Cloud Firestore DB
router.get('/', async (req, res) => {
  const { leaderId, isOpenQuestion, category, topic, leader, sort } = req.query;
  try {
    if (db && !POSTS_CACHE_FETCHED) {
      try {
        const postsRef = collection(db, 'posts');
        const snap = await getDocs(postsRef);
        if (snap.docs.length > 0) {
          IN_MEMORY_POSTS = snap.docs.map(docSnap => {
            const d = docSnap.data();
            return {
              id: docSnap.id,
              ...d,
              agreeCount: Math.max(0, d.agreeCount || 0),
              funnyCount: Math.max(0, d.funnyCount || 0),
              commentCount: Math.max(0, d.commentCount || 0)
            };
          });
          POSTS_CACHE_FETCHED = true;
          console.log(`🔥 Firestore DB: Synchronized ${IN_MEMORY_POSTS.length} posts from database`);
        }
      } catch (dbErr) {
        console.warn('⚠️ Firestore read posts warning:', dbErr.message);
      }
    }

    let posts = IN_MEMORY_POSTS;

    // Filter logic
    let filtered = [...posts];

    if (leaderId) {
      filtered = filtered.filter(p => p.targetLeaderId === leaderId || (p.leaderTag || '').toLowerCase().includes(leaderId.toLowerCase()));
    }

    if (isOpenQuestion === 'true') {
      filtered = filtered.filter(p => p.isOpenQuestion === true);
    }

    if (category && category !== 'All') {
      filtered = filtered.filter(p => p.questionCategory === category);
    }

    if (topic) {
      const qTopic = topic.replace(/^#/, '').toLowerCase();
      filtered = filtered.filter(p => (p.topicTag || '').toLowerCase().includes(qTopic));
    }

    if (leader && !leaderId) {
      const qLeader = leader.toLowerCase();
      filtered = filtered.filter(p => (p.leaderTag || '').toLowerCase().includes(qLeader));
    }

    // Sort logic - Strictly sort by total reaction volume (agreeCount + funnyCount)
    if (sort === 'supported' || sort === 'reactions' || sort === 'trending') {
      filtered.sort((a, b) => {
        const scoreA = (a.agreeCount || 0) + (a.funnyCount || 0);
        const scoreB = (b.agreeCount || 0) + (b.funnyCount || 0);
        return scoreB - scoreA;
      });
    } else if (sort === 'discussed') {
      filtered.sort((a, b) => (b.commentCount || 0) - (a.commentCount || 0));
    } else if (sort === 'unanswered') {
      filtered = filtered.filter(p => p.responseStatus === 'pending');
    } else if (sort === 'oldest') {
      filtered.sort((a, b) => a.createdAt - b.createdAt);
    }

    res.json(filtered);
  } catch (error) {
    res.json(IN_MEMORY_POSTS);
  }
});

// POST /api/posts - Publish Insight / Open Question to Cloud Firestore DB
router.post('/', verifyAuthToken, requireAuth, async (req, res) => {
  const { content, leaderTag, topicTag, poll, isOpenQuestion, targetLeaderId, targetLeaderName, questionCategory } = req.body;

  if (!content || typeof content !== 'string' || content.trim() === '') {
    return res.status(400).json({ error: 'Content is required' });
  }

  if (content.length > 500) {
    return res.status(400).json({ error: 'Post insight exceeds maximum 500 character limit' });
  }

  // Track daily user activity & check 7-day streak verification
  const streakInfo = await trackUserActivity(req.user.email, req.user.uid);
  const isVerified = streakInfo ? streakInfo.isVerifiedStreak : false;

  let formattedPoll = null;
  if (poll && poll.question && Array.isArray(poll.options) && poll.options.length >= 2) {
    formattedPoll = {
      id: 'poll-post-' + Date.now(),
      question: poll.question.trim(),
      options: poll.options.map((opt, i) => ({
        id: `opt-${i}`,
        text: typeof opt === 'string' ? opt.trim() : opt.text,
        votes: 0
      })),
      totalVotes: 0,
      residentVotes: 0,
      nonResidentVotes: 0,
    };
  }

  const effectiveLeaderId = targetLeaderId || null;

  const newPost = {
    content: content.trim(),
    authorId: req.user.uid,
    authorName: req.user.name || req.user.displayName || req.user.email?.split('@')[0].toUpperCase() || 'VERIFIED CITIZEN',
    authorAvatar: req.user.avatarUrl || `https://api.dicebear.com/10.x/avataaars/svg?seed=${req.user.uid || 'voter'}`,
    isVerified: isVerified,
    streakCount: streakInfo?.streakCount || 1,
    isOpenQuestion: !!isOpenQuestion,
    targetLeaderId: effectiveLeaderId,
    targetLeaderName: targetLeaderName || (isOpenQuestion ? 'Elected Representative' : null),
    questionCategory: questionCategory || 'General Infrastructure',
    responseStatus: isOpenQuestion ? 'pending' : null,
    officialResponse: null,
    leaderTag: leaderTag || (targetLeaderName ? targetLeaderName.toUpperCase() : 'GENERAL FEEDBACK'),
    topicTag: (topicTag || 'POLITICALDISCUSSIONS').replace(/^#/, '').toUpperCase(),
    poll: formattedPoll,
    agreeCount: 0,
    funnyCount: 0,
    commentCount: 0,
    isApproved: true,
    createdAt: Date.now(),
  };

  try {
    if (db) {
      const docRef = await addDoc(collection(db, 'posts'), newPost);
      console.log(`🔥 Firestore DB: Successfully saved new post to database [ID: ${docRef.id}] (isVerified: ${isVerified})`);
      
      // If post is an open question to a leader, increment leader's openQuestionsCount & pendingCount
      if (isOpenQuestion && effectiveLeaderId) {
        await incrementLeaderQuestionCounts(effectiveLeaderId, 1);
      }

      const savedPost = { id: docRef.id, ...newPost };
      IN_MEMORY_POSTS.unshift(savedPost);
      return res.status(201).json(savedPost);
    }
    
    if (isOpenQuestion && effectiveLeaderId) {
      await incrementLeaderQuestionCounts(effectiveLeaderId, 1);
    }

    const mockPost = { id: 'post-' + Date.now(), ...newPost };
    IN_MEMORY_POSTS.unshift(mockPost);
    res.status(201).json(mockPost);
  } catch (error) {
    console.error('⚠️ Firestore post write error:', error);
    const mockPost = { id: 'post-' + Date.now(), ...newPost };
    IN_MEMORY_POSTS.unshift(mockPost);
    res.status(201).json(mockPost);
  }
});

// DELETE /api/posts/:id - Delete Post from Cloud Firestore DB
router.delete('/:id', verifyAuthToken, requireAuth, async (req, res) => {
  const id = req.params.id;
  try {
    let targetPost = IN_MEMORY_POSTS.find(p => p.id === id);

    if (db) {
      const postRef = doc(db, 'posts', id);
      const snap = await getDoc(postRef);
      if (snap.exists()) {
        targetPost = snap.data();
      }
      await deleteDoc(postRef);
      console.log(`🔥 Firestore DB: Deleted post [ID: ${id}]`);
    }

    if (targetPost && targetPost.isOpenQuestion && targetPost.targetLeaderId) {
      await incrementLeaderQuestionCounts(targetPost.targetLeaderId, -1);
    }

    IN_MEMORY_POSTS = IN_MEMORY_POSTS.filter(p => p.id !== id);
    res.json({ success: true, id });
  } catch (e) {
    IN_MEMORY_POSTS = IN_MEMORY_POSTS.filter(p => p.id !== id);
    res.json({ success: true, id });
  }
});

export default router;
