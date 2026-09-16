import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import StreakBadge from './StreakBadge';
import { formatCompactNumber } from '../utils/formatters';

// Smart Comment Sorting Helper:
// 1. Comments created within the last 5 minutes (300,000 ms) are pinned to the top (newest first).
// 2. Once past 5 minutes, comments are sorted by Total Engagement Score = (agreeCount + funnyCount + childRepliesCount) DESC.
const sortCommentsByFiveMinRule = (commentList, allCommentsList) => {
  const FIVE_MINUTES_MS = 5 * 60 * 1000;
  const now = Date.now();

  return [...commentList].sort((a, b) => {
    const timeA = new Date(a.createdAt || 0).getTime();
    const timeB = new Date(b.createdAt || 0).getTime();
    const ageA = now - timeA;
    const ageB = now - timeB;

    const isNewA = ageA <= FIVE_MINUTES_MS;
    const isNewB = ageB <= FIVE_MINUTES_MS;

    // Rule 1: Fresh comments (< 5 mins) go to the top
    if (isNewA && !isNewB) return -1;
    if (!isNewA && isNewB) return 1;

    // Rule 2: If both are fresh (< 5 mins), newest first
    if (isNewA && isNewB) {
      return timeB - timeA;
    }

    // Rule 3: After 5 minutes, sort by Total Score = (agreeCount + funnyCount + childRepliesCount)
    const childCountA = allCommentsList.filter(c => c.parentId === a.id).length;
    const childCountB = allCommentsList.filter(c => c.parentId === b.id).length;

    const scoreA = (a.agreeCount || 0) + (a.funnyCount || 0) + childCountA;
    const scoreB = (b.agreeCount || 0) + (b.funnyCount || 0) + childCountB;

    if (scoreB !== scoreA) {
      return scoreB - scoreA;
    }

    // Fallback: newest first if score is tied
    return timeB - timeA;
  });
};

// Recursive Chat Bubble Component
function CommentBubble({ comment, allComments, onReplySubmit, onDeleteComment, user, userProfile, isAdmin, level = 0 }) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [agree, setAgree] = useState(Math.max(0, comment.agreeCount || 0));
  const [funny, setFunny] = useState(Math.max(0, comment.funnyCount || 0));
  const [hasAgreed, setHasAgreed] = useState(false);
  const [hasFunny, setHasFunny] = useState(false);

  const isTopLevel = !comment.parentId;
  
  // Sort child comments using the 5-minute rule then engagement score
  const rawChildComments = allComments.filter(c => c.parentId === comment.id);
  const childComments = sortCommentsByFiveMinRule(rawChildComments, allComments);

  // Dynamic Avatar Resolution:
  const isCurrentUser = user && (
    (comment.authorId && comment.authorId === user.uid) ||
    (comment.authorName && (comment.authorName === user.displayName || comment.authorName === user.name || comment.authorName === user.email?.split('@')[0].toUpperCase()))
  );

  const activeUserAvatar = isCurrentUser ? (userProfile?.avatarUrl || user?.avatarUrl) : null;
  const avatarUrl = activeUserAvatar 
    || comment.authorAvatar 
    || `https://api.dicebear.com/10.x/avataaars/svg?seed=${encodeURIComponent(comment.authorId || comment.authorName || 'voter')}`;

  // 7-Day Active Streak Tick Icon
  const showVerifiedTick = (isCurrentUser && (userProfile?.isVerifiedStreak || user?.isVerifiedStreak)) || comment.isVerified === true;

  const handleCommentReaction = async (type) => {
    if (!user) {
      alert('Please sign in or register to react to comments.');
      return;
    }

    try {
      if (type === 'agree') {
        if (hasAgreed) {
          setHasAgreed(false);
          setAgree(prev => Math.max(0, prev - 1));
        } else {
          setHasAgreed(true);
          setAgree(prev => prev + 1);
        }
      } else if (type === 'funny') {
        if (hasFunny) {
          setHasFunny(false);
          setFunny(prev => Math.max(0, prev - 1));
        } else {
          setHasFunny(true);
          setFunny(prev => prev + 1);
        }
      }

      const res = await api.toggleReaction({ targetId: comment.id, targetType: 'comment', reactionType: type });
      if (res && typeof res.newCount === 'number') {
        if (type === 'agree') setAgree(Math.max(0, res.newCount));
        if (type === 'funny') setFunny(Math.max(0, res.newCount));
      }
    } catch (e) {
      console.warn('Comment reaction error:', e);
    }
  };

  const handleSendReply = (e) => {
    e.preventDefault();
    if (!replyText.trim() || replyText.length > 50) return;
    onReplySubmit(comment.id, replyText.trim());
    setReplyText('');
    setShowReplyForm(false);
  };

  const formatCommentDate = (ts) => {
    if (!ts) return 'JUST NOW';
    if (typeof ts === 'string') return ts.toUpperCase();
    const d = new Date(ts);
    const diff = Math.floor((Date.now() - d.getTime()) / (1000 * 60));
    if (diff < 60) return `${Math.max(1, diff)} MINS AGO`;
    if (diff < 1440) return `${Math.floor(diff / 60)} HOURS AGO`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: level > 0 ? '2px' : '6px' }}>
      
      {/* Clean Minimal Comment Item */}
      <div 
        style={{
          width: '100%',
          backgroundColor: isTopLevel ? '#F8F9FA' : '#FAFAFA',
          border: '1px solid #F1F5F9',
          borderRadius: '8px',
          padding: '8px 12px',
          transition: 'background-color 150ms ease',
        }}
      >
        {/* Comment Author Header & 2D Avatar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <img 
              src={avatarUrl} 
              alt={comment.authorName} 
              style={{ 
                width: '24px', 
                height: '24px', 
                borderRadius: '50%', 
                backgroundColor: '#FFFFFF', 
                border: '1px solid #E2E8F0',
                flexShrink: 0 
              }} 
            />
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              {/* Author name: 11px */}
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '11px', color: 'var(--text-primary)' }}>
                {comment.authorName}
              </span>

              {/* Catchy 7-Day Active Streak Tick Badge with Hover Popover */}
              {showVerifiedTick && <StreakBadge isVerified={true} size="14px" fontSize="8px" />}

              {/* Time: 9px */}
              <span style={{ fontFamily: 'var(--font-sans)', fontSize: '9px', color: 'var(--text-muted)' }}>
                • {formatCommentDate(comment.createdAt)}
              </span>
            </div>
          </div>

          {(isAdmin || user?.uid === comment.authorId) && (
            <button 
              onClick={() => onDeleteComment(comment.id)} 
              className="btn-ghost" 
              style={{ fontSize: '11px', color: 'var(--color-error)', fontWeight: 600, padding: '2px 4px' }}
            >
              🗑
            </button>
          )}
        </div>

        {/* Comment Message Text: 14px */}
        <div style={{ fontFamily: 'var(--font-sans)', fontSize: '14px', lineHeight: 1.5, color: '#334155', marginBottom: '6px', wordBreak: 'break-word', paddingLeft: '32px' }}>
          {comment.content}
        </div>

        {/* Comment Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', paddingLeft: '34px' }}>
          <button 
            onClick={() => handleCommentReaction('agree')} 
            className="btn-ghost" 
            style={{
              fontSize: '12px',
              fontFamily: 'var(--font-mono)',
              padding: hasAgreed ? '2px 8px' : '0 2px',
              borderRadius: '10px',
              border: 'none',
              backgroundColor: hasAgreed ? '#FEF3C7' : 'transparent',
              color: hasAgreed ? '#92400E' : '#64748B',
              fontWeight: hasAgreed ? 700 : 500,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              transition: 'all 150ms ease'
            }}
          >
            👍 <span style={{ fontSize: '10px' }}>{formatCompactNumber(agree)}</span>
          </button>
          
          <button 
            onClick={() => handleCommentReaction('funny')} 
            className="btn-ghost" 
            style={{
              fontSize: '12px',
              fontFamily: 'var(--font-mono)',
              padding: hasFunny ? '2px 8px' : '0 2px',
              borderRadius: '10px',
              border: 'none',
              backgroundColor: hasFunny ? '#F1F5F9' : 'transparent',
              color: hasFunny ? '#0F172A' : '#64748B',
              fontWeight: hasFunny ? 700 : 500,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              transition: 'all 150ms ease'
            }}
          >
            😄 <span style={{ fontSize: '10px' }}>{formatCompactNumber(funny)}</span>
          </button>

          <button 
            onClick={() => setShowReplyForm(!showReplyForm)} 
            className="btn-ghost" 
            style={{ fontSize: '10.5px', fontFamily: 'var(--font-mono)', padding: '0 2px', color: 'var(--bg-navy-authority)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '3px' }}
          >
            ↪ REPLY
          </button>
        </div>

        {/* Seamless Borderless Reply Input (Fully typable row right to send button) */}
        {showReplyForm && (
          <form 
            onSubmit={handleSendReply}
            style={{ 
              marginLeft: '34px', 
              marginTop: '8px',
              paddingTop: '6px',
              borderTop: '1px dashed #E2E8F0',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              width: 'calc(100% - 34px)'
            }}
          >
            <input
              type="text"
              className="borderless-input"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value.slice(0, 50))}
              placeholder={`Reply to ${comment.authorName} (max 50 chars)...`}
              maxLength={50}
              autoFocus
              style={{ 
                flex: 1, 
                fontSize: '14px', 
                padding: '6px 0', 
                color: 'var(--text-primary)',
                border: 'none',
                outline: 'none',
                background: 'transparent'
              }}
            />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--text-muted)', flexShrink: 0 }}>
              {replyText.length}/50
            </span>
            <button 
              type="submit" 
              className="btn-primary" 
              disabled={!replyText.trim()} 
              style={{ fontSize: '11px', padding: '4px 12px', borderRadius: '16px', flexShrink: 0 }}
            >
              Send
            </button>
          </form>
        )}
      </div>

      {/* Recursive Nested Sub-Threads */}
      {childComments.length > 0 && (
        <div style={{ paddingLeft: '18px', borderLeft: '2px solid #E2E8F0', marginLeft: '12px', marginTop: '2px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {childComments.map(child => (
            <CommentBubble
              key={child.id}
              comment={child}
              allComments={allComments}
              onReplySubmit={onReplySubmit}
              onDeleteComment={onDeleteComment}
              user={user}
              userProfile={userProfile}
              isAdmin={isAdmin}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function CommentThread({ postId }) {
  const { user, userProfile, isAdmin } = useAuth();
  const [comments, setComments] = useState([]);
  const [newTopComment, setNewTopComment] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showMainInput, setShowMainInput] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchLatestComments = (showLoading = false) => {
      if (showLoading) setIsLoading(true);
      api.getComments(postId).then(data => {
        if (isMounted) {
          setComments(data || []);
          setIsLoading(false);
        }
      }).catch(() => {
        if (isMounted) setIsLoading(false);
      });
    };

    fetchLatestComments(true);

    // Auto-refresh comments every 1 minute (60,000 ms) from Cloud Firestore DB
    const intervalId = setInterval(() => {
      fetchLatestComments(false);
    }, 60000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [postId]);

  const handleAddComment = async (parentId, text) => {
    if (!text || !text.trim()) return;

    try {
      const created = await api.createComment({
        postId,
        parentId: parentId || null,
        content: text.trim(),
        authorAvatar: userProfile?.avatarUrl || user?.avatarUrl
      });
      setComments(prev => [...prev, created]);
      setShowMainInput(false);
    } catch (e) {
      console.warn('Comment submit error:', e);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Delete this comment or reply?')) return;
    try {
      await api.deleteComment(commentId);
      setComments(prev => prev.filter(c => c.id !== commentId && c.parentId !== commentId));
    } catch (e) {
      setComments(prev => prev.filter(c => c.id !== commentId && c.parentId !== commentId));
    }
  };

  const handleTopSubmit = (e) => {
    e.preventDefault();
    if (!newTopComment.trim() || newTopComment.length > 500) return;
    handleAddComment(null, newTopComment.trim());
    setNewTopComment('');
  };

  // Dynamic auto-expanding height handler
  const handleTextareaInput = (e) => {
    setNewTopComment(e.target.value.slice(0, 500));
    e.target.style.height = 'auto';
    e.target.style.height = Math.max(48, e.target.scrollHeight) + 'px';
  };

  // Sort top-level comments using the 5-minute rule then engagement score
  const rawTopComments = comments.filter(c => !c.parentId);
  const topLevelComments = sortCommentsByFiveMinRule(rawTopComments, comments);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      
            {/* Top Level Comment Input Box (Starts at 2 rows height & auto-expands height dynamically as text grows!) */}
      {showMainInput && (
        <form 
          onSubmit={handleTopSubmit} 
          style={{ 
            display: 'flex', 
            alignItems: 'flex-end', 
            gap: '12px', 
            backgroundColor: 'transparent', 
            border: 'none', 
            padding: '4px 0',
            width: '100%'
          }}
        >
          <textarea
            className="borderless-input"
            value={newTopComment}
            onChange={handleTextareaInput}
            placeholder={user ? "Write an insight comment (max 500 chars)..." : "Sign in to write a comment..."}
            maxLength={500}
            disabled={!user}
            autoFocus
            rows={1}
            style={{ 
              flex: 1, 
              border: 'none !important', 
              outline: 'none !important', 
              boxShadow: 'none !important',
              background: 'transparent', 
              backgroundColor: 'transparent',
              fontSize: '14px', 
              lineHeight: 1.5,
              padding: '4px 0', 
              minHeight: '32px',
              color: 'var(--text-primary)',
              resize: 'none',
              overflow: 'hidden'
            }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0, paddingBottom: '4px' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--text-muted)' }}>
              {newTopComment.length}/500
            </span>
            <button 
              type="submit" 
              className="btn-primary" 
              disabled={!user || !newTopComment.trim()}
              style={{ fontSize: '11px', padding: '6px 14px', borderRadius: '16px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
            >
              <span>💬</span> SUBMIT
            </button>
          </div>
        </form>
      )}

      {/* Recursive Chat Bubbles List */}
      {isLoading ? (
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-muted)', padding: '4px 0' }}>
          Loading insights...
        </div>
      ) : topLevelComments.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {topLevelComments.map(comment => (
            <CommentBubble
              key={comment.id}
              comment={comment}
              allComments={comments}
              onReplySubmit={(parentId, text) => handleAddComment(parentId, text)}
              onDeleteComment={handleDeleteComment}
              user={user}
              userProfile={userProfile}
              isAdmin={isAdmin}
              level={0}
            />
          ))}
        </div>
      ) : (
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-muted)', padding: '4px 0', fontStyle: 'italic' }}>
          No comments posted yet. Click ✏️ Write Insight to start the discussion!
        </div>
      )}
    </div>
  );
}
