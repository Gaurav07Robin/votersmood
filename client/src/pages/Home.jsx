import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import PostComposer from '../components/PostComposer';
import PostCard from '../components/PostCard';
import LeaderCard from '../components/LeaderCard';
import { CardSkeleton } from '../components/Skeleton';
import EmptyState from '../components/EmptyState';

export default function Home({ openRegisterModal }) {
  const [posts, setPosts] = useState([]);
  const [featuredLeaders, setFeaturedLeaders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadData = (showLoading = false) => {
      if (showLoading) setLoading(true);
      Promise.all([
        api.getPosts(),
        api.getLeaders({ sort: 'openQuestions' })
      ]).then(([postsData, leadersData]) => {
        if (isMounted) {
          const postsList = Array.isArray(postsData) ? postsData : (postsData?.posts || []);
          setPosts(postsList);
          
          // Sort leaders strictly by openQuestionsCount descending & pick top 5
          const list = Array.isArray(leadersData) ? leadersData : (leadersData?.leaders || []);
          const sorted = [...list].sort((a, b) => (b.openQuestionsCount || 0) - (a.openQuestionsCount || 0));
          setFeaturedLeaders(sorted.slice(0, 5));
          
          setLoading(false);
        }
      }).catch(() => {
        if (isMounted) setLoading(false);
      });
    };

    loadData(true);

    // Auto-refresh posts and leaders every 1 minute (60,000 ms) from Cloud Firestore DB
    const intervalId = setInterval(() => {
      loadData(false);
    }, 60000);

    const getTrending = (arr) => {
    const counts = {};
    arr.forEach(item => {
      if (item && item.trim()) {
        const val = item.trim().toUpperCase();
        counts[val] = (counts[val] || 0) + 1;
      }
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);
  };

  const trendingIssues = getTrending(safePosts.map(p => p.questionCategory).filter(Boolean));
  const trendingElections = getTrending(safePosts.map(p => p.topicTag).filter(Boolean));

  return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, []);

  const handlePostCreated = (newPost) => {
    setPosts(prev => [newPost, ...(Array.isArray(prev) ? prev : [])]);
  };

  // SEO-friendly Navigation for Featured Leaders in Home Discussions Sidebar (e.g. /directory/devendra-fadnavis)
  const handleSelectLeader = (leaderIdOrSlug) => {
    const cleanSlug = String(leaderIdOrSlug).toLowerCase().trim().replace(/[^a-z0-9]+/g, '-');
    window.history.pushState({}, '', `/directory/${cleanSlug}`);
    window.dispatchEvent(new Event('popstate'));
  };

  const safePosts = Array.isArray(posts) ? posts : [];
  const safeFeaturedLeaders = Array.isArray(featuredLeaders) ? featuredLeaders : [];

  const getTrending = (arr) => {
    const counts = {};
    arr.forEach(item => {
      if (item && item.trim()) {
        const val = item.trim().toUpperCase();
        counts[val] = (counts[val] || 0) + 1;
      }
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);
  };

  const trendingIssues = getTrending(safePosts.map(p => p.questionCategory).filter(Boolean));
  const trendingElections = getTrending(safePosts.map(p => p.topicTag).filter(Boolean));

  return (
    <div className="container page-main-container" style={{ padding: '32px 24px' }}>
      
      {/* Title Header Card */}
      <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-main)', borderRadius: 'var(--radius-card)', padding: '24px', marginBottom: '28px', boxShadow: 'var(--shadow-card)' }}>
        
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '32px', fontWeight: 800, margin: '0 0 8px 0', color: 'var(--text-primary)' }}>
          Citizen Discussions & Public Open Questions
        </h1>
      </div>

      <div className="two-column-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '32px' }}>
        
        {/* Main Feed Column */}
        <div>
          <PostComposer onPostCreated={handlePostCreated} openRegisterModal={openRegisterModal} />

          {loading ? (
            <div>
              <CardSkeleton />
              <CardSkeleton />
              <CardSkeleton />
            </div>
          ) : safePosts.length === 0 ? (
            <EmptyState 
              icon="💬"
              title="No Discussions Posted Yet"
              description="Be the first verified citizen to post an insight or open question to a leader!"
              actionLabel="Post First Insight"
              onAction={openRegisterModal}
            />
          ) : (
            safePosts.map(post => (
              <PostCard 
                key={post.id} 
                post={post} 
                onDelete={(id) => setPosts(prev => (Array.isArray(prev) ? prev : []).filter(p => p.id !== id))} 
              />
            ))
          )}
        </div>

        {/* Sidebar Column: Trending Topics and Elections */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Trending Issues Module */}
          <div className="gazette-card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '18px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                🔥 Trending Issues
              </h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {trendingIssues.length > 0 ? trendingIssues.map(([issue, count], idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '12px', borderBottom: idx !== trendingIssues.length - 1 ? '1px solid #F1F5F9' : 'none' }}>
                  <span style={{ fontFamily: 'var(--font-sans)', fontSize: '14px', fontWeight: 600, color: '#334155' }}>
                    {idx + 1}. {issue}
                  </span>
                  <span className="badge badge-verified" style={{ fontSize: '10px' }}>
                    {count} POSTS
                  </span>
                </div>
              )) : (
                <div style={{ fontSize: '13px', color: '#94A3B8' }}>No issues trending yet.</div>
              )}
            </div>
          </div>

          {/* Trending Elections Module */}
          <div className="gazette-card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '18px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                🗳️ Trending Elections
              </h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {trendingElections.length > 0 ? trendingElections.map(([election, count], idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '12px', borderBottom: idx !== trendingElections.length - 1 ? '1px solid #F1F5F9' : 'none' }}>
                  <span style={{ fontFamily: 'var(--font-sans)', fontSize: '13px', fontWeight: 600, color: '#0369A1', wordBreak: 'break-word', display: 'inline-block', lineHeight: 1.3 }}>
                    {election.startsWith('#') ? election : `#${election}`}
                  </span>
                  <span className="badge badge-trending" style={{ fontSize: '10px' }}>
                    {count} POSTS
                  </span>
                </div>
              )) : (
                <div style={{ fontSize: '13px', color: '#94A3B8' }}>No elections trending yet.</div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
