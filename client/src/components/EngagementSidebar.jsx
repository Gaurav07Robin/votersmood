import React, { useState, useEffect } from 'react';
import { api } from '../api/client';

const TARGET_SCOPES = [
  { value: 'mh2024', label: 'Maharashtra 2024 Assembly Elections' },
  { value: 'delhi2025', label: 'Delhi 2025 Assembly Elections' },
  { value: 'bihar2025', label: 'Bihar 2025 Assembly Elections' },
  { value: 'wb2026', label: 'West Bengal 2026 Assembly Elections' },
  { value: 'up2027', label: 'Uttar Pradesh 2027 Assembly Elections' },
  { value: 'central', label: 'Central Government Administration' }
];

export default function EngagementSidebar() {
  const [trending, setTrending] = useState([]);

  useEffect(() => {
    api.getCommunityPolls().then(data => {
      const pollsList = Array.isArray(data) ? data : (data?.polls || []);
      const counts = {};
      pollsList.forEach(p => {
        if (p.targetElection) {
          counts[p.targetElection] = (counts[p.targetElection] || 0) + 1;
        }
      });
      
      const sorted = Object.entries(counts).sort((a,b) => b[1] - a[1]).slice(0, 5);
      setTrending(sorted);
    }).catch(console.error);
  }, []);

  const getLabel = (val) => {
    const found = TARGET_SCOPES.find(s => s.value === val);
    return found ? found.label : val;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div className="gazette-card" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '18px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
            📈 Trending Polls
          </h3>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {trending.length > 0 ? trending.map(([election, count], idx) => (
            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '12px', borderBottom: idx !== trending.length - 1 ? '1px solid #F1F5F9' : 'none' }}>
              <span style={{ fontFamily: 'var(--font-sans)', fontSize: '13px', fontWeight: 600, color: '#0369A1', wordBreak: 'break-word', display: 'inline-block', lineHeight: 1.3, paddingRight: '12px' }}>
                {getLabel(election)}
              </span>
              <span className="badge badge-trending" style={{ fontSize: '10px', flexShrink: 0 }}>
                {count} POLLS
              </span>
            </div>
          )) : (
            <div style={{ fontSize: '13px', color: '#94A3B8' }}>No polls trending yet.</div>
          )}
        </div>
      </div>
    </div>
  );
}
