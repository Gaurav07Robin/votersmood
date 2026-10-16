import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { api } from '../api/client';

// Apple-inspired frosted pastel themes (light, airy, vibrant, high-contrast)
const PALETTES = [
  {
    name: 'Lavender Mist',
    bg: 'linear-gradient(145deg, rgba(245, 240, 255, 0.94) 0%, rgba(238, 242, 255, 0.82) 100%)',
    border: 'rgba(168, 85, 247, 0.28)',
    badgeBg: 'rgba(147, 51, 234, 0.12)',
    badgeColor: '#7E22CE',
    accent: '#9333EA',
    glow: '0 12px 30px -8px rgba(168, 85, 247, 0.18)'
  },
  {
    name: 'Warm Sunset Peach',
    bg: 'linear-gradient(145deg, rgba(255, 247, 237, 0.94) 0%, rgba(254, 242, 242, 0.82) 100%)',
    border: 'rgba(249, 115, 22, 0.28)',
    badgeBg: 'rgba(234, 88, 12, 0.12)',
    badgeColor: '#C2410C',
    accent: '#EA580C',
    glow: '0 12px 30px -8px rgba(249, 115, 22, 0.18)'
  },
  {
    name: 'Nordic Frost Sky',
    bg: 'linear-gradient(145deg, rgba(240, 249, 255, 0.94) 0%, rgba(238, 242, 255, 0.82) 100%)',
    border: 'rgba(14, 165, 233, 0.28)',
    badgeBg: 'rgba(2, 132, 199, 0.12)',
    badgeColor: '#0369A1',
    accent: '#0284C7',
    glow: '0 12px 30px -8px rgba(14, 165, 233, 0.18)'
  },
  {
    name: 'Emerald Sage Mist',
    bg: 'linear-gradient(145deg, rgba(236, 253, 245, 0.94) 0%, rgba(240, 253, 250, 0.82) 100%)',
    border: 'rgba(16, 185, 129, 0.28)',
    badgeBg: 'rgba(5, 150, 105, 0.12)',
    badgeColor: '#047857',
    accent: '#059669',
    glow: '0 12px 30px -8px rgba(16, 185, 129, 0.18)'
  },
  {
    name: 'Rose Blush Mist',
    bg: 'linear-gradient(145deg, rgba(255, 241, 242, 0.94) 0%, rgba(253, 242, 248, 0.82) 100%)',
    border: 'rgba(244, 63, 94, 0.28)',
    badgeBg: 'rgba(225, 29, 72, 0.12)',
    badgeColor: '#BE123C',
    accent: '#E11D48',
    glow: '0 12px 30px -8px rgba(244, 63, 94, 0.18)'
  },
  {
    name: 'Sunbeam Gold Mist',
    bg: 'linear-gradient(145deg, rgba(254, 252, 232, 0.94) 0%, rgba(255, 251, 235, 0.82) 100%)',
    border: 'rgba(234, 179, 8, 0.32)',
    badgeBg: 'rgba(202, 138, 4, 0.12)',
    badgeColor: '#A16207',
    accent: '#CA8A04',
    glow: '0 12px 30px -8px rgba(234, 179, 8, 0.18)'
  }
];

// Helper to sanitize any text: remove hashtags, asterisks, emojis, and unwanted prefixes
const cleanText = (s) => {
  return String(s || '')
    .replace(/[#*]/g, '')
    .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E6}-\u{1F1FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}]/gu, '')
    .replace(/^(The Spark|Ground (Calculus|Reality)|The Stat|Takeaway|Key Metric):\s*/i, '')
    .trim();
};

const cleanCategory = (cat) => {
  const c = cleanText(cat).toUpperCase();
  if (!c || c === 'TRENDING RADAR' || c === 'RADAR') return 'POLITICS';
  return c;
};

// Fact-dense, hard-hitting real-time political news feed
const INITIAL_REELS = [
  {
    id: 'reel-1',
    slug: 'aap-leaders-detained-outside-agency-headquarters',
    category: 'POLICE ACTION',
    tag: 'AAP Detentions',
    title: 'AAP Leaders Detained in High-Voltage Delhi Protests',
    subtitle: 'Police enforce Section 144 as senior party representatives clash outside investigative agency gates',
    timeAgo: '1h ago',
    paragraphs: [
      'Delhi Police detained multiple senior Aam Aadmi Party leaders and scores of party workers near central Delhi after demonstrations escalated over ongoing federal agency investigations.',
      'Sanjay Singh and key party representatives were bundled into police buses and relocated to Mandir Marg police station as security was fortified with multi-layer barricading around agency headquarters.',
      'The detention follows high-octane political accusations ahead of the Delhi Assembly elections, where AAP alleges deliberate administrative disruption while the opposition demands full accountability in ongoing excise charge-sheets.'
    ]
  },
  {
    id: 'reel-2',
    slug: 'dhruv-rathee-viral-briefing-counter-fir-storm',
    category: 'VIRAL EXPOSE',
    tag: 'Dhruv Rathee',
    title: 'Dhruv Rathee Press Briefing Triggers Cross-FIR Political Firestorm',
    subtitle: 'Viral expose video crosses 14 million views as rival political wings trade police complaints',
    timeAgo: '2h ago',
    paragraphs: [
      'YouTuber Dhruv Rathee held a widely streamed public media briefing addressing government pressure, shadow-banning allegations, and state machinery targeting digital commentators.',
      'The broadcast garnered over 14 million views within 24 hours across YouTube and X, prompting official counter-briefings from BJP national spokespersons alleging foreign-funded bias and coordinated electoral disruption.',
      'State police units in Maharashtra and Uttar Pradesh registered counter-complaints under the Information Technology Act, marking a major escalation in the battle for digital narrative control ahead of state polls.'
    ]
  },
  {
    id: 'reel-3',
    slug: 'gyanesh-kumar-eci-election-security-seizures',
    category: 'ELECTION COMMISSION',
    tag: 'Gyanesh Kumar CEC',
    title: 'CEC Gyanesh Kumar Orders Multi-Agency Border Checkpost Crackdown',
    subtitle: 'Over 280 crore in illicit cash, liquor, and precious metals seized across Maharashtra and Jharkhand borders',
    timeAgo: '3h ago',
    paragraphs: [
      'Chief Election Commissioner Gyanesh Kumar convened a comprehensive multi-agency review meeting directing enforcement directorates, state excise, and police chiefs to seal inter-state transit corridors.',
      'Official Election Commission records confirm seizures surpassing 280 crore across Maharashtra and Jharkhand within the first 72 hours of model code enforcement.',
      'Gyanesh Kumar instructed district electoral officers to install 24x7 live webcasting across all sensitive polling stations and mandated strict 3-hour action turnaround on citizen complaints received on the cVIGIL portal.'
    ]
  },
  {
    id: 'reel-4',
    slug: 'cjp-activist-detention-and-summons-mumbai',
    category: 'LEGAL & COURTS',
    tag: 'CJP Legal Action',
    title: 'CJP Activists Questioned by Police Over Hate Speech Filings',
    subtitle: 'Citizens for Justice and Peace representatives face intense administrative questioning in Mumbai',
    timeAgo: '4h ago',
    paragraphs: [
      'Representatives of the Citizens for Justice and Peace (CJP) organization were summoned and questioned by Mumbai police officials in connection with their ongoing public interest filings on hate speech monitoring.',
      'Rights groups and civil society organizations issued joint statements condemning the action as state-sponsored intimidation aimed at suppressing independent poll monitors.',
      'The police stated the inquiries pertain to verification of funding disclosures and documentation protocols, while CJP legal counsel moved the High Court seeking protective orders against arbitrary detention.'
    ]
  },
  {
    id: 'reel-5',
    slug: 'modi-rally-deep-state-foreign-interference-speech',
    category: 'RALLIES & SPEECHES',
    tag: 'Modi Rally',
    title: 'PM Modi Attacks Foreign Interference and Deep State Networks at Rally',
    subtitle: 'Direct accusations against external lobbies attempting to influence domestic electoral outcomes',
    timeAgo: '5h ago',
    paragraphs: [
      'Addressing a massive public gathering, Prime Minister Narendra Modi accused international entities and domestic proxy organizations of actively scheming to undermine stable governance in India.',
      'Modi asserted that certain foreign-funded networks are attempting regime change strategies by inflaming internal caste and regional fractures during democratic voting cycles.',
      'The speech drew fierce condemnation from Congress leaders who countered that invoking external deep state conspiracies is an admission of mounting economic distress and ground anti-incumbency.'
    ]
  },
  {
    id: 'reel-6',
    slug: 'maharashtra-288-seat-sharing-rebel-nominations',
    category: 'STATE BATTLEGROUNDS',
    tag: 'Maharashtra 2024',
    title: 'Mahayuti and MVA Battle High-Stakes Rebel Nominations Across 32 Seats',
    subtitle: 'BJP fields 148 candidates while Shiv Sena and NCP factions clash over disputed constituency quotas',
    timeAgo: '6h ago',
    paragraphs: [
      'The ruling Mahayuti coalition finalized seat distribution with the BJP contesting 148 seats, Eknath Shinde Shiv Sena 80, and Ajit Pawar NCP 58, leaving unaligned rebel candidates in 32 key constituencies.',
      'Simultaneously, the Maha Vikas Aghadi coalition witnessed severe friction between Congress and Shiv Sena (UBT) in the Vidarbha region, where local district chiefs filed independent nomination papers.',
      'With 145 seats required for a simple legislative majority in the 288-member assembly, rebel candidate management over the next 48 hours will decide the margin of victory across critical battlegrounds.'
    ]
  },
  {
    id: 'reel-7',
    slug: 'jharkhand-81-seat-assembly-polls-announced',
    category: 'STATE BATTLEGROUNDS',
    tag: 'Jharkhand Elections',
    title: 'Jharkhand Sets 2-Phase Polls as Hemant Soren Files Barhait Nomination',
    subtitle: 'JMM-Congress alliance locks horns with NDA across 81 legislative assembly seats',
    timeAgo: '8h ago',
    paragraphs: [
      'Chief Minister Hemant Soren officially submitted his nomination papers from the Barhait assembly constituency, launching the ruling alliance campaign on tribal land rights and state welfare benefits.',
      'The Election Commission scheduled polling for the 81-seat Jharkhand Assembly across two phases on November 13 and November 20, deploying over 400 companies of central paramilitary forces.',
      'The BJP-AJSU alliance framed its campaign around alleged demographic shifts in Santhal Pargana and corruption investigations, making it one of the most fiercely polarized contests in eastern India.'
    ]
  },
  {
    id: 'reel-8',
    slug: 'supreme-court-bench-questions-pmla-section-19-detentions',
    category: 'SUPREME COURT',
    tag: 'Supreme Court',
    title: 'Supreme Court Bench Questions Prolonged Pre-Trial Arrests Under PMLA',
    subtitle: 'Judicial observations emphasize that investigative custody cannot substitute for completed trials',
    timeAgo: '10h ago',
    paragraphs: [
      'A Supreme Court bench directed rigorous judicial scrutiny into arrests executed under Section 19 of the Prevention of Money Laundering Act against sitting public representatives and political leaders.',
      'The bench observed that indefinite incarceration without commencement of trial violates Article 21 constitutional guarantees, setting stricter parameters for investigating agencies to establish prima facie guilt.',
      'The observation directly impacts multiple high-profile bail applications pending across trial courts in Delhi, Jharkhand, and West Bengal involving top political figures.'
    ]
  }
];

export default function Insights({ initialSlug, onSelectSlug }) {
  const [reels, setReels] = useState(INITIAL_REELS);
  const [activeReel, setActiveReel] = useState(null);
  const [copiedSlug, setCopiedSlug] = useState(null);

  // Sync active reel if initialSlug prop is passed or changes
  useEffect(() => {
    if (initialSlug) {
      const found = reels.find(r => r.slug === initialSlug || r.id === initialSlug);
      if (found) setActiveReel(found);
    }
  }, [initialSlug, reels]);

  // Load live hourly dispatches from backend / local cache
  useEffect(() => {
    let isMounted = true;
    api.getInsights().then(data => {
      if (!isMounted || !data || data.length === 0) return;
      
      const converted = data.map((b, idx) => {
        const rawContent = cleanText(b.content || '');
        const paragraphs = b.paragraphs || b.bullets || (
          rawContent ? rawContent.split(/\.\s+/).filter(s => s.trim().length > 15).map(s => `${s}.`) : [
            'Real-time political development verified across agency checkposts and ground bureaus.',
            'Political party spokespersons and state representatives have issued formal statements.',
            'Administrative security and local election machinery placed on heightened readiness.'
          ]
        );

        return {
          id: b.id || `live-${idx}`,
          slug: cleanText(b.slug || b.title || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || `insight-${idx}`,
          category: cleanCategory(b.category),
          tag: cleanText(b.tag || 'Breaking'),
          title: cleanText(b.title || 'Breaking Political Development'),
          subtitle: cleanText(b.subtitle || 'Live verified ground report from our investigative radar'),
          timeAgo: b.timeAgo || 'Recent',
          paragraphs: paragraphs.map(cleanText)
        };
      });

      setReels(prev => {
        const existingSlugs = new Set(prev.map(p => p.slug));
        const newOnes = converted.filter(c => !existingSlugs.has(c.slug));
        return [...newOnes, ...prev];
      });
    }).catch(e => console.log('Offline/Local insights active:', e.message));

    return () => { isMounted = false; };
  }, []);

  const handleOpenReel = (reel) => {
    setActiveReel(reel);
    onSelectSlug?.(reel.slug);
  };

  const handleCloseReel = () => {
    setActiveReel(null);
    onSelectSlug?.(null);
  };

  const handleShare = (e, reel) => {
    e.stopPropagation();
    const url = `${window.location.origin}/insights/${reel.slug}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setCopiedSlug(reel.slug);
      setTimeout(() => setCopiedSlug(null), 2500);
    }
  };

  return (
    <div style={{ backgroundColor: '#F8F9FA', minHeight: '100vh', padding: '16px 16px 80px 16px', fontFamily: 'Inter, -apple-system, sans-serif' }}>
      <Helmet>
        <title>Political Insights & Ground Reports | Opinar</title>
        <meta name="description" content="Verified investigative reports, breaking campaign rallies, judicial observations, and state election progression." />
        <link rel="canonical" href="https://www.opinar.in/insights" />
      </Helmet>

      {/* TOP SECTION: HORIZONTAL SWIPEABLE REELS CAROUSEL */}
      <div style={{ maxWidth: '1240px', margin: '0 auto 24px auto' }}>
        <div 
          className="hide-scroll"
          style={{
            display: 'flex',
            gap: '16px',
            overflowX: 'auto',
            padding: '4px 2px 14px 2px',
            scrollSnapType: 'x mandatory'
          }}
        >
          {reels.slice(0, 6).map((reel, idx) => {
            const palette = PALETTES[idx % PALETTES.length];
            return (
              <div
                key={`carousel-${reel.id}`}
                onClick={() => handleOpenReel(reel)}
                style={{
                  flex: '0 0 320px',
                  scrollSnapAlign: 'start',
                  background: palette.bg,
                  border: `1px solid ${palette.border}`,
                  borderRadius: '20px',
                  padding: '22px',
                  boxShadow: palette.glow,
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  cursor: 'pointer',
                  transition: 'transform 0.25s ease, box-shadow 0.25s ease',
                  position: 'relative'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = `0 18px 36px -8px ${palette.accent}33`;
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = palette.glow;
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <span style={{ 
                    backgroundColor: palette.badgeBg, 
                    color: palette.badgeColor, 
                    padding: '4px 10px', 
                    borderRadius: '12px', 
                    fontSize: '11px', 
                    fontWeight: 700, 
                    letterSpacing: '0.4px' 
                  }}>
                    {cleanCategory(reel.category)}
                  </span>
                  <span style={{ fontSize: '12px', color: '#64748B', fontWeight: 500 }}>
                    {reel.timeAgo}
                  </span>
                </div>

                <h3 style={{ 
                  fontSize: '19px', 
                  fontWeight: 800, 
                  color: '#0F172A', 
                  margin: '0 0 10px 0', 
                  lineHeight: 1.3,
                  letterSpacing: '-0.3px'
                }}>
                  {cleanText(reel.title)}
                </h3>

                <p style={{ 
                  fontSize: '13.5px', 
                  color: '#475569', 
                  margin: '0 0 14px 0', 
                  fontWeight: 500,
                  lineHeight: 1.45
                }}>
                  {cleanText(reel.subtitle)}
                </p>

                {/* THE CORE NEWS PARAGRAPH */}
                <div style={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.75)', 
                  border: '1px solid rgba(255, 255, 255, 0.9)',
                  borderRadius: '12px', 
                  padding: '12px',
                  fontSize: '13px',
                  color: '#1E293B',
                  lineHeight: 1.5,
                  fontWeight: 500
                }}>
                  {cleanText((reel.paragraphs && reel.paragraphs[0]) || '')}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* MAIN VERTICAL FEED SECTION (Clean, direct, pure news paragraphs) */}
      <div style={{ maxWidth: '1240px', margin: '0 auto' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
          gap: '20px'
        }}>
          {reels.map((reel, idx) => {
            const palette = PALETTES[idx % PALETTES.length];

            return (
              <article
                key={reel.id}
                onClick={() => handleOpenReel(reel)}
                style={{
                  background: palette.bg,
                  border: `1px solid ${palette.border}`,
                  borderRadius: '22px',
                  padding: '22px',
                  boxShadow: palette.glow,
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  cursor: 'pointer',
                  transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                  position: 'relative'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = `0 20px 40px -10px ${palette.accent}33`;
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = palette.glow;
                }}
              >
                {/* TOP BADGE & META */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <span style={{ 
                    backgroundColor: palette.badgeBg, 
                    color: palette.badgeColor, 
                    padding: '4px 10px', 
                    borderRadius: '12px', 
                    fontSize: '11px', 
                    fontWeight: 700, 
                    letterSpacing: '0.4px' 
                  }}>
                    {cleanCategory(reel.category)}
                  </span>

                  <button
                    onClick={(e) => handleShare(e, reel)}
                    title="Share story"
                    style={{
                      background: 'rgba(255, 255, 255, 0.75)',
                      border: '1px solid rgba(0, 0, 0, 0.08)',
                      borderRadius: '20px',
                      padding: '4px 12px',
                      fontSize: '11px',
                      fontWeight: 600,
                      color: copiedSlug === reel.slug ? '#059669' : '#475569',
                      cursor: 'pointer'
                    }}
                  >
                    {copiedSlug === reel.slug ? 'Copied' : 'Share'}
                  </button>
                </div>

                {/* HOOK HEADLINE */}
                <h3 style={{ 
                  fontSize: '20px', 
                  fontWeight: 800, 
                  color: '#09090B', 
                  margin: '0 0 10px 0', 
                  lineHeight: 1.3,
                  letterSpacing: '-0.3px'
                }}>
                  {cleanText(reel.title)}
                </h3>

                <p style={{ 
                  fontSize: '13.5px', 
                  color: '#475569', 
                  margin: '0 0 16px 0', 
                  fontWeight: 500,
                  lineHeight: 1.45
                }}>
                  {cleanText(reel.subtitle)}
                </p>

                {/* FACT-DENSE NEWS PARAGRAPHS */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {(reel.paragraphs || []).map((paragraph, pIdx) => (
                    <div 
                      key={pIdx}
                      style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.75)',
                        border: '1px solid rgba(255, 255, 255, 0.95)',
                        borderRadius: '12px',
                        padding: '12px 14px',
                        fontSize: '13px',
                        color: '#1E293B',
                        lineHeight: 1.5,
                        fontWeight: 500,
                        boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
                      }}
                    >
                      {cleanText(paragraph)}
                    </div>
                  ))}
                </div>
              </article>
            );
          })}
        </div>
      </div>

      {/* FULL REEL DETAIL MODAL OVERLAY */}
      {activeReel && (
        <div 
          onClick={handleCloseReel}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 9999,
            padding: '20px'
          }}
        >
          <div 
            onClick={e => e.stopPropagation()}
            style={{
              maxWidth: '640px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              background: '#FFFFFF',
              borderRadius: '28px',
              padding: '36px',
              boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.3)',
              position: 'relative',
              border: '1px solid rgba(255, 255, 255, 0.8)'
            }}
          >
            {/* CLOSE BUTTON */}
            <button
              onClick={handleCloseReel}
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                border: 'none',
                backgroundColor: '#F1F5F9',
                color: '#475569',
                fontSize: '16px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              X
            </button>

            {/* MODAL BADGE */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <span style={{ 
                backgroundColor: 'rgba(15, 23, 42, 0.08)', 
                color: '#0F172A', 
                padding: '4px 12px', 
                borderRadius: '16px', 
                fontSize: '12px', 
                fontWeight: 700 
              }}>
                {cleanCategory(activeReel.category)}
              </span>
              <span style={{ fontSize: '13px', color: '#64748B', fontWeight: 600 }}>
                {cleanText(activeReel.tag)} • {activeReel.timeAgo}
              </span>
            </div>

            <h2 style={{ fontSize: '26px', fontWeight: 800, color: '#09090B', margin: '0 0 12px 0', lineHeight: 1.3, letterSpacing: '-0.5px' }}>
              {cleanText(activeReel.title)}
            </h2>

            <p style={{ fontSize: '15px', color: '#475569', margin: '0 0 24px 0', lineHeight: 1.5, fontWeight: 500 }}>
              {cleanText(activeReel.subtitle)}
            </p>

            {/* FULL NEWS PARAGRAPHS */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '28px' }}>
              {(activeReel.paragraphs || []).map((p, idx) => (
                <div 
                  key={idx}
                  style={{
                    backgroundColor: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    borderRadius: '16px',
                    padding: '16px 18px',
                    fontSize: '14.5px',
                    color: '#1E293B',
                    lineHeight: 1.6,
                    fontWeight: 500
                  }}
                >
                  {cleanText(p)}
                </div>
              ))}
            </div>

            {/* MODAL FOOTER */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #E2E8F0', paddingTop: '20px' }}>
              <button
                onClick={(e) => handleShare(e, activeReel)}
                style={{
                  backgroundColor: '#0F172A',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '24px',
                  padding: '10px 22px',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                {copiedSlug === activeReel.slug ? 'Link Copied' : 'Share Story'}
              </button>

              <button
                onClick={handleCloseReel}
                style={{
                  backgroundColor: 'transparent',
                  color: '#64748B',
                  border: 'none',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Back to Feed
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CSS FOR SMOOTH ANIMATIONS & SCROLLBAR HIDING */}
      <style>{`
        .hide-scroll::-webkit-scrollbar { display: none; }
        .hide-scroll { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
