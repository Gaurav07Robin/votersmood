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
  'uttaranchal': 'Uttarakhand'
};

const normalizeStateName = (name) => {
  if (!name) return '';
  const clean = name.replace(/_/g, ' ').trim();
  return historicalStateMap[clean.toLowerCase()] || clean;
};

export default function ElectionsHub({ 
  onSelectYear,
  initialType = 'LOK_SABHA',
  initialSelectedState = 'Uttar Pradesh',
  initialSelectedYear = 2026,
  onTypeChange,
  onStateChange,
  onYearChange
}) {
  useEffect(() => {
    let isMounted = true;
    api.getLiveElections().then(data => {
      if (isMounted) setLiveElections(data || []);
    }).catch(e => console.error(e));
    return () => { isMounted = false; };
  }, []);

  const [loading, setLoading] = useState(true);
  const [liveElections, setLiveElections] = useState([]);
  const [electionType, setElectionType] = useState(initialType || 'LOK_SABHA');
  
  // Lok Sabha State
  const [activeYearLS, setActiveYearLS] = useState(2024);
  const [historicalData, setHistoricalData] = useState([]);
  
  // State Assembly State: Year is primary (default 2026), State is filtered by selected year
  const [selectedYearAS, setSelectedYearAS] = useState(initialSelectedYear || 2026);
  const [selectedState, setSelectedState] = useState(initialSelectedState || 'Uttar Pradesh');
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

  // Fetch Lok Sabha historical data from Firestore
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
        const majorElections = data.filter(d => LOK_SABHA_YEARS.includes(d.year) || d.total_seats > 400);
        majorElections.sort((a, b) => a.year - b.year);
        
        const chartData = majorElections.map(d => {
          const incSeats = d.party_wins?.['INC'] || 0;
          const bjpSeats = (d.party_wins?.['BJP'] || 0) + (d.party_wins?.['BJS'] || 0);
          const othersSeats = d.total_seats - incSeats - bjpSeats;
          return {
            ...d,
            INC: incSeats,
            BJP: bjpSeats,
            Others: othersSeats > 0 ? othersSeats : 0
          };
        });
        
        if (chartData.length > 0) {
          setHistoricalData(chartData);
          if (activeYearLS === 2024 && !chartData.find(m => m.year === 2024)) {
             setActiveYearLS(chartData[chartData.length - 1].year);
          }
        }
      } catch (error) {
        console.error("Error fetching historical data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [activeYearLS]);

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

  // Available election years descending (from 2026 down to 1952)
  const availableYearsAS = useMemo(() => {
    const set = new Set();
    set.add(2026);
    stateElectionData.forEach(d => {
      if (d.year) set.add(d.year);
    });
    return Array.from(set).sort((a, b) => b - a);
  }, [stateElectionData]);

  // Available states holding elections in the chosen year
  const availableStatesForYear = useMemo(() => {
    const statesInYear = new Set();
    stateElectionData.forEach(d => {
      if (d.year === selectedYearAS) {
        const norm = normalizeStateName(d.state);
        if (norm) statesInYear.add(norm);
      }
    });

    // Fallback for 2026 if not populated
    if (selectedYearAS === 2026 && statesInYear.size === 0) {
      ['Assam', 'Kerala', 'Puducherry', 'Tamil Nadu', 'West Bengal'].forEach(s => statesInYear.add(s));
    }

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
  };

  const handleStateSelect = (st) => {
    setSelectedState(st);
    onStateChange?.(st);
    setStateDropdownOpen(false);
  };

  const handleTypeSwitch = (typeId) => {
    setElectionType(typeId);
    onTypeChange?.(typeId);
  };

  // State docs for the entire historical timeline of the selected state
  const stateDocs = useMemo(() => {
    const target = (selectedState || '').toLowerCase().trim();
    return stateElectionData.filter(d => normalizeStateName(d.state).toLowerCase() === target);
  }, [stateElectionData, selectedState]);

  const maxStateSeats = stateDocs.reduce((max, d) => Math.max(max, d.totalSeats || d.total_seats || 0), 0);

  const filteredStateData = useMemo(() => {
    return stateDocs
      .filter(d => (d.totalSeats || d.total_seats || 0) >= Math.max(15, maxStateSeats * 0.4))
      .sort((a, b) => a.year - b.year)
      .map(d => {
          const total = d.totalSeats || d.total_seats || 0;
          const pw = d.partyWins || d.party_wins || {};
          const inc = pw['INC'] || 0;
          const bjp = (pw['BJP'] || 0) + (pw['BJS'] || 0);
          const rest = total - inc - bjp;
          return {
              ...d,
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
        <title>Elections Hub | Opinar</title>
        <meta name="description" content="Explore historical and live election results across India." />
        <link rel="canonical" href="https://www.opinar.in/elections" />
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
          <p style={{ color: '#A1A1AA', fontSize: '16px', margin: '8px 0 0 0' }}>
            {electionType === 'LOK_SABHA' ? "A 75-year timeline of India's parliamentary elections" :
             "State and local election historical data mapping"}
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

      {!isLS && !isAS && (
        <div style={{ textAlign: 'center', padding: '40px', backgroundColor: '#27272A', borderRadius: '12px', color: '#A1A1AA', marginBottom: '24px' }}>
          <h3 style={{ color: '#FFFFFF', fontSize: '20px', marginBottom: '8px' }}>Module Active</h3>
          <p>This section is currently being mapped with historical data.</p>
        </div>
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
                        {y === 2026 && <span style={{ fontSize: '10px', color: '#10B981', backgroundColor: '#10B98120', padding: '1px 5px', borderRadius: '4px' }}>Upcoming</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* DROPDOWN 2: STATE SECOND (Filtered by selected year) */}
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
                  <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '6px', backgroundColor: '#18181B', border: '1px solid #3F3F46', borderRadius: '8px', maxHeight: '280px', overflowY: 'auto', zIndex: 100, boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }} className="hide-scroll">
                    {availableStatesForYear.length === 0 ? (
                      <div style={{ padding: '12px 16px', color: '#71717A', fontSize: '13px' }}>
                        No assemblies in {selectedYearAS}
                      </div>
                    ) : (
                      availableStatesForYear.map(s => (
                        <div 
                          key={s} 
                          onClick={() => handleStateSelect(s)}
                          style={{ 
                            padding: '10px 16px', cursor: 'pointer', 
                            backgroundColor: s === selectedState ? '#27272A' : 'transparent', 
                            color: s === selectedState ? '#3B82F6' : '#A1A1AA', 
                            fontWeight: s === selectedState ? 700 : 500, fontSize: '14px' 
                          }}
                          onMouseEnter={(e) => { if (s !== selectedState) { e.currentTarget.style.backgroundColor = '#27272A'; e.currentTarget.style.color = '#fff'; } }}
                          onMouseLeave={(e) => { if (s !== selectedState) { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#A1A1AA'; } }}
                        >
                          {s}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

            </div>
          )}
        </div>
        
        {currentData.length > 0 ? (
        <ResponsiveContainer width="100%" height="100%">
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
        ) : (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '250px', color: '#A1A1AA' }}>
             Loading data...
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
