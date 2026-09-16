import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from './Toast';
import CreateCommunityPollModal from './CreateCommunityPollModal';
import PostComposer from './PostComposer';
import PostCard from './PostCard';

export default function CommunityPollsSection({ openRegisterModal }) {
  const { user, isAdmin } = useAuth();
  const { showSuccess, showError } = useToast();
  const [polls, setPolls] = useState([]);
  const [posts, setPosts] = useState([]);
  const [votedMap, setVotedMap] = useState({});
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchCommunityPolls();
    fetchElectionPosts();
  }, []);

  // Fetch user vote receipts across page refreshes
  useEffect(() => {
    // Check local storage cache
    const savedLocal = localStorage.getItem('janmat_community_votes');
    if (savedLocal) {
      try {
        setVotedMap(JSON.parse(savedLocal));
      } catch (e) {}
    }

    // Query Cloud Firestore DB
    if (user) {
      api.getUserVotes().then(res => {
        if (res && res.userVotes) {
          const mapFromDb = {};
          Object.entries(res.userVotes).forEach(([key, val]) => {
            if (val.optionId) {
              mapFromDb[key] = val.optionId;
            }
          });
          setVotedMap(prev => {
            const merged = { ...prev, ...mapFromDb };
            localStorage.setItem('janmat_community_votes', JSON.stringify(merged));
            return merged;
          });
        }
      }).catch(() => {});
    }
  }, [user]);

  const fetchCommunityPolls = () => {
    api.getCommunityPolls().then(data => {
      const pollsList = Array.isArray(data) ? data : (data?.polls || []);
      setPolls(pollsList);
    }).catch(() => {});
  };

  const fetchElectionPosts = () => {
    api.getPosts().then(data => {
      const postsList = Array.isArray(data) ? data : (data?.posts || []);
      setPosts(postsList);
    }).catch(() => {});
  };

  const handleVoteCommunity = async (pollId, optionId) => {
    if (!user) {
      if (openRegisterModal) openRegisterModal();
      return;
    }

    if (votedMap[pollId]) {
      showError('⚠️ You have already recorded your vote in this community poll.');
      return;
    }

    try {
      const res = await api.voteCommunityPoll(pollId, { optionId });
      
      const newVotedMap = { ...votedMap, [pollId]: optionId };
      setVotedMap(newVotedMap);
      localStorage.setItem('janmat_community_votes', JSON.stringify(newVotedMap));

      showSuccess('📊 Community Poll Vote Saved to Cloud Firestore DB!');

      if (res && res.poll) {
        setPolls(prev => (Array.isArray(prev) ? prev : []).map(p => p.id === pollId ? res.poll : p));
      } else {
        fetchCommunityPolls();
      }
    } catch (e) {
      const serverErr = e.response?.data?.error;
      if (serverErr) {
        setVotedMap(prev => ({ ...prev, [pollId]: true }));
        showError(`⚠️ ${serverErr}`);
      } else {
        console.warn('Vote community poll error:', e);
      }
      fetchCommunityPolls();
    }
  };

  const handleFeature = async (pollId) => {
    try {
      await api.featureCommunityPoll(pollId);
      fetchCommunityPolls();
    } catch (e) {
      console.warn('Feature poll error:', e);
    }
  };

  const handleDelete = async (pollId) => {
    if (!window.confirm('Delete this community poll?')) return;
    try {
      await api.deleteCommunityPoll(pollId);
      fetchCommunityPolls();
    } catch (e) {
      console.warn('Delete poll error:', e);
    }
  };

  const safePolls = Array.isArray(polls) ? polls : [];
  const safePosts = Array.isArray(posts) ? posts : [];

  return (
    <div style={{ marginTop: '32px', borderTop: '2px solid var(--border-main)', paddingTop: '28px' }}>
      
      {/* Header Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
          🗣️ Community Issue Polls
        </h2>

        <button 
          onClick={() => {
            if (!user && openRegisterModal) openRegisterModal();
            else setIsModalOpen(true);
          }} 
          className="btn-primary" 
          style={{ fontSize: '12.5px', padding: '8px 16px' }}
        >
          📊 + CREATE ISSUE MINI POLL
        </button>
      </div>

      {/* Community Mini Issue Polls Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        {safePolls.map(poll => {
          const pollOptions = Array.isArray(poll.options) ? poll.options : [];
          const totalVotes = pollOptions.reduce((a, b) => a + (b.votes || 0), 0);
          const userVotedOpt = votedMap[poll.id];

          return (
            <div 
              key={poll.id} 
              className={`gazette-card ${userVotedOpt ? 'animate-vote-success' : ''}`}
              style={{ 
                backgroundColor: '#FFFFFF', 
                border: poll.isFeatured ? '2px solid var(--accent-primary)' : '1px solid var(--border-main)', 
                borderRadius: '8px', 
                padding: '18px',
                transition: 'all 200ms ease'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-muted)' }}>
                  {poll.authorName?.replace(' (Verified Citizen)', '')}
                </span>
                <div style={{ display: 'flex', gap: '6px' }}>

                  {poll.isFeatured && (
                    <span className="badge badge-featured" style={{ fontSize: '9px' }}>★ FEATURED SURVEY</span>
                  )}
                </div>
              </div>

              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '17px', fontWeight: 700, margin: '0 0 14px 0', color: 'var(--text-primary)' }}>
                {poll.question}
              </h3>

              {/* Options list */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>
                {pollOptions.map(opt => {
                  const pct = totalVotes > 0 ? Math.round((opt.votes / totalVotes) * 100) : 0;
                  const isSelected = userVotedOpt === opt.id;

                  return (
                    <div 
                      key={opt.id}
                      onClick={() => handleVoteCommunity(poll.id, opt.id)}
                      style={{
                        backgroundColor: isSelected ? '#ECFDF5' : 'var(--bg-secondary)',
                        border: isSelected ? '2px solid #059669' : '1px solid var(--border-divider)',
                        borderRadius: '6px',
                        padding: '8px 12px',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px',
                        transition: 'all 150ms ease'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-sans)', fontSize: '13px', color: 'var(--text-primary)', fontWeight: isSelected ? 700 : 500 }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {isSelected && <span style={{ color: '#059669', fontWeight: 800 }}>✓</span>}
                          {opt.text}
                          {isSelected && <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#059669', fontWeight: 700 }}>(YOUR CHOICE)</span>}
                        </span>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 700 }}>{pct}%</span>
                      </div>
                      <div style={{ height: '5px', backgroundColor: '#E5E2DC', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${pct}%`, backgroundColor: isSelected ? '#059669' : 'var(--accent-primary)', transition: 'width 300ms ease' }} />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Admin Moderation Bar */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-divider)', paddingTop: '8px', fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)' }}>
                <span>🗳 {totalVotes} CITIZEN VOTES</span>

                {isAdmin && (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => handleFeature(poll.id)} className="btn-ghost" style={{ fontSize: '10px', color: 'var(--accent-primary)' }}>
                      {poll.isFeatured ? 'Unfeature' : 'Feature'}
                    </button>
                    <button onClick={() => handleDelete(poll.id)} className="btn-ghost" style={{ fontSize: '10px', color: 'var(--color-error)' }}>
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <CreateCommunityPollModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onCreated={(newPoll) => setPolls(prev => [newPoll, ...(Array.isArray(prev) ? prev : [])])} 
      />
    </div>
  );
}
