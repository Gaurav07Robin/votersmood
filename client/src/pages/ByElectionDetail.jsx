import React from 'react';
import { Helmet } from 'react-helmet-async';
import { getByElectionBySlugs, BY_ELECTIONS_DATA } from '../data/by_elections_data';
import { getPartyColor, getPartySymbol } from '../utils/party_utils';
import ArrowLeft from 'lucide-react/dist/esm/icons/arrow-left';
import Trophy from 'lucide-react/dist/esm/icons/trophy';
import Calendar from 'lucide-react/dist/esm/icons/calendar';
import CheckCircle2 from 'lucide-react/dist/esm/icons/check-circle-2';
import Share2 from 'lucide-react/dist/esm/icons/share-2';
import MapPin from 'lucide-react/dist/esm/icons/map-pin';
import Vote from 'lucide-react/dist/esm/icons/vote';
import HelpCircle from 'lucide-react/dist/esm/icons/help-circle';

export default function ByElectionDetail({ stateSlug, constituencySlug, onBack }) {
  const item = getByElectionBySlugs(stateSlug, constituencySlug) || BY_ELECTIONS_DATA[0];

  const canonicalUrl = `https://www.opinar.in/by-elections/${item.stateSlug}/${item.constituencySlug}`;
  const isResult = item.status === 'RESULT' && item.result;
  const partyColor = isResult ? getPartyColor(item.result.party) : '#3B82F6';
  const partySymbol = isResult ? getPartySymbol(item.result.party) : '';

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: item.seo?.title || `${item.constituency} By-Election Result`,
        text: item.seo?.description || `Check out ${item.constituency} by-election result on Opinar`,
        url: window.location.href
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  // Structured Data Schema for Google Rich Snippets
  const faqSchema = item.seo?.faq ? {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": item.seo.faq.map(f => ({
      "@type": "Question",
      "name": f.q,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": f.a
      }
    }))
  } : null;

  const eventSchema = {
    "@context": "https://schema.org",
    "@type": "Event",
    "name": `${item.constituency} ${item.level} By-Election`,
    "startDate": item.date || "2024-11-13",
    "eventStatus": isResult ? "https://schema.org/EventCompleted" : "https://schema.org/EventScheduled",
    "location": {
      "@type": "Place",
      "name": `${item.constituency} Constituency`,
      "address": {
        "@type": "PostalAddress",
        "addressRegion": item.state,
        "addressCountry": "IN"
      }
    },
    "organizer": {
      "@type": "Organization",
      "name": "Election Commission of India",
      "url": "https://eci.gov.in"
    }
  };

  return (
    <div style={{ backgroundColor: '#18181B', minHeight: '100vh', color: '#E4E4E7', padding: '24px', fontFamily: 'Inter, sans-serif' }}>
      
      {/* HIGH-INTENT SEO HEAD METADATA */}
      <Helmet>
        <title>{item.seo?.title || `${item.constituency} By-Election Result | Opinar`}</title>
        <meta name="description" content={item.seo?.description || `Track official ${item.constituency} by-election results, winner, margin and party stats.`} />
        <meta name="keywords" content={(item.seo?.keywords || []).join(', ')} />
        <link rel="canonical" href={canonicalUrl} />
        
        {/* OpenGraph & Social Sharing Tags */}
        <meta property="og:title" content={item.seo?.title || `${item.constituency} By-Election Result`} />
        <meta property="og:description" content={item.seo?.description || `Explore ${item.constituency} by-election result and statistics.`} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:type" content="article" />
        <meta property="og:site_name" content="Opinar - JanMat Gazette" />
        
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={item.seo?.title} />
        <meta name="twitter:description" content={item.seo?.description} />

        {/* Google FAQ and Event Schema */}
        {faqSchema && (
          <script type="application/ld+json">
            {JSON.stringify(faqSchema)}
          </script>
        )}
        <script type="application/ld+json">
          {JSON.stringify(eventSchema)}
        </script>
      </Helmet>

      <div style={{ maxWidth: '860px', margin: '0 auto' }}>
        
        {/* TOP BAR / BREADCRUMB */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <button 
            onClick={onBack}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: '#27272A',
              color: '#FFFFFF',
              border: '1px solid #3F3F46',
              borderRadius: '8px',
              padding: '8px 14px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'background-color 0.15s'
            }}
          >
            <ArrowLeft size={16} /> Back to By-Elections
          </button>

          <button
            onClick={handleShare}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#27272A',
              color: '#A1A1AA',
              border: '1px solid #3F3F46',
              borderRadius: '8px',
              padding: '8px 14px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <Share2 size={15} /> Share Result
          </button>
        </div>

        {/* HEADER SECTION */}
        <div style={{ backgroundColor: '#27272A', borderRadius: '14px', padding: '24px 28px', border: '1px solid #3F3F46', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <span style={{
              fontSize: '11px',
              fontWeight: 800,
              color: item.type === 'LOK_SABHA' ? '#60A5FA' : '#FBBF24',
              backgroundColor: '#18181B',
              padding: '3px 8px',
              borderRadius: '4px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              {item.level}
            </span>

            {isResult ? (
              <span style={{
                fontSize: '11px',
                fontWeight: 700,
                color: '#10B981',
                backgroundColor: '#10B98115',
                padding: '3px 8px',
                borderRadius: '4px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <CheckCircle2 size={12} color="#10B981" /> Official ECI Result Declared
              </span>
            ) : (
              <span style={{
                fontSize: '11px',
                fontWeight: 600,
                color: '#9CA3AF',
                backgroundColor: '#18181B',
                padding: '3px 8px',
                borderRadius: '4px'
              }}>
                📅 Scheduled / Upcoming
              </span>
            )}
          </div>

          <h1 style={{ fontSize: '32px', fontWeight: 800, color: '#FFFFFF', margin: '0 0 8px 0', letterSpacing: '-0.5px' }}>
            {item.constituency} By-Election Result
          </h1>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '14px', color: '#A1A1AA', flexWrap: 'wrap' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
              <MapPin size={15} color="#3B82F6" /> {item.state}
            </span>
            <span>•</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
              <Calendar size={15} color="#71717A" /> {item.date}
            </span>
            {item.turnout && (
              <>
                <span>•</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                  <Vote size={15} color="#10B981" /> Turnout: {item.turnout}
                </span>
              </>
            )}
          </div>

          {item.reason && (
            <div style={{ marginTop: '14px', fontSize: '13px', color: '#D4D4D8', backgroundColor: '#18181B', padding: '10px 14px', borderRadius: '8px', border: '1px solid #3F3F46' }}>
              <strong>Trigger Context:</strong> {item.reason}
            </div>
          )}
        </div>

        {/* RESULTS SECTION */}
        {isResult && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            
            {/* WINNER SPOTLIGHT */}
            <div style={{
              backgroundColor: '#27272A',
              borderRadius: '12px',
              padding: '20px',
              border: `1px solid ${partyColor}60`,
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 800, color: '#F59E0B', textTransform: 'uppercase' }}>
                  <Trophy size={16} color="#F59E0B" /> Winner
                </span>
                <span style={{
                  fontSize: '12px',
                  fontWeight: 800,
                  color: partyColor,
                  backgroundColor: `${partyColor}20`,
                  padding: '3px 8px',
                  borderRadius: '4px'
                }}>
                  {partySymbol} {item.result.party}
                </span>
              </div>

              <div style={{ fontSize: '20px', fontWeight: 800, color: '#FFFFFF', marginBottom: '4px' }}>
                {item.result.winner}
              </div>

              <div style={{ fontSize: '14px', fontWeight: 700, color: '#10B981', marginTop: '4px' }}>
                Won by {item.result.margin}
              </div>

              {item.result.votes && (
                <div style={{ fontSize: '12px', color: '#A1A1AA', marginTop: '6px' }}>
                  Total Votes Polled: <strong>{item.result.votes}</strong>
                </div>
              )}
            </div>

            {/* RUNNER UP */}
            {item.result.runnerUp && (
              <div style={{
                backgroundColor: '#27272A',
                borderRadius: '12px',
                padding: '20px',
                border: '1px solid #3F3F46'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#71717A', textTransform: 'uppercase' }}>
                    Runner-Up
                  </span>
                  <span style={{
                    fontSize: '12px',
                    fontWeight: 700,
                    color: '#A1A1AA',
                    backgroundColor: '#18181B',
                    padding: '3px 8px',
                    borderRadius: '4px'
                  }}>
                    {item.result.runnerUpParty}
                  </span>
                </div>

                <div style={{ fontSize: '18px', fontWeight: 700, color: '#D4D4D8', marginBottom: '4px' }}>
                  {item.result.runnerUp}
                </div>

                {item.result.runnerUpVotes && (
                  <div style={{ fontSize: '12px', color: '#A1A1AA', marginTop: '6px' }}>
                    Total Votes Polled: <strong>{item.result.runnerUpVotes}</strong>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* SEO FAQ SECTION (Google SERP Goldmine) */}
        {item.seo?.faq && item.seo.faq.length > 0 && (
          <div style={{ backgroundColor: '#27272A', borderRadius: '12px', padding: '24px', border: '1px solid #3F3F46', marginBottom: '24px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#FFFFFF', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <HelpCircle size={18} color="#3B82F6" /> Frequently Asked Questions ({item.constituency} By-Election)
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {item.seo.faq.map((f, i) => (
                <div key={i} style={{ backgroundColor: '#18181B', borderRadius: '8px', padding: '14px 16px', border: '1px solid #3F3F46' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#FFFFFF', margin: '0 0 6px 0' }}>
                    {f.q}
                  </h3>
                  <p style={{ fontSize: '13px', color: '#A1A1AA', margin: 0, lineHeight: 1.5 }}>
                    {f.a}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SEO KEYWORDS & TAGS CLOUD */}
        {item.seo?.tags && (
          <div style={{ padding: '16px 0', borderTop: '1px solid #27272A', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '12px', color: '#71717A', fontWeight: 600 }}>Related Topics:</span>
            {item.seo.tags.map((t, idx) => (
              <span key={idx} style={{
                fontSize: '11px',
                fontWeight: 600,
                color: '#3B82F6',
                backgroundColor: '#3B82F615',
                padding: '3px 8px',
                borderRadius: '12px'
              }}>
                {t}
              </span>
            ))}
          </div>
        )}

      </div>

    </div>
  );
}
