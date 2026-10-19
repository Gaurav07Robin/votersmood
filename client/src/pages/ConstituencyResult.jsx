import { Helmet } from 'react-helmet-async';
import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';

export default function ConstituencyResult({ year, stateSlug, constituencySlug, onBack }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchResult() {
      try {
        // Try LS ID, then state archive ID, then ASSEMBLY ID
        const possibleIds = [
          `LS_${year}_${stateSlug}_${constituencySlug}`,
          `${stateSlug}_${year}_${constituencySlug}`,
          `ASSEMBLY_${stateSlug}_${year}_${constituencySlug}`
        ];
        for (const id of possibleIds) {
          const ref = doc(db, 'elections_constituencies', id);
          const snapshot = await getDoc(ref);
          if (snapshot.exists()) {
            setData(snapshot.data());
            break;
          }
        }
      } catch (error) {
        console.error("Error fetching constituency:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchResult();
  }, [year, stateSlug, constituencySlug]);

  if (loading) {
    return <div className="container" style={{ padding: '40px 0', color: 'var(--text-muted)' }}>Loading results...</div>;
  }

  if (!data) {
    return <div className="container" style={{ padding: '40px 0', color: 'var(--text-muted)' }}>Result not found.</div>;
  }

  const winner = data.candidates?.[0];
  const runnerUp = data.candidates?.[1];
  const canonicalUrl = `https://www.opinar.in/elections/state/${stateSlug}/${year}/${constituencySlug}`;
  const seoTitle = `${data.constituency} Election Result ${year} (${data.state}): ${winner ? winner.name + ' (' + winner.party + ')' : 'Winner'}, Margin & Vote Share | Opinar`;
  const seoDescription = `${winner ? winner.name + ' (' + winner.party + ')' : 'Candidate'} won the ${data.constituency} (${data.state}) election in ${year} by ${data.margin ? data.margin.toLocaleString() : 'declared'} votes against ${runnerUp ? runnerUp.name + ' (' + runnerUp.party + ')' : 'runner-up'}. Complete candidate returns and vote breakdown on Opinar.`;

  const constituencyFaqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": `Who won the ${data.constituency} election in ${year}?`,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": `${winner ? winner.name : 'The winning candidate'} representing ${winner ? winner.party : 'their party'} won ${data.constituency} in the ${year} election with ${winner?.votes?.toLocaleString() || 0} votes (${winner?.percentage || 0}% vote share).`
        }
      },
      {
        "@type": "Question",
        "name": `What was the victory margin in ${data.constituency} in ${year}?`,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": `The victory margin in ${data.constituency} was ${data.margin ? data.margin.toLocaleString() + ' votes' : 'declared by the returning officer'} against runner-up ${runnerUp ? runnerUp.name + ' (' + runnerUp.party + ')' : 'opponent'}.`
        }
      },
      {
        "@type": "Question",
        "name": `How many total votes were polled in ${data.constituency} in ${year}?`,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": `A total of ${data.total_votes ? data.total_votes.toLocaleString() : 'thousands of'} votes were cast across all contesting candidates in ${data.constituency}.`
        }
      }
    ]
  };

  return (
    <div className="container" style={{ padding: '40px 0' }}>

      <Helmet>
        <title>{seoTitle}</title>
        <meta name="description" content={seoDescription} />
        <meta name="keywords" content={`${data.constituency} election result ${year}, who won ${data.constituency}, ${winner?.name || ''} margin, ${data.constituency} mla election, ${data.state} election results, ${winner?.party || ''} vs ${runnerUp?.party || ''}`} />
        <link rel="canonical" href={canonicalUrl} />

        <meta property="og:title" content={seoTitle} />
        <meta property="og:description" content={seoDescription} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:type" content="article" />

        <script type="application/ld+json">
          {JSON.stringify(constituencyFaqSchema)}
        </script>
      </Helmet>

      <button 
        onClick={onBack}
        style={{ background: 'transparent', border: 'none', color: 'var(--accent-primary)', cursor: 'pointer', marginBottom: '24px', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}
      >
        ← Back to {year} Results
      </button>

      <div style={{ marginBottom: '40px' }}>
        <div style={{ color: 'var(--text-muted)', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>
          Lok Sabha {year} • {data.state}
        </div>
        <h1 style={{ fontSize: '36px', margin: '0 0 16px 0', color: 'var(--text-primary)' }}>
          {data.constituency}
        </h1>
        <div style={{ display: 'flex', gap: '24px', color: 'var(--text-muted)', fontSize: '16px' }}>
          <div>Total Votes: <strong style={{ color: 'var(--text-primary)' }}>{data.total_votes?.toLocaleString()}</strong></div>
          <div>Winning Margin: <strong style={{ color: 'var(--text-primary)' }}>{data.margin?.toLocaleString()}</strong></div>
        </div>
      </div>

      <div className="card" style={{ padding: '0', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ backgroundColor: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)' }}>
            <tr>
              <th style={{ padding: '16px 24px', color: 'var(--text-muted)', fontWeight: '600' }}>Position</th>
              <th style={{ padding: '16px 24px', color: 'var(--text-muted)', fontWeight: '600' }}>Candidate</th>
              <th style={{ padding: '16px 24px', color: 'var(--text-muted)', fontWeight: '600' }}>Party</th>
              <th style={{ padding: '16px 24px', color: 'var(--text-muted)', fontWeight: '600', textAlign: 'right' }}>Votes</th>
              <th style={{ padding: '16px 24px', color: 'var(--text-muted)', fontWeight: '600', textAlign: 'right' }}>Vote Share</th>
            </tr>
          </thead>
          <tbody>
            {data.candidates?.map((c, idx) => (
              <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '16px 24px', color: c.position === 1 ? 'var(--accent-primary)' : 'var(--text-primary)', fontWeight: c.position === 1 ? 'bold' : 'normal' }}>
                  {c.position === 1 ? '🏆 1st (Winner)' : `${c.position}${c.position === 2 ? 'nd' : c.position === 3 ? 'rd' : 'th'}`}
                </td>
                <td style={{ padding: '16px 24px', color: 'var(--text-primary)', fontWeight: c.position === 1 ? 'bold' : 'normal' }}>
                  {c.name}
                </td>
                <td style={{ padding: '16px 24px', color: 'var(--text-muted)' }}>{c.party}</td>
                <td style={{ padding: '16px 24px', color: 'var(--text-primary)', textAlign: 'right' }}>
                  {c.votes?.toLocaleString()}
                </td>
                <td style={{ padding: '16px 24px', color: 'var(--text-primary)', textAlign: 'right' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                    <span>{c.percentage}%</span>
                    <div style={{ width: '60px', height: '6px', background: 'var(--bg-secondary)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${c.percentage}%`, background: c.position === 1 ? 'var(--accent-primary)' : '#888' }} />
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
