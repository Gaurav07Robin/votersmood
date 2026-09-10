import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';

export default function ConstituencyResult({ year, stateSlug, constituencySlug, onBack }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchResult() {
      try {
        const docId = `LS_${year}_${stateSlug}_${constituencySlug}`;
        const ref = doc(db, 'elections_constituencies', docId);
        const snapshot = await getDoc(ref);
        if (snapshot.exists()) {
          setData(snapshot.data());
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

  return (
    <div className="container" style={{ padding: '40px 0' }}>
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
