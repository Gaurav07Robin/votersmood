import React, { useState, useEffect, useRef } from 'react';
import CommentThread from './CommentThread';
import PollCard from './PollCard';
import StreakBadge from './StreakBadge';
import SharePostModal from './SharePostModal';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { formatCompactNumber } from '../utils/formatters';

export default function PostCard({ post, onDelete }) {
  const { user, userProfile, isAdmin } = useAuth();
  const [showComments, setShowComments] = useState(true);
  const [agreeCount, setAgreeCount] = useState(Math.max(0, post.agreeCount || 0));
  const [funnyCount, setFunnyCount] = useState(Math.max(0, post.funnyCount || 0));
  const [hasAgreed, setHasAgreed] = useState(false);
  const [hasFunny, setHasFunny] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isHighlighted, setIsHighlighted] = useState(false);

  const cardRef = useRef(null);

  useEffect(() => {
    setAgreeCount(Math.max(0, post.agreeCount || 0));
    setFunnyCount(Math.max(0, post.funnyCount || 0));
  }, [post.agreeCount, post.funnyCount]);

  // Deep Link Auto-Scroll & Highlighting Handler
  useEffect(() => {
    if (!post?.id) return;

    const urlParams = new URLSearchParams(window.location.search);
    const targetPostId = urlParams.get('post');
    const hashId = window.location.hash.replace('#post-', '');

    if (targetPostId === post.id || hashId === post.id) {
      setIsHighlighted(true);
      setTimeout(() => {
        if (cardRef.current) {
          cardRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 300);

      // Remove highlight after 4 seconds
      const timer = setTimeout(() => setIsHighlighted(false), 4000);
      return () => clearTimeout(timer);
    }
  }, [post?.id]);

  // Load user post reaction state across page reloads
  useEffect(() => {
    if (!user || !post.id) return;

    const cacheKey = `janmat_post_rxn_${user.uid}_${post.id}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed.agree !== undefined) setHasAgreed(parsed.agree);
        if (parsed.funny !== undefined) setHasFunny(parsed.funny);
      } catch (e) {}
    }

    // Query Cloud Firestore DB for active user reaction receipts
    api.getUserReactions().then(res => {
      if (res && res.userReactions && res.userReactions[post.id]) {
        const rxns = res.userReactions[post.id];
        const hasAgree = !!rxns.agree;
        const hasFunny = !!rxns.funny;
        setHasAgreed(hasAgree);
        setHasFunny(hasFunny);
        localStorage.setItem(cacheKey, JSON.stringify({ agree: hasAgree, funny: hasFunny }));
      }
    }).catch(() => {});
  }, [user, post.id]);

  const formatDate = (timestamp) => {
    if (!timestamp) return 'RECENT';
    const date = new Date(timestamp);
    const diff = Math.floor((Date.now() - date.getTime()) / (1000 * 60));
    if (diff < 60) return `${Math.max(1, diff)} MINS AGO`;
    if (diff < 1440) return `${Math.floor(diff / 60)} HOURS AGO`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase();
  };

  const handleLeaderTagClick = (tagText) => {
    if (!tagText) return;
    const cleanName = tagText.split('(')[0].trim();
    const slug = cleanName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    window.history.pushState({}, '', `/directory/${slug}`);
    window.dispatchEvent(new Event('popstate'));
  };

  const navigateToLeader = (e) => {
    e.stopPropagation();
    const slug = (post.targetLeaderId || post.targetLeaderName).toLowerCase().replace(/[^a-z0-9]+/g, '-');
    window.history.pushState({}, '', `/directory/${slug}`);
    window.dispatchEvent(new Event('popstate'));
  };
  // Ultra-Fast 0ms Optimistic UI Reaction Toggle Engine for Posts
  const handleReaction = (type) => {
    if (!user) {
      alert('Please sign in or register to react to political insights.');
      return;
    }

    const cacheKey = `janmat_post_rxn_${user.uid}_${post.id}`;

    // 1. INSTANT OPTIMISTIC UI MUTATION (0ms)
    if (type === 'agree') {
      const nextAgreed = !hasAgreed;
      setHasAgreed(nextAgreed);
      setAgreeCount(prev => (nextAgreed ? prev + 1 : Math.max(0, prev - 1)));
      localStorage.setItem(cacheKey, JSON.stringify({ agree: nextAgreed, funny: hasFunny }));
    } else if (type === 'funny') {
      const nextFunny = !hasFunny;
      setHasFunny(nextFunny);
      setFunnyCount(prev => (nextFunny ? prev + 1 : Math.max(0, prev - 1)));
      localStorage.setItem(cacheKey, JSON.stringify({ agree: hasAgreed, funny: nextFunny }));
    }

    // 2. BACKGROUND ASYNC DB SYNC (Non-blocking)
    api.toggleReaction({ targetId: post.id, targetType: 'post', reactionType: type })
      .then(res => {
        if (res && typeof res.newCount === 'number') {
          if (type === 'agree') setAgreeCount(Math.max(0, res.newCount));
          if (type === 'funny') setFunnyCount(Math.max(0, res.newCount));
        }
      })
      .catch(e => {
        console.warn('Background post reaction sync warning:', e);
      });
  };

  const handleDeletePost = async () => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    try {
      await api.deletePost(post.id);
      setIsDeleted(true);
      if (onDelete) onDelete(post.id);
    } catch (e) {
      console.warn('Delete error:', e);
      setIsDeleted(true);
    }
  };

  if (isDeleted) return null;

  // Dynamic Avatar Resolution:
  const isCurrentUser = user && (
    (post.authorId && post.authorId === user.uid) ||
    (post.authorName && (post.authorName === user.displayName || post.authorName === user.name || post.authorName === user.email?.split('@')[0].toUpperCase()))
  );

  const activeUserAvatar = isCurrentUser ? (userProfile?.avatarUrl || user?.avatarUrl) : null;
  const authorAvatarUrl = activeUserAvatar 
    || post.authorAvatar 
    || `https://api.dicebear.com/10.x/avataaars/svg?seed=${encodeURIComponent(post.authorId || post.authorName || 'voter')}`;

  // 7-Day Streak Verified Tick Check
  const showVerifiedTick = (isCurrentUser && (userProfile?.isVerifiedStreak || user?.isVerifiedStreak)) || post.isVerified === true;

  return (
    <>
      <div 
        id={`post-${post.id}`}
        ref={cardRef}
        style={{ 
          backgroundColor: '#FFFFFF', 
          border: isHighlighted ? '2px solid var(--accent-primary)' : post.isOpenQuestion ? '2px solid var(--accent-primary)' : '1px solid #E5E2DC', 
          borderRadius: '12px', 
          padding: '20px', 
          boxShadow: isHighlighted ? '0 0 20px rgba(217, 119, 6, 0.35)' : '0 2px 8px rgba(0,0,0,0.02)', 
          marginBottom: '16px',
          transition: 'all 300ms ease'
        }}
      >
        
        {/* OPEN QUESTION SPECIAL BADGE STRIP */}
        {post.isOpenQuestion && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FDF6ED', border: '1px solid #F5E5D3', borderRadius: '6px', padding: '8px 12px', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 800, color: 'var(--accent-primary)', letterSpacing: '0.04em' }}>
                ❓ OPEN QUESTION
              </span>
              <span 
                onClick={() => handleLeaderTagClick(post.targetLeaderName || post.leaderTag)}
                style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-primary)', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}
              >
                To: {post.targetLeaderName || post.leaderTag}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {post.questionCategory && (
                <span className="badge badge-verified" style={{ fontSize: '9px' }}>
                  {post.questionCategory}
                </span>
              )}
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-muted)', fontWeight: 700 }}>
                STATUS: {post.responseStatus?.toUpperCase() || 'PENDING'}
              </span>
            </div>
          </div>
        )}

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img 
              src={authorAvatarUrl} 
              alt={post.authorName} 
              style={{ width: '38px', height: '38px', borderRadius: '50%', border: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-canvas)', flexShrink: 0 }} 
            />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {/* Post author name 11px */}
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '11px', color: 'var(--text-primary)', textTransform: 'uppercase' }}>
                  {post.authorName || 'VERIFIED CITIZEN'}
                </span>

                {/* Catchy 7-Day Active Streak Tick Badge with Hover Popover */}
                {showVerifiedTick && <StreakBadge isVerified={true} size="16px" fontSize="10px" />}
              </div>
              {/* Post time 8px */}
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '8px', color: 'var(--text-muted)', marginTop: '2px' }}>
                {formatDate(post.createdAt)}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            {!post.isOpenQuestion && post.leaderTag && (
              <span 
                onClick={() => handleLeaderTagClick(post.leaderTag)}
                style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 600, color: 'var(--text-primary)', backgroundColor: 'var(--bg-canvas)', padding: '3px 8px', borderRadius: '4px', textTransform: 'uppercase', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
              >
                📍 {post.leaderTag}
              </span>
            )}
            {post.topicTag && (
              <span className="badge badge-trending" style={{ fontSize: '10px' }}>
                #{post.topicTag.replace(/^#/, '')}
              </span>
            )}

            {(isAdmin || user?.uid === post.authorId) && (
              <button onClick={handleDeletePost} className="btn-ghost" style={{ fontSize: '11px', color: 'var(--color-error)', fontWeight: 700 }}>
                🗑 DELETE
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div style={{ fontFamily: 'var(--font-sans)', fontSize: '15px', lineHeight: 1.55, color: 'var(--text-primary)', marginBottom: '14px', wordBreak: 'break-word' }}>
          {post.content}
        </div>

        {/* Attached Poll inside Post */}
        {post.poll && (
          <div style={{ marginBottom: '14px' }}>
            <PollCard poll={post.poll} />
          </div>
        )}

        {/* Action Bar (Reactions + Insights + Share Button) */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '4px' }}>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button 
              onClick={() => handleReaction('agree')}
              className="btn-ghost" 
              style={{
                fontSize: '12px',
                padding: hasAgreed ? '2px 8px' : '2px 4px',
                borderRadius: '12px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                border: 'none',
                backgroundColor: hasAgreed ? '#FEF3C7' : 'transparent',
                color: hasAgreed ? '#92400E' : '#64748B',
                fontWeight: hasAgreed ? 700 : 500,
                transition: 'all 150ms ease'
              }}
            >
              <span>👍</span> <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)' }}>{formatCompactNumber(agreeCount)}</span>
            </button>

            <button 
              onClick={() => handleReaction('funny')}
              className="btn-ghost" 
              style={{
                fontSize: '12px',
                padding: hasFunny ? '2px 8px' : '2px 4px',
                borderRadius: '12px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                border: 'none',
                backgroundColor: hasFunny ? '#F1F5F9' : 'transparent',
                color: hasFunny ? '#0F172A' : '#64748B',
                fontWeight: hasFunny ? 700 : 500,
                transition: 'all 150ms ease'
              }}
            >
              <span>😄</span> <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)' }}>{formatCompactNumber(funnyCount)}</span>
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Share Post Button */}
            <button 
              onClick={() => setIsShareOpen(true)}
              className="btn-ghost"
              style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#0284C7', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}
            >
              <span>📤</span> SHARE
            </button>

            {/* Insights Count */}
            <button 
              onClick={() => setShowComments(!showComments)}
              className="btn-ghost" 
              style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-secondary)' }}
            >
              💬 {formatCompactNumber(post.commentCount || 0)} INSIGHTS
            </button>
          </div>
        </div>

        {/* Comments Thread */}
        {showComments && (
          <div style={{ marginTop: '14px', paddingTop: '10px' }}>
            <CommentThread postId={post.id} />
          </div>
        )}
      </div>

      {/* Interactive Share Modal */}
      <SharePostModal 
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        post={post}
      />
    </>
  );
}
