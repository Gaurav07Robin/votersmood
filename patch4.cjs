const fs = require('fs');

let text = fs.readFileSync('client/src/pages/ElectionsHub.jsx', 'utf8');

// 1. Add dropdownOpen state
if (!text.includes('const [dropdownOpen, setDropdownOpen]')) {
  text = text.replace(
    "const [selectedState, setSelectedState] = useState('Uttar Pradesh');",
    "const [selectedState, setSelectedState] = useState('Uttar Pradesh');\n  const [dropdownOpen, setDropdownOpen] = useState(false);"
  );
}

// 2. Replace Native Select with Custom Dropdown
const oldSelect = `{isAS && (
            <select 
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              style={{ backgroundColor: '#18181B', color: '#fff', border: '1px solid #3F3F46', borderRadius: '8px', padding: '6px 12px', outline: 'none', cursor: 'pointer' }}
            >
              {uniqueStates.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          )}`;

const newSelect = `{isAS && (
            <div style={{ position: 'relative' }}>
              <div 
                onClick={() => setDropdownOpen(!dropdownOpen)}
                style={{ backgroundColor: '#18181B', color: '#fff', border: '1px solid #3F3F46', borderRadius: '8px', padding: '8px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', minWidth: '220px', justifyContent: 'space-between' }}
              >
                <span style={{ fontWeight: 600 }}>{selectedState}</span>
                <span style={{ color: '#A1A1AA', fontSize: '10px' }}>▼</span>
              </div>
              {dropdownOpen && (
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '8px', backgroundColor: '#18181B', border: '1px solid #3F3F46', borderRadius: '8px', maxHeight: '300px', overflowY: 'auto', zIndex: 100, boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}>
                  {uniqueStates.map(s => (
                    <div 
                      key={s} 
                      onClick={() => { setSelectedState(s); setDropdownOpen(false); }}
                      style={{ padding: '10px 16px', cursor: 'pointer', backgroundColor: s === selectedState ? '#27272A' : 'transparent', color: s === selectedState ? '#fff' : '#A1A1AA', transition: 'background 0.2s', fontSize: '14px', fontWeight: 500 }}
                      onMouseEnter={(e) => { if(s !== selectedState) { e.currentTarget.style.backgroundColor = '#27272A'; e.currentTarget.style.color = '#fff'; } }}
                      onMouseLeave={(e) => { if(s !== selectedState) { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#A1A1AA'; } }}
                    >
                      {s}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}`;

text = text.replace(oldSelect, newSelect);

// 3. Fix Timeline overflow by removing minWidth calculation
const oldTimeline = `minWidth: isAS ? (currentData.length * 60 + 'px') : '100%'`;
const newTimeline = `minWidth: '100%'`;
text = text.replace(oldTimeline, newTimeline);

// 4. Update Explore Button text
const oldExploreBtn = `<List size={20} /> Explore {activeYear} Directory`;
const newExploreBtn = `<List size={20} /> Explore {activeYear} {isLS ? 'Lok Sabha' : selectedState} Directory`;
text = text.replace(oldExploreBtn, newExploreBtn);

fs.writeFileSync('client/src/pages/ElectionsHub.jsx', text);
console.log('UI Patched Successfully!');
