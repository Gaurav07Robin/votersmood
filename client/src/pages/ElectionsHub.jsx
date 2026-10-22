import { Helmet } from 'react-helmet-async';
import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../api/client';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import List from 'lucide-react/dist/esm/icons/list';
import ChevronDown from 'lucide-react/dist/esm/icons/chevron-down';
import { getPartyColor, getPartySymbol, getPartyFlag } from '../utils/party_utils';
import localStateMetadata from '../data/state_elections_metadata.json';
import localLokSabhaMetadata from '../data/lok_sabha_metadata.json';
import ByElectionsView from '../components/ByElectionsView';
import MunicipalView from '../components/MunicipalView';

const CustomXAxisTick = ({ x, y, payload }) => {
  const symbol = getPartySymbol(payload.value);
  return (
    <g transform={`translate(${x},${y})`}>
      <text x={0} y={0} dy={16} textAnchor="middle" fill="#A1A1AA" fontSize={12} fontWeight="bold">
        {symbol} {payload.value}
      </text>
    </g>
  );
};

const historicalStateMap = {
  'madras': 'Tamil Nadu',
  'mysore': 'Karnataka',
  'orissa': 'Odisha',
  'pondicherry': 'Puducherry',
  'uttaranchal': 'Uttarakhand',
  'jammu and kashmir': 'Jammu & Kashmir'
};

const normalizeStateName = (name) => {
  if (!name) return '';
  const clean = name.replace(/_/g, ' ').trim();
  return historicalStateMap[clean.toLowerCase()] || clean;
};

const formattedLocalLS = (localLokSabhaMetadata || []).map(d => {
  const pw = d.party_wins || d.partyWins || {};
  const incSeats = (pw['INC'] || 0) + (pw['INC(I)'] || 0) + (pw['INC(R)'] || 0);
  const bjpSeats = (pw['BJP'] || 0) + (pw['BJS'] || 0);
  const total = d.total_seats || d.totalSeats || 543;
  const othersSeats = total - incSeats - bjpSeats;
  return {
    ...d,
    total_seats: total,
    party_wins: pw,
    INC: incSeats,
    BJP: bjpSeats,
    Others: othersSeats > 0 ? othersSeats : 0
  };
});

export default function ElectionsHub({ 
  onSelectYear,
  initialType = 'LOK_SABHA',
  initialSelectedState = 'Maharashtra',
  initialSelectedYear = 2024,
  onTypeChange,
  onStateChange,
  onYearChange,
  onSelectConstituency,
  onSelectByElection
}) {
  useEffect(() => {
    let isMounted = true;
    api.getLiveElections().then(data => {
      if (isMounted) setLiveElections(data || []);
    }).catch(e => console.error(e));
    return () => { isMounted = false; };
  }, []);

  const [loading, setLoading] = useState(false);
  const [liveElections, setLiveElections] = useState([]);
  const [electionType, setElectionType] = useState(initialType || 'LOK_SABHA');

  useEffect(() => {
    if (initialType && initialType !== electionType) {
      setElectionType(initialType);
    }
  }, [initialType]);
  
  // Lok Sabha State (Initialized with 18 historical general elections)
  const [activeYearLS, setActiveYearLS] = useState(2024);
  const [historicalData, setHistoricalData] = useState(formattedLocalLS);
  
  // State Assembly State: Year is primary (default 2024), State is filtered by selected year
  const [selectedYearAS, setSelectedYearAS] = useState(initialSelectedYear || 2024);
  const [selectedState, setSelectedState] = useState(initialSelectedState || 'Maharashtra');
  const [stateElectionData, setStateElectionData] = useState(localStateMetadata || []);
  
  const [yearDropdownOpen, setYearDropdownOpen] = useState(false);
  const [stateDropdownOpen, setStateDropdownOpen] = useState(false);
  const scrollRef = React.useRef(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest?.('.election-dropdown-container')) {
        setYearDropdownOpen(false);
        setStateDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    
    // Prevent vertical page scroll when hovering timeline
    const onWheel = (e) => {
      if (e.deltaY !== 0) {
        e.preventDefault();
        el.scrollLeft += e.deltaY;
      }
    };
    
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [electionType]);

  // Fetch Lok Sabha historical data from Firestore (merging on top of local data)
  useEffect(() => {
    async function fetchData() {
      try {
        const q = collection(db, 'elections_metadata');
        const querySnapshot = await getDocs(q);
        const data = [];
        querySnapshot.forEach(doc => {
          data.push(doc.data());
        });
        
        const LOK_SABHA_YEARS = [1952, 1957, 1962, 1967, 1971, 1977, 1980, 1984, 1989, 1991, 1996, 1998, 1999, 2004, 2009, 2014, 2019, 2024];
        
        // CRITICAL: Filter for authentic General Elections (total seats >= 400) and deduplicate by year (taking max seats)
        const mapByYear = {};
        data.forEach(d => {
          const total = d.total_seats || d.totalSeats || 0;
          if (total >= 400 && LOK_SABHA_YEARS.includes(d.year)) {
            const existingTotal = mapByYear[d.year] ? (mapByYear[d.year].total_seats || mapByYear[d.year].totalSeats || 0) : 0;
            if (!mapByYear[d.year] || existingTotal < total) {
              mapByYear[d.year] = d;
            }
          }
        });

        const majorElections = Object.values(mapByYear).sort((a, b) => a.year - b.year);
        
        if (majorElections.length > 0) {
          const chartData = majorElections.map(d => {
            const pw = d.party_wins || d.partyWins || {};
            const incSeats = (pw['INC'] || 0) + (pw['INC(I)'] || 0) + (pw['INC(R)'] || 0);
            const bjpSeats = (pw['BJP'] || 0) + (pw['BJS'] || 0);
            const total = d.total_seats || d.totalSeats || 543;
            const othersSeats = total - incSeats - bjpSeats;
            return {
              ...d,
              total_seats: total,
              party_wins: pw,
              INC: incSeats,
              BJP: bjpSeats,
              Others: othersSeats > 0 ? othersSeats : 0
            };
          });
          setHistoricalData(chartData);
        }
      } catch (error) {
        // Fallback to formattedLocalLS already initialized
      }
    }
    fetchData();
  }, []);

  // Optional background refresh of state metadata if Firestore is available
  useEffect(() => {
    if (electionType === 'ASSEMBLY' && stateElectionData.length <= localStateMetadata.length) {
      async function fetchStateData() {
        try {
          const q = collection(db, 'state_elections_metadata');
          const querySnapshot = await getDocs(q);
          const data = [];
          querySnapshot.forEach(doc => { data.push(doc.data()); });
          if (data.length > 0) {
            setStateElectionData(data);
          }
        } catch (err) {
          // Gracefully fallback to localStateMetadata already set
        }
      }
      fetchStateData();
    }
  }, [electionType, stateElectionData.length]);

  // Available election years descending (from 2024 down to 1952)
  const availableYearsAS = useMemo(() => {
    const set = new Set();
    stateElectionData.forEach(d => {
      const y = d.year || d.Year;
      if (y) set.add(y);
    });
    return Array.from(set).sort((a, b) => b - a);
  }, [stateElectionData]);

  // List of all unique states with their latest election year
  const allStatesWithLatestYear = useMemo(() => {
    const map = new Map();
    stateElectionData.forEach(d => {
      const norm = normalizeStateName(d.state || d.State);
      const y = d.year || d.Year;
      if (norm && y) {
        if (!map.has(norm) || y > map.get(norm)) {
          map.set(norm, y);
        }
      }
    });
    return Array.from(map.entries())
      .map(([name, latestYear]) => ({ name, latestYear }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [stateElectionData]);

  // Available states holding elections in the chosen year
  const availableStatesForYear = useMemo(() => {
    const statesInYear = new Set();
    stateElectionData.forEach(d => {
      const y = d.year || d.Year;
      if (y === selectedYearAS) {
        const norm = normalizeStateName(d.state || d.State);
        if (norm) statesInYear.add(norm);
      }
    });
    return Array.from(statesInYear).sort();
  }, [stateElectionData, selectedYearAS]);

  // If currently selected state didn't have an election in selectedYearAS, auto-pick first available state
  useEffect(() => {
    if (availableStatesForYear.length > 0) {
      if (!availableStatesForYear.includes(selectedState)) {
        const nextState = availableStatesForYear[0];
        setSelectedState(nextState);
        onStateChange?.(nextState);
      }
    }
  }, [availableStatesForYear, selectedState, onStateChange]);

  const handleYearSelect = (year) => {
    setSelectedYearAS(year);
    onYearChange?.(year);
    setYearDropdownOpen(false);

    // If current state did not hold an election in this year, auto-switch to a state in this year
    const statesInYear = [];
    stateElectionData.forEach(d => {
      if ((d.year || d.Year) === year) {
        const norm = normalizeStateName(d.state || d.State);
        if (norm && !statesInYear.includes(norm)) statesInYear.push(norm);
      }
    });
    if (statesInYear.length > 0 && !statesInYear.includes(selectedState)) {
      setSelectedState(statesInYear[0]);
      onStateChange?.(statesInYear[0]);
    }
  };

  const handleStateSelect = (st) => {
    setSelectedState(st);
    onStateChange?.(st);
    setStateDropdownOpen(false);

    // If the selected state did not hold an election in selectedYearAS, automatically switch to its latest election year!
    const targetNorm = (st || '').toLowerCase().trim();
    const stElections = stateElectionData
      .filter(d => normalizeStateName(d.state || d.State).toLowerCase() === targetNorm)
      .map(d => d.year || d.Year)
      .filter(Boolean)
      .sort((a, b) => b - a);

    if (stElections.length > 0 && !stElections.includes(selectedYearAS)) {
      setSelectedYearAS(stElections[0]);
      onYearChange?.(stElections[0]);
    }
  };

  const handleTypeSwitch = (typeId) => {
    setElectionType(typeId);
    onTypeChange?.(typeId);
    if (typeId === 'LOK_SABHA') {
      window.history.pushState({}, '', '/elections/lok-sabha');
    } else if (typeId === 'ASSEMBLY') {
      window.history.pushState({}, '', '/elections/state');
    } else if (typeId === 'BY_ELECTION') {
      window.history.pushState({}, '', '/elections/by-elections');
    } else if (typeId === 'MUNICIPAL') {
      window.history.pushState({}, '', '/elections/municipal');
    }
  };

  // State docs for the entire historical timeline of the selected state
  const stateDocs = useMemo(() => {
    const target = (selectedState || '').toLowerCase().trim();
    return stateElectionData.filter(d => normalizeStateName(d.state).toLowerCase() === target);
  }, [stateElectionData, selectedState]);

  const maxStateSeats = stateDocs.reduce((max, d) => Math.max(max, d.totalSeats || d.total_seats || 0), 0);

  const filteredStateData = useMemo(() => {
    // Map to ensure each year only has 1 general election entry (taking the one with max seats)
    const map = {};
    stateDocs.forEach(d => {
      const y = d.year || d.Year;
      const total = d.totalSeats || d.total_seats || 0;
      if (y && total >= Math.max(15, maxStateSeats * 0.4)) {
        if (!map[y] || (map[y].totalSeats || map[y].total_seats || 0) < total) {
          map[y] = d;
        }
      }
    });

    return Object.values(map)
      .sort((a, b) => (a.year || a.Year) - (b.year || b.Year))
      .map(d => {
          const total = d.totalSeats || d.total_seats || 0;
          const pw = d.partyWins || d.party_wins || {};
          const inc = (pw['INC'] || 0) + (pw['INC(I)'] || 0) + (pw['INC(R)'] || 0);
          const bjp = (pw['BJP'] || 0) + (pw['BJS'] || 0);
          const rest = total - inc - bjp;
          return {
              ...d,
              year: d.year || d.Year,
              total_seats: total,
              party_wins: pw,
              INC: inc,
              BJP: bjp,
              Others: rest > 0 ? rest : 0
          };
      });
  }, [stateDocs, maxStateSeats]);

  const isLS = electionType === 'LOK_SABHA';
  const isAS = electionType === 'ASSEMBLY';
  const currentData = isLS ? historicalData : (isAS ? filteredStateData : []);

  // In State Assembly mode, the active year is selectedYearAS (or the closest available year in filteredStateData)
  const activeYearAS = useMemo(() => {
    if (filteredStateData.find(d => d.year === selectedYearAS)) {
      return selectedYearAS;
    }
    if (selectedYearAS === 2026) return 2026;
    if (filteredStateData.length > 0) {
      return filteredStateData[filteredStateData.length - 1].year;
    }
    return selectedYearAS;
  }, [selectedYearAS, filteredStateData]);

  const activeYear = isLS ? activeYearLS : activeYearAS;
  const setActiveYearFunc = (year) => {
    if (isLS) {
      setActiveYearLS(year);
    } else {
      handleYearSelect(year);
    }
  };

  const getTopParties = (year) => {
    const yearData = currentData.find(d => d.year === year);
    if (!yearData || !yearData.party_wins) return [];
    
    return Object.entries(yearData.party_wins)
      .map(([party, seats]) => ({ party, seats, total: yearData.total_seats }))
      .sort((a, b) => b.seats - a.seats)
      .slice(0, 10);
  };

  const topParties = getTopParties(activeYear);
  const maxSeats = topParties.length > 0 ? topParties[0].seats : 1;

  if (loading) {
    return <div style={{ color: '#fff', padding: '40px' }}>Loading historical archive...</div>;
  }

  // Calculate dynamic width for timeline to prevent cramping
  // We just want it to fit 100% now without horizontal scroll
  const timelineWidth = 100;

  return (
    <div style={{ backgroundColor: '#18181B', minHeight: '100vh', color: '#E4E4E7', padding: '24px', overflowX: 'hidden', fontFamily: 'Inter, sans-serif' }}>

      <Helmet>
        <title>
          {electionType === 'LOK_SABHA' 
            ? 'Lok Sabha Election Results (1952–2024): General Elections Timeline & Party Tally | Opinar'
            : electionType === 'ASSEMBLY'
            ? `${selectedState} Assembly Election Results (1952–2026): Vidhan Sabha Seat Breakdowns | Opinar`
            : electionType === 'BY_ELECTION'
            ? 'Live By-Election Radar India (2024–2026): Assembly & Lok Sabha Bypolls | Opinar'
            : 'Municipal Election Results India (1952–2026): Mahanagar Palika, Wards & Mayors | Opinar'}
        </title>
        <meta 
          name="description" 
          content={electionType === 'LOK_SABHA'
            ? 'Explore official Lok Sabha parliamentary election results across 543 constituencies from 1952 to 2024. View party vote shares, majorities, and historical winning trends on Opinar.'
            : electionType === 'ASSEMBLY'
            ? `Historical and live Vidhan Sabha assembly election results in ${selectedState} across all constituencies since 1952. Party seat shares, vote margins, and government formations.`
            : electionType === 'BY_ELECTION'
            ? 'Live tracking of Indian by-elections, candidate nominations, voter turnouts, and margins across Wayanad, Karhal, Dausa, and key parliamentary and assembly seats.'
            : 'Explore municipal corporation and local body elections across Mumbai BMC, Delhi MCD, Kolkata KMC, and urban councils. Party majorities and ward standings.'}
        />
        <meta 
          name="keywords" 
          content={electionType === 'LOK_SABHA'
            ? 'Lok Sabha election results, Indian general elections 1952 to 2024, Lok Sabha party tally, parliamentary election winners, who won Lok Sabha majority, general election seat share India, complete list of Lok Sabha election results year wise, national election commission data India'
            : electionType === 'ASSEMBLY'
            ? `${selectedState} assembly election results, Vidhan Sabha election, state elections India, ${selectedState} party seats tally, state election winners, historical state assembly election results since 1952, who formed government in ${selectedState}, state assembly election seat breakdown`
            : electionType === 'BY_ELECTION'
            ? 'by election results, bypoll results 2024, by elections India, assembly and parliamentary by-elections, live by-election tracker, upcoming bypoll candidates, who won Wayanad by election, state by election results live updates, why was by election held'
            : 'municipal election results, mahanagar palika results, mcd delhi results 2022, bmc mumbai election 2017, kmc kolkata results, ghmc hyderabad, nagar palika results, nagar parishad, nagar panchayat, who won municipal corporation election, ward results india'}
        />
        <link 
          rel="canonical" 
          href={electionType === 'LOK_SABHA' 
            ? 'https://www.opinar.in/elections/lok-sabha'
            : electionType === 'ASSEMBLY'
            ? `https://www.opinar.in/elections/state/${selectedState.toLowerCase().replace(/\s+/g, '-')}`
            : electionType === 'BY_ELECTION'
            ? 'https://www.opinar.in/elections/by-elections'
            : 'https://www.opinar.in/elections/municipal'} 
        />

        <meta property="og:title" content="Elections Hub | Opinar" />
        <meta property="og:description" content="Explore historical and live election results across India." />
        <meta property="og:url" content="https://www.opinar.in/elections" />
        <meta property="og:type" content="website" />
      </Helmet>

      
      {/* CSS to hide scrollbar but keep it functional */}
      <style dangerouslySetInnerHTML={{__html: `
        .hide-scroll::-webkit-scrollbar { display: none; }
        .hide-scroll { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />

      {/* HEADER SECTION */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '36px', fontWeight: 800, color: '#FFFFFF', margin: 0, letterSpacing: '-0.5px' }}>
            {electionType === 'LOK_SABHA' ? 'Lok Sabha Historical Results' : 
             electionType === 'ASSEMBLY' ? 'State Assembly Elections' :
             electionType === 'MUNICIPAL' ? 'Municipal Elections' : 'By-Elections'}
          </h1>
          <p style={{ color: '#A1A1AA', fontSize: '15px', margin: '8px 0 0 0' }}>
            {electionType === 'LOK_SABHA' ? "A 75-year timeline of India's parliamentary elections" :
             electionType === 'ASSEMBLY' ? "State assembly election historical data" :
             electionType === 'MUNICIPAL' ? "Municipal and urban local body election mapping" :
             "Recent and scheduled by-elections across parliamentary and assembly seats"}
          </p>
        </div>

        {/* ELECTION TYPE SWITCHER UI */}
        <div style={{ display: 'flex', gap: '4px', backgroundColor: '#27272A', padding: '6px', borderRadius: '12px', border: '1px solid #3F3F46', flexWrap: 'wrap' }}>
          {[
            { id: 'LOK_SABHA', label: 'Lok Sabha', icon: '🏛️' },
            { id: 'ASSEMBLY', label: 'State Assembly', icon: '🗺️' },
            { id: 'MUNICIPAL', label: 'Municipal', icon: '🏙️' },
            { id: 'BY_ELECTION', label: 'By-Election', icon: '🔄' }
          ].map(type => (
            <button
              key={type.id}
              onClick={() => handleTypeSwitch(type.id)}
              style={{
                backgroundColor: electionType === type.id ? '#3F3F46' : 'transparent',
                color: electionType === type.id ? '#FFFFFF' : '#A1A1AA',
                border: 'none',
                borderRadius: '8px',
                padding: '8px 14px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s',
                boxShadow: electionType === type.id ? '0 2px 4px rgba(0,0,0,0.2)' : 'none'
              }}
            >
              <span style={{ fontSize: '14px' }}>{type.icon}</span> {type.label}
            </button>
          ))}
        </div>
      </div>

      {electionType === 'MUNICIPAL' && (
        <MunicipalView />
      )}

      {electionType === 'BY_ELECTION' && (
        <ByElectionsView 
          defaultLevel="ALL"
          onSelectConstituency={onSelectConstituency}
          onSelectYear={onSelectYear}
          onSelectByElection={onSelectByElection}
        />
      )}

      {(isLS || isAS) && (<>
      {/* TOP CHART: ALL-TIME TREND */}
      <div style={{ backgroundColor: '#27272A', borderRadius: '12px', padding: '24px', marginBottom: '24px', minHeight: '350px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ fontSize: '14px', color: '#A1A1AA', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>
            {isLS ? 'All-Time Historical Trend' : `${selectedState} Historical Trend`}
          </div>
          
          {isAS && (
            <div className="election-dropdown-container" style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', position: 'relative', zIndex: 50 }}>
              
              {/* DROPDOWN 1: YEAR FIRST (Default: 2026, spans 2026 to 1952) */}
              <div style={{ position: 'relative' }}>
                <div 
                  onClick={() => { setYearDropdownOpen(!yearDropdownOpen); setStateDropdownOpen(false); }}
                  style={{ 
                    backgroundColor: '#18181B', color: '#fff', border: '1px solid #3F3F46', borderRadius: '8px', 
                    padding: '8px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', 
                    minWidth: '135px', justifyContent: 'space-between', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' 
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '12px', color: '#A1A1AA' }}>Year:</span>
                    <span style={{ fontWeight: 700, fontSize: '14px', color: '#3B82F6' }}>{selectedYearAS}</span>
                  </div>
                  <ChevronDown size={16} color="#A1A1AA" />
                </div>
                {yearDropdownOpen && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: '6px', width: '165px', backgroundColor: '#18181B', border: '1px solid #3F3F46', borderRadius: '8px', maxHeight: '280px', overflowY: 'auto', zIndex: 100, boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }} className="hide-scroll">
                    {availableYearsAS.map(y => (
                      <div 
                        key={y} 
                        onClick={() => handleYearSelect(y)}
                        style={{ 
                          padding: '10px 14px', cursor: 'pointer', 
                          backgroundColor: y === selectedYearAS ? '#27272A' : 'transparent', 
                          color: y === selectedYearAS ? '#3B82F6' : '#E4E4E7', 
                          fontWeight: y === selectedYearAS ? 700 : 500, fontSize: '14px',
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                        }}
                        onMouseEnter={(e) => { if (y !== selectedYearAS) { e.currentTarget.style.backgroundColor = '#27272A'; } }}
                        onMouseLeave={(e) => { if (y !== selectedYearAS) { e.currentTarget.style.backgroundColor = 'transparent'; } }}
                      >
                        <span>{y}</span>
                        {y === 2024 && <span style={{ fontSize: '10px', color: '#10B981', backgroundColor: '#10B98120', padding: '1px 5px', borderRadius: '4px' }}>Latest</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* DROPDOWN 2: STATE SECOND (Filtered by selected year & all states access) */}
              <div style={{ position: 'relative' }}>
                <div 
                  onClick={() => { setStateDropdownOpen(!stateDropdownOpen); setYearDropdownOpen(false); }}
                  style={{ 
                    backgroundColor: '#18181B', color: '#fff', border: '1px solid #3F3F46', borderRadius: '8px', 
                    padding: '8px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', 
                    minWidth: '220px', justifyContent: 'space-between', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' 
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '12px', color: '#A1A1AA' }}>State:</span>
                    <span style={{ fontWeight: 600, fontSize: '14px', color: '#FFFFFF' }}>{selectedState}</span>
                  </div>
                  <ChevronDown size={16} color="#A1A1AA" />
                </div>
                {stateDropdownOpen && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '6px', minWidth: '260px', backgroundColor: '#18181B', border: '1px solid #3F3F46', borderRadius: '8px', maxHeight: '320px', overflowY: 'auto', zIndex: 100, boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }} className="hide-scroll">
                    {availableStatesForYear.length > 0 && (
                      <div>
                        <div style={{ padding: '8px 14px', fontSize: '11px', color: '#3B82F6', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          Elections in {selectedYearAS} ({availableStatesForYear.length})
                        </div>
                        {availableStatesForYear.map(s => (
                          <div 
                            key={`year-${s}`} 
                            onClick={() => handleStateSelect(s)}
                            style={{ 
                              padding: '8px 16px', cursor: 'pointer', 
                              backgroundColor: s === selectedState ? '#27272A' : 'transparent', 
                              color: s === selectedState ? '#3B82F6' : '#FFFFFF', 
                              fontWeight: s === selectedState ? 700 : 500, fontSize: '13px',
                              display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                            }}
                            onMouseEnter={(e) => { if (s !== selectedState) { e.currentTarget.style.backgroundColor = '#27272A'; } }}
                            onMouseLeave={(e) => { if (s !== selectedState) { e.currentTarget.style.backgroundColor = 'transparent'; } }}
                          >
                            <span>{s}</span>
                            <span style={{ fontSize: '10px', color: '#10B981', backgroundColor: '#10B98120', padding: '1px 5px', borderRadius: '4px' }}>Active</span>
                          </div>
                        ))}
                      </div>
                    )}

                    <div style={{ padding: '8px 14px', fontSize: '11px', color: '#A1A1AA', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', borderTop: '1px solid #27272A', marginTop: '4px' }}>
                      All States & UTs ({allStatesWithLatestYear.length})
                    </div>
                    {allStatesWithLatestYear.map(item => (
                      <div 
                        key={`all-${item.name}`} 
                        onClick={() => handleStateSelect(item.name)}
                        style={{ 
                          padding: '8px 16px', cursor: 'pointer', 
                          backgroundColor: item.name === selectedState ? '#27272A' : 'transparent', 
                          color: item.name === selectedState ? '#3B82F6' : '#A1A1AA', 
                          fontWeight: item.name === selectedState ? 700 : 500, fontSize: '13px',
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                        }}
                        onMouseEnter={(e) => { if (item.name !== selectedState) { e.currentTarget.style.backgroundColor = '#27272A'; e.currentTarget.style.color = '#fff'; } }}
                        onMouseLeave={(e) => { if (item.name !== selectedState) { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#A1A1AA'; } }}
                      >
                        <span>{item.name}</span>
                        <span style={{ fontSize: '11px', color: '#71717A', backgroundColor: '#27272A', padding: '1px 5px', borderRadius: '4px' }}>{item.latestYear}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          )}
        </div>
        
        {currentData.length > 0 ? (
        <div style={{ width: '100%', height: '300px' }}>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={currentData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#3F3F46" vertical={false} />
              <XAxis dataKey="year" stroke="#A1A1AA" tickLine={false} axisLine={false} />
              <YAxis stroke="#A1A1AA" tickLine={false} axisLine={false} tick={{fill: '#71717A'}} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#18181B', border: '1px solid #3F3F46', borderRadius: '8px', color: '#fff' }}
                itemStyle={{ fontWeight: 'bold' }}
              />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
              <Line type="monotone" dataKey="INC" name="INC Seats" stroke={getPartyColor('INC')} strokeWidth={3} dot={{r: 4, fill: getPartyColor('INC')}} activeDot={{r: 6}} />
              <Line type="monotone" dataKey="BJP" name="BJP Seats" stroke={getPartyColor('BJP')} strokeWidth={3} dot={{r: 4, fill: getPartyColor('BJP')}} activeDot={{r: 6}} />
              {isAS && <Line type="monotone" dataKey="party_wins.TMC" name="TMC Seats" stroke="#22C55E" strokeWidth={3} dot={{r: 4}} activeDot={{r: 6}} />}
              {isAS && <Line type="monotone" dataKey="party_wins.SP" name="SP Seats" stroke="#EF4444" strokeWidth={3} dot={{r: 4}} activeDot={{r: 6}} />}
              {isAS && <Line type="monotone" dataKey="party_wins.AAP" name="AAP Seats" stroke="#06B6D4" strokeWidth={3} dot={{r: 4}} activeDot={{r: 6}} />}
              <Line type="monotone" dataKey="Others" name="Other Parties" stroke="#71717A" strokeWidth={2} strokeDasharray="5 5" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        ) : (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px', color: '#A1A1AA' }}>
             No historical data available for {isLS ? 'Lok Sabha' : selectedState}.
          </div>
        )}
      </div>

      {/* TIMELINE SCRUBBER */}
      <div style={{ backgroundColor: '#27272A', borderRadius: '12px', padding: '24px', marginBottom: '24px' }}>
        <div style={{ fontSize: '16px', fontWeight: 600, color: '#FFFFFF', marginBottom: '24px' }}>
          Timeline of {isLS ? 'Lok Sabha' : selectedState} Elections <span style={{ color: '#71717A', fontWeight: 400 }}>({currentData[0]?.year || 1951} - {currentData[currentData.length-1]?.year || 2024})</span>
        </div>
        
                <div 
          ref={scrollRef}
          className="hide-scroll" 
          style={{ overflowX: 'auto', overflowY: 'hidden', paddingBottom: '32px', paddingTop: '10px', minHeight: '60px' }}
        >
          <div style={{ position: 'relative', height: '4px', backgroundColor: '#3F3F46', borderRadius: '2px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '0 20px', minWidth: `${timelineWidth}%` }}>
            {currentData.map((data, idx) => {
              const isActive = data.year === activeYear;
              return (
                <div 
                  key={data.year} 
                  onClick={() => {
                    setActiveYearFunc(data.year);
                  }}
                  style={{ position: 'relative', cursor: 'pointer', flex: 1, display: 'flex', justifyContent: 'center' }}
                >
                  {isActive ? (
                    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', backgroundColor: '#3B82F6', borderRadius: '12px', padding: '4px 12px', color: 'white', fontSize: '12px', fontWeight: 'bold', zIndex: 10 }}>
                      {data.year}
                    </div>
                  ) : (
                    <>
                      <div style={{ width: '10px', height: '10px', backgroundColor: '#A1A1AA', borderRadius: '50%', position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }} />
                      <div style={{ position: 'absolute', top: '24px', left: '50%', transform: 'translateX(-50%)', color: '#A1A1AA', fontSize: '12px', whiteSpace: 'nowrap' }}>
                        {data.year}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* DYNAMIC PROPORTIONAL YEAR CARDS */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div style={{ fontSize: '22px', fontWeight: 700, color: '#fff' }}>
          Top 10 Parties ({activeYear})
        </div>
      </div>
      
      <div style={{ 
        display: 'flex', 
        flexWrap: 'wrap', 
        gap: '24px', 
        paddingBottom: '40px',
        alignItems: 'center'
      }}>
        {topParties.map((data, index) => {
          const themeColor = getPartyColor(data.party);
          const scaleRatio = 0.65 + (0.35 * (data.seats / maxSeats));
          
          return (
            <div key={data.party} style={{ 
              width: '320px',
              backgroundColor: '#27272A', 
              borderRadius: '12px', 
              padding: '24px', 
              border: '1px solid #3F3F46',
              transform: `scale(${scaleRatio})`,
              transformOrigin: 'left center',
              marginRight: `-${320 * (1 - scaleRatio)}px`,
              boxShadow: index === 0 ? `0 0 20px ${themeColor}40` : 'none'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <span style={{ fontSize: '28px', fontWeight: 800, color: '#FFFFFF' }}>#{index + 1}</span>
                <div style={{ marginLeft: 'auto', backgroundColor: '#3F3F46', padding: '4px 8px', borderRadius: '6px', fontSize: '14px', color: '#D4D4D8', fontWeight: 'bold' }}>
                  {data.party}
                </div>
              </div>

              {/* Banner Area */}
              <div style={{ 
                height: '100px', 
                borderRadius: '8px', 
                background: `linear-gradient(90deg, #18181B 0%, ${themeColor} 100%)`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-end',
                padding: '0 24px',
                marginBottom: '16px',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div style={{ width: '80px', height: '90px', backgroundColor: '#000', borderTopLeftRadius: '40px', borderTopRightRadius: '40px', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '42px' }}>
                   {getPartyFlag(data.party) ? (
                     <img src={getPartyFlag(data.party)} alt={`${data.party} flag`} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '12px' }} />
                   ) : (
                     getPartySymbol(data.party)
                   )}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '22px', color: '#FFFFFF', fontWeight: 700 }}>{data.seats} <span style={{ color: '#A1A1AA', fontSize: '14px', fontWeight: 400 }}>seats</span></div>
                  <div style={{ fontSize: '14px', color: themeColor, marginTop: '4px', fontWeight: 'bold' }}>
                    {((data.seats / data.total) * 100).toFixed(1)}% of {isLS ? 'Lok Sabha' : 'State Assembly'}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* FLOATING ACTION BUTTON */}
      <button
        onClick={() => onSelectYear(activeYear, isLS, selectedState)}
        style={{
          position: 'fixed',
          bottom: '40px',
          right: '40px',
          backgroundColor: '#3B82F6',
          color: '#FFF',
          padding: '16px 28px',
          borderRadius: '30px',
          border: 'none',
          fontWeight: 700,
          fontSize: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          boxShadow: '0 8px 24px rgba(59, 130, 246, 0.4)',
          cursor: 'pointer',
          zIndex: 1000,
          transition: 'transform 0.2s ease, background-color 0.2s ease'
        }}
        onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.backgroundColor = '#2563EB'; }}
        onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.backgroundColor = '#3B82F6'; }}
      >
        <List size={20} /> Explore {activeYear} {isLS ? 'Lok Sabha' : selectedState} Directory
      </button>
      </>)}

    </div>
  );
}
