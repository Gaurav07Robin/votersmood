import React, { useState, useEffect, useRef } from 'react';
import { CitizenInquiry } from './Icons';
import ShareLeaderModal from './ShareLeaderModal';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from './Toast';
import { formatCompactNumber } from '../utils/formatters';

export default function LeaderCard({ leader, rank, onSelect, openRegisterModal }) {
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();

  const [agreeCount, setAgreeCount] = useState(leader.agreeCount || 0);
  const [funnyCount, setFunnyCount] = useState(leader.funnyCount || 0);
  const [userAgreed, setUserAgreed] = useState(false);
  const [userFunny, setUserFunny] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isHighlighted, setIsHighlighted] = useState(false);

  const cardRef = useRef(null);
  const cleanSlug = (leader?.id || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-');

  useEffect(() => {
    setAgreeCount(leader.agreeCount || 0);
    setFunnyCount(leader.funnyCount || 0);
  }, [leader.agreeCount, leader.funnyCount]);

  // Deep Link Auto-Scroll & Highlighting Handler for Leader Cards in Directory
  useEffect(() => {
    if (!leader?.id) return;

    const urlParams = new URLSearchParams(window.location.search);
    const targetLeaderId = urlParams.get('leader');
    const hashId = window.location.hash.replace('#leader-', '');
    const cleanSlug = (leader.id || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-');

    if (targetLeaderId === leader.id || targetLeaderId === cleanSlug || hashId === leader.id || hashId === cleanSlug) {
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
  }, [leader?.id]);

  // Load user reaction state across page refreshes
  useEffect(() => {
    if (!user) return;

    const cacheKey = `janmat_leader_rxn_${user.uid}_${leader.id}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed.agree !== undefined) setUserAgreed(parsed.agree);
        if (parsed.funny !== undefined) setUserFunny(parsed.funny);
      } catch (e) {}
    }

    // Query Cloud Firestore DB
    api.getUserReactions().then(res => {
      if (res && res.userReactions && res.userReactions[leader.id]) {
        const rxns = res.userReactions[leader.id];
        const hasAgree = !!rxns.agree;
        const hasFunny = !!rxns.funny;
        setUserAgreed(hasAgree);
        setUserFunny(hasFunny);
        localStorage.setItem(cacheKey, JSON.stringify({ agree: hasAgree, funny: hasFunny }));
      }
    }).catch(() => {});
  }, [user, leader.id]);

  // Ultra-Fast 0ms Optimistic UI Reaction Toggle Engine
  const handleReaction = (e, reactionType) => {
    e.stopPropagation(); // Prevent card navigation when clicking reaction buttons

    if (!user) {
      if (openRegisterModal) openRegisterModal();
      else showError('Please sign in or register to react to representatives.');
      return;
    }

    const cacheKey = `janmat_leader_rxn_${user.uid}_${leader.id}`;

    // 1. INSTANT OPTIMISTIC UI MUTATION (0ms)
    if (reactionType === 'agree') {
      const nextAgreed = !userAgreed;
      setUserAgreed(nextAgreed);
      setAgreeCount(prev => (nextAgreed ? prev + 1 : Math.max(0, prev - 1)));
      localStorage.setItem(cacheKey, JSON.stringify({ agree: nextAgreed, funny: userFunny }));
      showSuccess(nextAgreed ? `👍 Agreed with ${leader.name}!` : `Removed Agree reaction`);
    } else if (reactionType === 'funny') {
      const nextFunny = !userFunny;
      setUserFunny(nextFunny);
      setFunnyCount(prev => (nextFunny ? prev + 1 : Math.max(0, prev - 1)));
      localStorage.setItem(cacheKey, JSON.stringify({ agree: userAgreed, funny: nextFunny }));
      showSuccess(nextFunny ? `😄 Reacted Funny to ${leader.name}!` : `Removed Funny reaction`);
    }

    // 2. BACKGROUND ASYNC DB SYNC (Non-blocking)
    api.toggleReaction({
      targetId: leader.id,
      targetType: 'leader',
      reactionType
    }).then(res => {
      if (res && typeof res.newCount === 'number') {
        if (reactionType === 'agree') setAgreeCount(Math.max(0, res.newCount));
        if (reactionType === 'funny') setFunnyCount(Math.max(0, res.newCount));
      }
    }).catch(err => {
      console.warn('Background leader reaction sync warning:', err);
    });
  };

  const handleOpenExternalWebsite = (e) => {
    e.stopPropagation(); // Prevent card selection navigation
    if (leader.website) {
      let url = leader.website.trim();
      if (!/^https?:\/\//i.test(url)) {
        url = `https://${url}`;
      }
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const handleOpenShareModal = (e) => {
    e.stopPropagation(); // Prevent card selection navigation
    setIsShareOpen(true);
  };

  const photoUrl = leader.profilePhoto || leader.profilePhotoUrl || leader.photoURL;

  return (
    <>
      <div
        id={`leader-${leader.id}`}
        ref={cardRef}
        onClick={() => onSelect && onSelect(leader.id)}
        className="gazette-card"
        style={{
          backgroundColor: '#FFFFFF',
          border: isHighlighted ? '2px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
          borderRadius: '12px',
          padding: '16px 18px',
          cursor: 'pointer',
          display: 'flex',
          flexDirection: 'column',
          justify: 'space-between',
          boxShadow: isHighlighted ? '0 0 20px rgba(217, 119, 6, 0.35)' : undefined,
          transition: 'transform 150ms ease, box-shadow 150ms ease, border-color 300ms ease'
        }}
      >
        <div>
          {/* Header Badges Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '6px' }}>
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
              {/* Rank badge: Crisp WHITE text on BLACK background */}
              {rank && (
                <span 
                  style={{ 
                    fontSize: '10px', 
                    fontWeight: 800, 
                    fontFamily: 'var(--font-mono)',
                    backgroundColor: '#000000', 
                    color: '#FFFFFF', 
                    padding: '2px 7px',
                    borderRadius: '4px',
                    letterSpacing: '0.04em'
                  }}
                >
                  #{rank} RANK
                </span>
              )}
              <span className="badge badge-featured" style={{ fontSize: '10px' }}>{leader.party}</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {/* Top Row Share Leader Button */}
              <button
                type="button"
                onClick={handleOpenShareModal}
                title={`Share ${leader.name}'s Profile`}
                className="btn-ghost"
                style={{
                  fontSize: '10px',
                  fontFamily: 'var(--font-mono)',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  border: '1px solid #BAE6FD',
                  color: '#0284C7',
                  backgroundColor: '#F0F9FF',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '3px'
                }}
              >
                <span>📤</span> Share
              </button>

              {/* Official Website Link Button */}
              {leader.website && (
                <button
                  type="button"
                  onClick={handleOpenExternalWebsite}
                  title={`Visit Official Website: ${leader.website}`}
                  className="btn-ghost"
                  style={{
                    fontSize: '10px',
                    fontFamily: 'var(--font-mono)',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    border: '1px solid #CBD5E1',
                    color: '#0284C7',
                    backgroundColor: '#F0F9FF',
                    fontWeight: 600,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '3px'
                  }}
                >
                  🔗 Website
                </button>
              )}
              <span className="badge badge-verified" style={{ fontSize: '10px' }}>{leader.type || leader.repType}</span>
            </div>
          </div>

          {/* Leader Profile Photo & Title Row (Crawlable <a> tag for Googlebot SEO) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
            <a
              href={`/directory/${cleanSlug}`}
              onClick={(e) => {
                e.preventDefault();
                if (onSelect) onSelect(leader.id);
              }}
              style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '12px', flex: 1, color: 'inherit' }}
            >
              {photoUrl ? (
                <img 
                  src={photoUrl} 
                  alt={leader.name} 
                  style={{ width: '42px', height: '42px', borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--border-subtle)', flexShrink: 0, backgroundColor: '#F8FAFC' }} 
                />
              ) : (
                <div style={{ width: '42px', height: '42px', borderRadius: '50%', backgroundColor: 'var(--bg-navbar)', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-serif)', fontSize: '18px', fontWeight: 700, flexShrink: 0 }}>
                  {leader.name?.charAt(0)}
                </div>
              )}

              <div>
                <h3 style={{ fontFamily: 'var(--font-card-title)', fontSize: '19px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                  {leader.name}
                </h3>

                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11.5px', color: 'var(--text-secondary)' }}>
                  📍 {leader.constituency}, {leader.state}
                </div>
              </div>
            </a>
          </div>

          {leader.portfolio && (
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: '12.5px', color: 'var(--text-muted)', margin: '6px 0 12px 0', lineHeight: 1.35, fontStyle: 'italic' }}>
              💼 {leader.portfolio}
            </p>
          )}
        </div>

        {/* Single Compact Horizontal Action Bar (Reactions Left, Open Questions Right) */}
        <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontFamily: 'var(--font-mono)', fontSize: '11px', flexWrap: 'wrap', gap: '6px' }}>
          
          {/* Minimal Transparent Reaction Buttons (Instant 0ms Optimistic UI) */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button
              type="button"
              onClick={(e) => handleReaction(e, 'agree')}
              className="btn-ghost"
              style={{
                fontSize: '11px',
                padding: userAgreed ? '2px 7px' : '0 2px',
                borderRadius: '10px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                border: 'none',
                backgroundColor: userAgreed ? '#FEF3C7' : 'transparent',
                color: userAgreed ? '#92400E' : '#64748B',
                fontWeight: userAgreed ? 700 : 500,
                transition: 'all 150ms ease'
              }}
            >
              <span>👍</span> <span>{formatCompactNumber(agreeCount)}</span>
            </button>

            <button
              type="button"
              onClick={(e) => handleReaction(e, 'funny')}
              className="btn-ghost"
              style={{
                fontSize: '11px',
                padding: userFunny ? '2px 7px' : '0 2px',
                borderRadius: '10px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                border: 'none',
                backgroundColor: userFunny ? '#F1F5F9' : 'transparent',
                color: userFunny ? '#0F172A' : '#64748B',
                fontWeight: userFunny ? 700 : 500,
                transition: 'all 150ms ease'
              }}
            >
              <span>😄</span> <span>{formatCompactNumber(funnyCount)}</span>
            </button>
          </div>

          {/* Open Questions Count Indicator on the Right side */}
          <span style={{ fontWeight: 600, fontSize: '10.5px', color: 'var(--accent-copper-text)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <CitizenInquiry size={12} /> {formatCompactNumber(leader.openQuestionsCount || 0)} Open Ques
          </span>
        </div>
      </div>

      {/* Share Leader Modal */}
      <ShareLeaderModal 
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        leader={leader}
      />
    </>
  );
}
