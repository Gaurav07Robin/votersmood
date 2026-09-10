import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { Search, ArrowRight, ArrowLeft, LayoutGrid, List, Moon, Sun } from 'lucide-react';
import { getPartyColor, getPartySymbol, getPartyFlag } from '../utils/party_utils';

const slugify = (text) => text.toString().toLowerCase().trim()
  .replace(/\s+/g, '-')
  .replace(/[^\w\-]+/g, '')
  .replace(/\-\-+/g, '-');

// ---------------------------------------------------------
// MAIN COMPONENT
// ---------------------------------------------------------
export default function ElectionYearDetail({ year, onBack, onSelectConstituency }) {
  const [constituencies, setConstituencies] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filter States
  const [selectedState, setSelectedState] = useState('All');
  const [selectedParty, setSelectedParty] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // UI States
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'table'
  const [theme, setTheme] = useState('dark'); // 'dark' or 'light'

  // Scroll Ref for horizontal party pills
  const scrollRef = React.useRef(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      const onWheel = (e) => {
        if (e.deltaY === 0) return;
        
        const isAtLeft = el.scrollLeft === 0;
        const isAtRight = el.scrollLeft + el.clientWidth >= el.scrollWidth - 1;

        if (e.deltaY > 0 && isAtRight) return; // let page scroll down
        if (e.deltaY < 0 && isAtLeft) return; // let page scroll up
        
        e.preventDefault();
        el.scrollLeft += e.deltaY;
      };
      el.addEventListener('wheel', onWheel, { passive: false });
      return () => el.removeEventListener('wheel', onWheel);
    }
  }, [loading]); // re-bind when loading finishes and DOM exists

  // Theme Colors
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
        const data = snapshot.docs.map(doc => doc.data());
        data.sort((a, b) => a.constituency.localeCompare(b.constituency));
        setConstituencies(data);
      } catch (error) {
        console.error("Error fetching constituencies:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [year]);

  const states = useMemo(() => {
    return ['All', ...new Set(constituencies.map(c => c.state))].sort();
  }, [constituencies]);

  const parties = useMemo(() => {
    const counts = {};
    constituencies.forEach(c => {
      const p = c.candidates[0]?.party;
      if (p) counts[p] = (counts[p] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]); // Sort by seats descending
  }, [constituencies]);

  const filtered = useMemo(() => {
    return constituencies.filter(c => {
      const matchState = selectedState === 'All' || c.state === selectedState;
      const matchParty = selectedParty === 'All' || c.candidates[0]?.party === selectedParty;
      const matchSearch = c.constituency.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (c.candidates[0] && c.candidates[0].name.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchState && matchParty && matchSearch;
    });
  }, [constituencies, selectedState, selectedParty, searchQuery]);

  return (
    <div style={{ backgroundColor: t.bg, minHeight: '100vh', color: t.text, padding: '24px', fontFamily: 'Inter, sans-serif', transition: 'background-color 0.2s ease, color 0.2s ease' }}>
      
      {/* HEADER WITH CONTROLS */}
      <div style={{ maxWidth: '1400px', margin: '0 auto', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <button onClick={onBack} style={{ background: 'transparent', border: 'none', color: t.subText, cursor: 'pointer', marginBottom: '16px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px', padding: 0 }}>
            <ArrowLeft size={16} /> Back to Timeline
          </button>
          <h1 style={{ fontSize: '32px', fontWeight: 800, color: t.text, margin: 0, letterSpacing: '-0.5px' }}>
            {year} Lok Sabha Results
          </h1>
          <p style={{ color: t.subText, fontSize: '15px', marginTop: '4px' }}>
            Explore the verdict from {constituencies.length} constituencies across India.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          {/* View Toggle */}
          <div style={{ display: 'flex', backgroundColor: t.cardBg, borderRadius: '24px', border: `1px solid ${t.border}`, padding: '4px' }}>
            <button 
              onClick={() => setViewMode('grid')}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '20px', border: 'none', cursor: 'pointer', backgroundColor: viewMode === 'grid' ? t.hover : 'transparent', color: viewMode === 'grid' ? t.text : t.subText, fontWeight: 600, fontSize: '13px' }}
            >
              <LayoutGrid size={16} /> Grid
            </button>
            <button 
              onClick={() => setViewMode('table')}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '20px', border: 'none', cursor: 'pointer', backgroundColor: viewMode === 'table' ? t.hover : 'transparent', color: viewMode === 'table' ? t.text : t.subText, fontWeight: 600, fontSize: '13px' }}
            >
              <List size={16} /> Table
            </button>
          </div>

          {/* Theme Toggle */}
          <button 
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            style={{ width: '36px', height: '36px', borderRadius: '50%', border: `1px solid ${t.border}`, backgroundColor: t.cardBg, display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', color: t.text }}
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
          
          {/* LEFT SIDEBAR: STATE SELECTION */}
          <div style={{ width: '280px', flexShrink: 0 }}>
            <h3 style={{ color: t.subText, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>Filter by State</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '75vh', overflowY: 'auto', paddingRight: '8px', scrollbarWidth: 'thin', scrollbarColor: `${t.border} transparent` }}>
              {states.map(state => {
                // If a party is selected, count only seats for that party in the state
                const stateCount = state === 'All' 
                  ? (selectedParty === 'All' ? constituencies.length : constituencies.filter(c => c.candidates[0]?.party === selectedParty).length)
                  : constituencies.filter(c => c.state === state && (selectedParty === 'All' || c.candidates[0]?.party === selectedParty)).length;
                  
                return (
                  <button
                    key={state}
                    onClick={() => setSelectedState(state)}
                    style={{
                      textAlign: 'left', padding: '10px 14px', borderRadius: '8px', border: 'none', fontSize: '14px', fontWeight: 500, cursor: 'pointer',
                      backgroundColor: selectedState === state ? t.hover : 'transparent',
                      color: selectedState === state ? t.text : (stateCount === 0 ? t.emptyPill : t.subText),
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      transition: 'background-color 0.1s ease'
                    }}
                  >
                    <span>{state.replace(/_/g, ' ')}</span>
                    <span style={{ fontSize: '12px', color: selectedState === state ? t.subText : t.subText }}>{stateCount}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* RIGHT PANEL: SEARCH, PARTY PILLS & CONTENT */}
          <div style={{ flex: 1, minWidth: 0 }}>
            
            {/* Search Bar aligned top right */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '22px', color: t.text, margin: 0 }}>
                {selectedState === 'All' ? 'All Constituencies' : selectedState.replace(/_/g, ' ')}
              </h2>
              
              <div style={{ position: 'relative', width: '280px' }}>
                <Search size={18} color={t.subText} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
                <input 
                  type="text"
                  placeholder="Search candidate..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ width: '100%', backgroundColor: t.inputBg, border: `1px solid ${t.border}`, borderRadius: '30px', padding: '10px 16px 10px 44px', fontSize: '14px', color: t.text, outline: 'none' }}
                />
              </div>
            </div>

            {/* Horizontal Party Pills - Made strictly scrollable without warping */}
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
                All Parties
              </button>
              {parties.map(([party, totalCount]) => {
                // If a state is selected, count only seats for that party in the state
                const activeCount = selectedState === 'All' 
                  ? totalCount 
                  : constituencies.filter(c => c.state === selectedState && c.candidates[0]?.party === party).length;
                
                const themeColor = getPartyColor(party);
                const isSelected = selectedParty === party;
                
                return (
                  <button
                    key={party}
                    onClick={() => setSelectedParty(party)}
                    style={{
                      flexShrink: 0, display: 'flex', alignItems: 'center', gap: '6px',
                      padding: '6px 14px', borderRadius: '20px', border: '1px solid', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                      backgroundColor: isSelected ? `${themeColor}15` : t.pillBg,
                      color: isSelected ? themeColor : (activeCount === 0 ? t.emptyPill : t.subText),
                      borderColor: isSelected ? themeColor : t.border
                    }}
                  >
                    <span>{getPartySymbol(party)}</span>
                    <span>{party}</span>
                    <span style={{ fontSize: '11px', padding: '2px 6px', borderRadius: '10px', backgroundColor: isSelected ? themeColor : t.border, color: isSelected ? '#FFF' : t.subText }}>
                      {activeCount}
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
                  const winner = c.candidates[0]; 
                  const pColor = getPartyColor(winner?.party);
                  return (
                    <div 
                      key={`${c.state}-${c.constituency}`}
                      onClick={() => onSelectConstituency(year, slugify(c.state), slugify(c.constituency))}
                      style={{ 
                        backgroundColor: t.cardBg, borderRadius: '12px', padding: '20px', border: `1px solid ${t.border}`, cursor: 'pointer', position: 'relative', overflow: 'hidden',
                        transition: 'transform 0.1s ease, box-shadow 0.1s ease, border-color 0.1s ease'
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 8px 16px rgba(0,0,0,0.1)`; e.currentTarget.style.borderColor = pColor; }}
                      onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = t.border; }}
                    >
                      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', backgroundColor: pColor }} />
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <div style={{ color: t.subText, fontSize: '11px', fontWeight: 600, letterSpacing: '0.5px' }}>{c.state.replace(/_/g, ' ')}</div>
                      </div>
                      <h2 style={{ fontSize: '20px', fontWeight: 800, color: t.text, margin: '0 0 16px 0', letterSpacing: '-0.5px' }}>{c.constituency}</h2>
                      {winner && (
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                          <div style={{ width: '40px', height: '40px', backgroundColor: t.bg, borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', flexShrink: 0 }}>
                            <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: pColor }} />
                          </div>
                          <div>
                            <div style={{ fontSize: '11px', color: t.subText, marginBottom: '2px', textTransform: 'uppercase', fontWeight: 600 }}>Winner</div>
                            <div style={{ fontSize: '14px', fontWeight: 700, color: t.text, marginBottom: '4px' }}>{winner.name}</div>
                            <div style={{ fontSize: '13px', color: pColor, fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                              {winner.party} 
                              {getPartyFlag(winner.party) ? <img src={getPartyFlag(winner.party)} alt="flag" style={{ height: '12px', borderRadius: '2px' }} /> : getPartySymbol(winner.party)}
                              <span style={{ color: t.subText, fontWeight: 400, marginLeft: '2px' }}>({winner.percentage}%)</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ backgroundColor: t.cardBg, borderRadius: '12px', border: `1px solid ${t.border}`, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                  <thead>
                    <tr style={{ borderBottom: `2px solid ${t.border}`, backgroundColor: t.hover, color: t.subText, textAlign: 'left', fontSize: '12px', textTransform: 'uppercase' }}>
                      <th style={{ padding: '16px', fontWeight: 600 }}>Constituency</th>
                      <th style={{ padding: '16px', fontWeight: 600 }}>State</th>
                      <th style={{ padding: '16px', fontWeight: 600 }}>Winner</th>
                      <th style={{ padding: '16px', fontWeight: 600 }}>Party</th>
                      <th style={{ padding: '16px', fontWeight: 600 }}>Vote %</th>
                      <th style={{ padding: '16px' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(c => {
                      const winner = c.candidates[0];
                      const pColor = getPartyColor(winner?.party);
                      return (
                        <tr key={`${c.state}-${c.constituency}`} style={{ borderBottom: `1px solid ${t.border}` }}>
                          <td style={{ padding: '16px', fontWeight: 700, color: t.text }}>{c.constituency}</td>
                          <td style={{ padding: '16px', color: t.subText }}>{c.state.replace(/_/g, ' ')}</td>
                          <td style={{ padding: '16px', color: t.text }}>{winner?.name}</td>
                          <td style={{ padding: '16px', color: pColor, fontWeight: 600 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              {getPartyFlag(winner?.party) ? <img src={getPartyFlag(winner?.party)} alt="flag" style={{ height: '14px', borderRadius: '2px' }} /> : getPartySymbol(winner?.party)}
                              {winner?.party}
                            </div>
                          </td>
                          <td style={{ padding: '16px', color: t.subText }}>{winner?.percentage}%</td>
                          <td style={{ padding: '16px', textAlign: 'right' }}>
                             <button onClick={() => onSelectConstituency(year, slugify(c.state), slugify(c.constituency))} style={{ background: t.hover, border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', color: t.text, fontWeight: 600, fontSize: '12px' }}>
                               View Details
                             </button>
                          </td>
                        </tr>
                      )
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
