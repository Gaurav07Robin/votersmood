import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../api/client';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';
import { getPartyColor, getPartySymbol } from '../utils/party_utils';
import Search from 'lucide-react/dist/esm/icons/search';
import Trophy from 'lucide-react/dist/esm/icons/trophy';
import Calendar from 'lucide-react/dist/esm/icons/calendar';
import CheckCircle2 from 'lucide-react/dist/esm/icons/check-circle-2';
import Clock from 'lucide-react/dist/esm/icons/clock';

// Authentic By-Elections with real results or upcoming schedule
const AUTHENTIC_BY_ELECTIONS = [
  {
    id: 'bypoll-kl-wayanad',
    constituency: 'Wayanad',
    state: 'Kerala',
    type: 'LOK_SABHA',
    level: 'Lok Sabha',
    date: 'November 2024',
    status: 'RESULT',
    result: {
      winner: 'Priyanka Gandhi Vadra',
      party: 'INC',
      margin: '4,10,931 votes',
      runnerUp: 'Sathyan Mokeri',
      runnerUpParty: 'CPI'
    }
  },
  {
    id: 'bypoll-mh-nanded',
    constituency: 'Nanded',
    state: 'Maharashtra',
    type: 'LOK_SABHA',
    level: 'Lok Sabha',
    date: 'November 2024',
    status: 'RESULT',
    result: {
      winner: 'Ravindra Vasantrao Chavan',
      party: 'INC',
      margin: '1,457 votes',
      runnerUp: 'Santukrao Hambarde',
      runnerUpParty: 'BJP'
    }
  },
  {
    id: 'bypoll-uk-kedarnath',
    constituency: 'Kedarnath',
    state: 'Uttarakhand',
    type: 'ASSEMBLY',
    level: 'Vidhan Sabha',
    date: 'November 2024',
    status: 'RESULT',
    result: {
      winner: 'Asha Nautiyal',
      party: 'BJP',
      margin: '5,622 votes',
      runnerUp: 'Manoj Rawat',
      runnerUpParty: 'INC'
    }
  },
  {
    id: 'bypoll-gj-vav',
    constituency: 'Vav',
    state: 'Gujarat',
    type: 'ASSEMBLY',
    level: 'Vidhan Sabha',
    date: 'November 2024',
    status: 'RESULT',
    result: {
      winner: 'Gulabsinh Rajput',
      party: 'INC',
      margin: '2,484 votes',
      runnerUp: 'Swaroopji Thakor',
      runnerUpParty: 'BJP'
    }
  },
  {
    id: 'bypoll-up-karhal',
    constituency: 'Karhal',
    state: 'Uttar Pradesh',
    type: 'ASSEMBLY',
    level: 'Vidhan Sabha',
    date: 'November 2024',
    status: 'RESULT',
    result: {
      winner: 'Tej Pratap Yadav',
      party: 'SP',
      margin: '14,302 votes',
      runnerUp: 'Anujesh Pratap Singh',
      runnerUpParty: 'BJP'
    }
  },
  {
    id: 'bypoll-up-kundarki',
    constituency: 'Kundarki',
    state: 'Uttar Pradesh',
    type: 'ASSEMBLY',
    level: 'Vidhan Sabha',
    date: 'November 2024',
    status: 'RESULT',
    result: {
      winner: 'Ramveer Singh',
      party: 'BJP',
      margin: '1,44,791 votes',
      runnerUp: 'Mohd Rizwan',
      runnerUpParty: 'SP'
    }
  },
  {
    id: 'bypoll-up-ghaziabad',
    constituency: 'Ghaziabad',
    state: 'Uttar Pradesh',
    type: 'ASSEMBLY',
    level: 'Vidhan Sabha',
    date: 'November 2024',
    status: 'RESULT',
    result: {
      winner: 'Sanjeev Sharma',
      party: 'BJP',
      margin: '69,551 votes',
      runnerUp: 'Singh Raj Jatav',
      runnerUpParty: 'SP'
    }
  },
  {
    id: 'bypoll-up-meerapur',
    constituency: 'Meerapur',
    state: 'Uttar Pradesh',
    type: 'ASSEMBLY',
    level: 'Vidhan Sabha',
    date: 'November 2024',
    status: 'RESULT',
    result: {
      winner: 'Mithlesh Pal',
      party: 'RLD',
      margin: '29,796 votes',
      runnerUp: 'Sumbul Rana',
      runnerUpParty: 'SP'
    }
  },
  {
    id: 'bypoll-up-sisamau',
    constituency: 'Sisamau',
    state: 'Uttar Pradesh',
    type: 'ASSEMBLY',
    level: 'Vidhan Sabha',
    date: 'November 2024',
    status: 'RESULT',
    result: {
      winner: 'Naseem Solanki',
      party: 'SP',
      margin: '8,533 votes',
      runnerUp: 'Suresh Awasthi',
      runnerUpParty: 'BJP'
    }
  },
  {
    id: 'bypoll-up-phulpur',
    constituency: 'Phulpur',
    state: 'Uttar Pradesh',
    type: 'ASSEMBLY',
    level: 'Vidhan Sabha',
    date: 'November 2024',
    status: 'RESULT',
    result: {
      winner: 'Deepak Patel',
      party: 'BJP',
      margin: '11,305 votes',
      runnerUp: 'Mujtaba Siddiqui',
      runnerUpParty: 'SP'
    }
  },
  {
    id: 'bypoll-up-katehari',
    constituency: 'Katehari',
    state: 'Uttar Pradesh',
    type: 'ASSEMBLY',
    level: 'Vidhan Sabha',
    date: 'November 2024',
    status: 'RESULT',
    result: {
      winner: 'Dharmraj Nishad',
      party: 'BJP',
      margin: '12,852 votes',
      runnerUp: 'Shobhavati Verma',
      runnerUpParty: 'SP'
    }
  },
  {
    id: 'bypoll-up-khair',
    constituency: 'Khair (SC)',
    state: 'Uttar Pradesh',
    type: 'ASSEMBLY',
    level: 'Vidhan Sabha',
    date: 'November 2024',
    status: 'RESULT',
    result: {
      winner: 'Surendra Diler',
      party: 'BJP',
      margin: '36,734 votes',
      runnerUp: 'Charu Kain',
      runnerUpParty: 'SP'
    }
  },
  {
    id: 'bypoll-pb-gidderbaha',
    constituency: 'Gidderbaha',
    state: 'Punjab',
    type: 'ASSEMBLY',
    level: 'Vidhan Sabha',
    date: 'November 2024',
    status: 'RESULT',
    result: {
      winner: 'Hardeep Singh Dimpy Dhillon',
      party: 'AAP',
      margin: '21,969 votes',
      runnerUp: 'Amrinder Singh Raja Warring',
      runnerUpParty: 'INC'
    }
  },
  {
    id: 'bypoll-pb-barnala',
    constituency: 'Barnala',
    state: 'Punjab',
    type: 'ASSEMBLY',
    level: 'Vidhan Sabha',
    date: 'November 2024',
    status: 'RESULT',
    result: {
      winner: 'Harinder Singh Dhaliwal',
      party: 'AAP',
      margin: '2,157 votes',
      runnerUp: 'Kuldeep Singh Dhillon',
      runnerUpParty: 'INC'
    }
  },
  {
    id: 'bypoll-pb-derababanak',
    constituency: 'Dera Baba Nanak',
    state: 'Punjab',
    type: 'ASSEMBLY',
    level: 'Vidhan Sabha',
    date: 'November 2024',
    status: 'RESULT',
    result: {
      winner: 'Gurdeep Singh Randhawa',
      party: 'AAP',
      margin: '5,699 votes',
      runnerUp: 'Jatinder Kaur Randhawa',
      runnerUpParty: 'INC'
    }
  },
  {
    id: 'bypoll-pb-chabbewal',
    constituency: 'Chabbewal (SC)',
    state: 'Punjab',
    type: 'ASSEMBLY',
    level: 'Vidhan Sabha',
    date: 'November 2024',
    status: 'RESULT',
    result: {
      winner: 'Ishan Kumar',
      party: 'AAP',
      margin: '28,690 votes',
      runnerUp: 'Ranjit Kumar',
      runnerUpParty: 'INC'
    }
  },
  {
    id: 'bypoll-kl-palakkad',
    constituency: 'Palakkad',
    state: 'Kerala',
    type: 'ASSEMBLY',
    level: 'Vidhan Sabha',
    date: 'November 2024',
    status: 'RESULT',
    result: {
      winner: 'Rahul Mamkootathil',
      party: 'INC',
      margin: '18,840 votes',
      runnerUp: 'C. Krishnakumar',
      runnerUpParty: 'BJP'
    }
  },
  {
    id: 'bypoll-kl-chelakkara',
    constituency: 'Chelakkara (SC)',
    state: 'Kerala',
    type: 'ASSEMBLY',
    level: 'Vidhan Sabha',
    date: 'November 2024',
    status: 'RESULT',
    result: {
      winner: 'U. R. Pradeep',
      party: 'CPM',
      margin: '12,201 votes',
      runnerUp: 'Ramya Haridas',
      runnerUpParty: 'INC'
    }
  },
  {
    id: 'bypoll-mp-budhni',
    constituency: 'Budhni',
    state: 'Madhya Pradesh',
    type: 'ASSEMBLY',
    level: 'Vidhan Sabha',
    date: 'November 2024',
    status: 'RESULT',
    result: {
      winner: 'Ramakant Bhargava',
      party: 'BJP',
      margin: '13,090 votes',
      runnerUp: 'Rajkumar Patel',
      runnerUpParty: 'INC'
    }
  },
  {
    id: 'bypoll-mp-vijaypur',
    constituency: 'Vijaypur',
    state: 'Madhya Pradesh',
    type: 'ASSEMBLY',
    level: 'Vidhan Sabha',
    date: 'November 2024',
    status: 'RESULT',
    result: {
      winner: 'Mukesh Malhotra',
      party: 'INC',
      margin: '7,364 votes',
      runnerUp: 'Ramniwas Rawat',
      runnerUpParty: 'BJP'
    }
  },
  // Upcoming / Live tracked by-elections
  {
    id: 'bypoll-as-nagaon',
    constituency: 'Nagaon',
    state: 'Assam',
    type: 'LOK_SABHA',
    level: 'Lok Sabha',
    date: 'Upcoming 2026',
    status: 'UPCOMING',
    result: null
  },
  {
    id: 'bypoll-py-thattanchavady',
    constituency: 'Thattanchavady',
    state: 'Puducherry',
    type: 'ASSEMBLY',
    level: 'Vidhan Sabha',
    date: 'Upcoming 2026',
    status: 'UPCOMING',
    result: null
  },
  {
    id: 'bypoll-as-dhing',
    constituency: 'Dhing',
    state: 'Assam',
    type: 'ASSEMBLY',
    level: 'Vidhan Sabha',
    date: 'Upcoming 2026',
    status: 'UPCOMING',
    result: null
  },
  {
    id: 'bypoll-up-bithoor',
    constituency: 'Bithoor',
    state: 'Uttar Pradesh',
    type: 'MUNICIPAL',
    level: 'Municipal / Local Body',
    date: 'Upcoming 2026',
    status: 'UPCOMING',
    result: null
  }
];

export default function ByElectionsView({ defaultLevel = 'ALL' }) {
  const [bypolls, setBypolls] = useState(AUTHENTIC_BY_ELECTIONS);
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

            mapped.push({
              id: item.id || `live-${constName}`,
              constituency: constName,
              state: item.state || 'India',
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
            const combined = [...AUTHENTIC_BY_ELECTIONS];
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
                style={{
                  backgroundColor: '#27272A',
                  borderRadius: '12px',
                  border: '1px solid #3F3F46',
                  padding: '18px 20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  transition: 'border-color 0.15s',
                  position: 'relative'
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

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
