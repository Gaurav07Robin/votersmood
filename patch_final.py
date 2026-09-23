import sys

content = """import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { List, ChevronDown } from 'lucide-react';
import { getPartyColor, getPartySymbol, getPartyFlag } from '../utils/party_utils';

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

export default function ElectionsHub({ onSelectYear }) {
  const [loading, setLoading] = useState(true);
  const [electionType, setElectionType] = useState('LOK_SABHA');
  
  // Lok Sabha State
  const [activeYearLS, setActiveYearLS] = useState(2024);
  const [historicalData, setHistoricalData] = useState([]);
  
  // Assembly State
  const [activeYearAS, setActiveYearAS] = useState(0);
  const [stateElectionData, setStateElectionData] = useState([]);
  const [selectedState, setSelectedState] = useState('Uttar Pradesh');
  const [dropdownOpen, setDropdownOpen] = useState(false);

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

  useEffect(() => {
    if (electionType === 'ASSEMBLY' && stateElectionData.length === 0) {
      async function fetchStateData() {
        const q = collection(db, 'state_elections_metadata');
        const querySnapshot = await getDocs(q);
        const data = [];
        querySnapshot.forEach(doc => { data.push(doc.data()); });
        setStateElectionData(data);
      }
      fetchStateData();
    }
  }, [electionType, stateElectionData.length]);

  const uniqueStates = [...new Set(stateElectionData.map(d => d.state))].sort();
  const filteredStateData = stateElectionData
    .filter(d => d.state === selectedState)
    .sort((a, b) => a.year - b.year)
    .map(d => {
        const total = d.totalSeats || 0;
        const inc = d.partyWins?.['INC'] || 0;
        const bjp = (d.partyWins?.['BJP'] || 0) + (d.partyWins?.['BJS'] || 0);
        const rest = total - inc - bjp;
        return {
            ...d,
            total_seats: total,
            party_wins: d.partyWins,
            INC: inc,
            BJP: bjp,
            Others: rest > 0 ? rest : 0
        };
    });

  useEffect(() => {
    if (filteredStateData.length > 0) {
        if (!filteredStateData.find(d => d.year === activeYearAS)) {
            setActiveYearAS(filteredStateData[filteredStateData.length - 1].year);
        }
    }
  }, [selectedState, filteredStateData, activeYearAS]);

  const isLS = electionType === 'LOK_SABHA';
  const isAS = electionType === 'ASSEMBLY';
  const currentData = isLS ? historicalData : (isAS ? filteredStateData : []);
  const activeYear = isLS ? activeYearLS : activeYearAS;
  const setActiveYearFunc = isLS ? setActiveYearLS : setActiveYearAS;

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
  const timelineWidth = Math.max(100, currentData.length * 6); // roughly 6% per item, or fixed pixels

  return (
    <div style={{ backgroundColor: '#18181B', minHeight: '100vh', color: '#E4E4E7', padding: '24px', overflowX: 'hidden', fontFamily: 'Inter, sans-serif' }}>
      
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
              onClick={() => setElectionType(type.id)}
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
      <div style={{ backgroundColor: '#27272A', borderRadius: '12px', padding: '24px', marginBottom: '24px', height: '350px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ fontSize: '14px', color: '#A1A1AA', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>
            {isLS ? 'All-Time Historical Trend' : 'State Historical Trend'}
          </div>
          {isAS && (
            <div style={{ position: 'relative', zIndex: 50 }}>
              <div 
                onClick={() => setDropdownOpen(!dropdownOpen)}
                style={{ backgroundColor: '#18181B', color: '#fff', border: '1px solid #3F3F46', borderRadius: '8px', padding: '8px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', minWidth: '220px', justifyContent: 'space-between', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
              >
                <span style={{ fontWeight: 600, fontSize: '14px' }}>{selectedState}</span>
                <ChevronDown size={16} color="#A1A1AA" />
              </div>
              {dropdownOpen && (
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '8px', backgroundColor: '#18181B', border: '1px solid #3F3F46', borderRadius: '8px', maxHeight: '300px', overflowY: 'auto', zIndex: 100, boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }} className="hide-scroll">
                  {uniqueStates.map(s => (
                    <div 
                      key={s} 
                      onClick={() => { setSelectedState(s); setDropdownOpen(false); }}
                      style={{ padding: '12px 16px', cursor: 'pointer', backgroundColor: s === selectedState ? '#27272A' : 'transparent', color: s === selectedState ? '#fff' : '#A1A1AA', transition: 'background 0.2s', fontSize: '14px', fontWeight: 500 }}
                      onMouseEnter={(e) => { if(s !== selectedState) { e.currentTarget.style.backgroundColor = '#27272A'; e.currentTarget.style.color = '#fff'; } }}
                      onMouseLeave={(e) => { if(s !== selectedState) { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#A1A1AA'; } }}
                    >
                      {s}
                    </div>
                  ))}
                </div>
              )}
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
        
        <div className="hide-scroll" style={{ overflowX: 'auto', overflowY: 'hidden', paddingBottom: '32px', paddingTop: '10px', minHeight: '60px' }}>
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
        onClick={() => onSelectYear(activeYear)}
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
"""

with open('client/src/pages/ElectionsHub.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("done")
