import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import PostCard from '../components/PostCard';
import PostComposer from '../components/PostComposer';
import ShareLeaderModal from '../components/ShareLeaderModal';

const CATEGORIES = [
  'All',
  'Water Supply',
  'Infrastructure',
  'Employment',
  'Healthcare',
  'Education',
  'Roads',
  'Agriculture',
  'Law & Order',
  'Other'
];

export default function LeaderDetail({ leaderId, onBack }) {
  const [leader, setLeader] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isShareOpen, setIsShareOpen] = useState(false);
  
  // Filters & Sorting
  const [sortOption, setSortOption] = useState('supported'); // 'supported' | 'discussed' | 'recent' | 'unanswered' | 'oldest'
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  useEffect(() => {
    let isMounted = true;

    const fetchLeaderData = (showLoading = false) => {
      if (showLoading) setLoading(true);
      Promise.all([
        api.getLeaderById(leaderId),
        api.getPosts({ leaderId, isOpenQuestion: 'true', sort: sortOption, category: categoryFilter })
      ]).then(([leaderData, postsData]) => {
        if (isMounted) {
          setLeader(leaderData);
          if (leaderData?.name) {
            // 1. Generate SEO-optimized text
            const pageTitle = `${leaderData.name} - Political Profile & Career History | VotersMood`;
            const pageDesc = `View the complete political career, election timeline, and ask open questions to ${leaderData.name}, ${leaderData.party} leader from ${leaderData.constituency}, ${leaderData.state}.`;
            
            // 2. Update Document Title
            document.title = pageTitle;
            
            // 3. Update Standard Meta Description
            const metaDesc = document.querySelector('meta[name="description"]');
            if (metaDesc) metaDesc.setAttribute('content', pageDesc);

            // 4. Update Open Graph (Social) Tags dynamically
            const ogTitle = document.querySelector('meta[property="og:title"]');
            if (ogTitle) ogTitle.setAttribute('content', pageTitle);
            
            const ogDesc = document.querySelector('meta[property="og:description"]');
            if (ogDesc) ogDesc.setAttribute('content', pageDesc);

            const ogUrl = document.querySelector('meta[property="og:url"]');
            if (ogUrl) ogUrl.setAttribute('content', window.location.href);

            const photoUrl = leaderData.profilePhoto || leaderData.profilePhotoUrl || leaderData.photoURL;
            if (photoUrl) {
              const ogImage = document.querySelector('meta[property="og:image"]');
              if (ogImage) ogImage.setAttribute('content', photoUrl);
            }
          }
          
          let filtered = postsData.filter(p => p.isOpenQuestion === true || p.targetLeaderId === leaderId || p.targetLeaderId === leaderData?.id);
          if (statusFilter === 'Answered') filtered = filtered.filter(p => p.responseStatus === 'answered');
          if (statusFilter === 'Unanswered') filtered = filtered.filter(p => p.responseStatus === 'pending');
          
          setQuestions(filtered);
          setLoading(false);
        }
      }).catch(() => {
        if (isMounted) setLoading(false);
      });
    };

    fetchLeaderData(true);

    // Auto-refresh open questions every 1 minute (60,000 ms) from Cloud Firestore DB
    const intervalId = setInterval(() => {
      fetchLeaderData(false);
    }, 60000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [leaderId, sortOption, categoryFilter, statusFilter]);

  const handleOpenWebsite = () => {
    if (leader?.website) {
      let url = leader.website.trim();
      if (!/^https?:\/\//i.test(url)) url = `https://${url}`;
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const photoUrl = leader?.profilePhoto || leader?.profilePhotoUrl || leader?.photoURL;

  return (
    <div className="container page-main-container" style={{ padding: '32px 24px', maxWidth: '1000px' }}>
      
      {/* SEO Friendly Back Navigation Bar */}
      <button onClick={onBack} className="btn-ghost" style={{ marginBottom: '16px', fontSize: '13px', fontFamily: 'var(--font-mono)' }}>
        ← BACK TO ELECTED REPRESENTATIVES DIRECTORY
      </button>

      {/* Leader Profile Header */}
      {leader && (
        <div style={{ backgroundColor: '#FFFFFF', border: '1px solid var(--border-main)', borderRadius: 'var(--radius-card)', padding: '24px', marginBottom: '24px', boxShadow: '0 2px 12px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              {photoUrl ? (
                <img 
                  src={photoUrl} 
                  alt={leader.name} 
                  style={{ width: '68px', height: '68px', borderRadius: '12px', objectFit: 'cover', border: '1px solid var(--border-subtle)', backgroundColor: '#F8FAFC', flexShrink: 0 }} 
                />
              ) : (
                <div style={{ width: '68px', height: '68px', borderRadius: '12px', backgroundColor: 'var(--bg-navbar)', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-serif)', fontSize: '30px', fontWeight: 700, flexShrink: 0 }}>
                  {leader.name?.charAt(0)}
                </div>
              )}

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px', flexWrap: 'wrap' }}>
                  <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '28px', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                    {leader.name}
                  </h1>
                  <span className="badge badge-featured">{leader.party}</span>
                  <span className="badge badge-verified">{leader.type}</span>
                  
                  {/* Share Leader Profile Button */}
                  <button
                    onClick={() => setIsShareOpen(true)}
                    className="btn-ghost"
                    style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: '#0284C7', backgroundColor: '#F0F9FF', border: '1px solid #BAE6FD', padding: '3px 8px', borderRadius: '4px', display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 700 }}
                  >
                    <span>📤</span> Share Profile
                  </button>

                  {/* Official Website Link Button */}
                  {leader.website && (
                    <button
                      onClick={handleOpenWebsite}
                      className="btn-ghost"
                      style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: '#0284C7', backgroundColor: '#F0F9FF', border: '1px solid #BAE6FD', padding: '3px 8px', borderRadius: '4px', display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}
                    >
                      🌐 Official Profile Website
                    </button>
                  )}
                </div>

                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--text-secondary)' }}>
                  📍 {leader.constituency}, {leader.state} ({leader.chamber || 'Vidhan Sabha'})
                </div>

                {leader.portfolio && (
                  <div style={{ fontFamily: 'var(--font-sans)', fontSize: '14px', color: 'var(--text-muted)', marginTop: '4px', fontStyle: 'italic' }}>
                    💼 {leader.portfolio}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* POLITICAL PROFILE & TIMELINE */}
          {leader.careerTimeline && leader.careerTimeline.length > 0 && (
            <div style={{ marginTop: '32px', borderTop: '1px solid var(--border-subtle)', paddingTop: '24px' }}>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '24px' }}>
                📜 Political Profile & Career History
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', position: 'relative', marginLeft: '8px' }}>
                {/* Vertical Line */}
                <div style={{ position: 'absolute', left: '11px', top: '8px', bottom: '8px', width: '2px', backgroundColor: '#E2E8F0', zIndex: 0 }}></div>
                
                {leader.careerTimeline.map((milestone, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '24px', position: 'relative', zIndex: 1 }}>
                    {/* Timeline Node */}
                    <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#0284C7', flexShrink: 0, marginTop: '2px', border: '4px solid #FFFFFF', boxShadow: '0 0 0 1px #CBD5E1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <div style={{ width: '6px', height: '6px', backgroundColor: '#FFFFFF', borderRadius: '50%' }}></div>
                    </div>
                    {/* Timeline Content */}
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
                        <div style={{ display: 'inline-block', fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 800, color: '#0369A1', backgroundColor: '#F0F9FF', padding: '2px 8px', borderRadius: '4px' }}>
                          {milestone.year}
                        </div>
                        {milestone.place && (
                          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>
                            📍 {milestone.place}
                          </div>
                        )}
                      </div>
                      <div style={{ fontFamily: 'var(--font-sans)', fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
                        {milestone.title}
                      </div>
                      <div style={{ fontFamily: 'var(--font-sans)', fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                        {milestone.description}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Share Leader Modal */}
      <ShareLeaderModal 
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        leader={leader}
      />
    </div>
  );
}
