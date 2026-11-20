import { Helmet } from 'react-helmet-async';
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
  const [relatedLeaders, setRelatedLeaders] = useState([]);
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

          // Fetch peer representatives from the same state for internal PageRank flow
          if (leaderData?.state) {
            api.getLeaders({ state: leaderData.state, limit: 8 }).then(data => {
              const list = Array.isArray(data) ? data : (data?.leaders || []);
              if (isMounted) {
                setRelatedLeaders(list.filter(l => l.id !== leaderData.id).slice(0, 6));
              }
            }).catch(() => {});
          }

          if (leaderData?.name) {
            const roleTag = leaderData.type === 'MP_LS' || leaderData.repType === 'MP' ? 'MP' : 'MLA';
            const partyBadge = leaderData.party ? `(${leaderData.party})` : '';
            const constPart = leaderData.constituency ? `${leaderData.constituency}` : '';
            const statePart = leaderData.state ? `, ${leaderData.state}` : '';

            // High-CTR Click Magnet Title & Description
            const pageTitle = `${leaderData.name} ${partyBadge} ${roleTag} ${constPart}: Election Track Record, Bio & Contact | Opinar`;
            const pageDesc = `Explore ${leaderData.name} ${partyBadge}, elected ${roleTag} representing ${constPart}${statePart}. View verified election track record, legislative performance, and citizen open questions on Opinar.`;
            
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

  const roleLabel = leader?.type === 'MP_LS' || leader?.repType === 'MP' ? 'MP' : 'MLA';
  const partyBadge = leader?.party ? `(${leader.party})` : '';
  const constPart = leader?.constituency ? `${leader.constituency}` : '';
  const statePart = leader?.state ? `, ${leader.state}` : '';
  const highCtrTitle = leader?.name 
    ? `${leader.name} ${partyBadge} ${roleLabel} ${constPart}: Election Track Record, Bio & Contact | Opinar`
    : 'Leader Profile | Opinar';
  const highCtrDesc = leader?.name 
    ? `Explore ${leader.name} ${partyBadge}, elected ${roleLabel} representing ${constPart}${statePart}. View verified election track record, legislative performance, and citizen open questions on Opinar.`
    : 'Track leader performance on Opinar.';

  return (
    <div className="container page-main-container" style={{ padding: '32px 24px', maxWidth: '1000px' }}>

      <Helmet>
        <title>{highCtrTitle}</title>
        <meta name="description" content={highCtrDesc} />
        <meta name="keywords" content={`${leader?.name || 'Indian politician'}, ${leader?.name || ''} ${leader?.party || ''}, ${roleLabel} ${leader?.name || ''}, ${leader?.name || ''} ${leader?.constituency || ''}, ${leader?.name || ''} MLA, ${leader?.name || ''} MP, ${leader?.constituency || ''} election result, ask question to ${leader?.name || ''}, how to contact ${leader?.name || ''} ${leader?.constituency || ''} representative, ${leader?.name || ''} political career`} />
        <link rel="canonical" href={`https://www.opinar.in/directory/${leader?.id || leaderId || ''}`} />

        <meta property="og:title" content={highCtrTitle} />
        <meta property="og:description" content={highCtrDesc} />
        <meta property="og:url" content={`https://www.opinar.in/directory/${leader?.id || leaderId || ''}`} />
        <meta property="og:type" content="profile" />

        {leader?.name && (
          <script type="application/ld+json">
            {JSON.stringify({
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "Person",
                  "name": leader.name,
                  "jobTitle": leader.portfolio || (leader.type === 'MP_LS' ? 'Member of Parliament (Lok Sabha)' : 'Member of Legislative Assembly'),
                  "affiliation": {
                    "@type": "Organization",
                    "name": leader.party
                  },
                  "address": {
                    "@type": "PostalAddress",
                    "addressRegion": leader.state,
                    "addressCountry": "IN"
                  }
                },
                {
                  "@type": "BreadcrumbList",
                  "itemListElement": [
                    { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://www.opinar.in/" },
                    { "@type": "ListItem", "position": 2, "name": "Directory", "item": "https://www.opinar.in/directory" },
                    { "@type": "ListItem", "position": 3, "name": leader.state || "State", "item": `https://www.opinar.in/directory?state=${encodeURIComponent(leader.state || '')}` },
                    { "@type": "ListItem", "position": 4, "name": `${leader.name} (${leader.party || 'Leader'})`, "item": `https://www.opinar.in/directory/${leader.id}` }
                  ]
                },
                {
                  "@type": "FAQPage",
                  "mainEntity": [
                    {
                      "@type": "Question",
                      "name": `Which constituency does ${leader.name} represent?`,
                      "acceptedAnswer": {
                        "@type": "Answer",
                        "text": `${leader.name} represents ${leader.constituency || 'their constituency'} in ${leader.state} as a member of ${leader.party}.`
                      }
                    },
                    {
                      "@type": "Question",
                      "name": `How can I ask an open question to ${leader.name}?`,
                      "acceptedAnswer": {
                        "@type": "Answer",
                        "text": `You can post a verified citizen open question to ${leader.name} directly on their Opinar profile page.`
                      }
                    }
                  ]
                }
              ]
            })}
          </script>
        )}
      </Helmet>

      
      {/* Breadcrumb Navigation */}
      {leader && (
        <nav aria-label="Breadcrumb" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px', flexWrap: 'wrap' }}>
          <a href="/" style={{ color: '#0284C7', textDecoration: 'none', fontWeight: 500 }}>Home</a>
          <span>/</span>
          <a href="/directory" onClick={(e) => { e.preventDefault(); onBack?.(); }} style={{ color: '#0284C7', textDecoration: 'none', fontWeight: 500 }}>Directory</a>
          <span>/</span>
          <span>{leader.state || 'State'}</span>
          <span>/</span>
          <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{leader.name}</span>
        </nav>
      )}

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

          {/* VISIBLE FREQUENTLY ASKED QUESTIONS */}
          <div style={{ marginTop: '32px', borderTop: '1px solid var(--border-subtle)', paddingTop: '24px' }}>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '16px' }}>
              ❓ Frequently Asked Questions about {leader.name}
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '16px' }}>
                <h4 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 6px 0', color: 'var(--text-primary)' }}>
                  Which constituency does {leader.name} represent?
                </h4>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.5' }}>
                  {leader.name} represents the <strong>{leader.constituency}</strong> constituency in <strong>{leader.state}</strong> as an elected {roleLabel} affiliated with <strong>{leader.party}</strong>.
                </p>
              </div>
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '16px' }}>
                <h4 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 6px 0', color: 'var(--text-primary)' }}>
                  How can I ask an open question to {leader.name}?
                </h4>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.5' }}>
                  Citizens can post verified public questions directly on {leader.name}'s official Opinar profile to debate local civic issues and demand representative accountability.
                </p>
              </div>
            </div>
          </div>

          {/* RELATED REPRESENTATIVES FROM STATE (Internal PageRank Mesh) */}
          {relatedLeaders.length > 0 && (
            <div style={{ marginTop: '32px', borderTop: '1px solid var(--border-subtle)', paddingTop: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  🏛️ Elected Representatives from {leader.state}
                </h3>
                {leader.state && (
                  <a 
                    href={`/elections/state/${leader.state.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
                    style={{ fontSize: '13px', fontWeight: 600, color: '#0284C7', textDecoration: 'none' }}
                  >
                    View {leader.state} Assembly Elections &rarr;
                  </a>
                )}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                {relatedLeaders.map(peer => (
                  <a 
                    key={peer.id}
                    href={`/directory/${peer.id}`}
                    style={{
                      display: 'block',
                      padding: '14px 16px',
                      background: '#FFFFFF',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '8px',
                      textDecoration: 'none',
                      color: 'var(--text-primary)',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                      transition: 'border-color 0.2s'
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '4px' }}>{peer.name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                      <span style={{ fontWeight: 600, color: '#0F172A' }}>{peer.party}</span> • {peer.constituency}
                    </div>
                  </a>
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
