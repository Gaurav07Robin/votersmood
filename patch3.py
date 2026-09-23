import sys, re

with open('client/src/pages/ElectionsHub.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

# Add states if missing
if 'setElectionType' not in text:
    state_decl = '''  const [loading, setLoading] = useState(true);
  const [electionType, setElectionType] = useState('LOK_SABHA');
  const [stateElectionData, setStateElectionData] = useState([]);
  const [selectedState, setSelectedState] = useState('Uttar Pradesh');

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
  const filteredStateData = stateElectionData.filter(d => d.state === selectedState).sort((a, b) => a.year - b.year);
'''
    text = text.replace('  const [loading, setLoading] = useState(true);', state_decl)

# Update the main useEffect dependency array
text = text.replace('  }, []);', '  }, [activeYear]);')

# Replace the Header Section
header_pattern = re.compile(r'\{\/\* HEADER SECTION \*\/\}.*?<\/div>.*?<\/div>', re.DOTALL)
new_header = '''{/* HEADER SECTION */}
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
      
      {electionType === 'ASSEMBLY' && (
        <div style={{ backgroundColor: '#27272A', borderRadius: '12px', padding: '24px', marginBottom: '24px', minHeight: '350px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ fontSize: '14px', color: '#A1A1AA', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>
              State Historical Trend
            </div>
            <select 
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              style={{
                backgroundColor: '#18181B',
                color: '#fff',
                border: '1px solid #3F3F46',
                borderRadius: '8px',
                padding: '6px 12px',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              {uniqueStates.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          
          {filteredStateData.length > 0 ? (
            <div style={{ height: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={filteredStateData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#3F3F46" vertical={false} />
                  <XAxis dataKey="year" stroke="#A1A1AA" tickLine={false} axisLine={false} />
                  <YAxis stroke="#A1A1AA" tickLine={false} axisLine={false} tick={{fill: '#71717A'}} />
                  <Tooltip contentStyle={{ backgroundColor: '#18181B', border: '1px solid #3F3F46', borderRadius: '8px', color: '#fff' }} />
                  <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                  <Line type="monotone" dataKey="partyWins.BJP" name="BJP Seats" stroke="#F97316" strokeWidth={3} dot={{r: 4}} activeDot={{r: 6}} />
                  <Line type="monotone" dataKey="partyWins.INC" name="INC Seats" stroke="#3B82F6" strokeWidth={3} dot={{r: 4}} activeDot={{r: 6}} />
                  <Line type="monotone" dataKey="partyWins.TMC" name="TMC Seats" stroke="#22C55E" strokeWidth={3} dot={{r: 4}} activeDot={{r: 6}} />
                  <Line type="monotone" dataKey="partyWins.SP" name="SP Seats" stroke="#EF4444" strokeWidth={3} dot={{r: 4}} activeDot={{r: 6}} />
                  <Line type="monotone" dataKey="partyWins.AAP" name="AAP Seats" stroke="#06B6D4" strokeWidth={3} dot={{r: 4}} activeDot={{r: 6}} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '250px', color: '#A1A1AA' }}>
              Loading state data...
            </div>
          )}
        </div>
      )}

      {electionType !== 'LOK_SABHA' && electionType !== 'ASSEMBLY' && (
        <div style={{ textAlign: 'center', padding: '40px', backgroundColor: '#27272A', borderRadius: '12px', color: '#A1A1AA', marginBottom: '24px' }}>
          <h3 style={{ color: '#FFFFFF', fontSize: '20px', marginBottom: '8px' }}>Module Active</h3>
          <p>This section is currently being mapped with historical data.</p>
        </div>
      )}'''
text = header_pattern.sub(new_header, text, count=1)

# Ensure Lok Sabha sections only show when type is LOK_SABHA
if '{electionType === "LOK_SABHA"' not in text:
    text = text.replace('{/* TOP CHART: ALL-TIME TREND */}', '{electionType === "LOK_SABHA" && (<>\n      {/* TOP CHART: ALL-TIME TREND */}')
    fab_pattern = r'Explore \{activeYear\} Directory\n      </button>'
    text = re.sub(fab_pattern, 'Explore {activeYear} Directory\\n      </button>\\n      </>)}', text, count=1)

with open('client/src/pages/ElectionsHub.jsx', 'w', encoding='utf-8') as f:
    f.write(text)
print('Python patch done!')
