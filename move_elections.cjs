const fs = require('fs');
let code = fs.readFileSync('client/src/pages/ElectionsHub.jsx', 'utf8');

// 1. Add api import
if (!code.includes("import { api }")) {
  code = code.replace("import { db } from '../firebase';", "import { api } from '../api/client';\nimport { db } from '../firebase';");
}

// 2. Add state
if (!code.includes('const [liveElections,')) {
  code = code.replace('const [loading, setLoading] = useState(true);', 'const [loading, setLoading] = useState(true);\n  const [liveElections, setLiveElections] = useState([]);');
}

// 3. Add useEffect to fetch liveElections
const useEffectCode = `
  useEffect(() => {
    let isMounted = true;
    api.getLiveElections().then(data => {
      if (isMounted) setLiveElections(data || []);
    }).catch(e => console.error(e));
    return () => { isMounted = false; };
  }, []);
`;
if (!code.includes('api.getLiveElections()')) {
  code = code.replace('export default function ElectionsHub({ onSelectYear }) {', 'export default function ElectionsHub({ onSelectYear }) {' + useEffectCode);
}

// 4. Wrap return with fragment and inject JSX
const returnJSX = `
    <>
      <style>{\`
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
          70% { box-shadow: 0 0 0 6px rgba(239, 68, 68, 0); }
          100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
        }
      \`}</style>
      {electionType === 'ASSEMBLY' && liveElections.length > 0 && (
        <div style={{ backgroundColor: 'var(--bg-primary)', padding: '24px 0' }}>
          <div className="container page-main-container">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#EF4444', animation: 'pulse 2s infinite' }}></span>
              <h2 style={{ fontFamily: 'var(--font-brand)', fontSize: '20px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>Live Scraped Elections</h2>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
              {liveElections.map(election => (
                <div key={election.id} style={{ backgroundColor: '#FFF', borderRadius: '12px', border: '1px solid var(--border-subtle)', padding: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <span style={{ backgroundColor: 'var(--bg-canvas)', color: 'var(--bg-navy-authority)', fontSize: '12px', fontWeight: 700, padding: '4px 8px', borderRadius: '4px', letterSpacing: '0.05em' }}>
                      {election.electionType}
                    </span>
                    <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600 }}>{election.year}</span>
                  </div>
                  <h3 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>{election.electionName}</h3>
                  <p style={{ margin: '0 0 16px 0', fontSize: '14px', color: 'var(--text-muted)' }}>{election.state}</p>
                  
                  {election.partyStandings && election.partyStandings.length > 0 && (
                    <div>
                      <h4 style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '8px' }}>Current Standings</h4>
                      {election.partyStandings.slice(0, 3).map((standing, idx) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', padding: '4px 0', borderBottom: idx !== 2 ? '1px solid #F1F5F9' : 'none', color: 'var(--text-primary)' }}>
                          <span style={{ fontWeight: 600 }}>{standing.party}</span>
                          <span>{standing.seatsWon} seats</span>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <div style={{ marginTop: '16px', fontSize: '12px', color: '#94A3B8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>dY -</span> Auto-scraped by Election Agent
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
`;

code = code.replace(
  "return (\n    <div style={{ backgroundColor: '#18181B'",
  "return (\n" + returnJSX + "\n    <div style={{ backgroundColor: '#18181B'"
);
// Close the fragment at the end of the file
code = code.replace(/(<\/div>\n\s*);\n}\s*$/, "</div>\n    </>\n  );\n}");

fs.writeFileSync('client/src/pages/ElectionsHub.jsx', code);
console.log('Patched ElectionsHub!');
