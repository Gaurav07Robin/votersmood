import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { List } from 'lucide-react';
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
  const [activeYear, setActiveYear] = useState(2024);
  const [historicalData, setHistoricalData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const q = collection(db, 'elections_metadata');
        const querySnapshot = await getDocs(q);
        const data = [];
        querySnapshot.forEach(doc => {
          data.push(doc.data());
        });
        
        // Define major Lok Sabha election years
        const LOK_SABHA_YEARS = [1952, 1957, 1962, 1967, 1971, 1977, 1980, 1984, 1989, 1991, 1996, 1998, 1999, 2004, 2009, 2014, 2019, 2024];
        
        // Filter out by-election years (which have very few seats) to only keep General Elections
        const majorElections = data.filter(d => LOK_SABHA_YEARS.includes(d.year) || d.total_seats > 400);
        
        // Sort chronologically
        majorElections.sort((a, b) => a.year - b.year);
        
        // Flatten data for Recharts (extract INC, BJP, and Others)
        const chartData = majorElections.map(d => {
          const incSeats = d.party_wins?.['INC'] || 0;
          const bjpSeats = (d.party_wins?.['BJP'] || 0) + (d.party_wins?.['BJS'] || 0); // Include BJS (precursor to BJP)
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
          setActiveYear(chartData[chartData.length - 1].year);
        }
      } catch (error) {
        console.error("Error fetching historical data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const getTopParties = (year) => {
    const yearData = historicalData.find(d => d.year === year);
    if (!yearData) return [];
    
    // Sort parties by seats won
    const sortedParties = Object.entries(yearData.party_wins)
      .map(([party, seats]) => ({ party, seats, total: yearData.total_seats }))
      .sort((a, b) => b.seats - a.seats)
      .slice(0, 10);
    
    return sortedParties;
  };

  const topParties = getTopParties(activeYear);
  const maxSeats = topParties.length > 0 ? topParties[0].seats : 1;

  if (loading) {
    return <div style={{ color: '#fff', padding: '40px' }}>Loading historical archive...</div>;
  }

  return (
    <div style={{ backgroundColor: '#18181B', minHeight: '100vh', color: '#E4E4E7', padding: '24px', overflowX: 'hidden', fontFamily: 'Inter, sans-serif' }}>
      
      {/* HEADER SECTION */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '36px', fontWeight: 800, color: '#FFFFFF', margin: 0, letterSpacing: '-0.5px' }}>
            Lok Sabha Historical Results
          </h1>
          <p style={{ color: '#A1A1AA', fontSize: '16px', margin: '8px 0 0 0' }}>
            A 75-year timeline of India's parliamentary elections
          </p>
        </div>
      </div>

      {/* TOP CHART: ALL-TIME TREND */}
      <div style={{ backgroundColor: '#27272A', borderRadius: '12px', padding: '24px', marginBottom: '24px', height: '350px' }}>
        <div style={{ fontSize: '14px', color: '#A1A1AA', marginBottom: '8px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>
          All-Time Historical Trend
        </div>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={historicalData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
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
            <Line type="monotone" dataKey="Others" name="Other Parties" stroke="#71717A" strokeWidth={2} strokeDasharray="5 5" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* TIMELINE SCRUBBER */}
      <div style={{ backgroundColor: '#27272A', borderRadius: '12px', padding: '24px', marginBottom: '24px' }}>
        <div style={{ fontSize: '16px', fontWeight: 600, color: '#FFFFFF', marginBottom: '24px' }}>
          Timeline of Lok Sabha Elections <span style={{ color: '#71717A', fontWeight: 400 }}>({historicalData[0]?.year || 1951} - {historicalData[historicalData.length-1]?.year || 2024})</span>
        </div>
        
        <div style={{ overflowX: 'hidden', overflowY: 'hidden', paddingBottom: '32px', paddingTop: '10px', minHeight: '60px' }}>
          <div style={{ position: 'relative', height: '4px', backgroundColor: '#3F3F46', borderRadius: '2px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '0 20px', minWidth: '100%' }}>
            {historicalData.map((data) => {
              const isActive = data.year === activeYear;
              return (
                <div 
                  key={data.year} 
                  onClick={() => {
                    setActiveYear(data.year);
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
                    {((data.seats / data.total) * 100).toFixed(1)}% of Lok Sabha
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
        <List size={20} /> Explore {activeYear} Directory
      </button>

    </div>
  );
}
