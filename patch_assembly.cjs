const fs = require('fs');
const file = 'client/src/pages/ElectionsHub.jsx';
let content = fs.readFileSync(file, 'utf8');

// We need to add state fetching logic
const stateLogic = `
  const [stateElectionData, setStateElectionData] = useState([]);
  const [selectedState, setSelectedState] = useState('Uttar Pradesh');

  useEffect(() => {
    if (electionType === 'ASSEMBLY' && stateElectionData.length === 0) {
      async function fetchStateData() {
        const q = collection(db, 'state_elections_metadata');
        const querySnapshot = await getDocs(q);
        const data = [];
        querySnapshot.forEach(doc => {
          data.push(doc.data());
        });
        setStateElectionData(data);
      }
      fetchStateData();
    }
  }, [electionType]);

  const uniqueStates = [...new Set(stateElectionData.map(d => d.state))].sort();
  
  const filteredStateData = stateElectionData
    .filter(d => d.state === selectedState)
    .sort((a, b) => a.year - b.year);
`;

content = content.replace(
  "  const [loading, setLoading] = useState(true);",
  "  const [loading, setLoading] = useState(true);\n" + stateLogic
);

const assemblyView = `
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
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#18181B', border: '1px solid #3F3F46', borderRadius: '8px', color: '#fff' }}
                  />
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
`;

content = content.replace(
  "{electionType !== 'LOK_SABHA' && (",
  assemblyView + "\n      {electionType !== 'LOK_SABHA' && electionType !== 'ASSEMBLY' && ("
);

fs.writeFileSync(file, content);
console.log('Patched assembly view');
