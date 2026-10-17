import React, { useState, useEffect, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { api } from '../api/client';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';
import { getPartyColor, getPartySymbol } from '../utils/party_utils';
import { BY_ELECTIONS_DATA } from '../data/by_elections_data';
import Search from 'lucide-react/dist/esm/icons/search';
import Trophy from 'lucide-react/dist/esm/icons/trophy';
import Calendar from 'lucide-react/dist/esm/icons/calendar';
import CheckCircle2 from 'lucide-react/dist/esm/icons/check-circle-2';
import Clock from 'lucide-react/dist/esm/icons/clock';
import ArrowRight from 'lucide-react/dist/esm/icons/arrow-right';

export default function ByElectionsView({ defaultLevel = 'ALL', onSelectByElection }) {
  const [bypolls, setBypolls] = useState(BY_ELECTIONS_DATA);
  const [selectedLevel, setSelectedLevel] = useState(defaultLevel);
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (defaultLevel) setSelectedLevel(defaultLevel);
  }, [defaultLevel]);

  // Sync with live radar / firestore
  useEffect(() => {
    let isMounted = true;
    async function fetchDynamic() {
      try {
        let liveDocs = [];
        try {
          const apiData = await api.getLiveElections();
          if (Array.isArray(apiData) && apiData.length > 0) liveDocs = apiData;
        } catch (e) {}

        if (liveDocs.length === 0) {
          const snap = await getDocs(collection(db, 'live_elections'));
          snap.forEach(docSnap => {
            const d = docSnap.data();
            liveDocs.push({ id: docSnap.id, ...d });
          });
        }

        if (isMounted && liveDocs.length > 0) {
          const mapped = [];
          liveDocs.forEach(item => {
            const title = item.title || '';
            const isBypoll = (item.type && item.type.toUpperCase().includes('BY')) ||
                             title.toLowerCase().includes('bypoll') ||
                             title.toLowerCase().includes('by-election');
            if (!isBypoll) return;

            const constName = item.constituency || title.split(' ')[0];
            if (!constName || constName.toLowerCase() === 'unknown' || constName.toLowerCase() === 'n/a') return;

            let level = 'Vidhan Sabha';
            let type = 'ASSEMBLY';
            const lowerTitle = title.toLowerCase();
            if (lowerTitle.includes('lok sabha') || lowerTitle.includes('parliamentary') || lowerTitle.includes(' ls')) {
              level = 'Lok Sabha';
              type = 'LOK_SABHA';
            } else if (lowerTitle.includes('municipal') || lowerTitle.includes('panchayat') || lowerTitle.includes('corporation')) {
              level = 'Municipal';
              type = 'MUNICIPAL';
            }

            const docStatus = item.status === 'RESULT' || item.winner ? 'RESULT' :
                              item.status === 'COUNTING' || item.liveCount ? 'COUNTING' : 'UPCOMING';

            const st = item.state || 'India';
            const stateSlug = st.toLowerCase().replace(/[^a-z0-9]/g, '-');
            const constituencySlug = constName.toLowerCase().replace(/[^a-z0-9]/g, '-');

            mapped.push({
              id: item.id || `live-${constName}`,
              constituency: constName,
              constituencySlug,
              state: st,
              stateSlug,
              type,
              level,
              date: item.date || '2026',
              status: docStatus,
              liveCount: item.liveCount || (item.leadCandidate ? {
                leading: item.leadCandidate,
                party: item.leadParty || 'IND',
                margin: item.leadMargin || 'Leading'
              } : null),
              result: item.winner ? {
                winner: item.winner,
                party: item.winningParty || 'IND',
                margin: item.margin || 'Declared',
                runnerUp: item.runnerUp || null,
                runnerUpParty: item.runnerUpParty || null
              } : null
            });
          });

          if (mapped.length > 0) {
            const combined = [...BY_ELECTIONS_DATA];
            mapped.forEach(m => {
              if (!combined.some(c => c.constituency.toLowerCase() === m.constituency.toLowerCase())) {
                combined.unshift(m);
              }
            });
            setBypolls(combined);
          }
        }
      } catch (e) {}
    }
    fetchDynamic();
    return () => { isMounted = false; };
  }, []);

  const handleCardClick = (bp) => {
    const sSlug = bp.stateSlug || bp.state.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const cSlug = bp.constituencySlug || bp.constituency.toLowerCase().replace(/[^a-z0-9]/g, '-');
    if (onSelectByElection) {
      onSelectByElection(sSlug, cSlug);
    } else {
      window.history.pushState({}, '', `/by-elections/${sSlug}/${cSlug}`);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  };

  // Filtered dataset
  const filteredList = useMemo(() => {
    return bypolls.filter(bp => {
      // Level filter
      if (selectedLevel !== 'ALL' && bp.type !== selectedLevel) return false;

      // Status filter
      if (selectedStatus === 'RESULT' && bp.status !== 'RESULT') return false;
      if (selectedStatus === 'COUNTING' && bp.status !== 'COUNTING') return false;
      if (selectedStatus === 'UPCOMING' && bp.status !== 'UPCOMING') return false;

      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesConst = bp.constituency?.toLowerCase().includes(q);
        const matchesState = bp.state?.toLowerCase().includes(q);
        const matchesWinner = bp.result?.winner?.toLowerCase().includes(q);
        const matchesParty = bp.result?.party?.toLowerCase().includes(q);
        if (!matchesConst && !matchesState && !matchesWinner && !matchesParty) return false;
      }

      return true;
    });
  }, [bypolls, selectedLevel, selectedStatus, searchQuery]);

  return (
    <div style={{ marginTop: '8px', color: '#E4E4E7' }}>
      
      {/* HIGH-RANKING SHORT-TAIL & LONG-TAIL SEO METATAGS */}
      <Helmet>
        <title>By-Election Results India 2024-2026: Lok Sabha & Vidhan Sabha Bypoll Winners, Live Count | Opinar</title>
        <meta name="description" content="Track official Indian by-election results and live count for Lok Sabha, Vidhan Sabha and Municipal seats. Verified winners, margins and party breakdown for Wayanad, Karhal, Kedarnath, Vav, Kundarki and upcoming bypolls." />
        <meta name="keywords" content="by election results 2024, bypoll results live, lok sabha by election, vidhan sabha by election, who won by election, election commission bypoll results, wayanad by election, karhal bypoll results, kedarnath by election, kundarki by election, vav by election result, by election live count" />
        <link rel="canonical" href="https://www.opinar.in/by-elections" />

        <meta property="og:title" content="By-Election Results India 2024-2026: Live Bypoll Count & Winners | Opinar" />
        <meta property="og:description" content="Explore live counting, winners, margins, and election commission verified returns across Indian by-elections." />
        <meta property="og:url" content="https://www.opinar.in/by-elections" />
        <meta property="og:type" content="website" />
      </Helmet>

      {/* MINIMAL FILTER BAR */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        flexWrap: 'wrap', 
        gap: '12px',
        marginBottom: '24px'
      }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: '1', minWidth: '220px', maxWidth: '380px' }}>
          <Search size={16} color="#71717A" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input 
            type="text" 
            placeholder="Search constituency or state..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              backgroundColor: '#27272A',
              border: '1px solid #3F3F46',
              borderRadius: '8px',
              padding: '8px 12px 8px 36px',
              color: '#FFFFFF',
              fontSize: '13px',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
        </div>

        {/* Level Switcher */}
        <div style={{ display: 'flex', gap: '4px', backgroundColor: '#27272A', padding: '4px', borderRadius: '8px', border: '1px solid #3F3F46' }}>
          {[
            { id: 'ALL', label: 'All' },
            { id: 'LOK_SABHA', label: 'Lok Sabha' },
            { id: 'ASSEMBLY', label: 'Vidhan Sabha' },
            { id: 'MUNICIPAL', label: 'Municipal' }
          ].map(lvl => (
            <button
              key={lvl.id}
              onClick={() => setSelectedLevel(lvl.id)}
              style={{
                backgroundColor: selectedLevel === lvl.id ? '#3F3F46' : 'transparent',
                color: selectedLevel === lvl.id ? '#FFFFFF' : '#A1A1AA',
                border: 'none',
                borderRadius: '6px',
                padding: '6px 12px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}
            >
              {lvl.label}
            </button>
          ))}
        </div>

        {/* Status Filter */}
        <div style={{ display: 'flex', gap: '4px', backgroundColor: '#27272A', padding: '4px', borderRadius: '8px', border: '1px solid #3F3F46' }}>
          {[
            { id: 'ALL', label: 'All Status' },
            { id: 'RESULT', label: 'Results Declared' },
            { id: 'UPCOMING', label: 'Upcoming' }
          ].map(st => (
            <button
              key={st.id}
              onClick={() => setSelectedStatus(st.id)}
              style={{
                backgroundColor: selectedStatus === st.id ? '#3F3F46' : 'transparent',
                color: selectedStatus === st.id ? '#FFFFFF' : '#A1A1AA',
                border: 'none',
                borderRadius: '6px',
                padding: '6px 12px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}
            >
              {st.label}
            </button>
          ))}
        </div>
      </div>

      {/* MINIMAL CARDS GRID */}
      {filteredList.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', backgroundColor: '#27272A', borderRadius: '12px', border: '1px solid #3F3F46', color: '#A1A1AA' }}>
          No by-elections match your filter.
        </div>
      ) : (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', 
          gap: '16px' 
        }}>
          {filteredList.map(bp => {
            const isResult = bp.status === 'RESULT' && bp.result;
            const isCounting = bp.status === 'COUNTING';
            const partyColor = isResult ? getPartyColor(bp.result.party) : '#71717A';
            const partySymbol = isResult ? getPartySymbol(bp.result.party) : '';

            return (
              <div
                key={bp.id}
                onClick={() => handleCardClick(bp)}
                style={{
                  backgroundColor: '#27272A',
                  borderRadius: '12px',
                  border: '1px solid #3F3F46',
                  padding: '18px 20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  transition: 'border-color 0.15s, transform 0.15s',
                  position: 'relative',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#3B82F6';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#3F3F46';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                {/* Header: Level & Status */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ 
                    fontSize: '11px', 
                    fontWeight: 700, 
                    color: bp.type === 'LOK_SABHA' ? '#60A5FA' : bp.type === 'MUNICIPAL' ? '#34D399' : '#FBBF24',
                    backgroundColor: '#18181B',
                    padding: '3px 8px',
                    borderRadius: '4px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    {bp.level}
                  </span>

                  {isResult ? (
                    <span style={{ 
                      fontSize: '11px', 
                      fontWeight: 700, 
                      color: '#10B981', 
                      backgroundColor: '#10B98115', 
                      padding: '3px 8px', 
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      <CheckCircle2 size={12} color="#10B981" /> Result Declared
                    </span>
                  ) : isCounting ? (
                    <span style={{ 
                      fontSize: '11px', 
                      fontWeight: 700, 
                      color: '#EF4444', 
                      backgroundColor: '#EF444415', 
                      padding: '3px 8px', 
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#EF4444' }} /> Counting Live
                    </span>
                  ) : (
                    <span style={{ 
                      fontSize: '11px', 
                      fontWeight: 600, 
                      color: '#9CA3AF', 
                      backgroundColor: '#18181B', 
                      padding: '3px 8px', 
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      <Clock size={12} color="#9CA3AF" /> Upcoming
                    </span>
                  )}
                </div>

                {/* Constituency & State */}
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
                    {bp.constituency}
                  </h3>
                  <div style={{ fontSize: '13px', color: '#A1A1AA', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>{bp.state}</span>
                    <span>•</span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <Calendar size={12} color="#71717A" /> {bp.date}
                    </span>
                  </div>
                </div>

                {/* RESULT SECTION (If election happened) */}
                {isResult && (
                  <div style={{
                    backgroundColor: '#18181B',
                    borderRadius: '8px',
                    padding: '12px 14px',
                    border: '1px solid #3F3F46',
                    marginTop: '2px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Trophy size={14} color="#F59E0B" />
                        <span style={{ fontSize: '11px', color: '#A1A1AA', fontWeight: 700, textTransform: 'uppercase' }}>Winner</span>
                      </div>
                      <span style={{
                        fontSize: '11px',
                        fontWeight: 800,
                        color: partyColor,
                        backgroundColor: `${partyColor}15`,
                        padding: '2px 6px',
                        borderRadius: '4px'
                      }}>
                        {partySymbol} {bp.result.party}
                      </span>
                    </div>

                    <div style={{ fontSize: '15px', fontWeight: 700, color: '#FFFFFF' }}>
                      {bp.result.winner}
                    </div>

                    {bp.result.margin && (
                      <div style={{ fontSize: '12px', color: '#10B981', fontWeight: 600, marginTop: '3px' }}>
                        Won by {bp.result.margin}
                      </div>
                    )}

                    {bp.result.runnerUp && (
                      <div style={{ fontSize: '11px', color: '#71717A', marginTop: '6px', borderTop: '1px solid #27272A', paddingTop: '6px' }}>
                        Runner-up: {bp.result.runnerUp} ({bp.result.runnerUpParty})
                      </div>
                    )}
                  </div>
                )}

                {/* LIVE COUNTING SECTION (If counting underway) */}
                {isCounting && bp.liveCount && (
                  <div style={{
                    backgroundColor: '#18181B',
                    borderRadius: '8px',
                    padding: '12px 14px',
                    border: '1px solid #EF444440',
                    marginTop: '2px'
                  }}>
                    <div style={{ fontSize: '11px', color: '#EF4444', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>
                      Leading Candidate
                    </div>
                    <div style={{ fontSize: '15px', fontWeight: 700, color: '#FFFFFF' }}>
                      {bp.liveCount.leading} ({bp.liveCount.party})
                    </div>
                    <div style={{ fontSize: '12px', color: '#EF4444', fontWeight: 600, marginTop: '3px' }}>
                      Lead: {bp.liveCount.margin}
                    </div>
                  </div>
                )}

                {/* UPCOMING NOTICE */}
                {!isResult && !isCounting && (
                  <div style={{
                    backgroundColor: '#18181B',
                    borderRadius: '8px',
                    padding: '12px 14px',
                    border: '1px solid #3F3F46',
                    fontSize: '12px',
                    color: '#A1A1AA',
                    marginTop: '2px'
                  }}>
                    Polling scheduled. Results will be updated immediately upon counting.
                  </div>
                )}

                {/* CARD FOOTER: LINK TO DEDICATED SEO PAGE */}
                <div style={{ marginTop: 'auto', paddingTop: '8px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', color: '#3B82F6', fontSize: '12px', fontWeight: 600, gap: '4px' }}>
                  <span>View Full Details & Breakdown</span>
                  <ArrowRight size={13} />
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
