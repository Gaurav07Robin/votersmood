import { Helmet } from 'react-helmet-async';
import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import Search from 'lucide-react/dist/esm/icons/search';
import ArrowRight from 'lucide-react/dist/esm/icons/arrow-right';
import ArrowLeft from 'lucide-react/dist/esm/icons/arrow-left';
import LayoutGrid from 'lucide-react/dist/esm/icons/layout-grid';
import List from 'lucide-react/dist/esm/icons/list';
import Moon from 'lucide-react/dist/esm/icons/moon';
import Sun from 'lucide-react/dist/esm/icons/sun';
import { getPartyColor, getPartySymbol } from '../utils/party_utils';

const slugify = (text) => text.toString().toLowerCase().trim()
  .replace(/\s+/g, '-')
  .replace(/[^\w\-]+/g, '')
  .replace(/\-\-+/g, '-');

export default function ElectionYearDetail({ year, isLS = true, state = null, onBack, onSelectConstituency }) {
  const [constituencies, setConstituencies] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filter States
  const [selectedState, setSelectedState] = useState(state || 'All');
  const [selectedParty, setSelectedParty] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // UI States
  const [viewMode, setViewMode] = useState('grid');
  const [theme, setTheme] = useState('dark');

  const scrollRef = React.useRef(null);

  useEffect(() => {
    if (state) {
      setSelectedState(state);
    }
  }, [state]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      const onWheel = (e) => {
        if (e.deltaY === 0) return;
        const isAtLeft = el.scrollLeft === 0;
        const isAtRight = el.scrollLeft + el.clientWidth >= el.scrollWidth - 1;
        if (e.deltaY > 0 && isAtRight) return;
        if (e.deltaY < 0 && isAtLeft) return;
        e.preventDefault();
        el.scrollLeft += e.deltaY;
      };
      el.addEventListener('wheel', onWheel, { passive: false });
      return () => el.removeEventListener('wheel', onWheel);
    }
  }, [loading]);

  const t = {
    bg: theme === 'dark' ? '#18181B' : '#F8FAFC',
    cardBg: theme === 'dark' ? '#27272A' : '#FFFFFF',
    text: theme === 'dark' ? '#FFFFFF' : '#0F172A',
    subText: theme === 'dark' ? '#A1A1AA' : '#64748B',
    border: theme === 'dark' ? '#3F3F46' : '#E2E8F0',
    hover: theme === 'dark' ? '#3F3F46' : '#F1F5F9',
    inputBg: theme === 'dark' ? '#27272A' : '#FFFFFF',
    pillBg: theme === 'dark' ? 'transparent' : '#FFFFFF',
    emptyPill: theme === 'dark' ? '#52525B' : '#CBD5E1'
  };

  useEffect(() => {
    async function fetchData() {
      try {
        const q = query(collection(db, 'elections_constituencies'), where('year', '==', parseInt(year)));
        const snapshot = await getDocs(q);
        let data = snapshot.docs.map(doc => {
          const d = doc.data();
          const winnerName = d.winner || d.candidates?.[0]?.name || 'Unknown';
          const winnerParty = d.party || d.candidates?.[0]?.party || 'IND';
          return {
            ...d,
            id: doc.id,
            constituency: d.constituency || doc.id.split('_').slice(-1)[0].replace(/-/g, ' ').toUpperCase(),
            state: (d.state || '').replace(/_/g, ' ').trim(),
            winner: winnerName,
            party: winnerParty,
            candidates: d.candidates && d.candidates.length > 0 ? d.candidates : [
              { name: winnerName, party: winnerParty, position: 1, votes: d.votes || 0 }
            ]
          };
        });

        // CRITICAL: If this is a State Assembly election, strictly filter for this state's assembly seats!
        if (!isLS && state) {
          const cleanTarget = state.replace(/_/g, ' ').trim().toLowerCase();
          data = data.filter(c => c.state.replace(/_/g, ' ').trim().toLowerCase() === cleanTarget);
        }

        data.sort((a, b) => a.constituency.localeCompare(b.constituency));
        setConstituencies(data);
      } catch (error) {
        console.error("Error fetching constituencies:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [year, isLS, state]);

  // States list (used only when viewing national Lok Sabha elections)
  const states = useMemo(() => {
    const set = new Set(constituencies.map(c => c.state).filter(Boolean));
    return ['All', ...Array.from(set).sort()];
  }, [constituencies]);

  // Scoped constituencies:
  // For Lok Sabha: respects selectedState if not 'All'
  // For State Assembly: all constituencies are already scoped to the target state
  const scopedConstituencies = useMemo(() => {
    if (!isLS || selectedState === 'All') return constituencies;
    const cleanTarget = selectedState.replace(/_/g, ' ').trim().toLowerCase();
    return constituencies.filter(c => c.state.replace(/_/g, ' ').trim().toLowerCase() === cleanTarget);
  }, [constituencies, selectedState, isLS]);

  // Dynamic party counts based on scoped constituencies
  const parties = useMemo(() => {
    const counts = {};
    scopedConstituencies.forEach(c => {
      const p = c.party || c.candidates?.[0]?.party;
      if (p) counts[p] = (counts[p] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [scopedConstituencies]);

  // Reset selected party when selected state changes
  useEffect(() => {
    setSelectedParty('All');
  }, [selectedState]);

  // Filter by party and search query
  const filtered = useMemo(() => {
    return scopedConstituencies.filter(c => {
      const party = c.party || c.candidates?.[0]?.party;
      const matchParty = selectedParty === 'All' || party === selectedParty;
      const matchSearch = (c.constituency || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (c.winner || c.candidates?.[0]?.name || '').toLowerCase().includes(searchQuery.toLowerCase());
      return matchParty && matchSearch;
    });
  }, [scopedConstituencies, selectedParty, searchQuery]);

  const activeTitle = isLS ? `Lok Sabha ${year}` : `${state || selectedState} Assembly ${year}`;

  return (
    <div style={{ backgroundColor: t.bg, minHeight: '100vh', color: t.text, padding: '24px', fontFamily: 'Inter, sans-serif', transition: 'background-color 0.2s ease, color 0.2s ease' }}>

      <Helmet>
        <title>{`${activeTitle} | Opinar`}</title>
        <meta name="description" content="View full assembly election results, party vote shares, and winning MLAs." />
      </Helmet>

      {/* HEADER WITH CONTROLS */}
      <div style={{ maxWidth: '1400px', margin: '0 auto', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <button 
            onClick={onBack}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', color: t.subText, cursor: 'pointer', fontSize: '14px', marginBottom: '12px', padding: 0 }}
          >
            <ArrowLeft size={16} /> Back to Elections Timeline
          </button>
          
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '16px', flexWrap: 'wrap' }}>
            <h1 style={{ fontSize: '32px', fontWeight: 800, margin: 0, color: t.text }}>
              {activeTitle}
            </h1>
            <span style={{ fontSize: '18px', color: t.subText, fontWeight: 500 }}>
              {scopedConstituencies.length} Constituencies
            </span>
          </div>
        </div>

        {/* View Mode & Theme Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', backgroundColor: t.cardBg, padding: '4px', borderRadius: '8px', border: `1px solid ${t.border}` }}>
            <button 
              onClick={() => setViewMode('grid')}
              style={{ padding: '6px', border: 'none', borderRadius: '6px', cursor: 'pointer', backgroundColor: viewMode === 'grid' ? t.hover : 'transparent', color: viewMode === 'grid' ? t.text : t.subText }}
            >
              <LayoutGrid size={18} />
            </button>
            <button 
              onClick={() => setViewMode('table')}
              style={{ padding: '6px', border: 'none', borderRadius: '6px', cursor: 'pointer', backgroundColor: viewMode === 'table' ? t.hover : 'transparent', color: viewMode === 'table' ? t.text : t.subText }}
            >
              <List size={18} />
            </button>
          </div>

          <button aria-label="Toggle Theme" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} style={{ width: '36px', height: '36px', borderRadius: '50%', border: `1px solid ${t.border}`, backgroundColor: t.cardBg, display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', color: t.text }}
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px', color: t.subText }}>
          <div className="spinner" style={{ width: '40px', height: '40px', border: `3px solid ${t.border}`, borderTopColor: t.text, borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: '32px', maxWidth: '1400px', margin: '0 auto' }}>
          
          {/* LEFT SIDEBAR */}
          <div style={{ width: '280px', flexShrink: 0 }}>
            {isLS ? (
              /* LOK SABHA: FILTER BY STATE */
              <div>
                <h2 style={{ color: t.subText, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>Filter by State</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '75vh', overflowY: 'auto', paddingRight: '8px', scrollbarWidth: 'thin', scrollbarColor: `${t.border} transparent` }}>
                  {states.map(s => {
                    const cleanS = (s || '').replace(/_/g, ' ').trim().toLowerCase();
                    const stateCount = s === 'All' 
                      ? constituencies.length 
                      : constituencies.filter(c => (c.state || '').replace(/_/g, ' ').trim().toLowerCase() === cleanS).length;
                    const isSelected = selectedState.replace(/_/g, ' ').trim().toLowerCase() === cleanS;
                    return (
                      <button
                        key={s}
                        onClick={() => setSelectedState(s)}
                        style={{
                          textAlign: 'left', padding: '10px 14px', borderRadius: '8px', border: 'none', fontSize: '14px', fontWeight: 500, cursor: 'pointer',
                          backgroundColor: isSelected ? t.hover : 'transparent',
                          color: isSelected ? t.text : t.subText,
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                        }}
                      >
                        <span>{s}</span>
                        <span style={{ fontSize: '12px', color: isSelected ? t.text : t.subText }}>{stateCount}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* STATE ASSEMBLY: FILTER BY PARTY DIRECTLY IN SIDEBAR */
              <div>
                <h2 style={{ color: t.subText, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>
                  Filter by Party
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '75vh', overflowY: 'auto', paddingRight: '8px', scrollbarWidth: 'thin', scrollbarColor: `${t.border} transparent` }}>
                  <button
                    onClick={() => setSelectedParty('All')}
                    style={{
                      textAlign: 'left', padding: '10px 14px', borderRadius: '8px', border: 'none', fontSize: '14px', fontWeight: 600, cursor: 'pointer',
                      backgroundColor: selectedParty === 'All' ? t.hover : 'transparent',
                      color: selectedParty === 'All' ? t.text : t.subText,
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                    }}
                  >
                    <span>All Parties</span>
                    <span style={{ fontSize: '12px', color: selectedParty === 'All' ? t.text : t.subText }}>{constituencies.length}</span>
                  </button>
                  {parties.map(([party, seatCount]) => {
                    const isSelected = selectedParty === party;
                    const pColor = getPartyColor(party);
                    return (
                      <button
                        key={party}
                        onClick={() => setSelectedParty(isSelected ? 'All' : party)}
                        style={{
                          textAlign: 'left', padding: '10px 14px', borderRadius: '8px', border: 'none', fontSize: '14px', fontWeight: 500, cursor: 'pointer',
                          backgroundColor: isSelected ? `${pColor}20` : 'transparent',
                          color: isSelected ? pColor : t.subText,
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          borderLeft: isSelected ? `3px solid ${pColor}` : '3px solid transparent'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: pColor }}></span>
                          <span style={{ fontWeight: isSelected ? 700 : 500 }}>{party}</span>
                        </div>
                        <span style={{ fontSize: '12px', fontWeight: 600, color: isSelected ? pColor : t.subText }}>{seatCount}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT PANEL: SEARCH, PARTY PILLS & CONTENT */}
          <div style={{ flex: 1, minWidth: 0 }}>
            
            {/* Search Bar aligned top right */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '20px', color: t.text, margin: 0, fontWeight: 700 }}>
                {selectedParty === 'All' ? 'All Constituencies' : `${selectedParty} Won Constituencies`}
              </h2>
              
              <div style={{ position: 'relative', width: '280px' }}>
                <Search size={18} color={t.subText} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
                <input 
                  type="text"
                  placeholder="Search candidate or constituency..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ width: '100%', backgroundColor: t.inputBg, border: `1px solid ${t.border}`, borderRadius: '30px', padding: '10px 16px 10px 44px', fontSize: '14px', color: t.text, outline: 'none' }}
                />
              </div>
            </div>

            {/* Horizontal Party Pills for quick mobile/desktop selection */}
            <div ref={scrollRef} style={{ display: 'flex', overflowX: 'auto', gap: '8px', paddingBottom: '12px', marginBottom: '20px', borderBottom: `1px solid ${t.border}`, scrollbarWidth: 'thin', scrollbarColor: `${t.border} transparent`, width: '100%' }}>
              <button
                onClick={() => setSelectedParty('All')}
                style={{
                  flexShrink: 0, padding: '6px 14px', borderRadius: '20px', border: '1px solid', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                  backgroundColor: selectedParty === 'All' ? t.text : t.pillBg,
                  color: selectedParty === 'All' ? t.bg : t.subText,
                  borderColor: selectedParty === 'All' ? t.text : t.border
                }}
              >
                All Parties ({scopedConstituencies.length})
              </button>
              {parties.map(([party, seatCount]) => {
                const themeColor = getPartyColor(party);
                const isSelected = selectedParty === party;
                
                return (
                  <button
                    key={party}
                    onClick={() => setSelectedParty(selectedParty === party ? 'All' : party)}
                    style={{
                      flexShrink: 0, display: 'flex', alignItems: 'center', gap: '6px',
                      padding: '6px 14px', borderRadius: '20px', border: '1px solid', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                      backgroundColor: isSelected ? `${themeColor}20` : t.pillBg,
                      color: isSelected ? themeColor : t.subText,
                      borderColor: isSelected ? themeColor : t.border
                    }}
                  >
                    <span>{getPartySymbol(party)}</span>
                    <span>{party}</span>
                    <span style={{ fontSize: '11px', padding: '2px 6px', borderRadius: '10px', backgroundColor: isSelected ? themeColor : t.border, color: isSelected ? '#FFF' : t.subText }}>
                      {seatCount}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Content Area (Grid or Table) */}
            {filtered.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px', color: t.subText, fontSize: '16px' }}>
                No constituencies found matching your filters.
              </div>
            ) : viewMode === 'grid' ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                {filtered.map(c => {
                  const winnerName = c.winner || c.candidates?.[0]?.name || 'Unknown';
                  const partyName = c.party || c.candidates?.[0]?.party || 'IND';
                  const pColor = getPartyColor(partyName);
                  return (
                    <div 
                      key={`${c.state}-${c.constituency}-${c.id}`}
                      onClick={() => onSelectConstituency(year, slugify(c.state), slugify(c.constituency))}
                      style={{ 
                        backgroundColor: t.cardBg, borderRadius: '12px', border: `1px solid ${t.border}`, padding: '20px',
                        cursor: 'pointer', transition: 'all 0.2s ease', display: 'flex', flexDirection: 'column', gap: '16px'
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = pColor; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = t.border; e.currentTarget.style.transform = 'translateY(0)'; }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <div style={{ fontSize: '12px', color: t.subText, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{c.state}</div>
                          <div style={{ fontSize: '18px', fontWeight: 700, color: t.text, marginTop: '2px' }}>{c.constituency}</div>
                        </div>
                        <span style={{ backgroundColor: `${pColor}15`, color: pColor, padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 700, border: `1px solid ${pColor}40` }}>
                          {partyName}
                        </span>
                      </div>

                      <div style={{ backgroundColor: t.bg, padding: '12px', borderRadius: '8px', border: `1px solid ${t.border}` }}>
                        <div style={{ fontSize: '11px', color: t.subText }}>Elected Representative (MLA)</div>
                        <div style={{ fontSize: '15px', fontWeight: 600, color: t.text, marginTop: '2px' }}>
                          {winnerName}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '12px', color: t.subText }}>
                          <span>Margin: {typeof c.margin === 'number' ? c.margin.toLocaleString() : (c.margin || 'N/A')}</span>
                          {c.votes ? <span>Votes: {c.votes.toLocaleString()}</span> : null}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px', fontSize: '13px', color: t.subText, marginTop: 'auto' }}>
                        <span>View Details</span>
                        <ArrowRight size={14} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ backgroundColor: t.cardBg, borderRadius: '12px', border: `1px solid ${t.border}`, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${t.border}`, color: t.subText }}>
                      <th style={{ padding: '14px 16px', fontWeight: 600 }}>Constituency</th>
                      <th style={{ padding: '14px 16px', fontWeight: 600 }}>State</th>
                      <th style={{ padding: '14px 16px', fontWeight: 600 }}>Winner</th>
                      <th style={{ padding: '14px 16px', fontWeight: 600 }}>Party</th>
                      <th style={{ padding: '14px 16px', fontWeight: 600, textAlign: 'right' }}>Margin</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(c => {
                      const winnerName = c.winner || c.candidates?.[0]?.name || 'Unknown';
                      const partyName = c.party || c.candidates?.[0]?.party || 'IND';
                      return (
                        <tr 
                          key={`${c.state}-${c.constituency}-${c.id}`}
                          onClick={() => onSelectConstituency(year, slugify(c.state), slugify(c.constituency))}
                          style={{ borderBottom: `1px solid ${t.border}`, cursor: 'pointer', transition: 'background-color 0.1s ease' }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = t.hover}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                          <td style={{ padding: '14px 16px', fontWeight: 600, color: t.text }}>{c.constituency}</td>
                          <td style={{ padding: '14px 16px', color: t.subText }}>{c.state}</td>
                          <td style={{ padding: '14px 16px', color: t.text }}>{winnerName}</td>
                          <td style={{ padding: '14px 16px' }}>
                            <span style={{ color: getPartyColor(partyName), fontWeight: 600 }}>
                              {partyName}
                            </span>
                          </td>
                          <td style={{ padding: '14px 16px', textAlign: 'right', color: t.subText }}>
                            {typeof c.margin === 'number' ? c.margin.toLocaleString() : (c.margin || '—')}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
