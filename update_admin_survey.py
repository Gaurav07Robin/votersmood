import re

with open('client/src/pages/Admin.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

# 1. Add state variable
state_pattern = r"const \[candidatesList, setCandidatesList\] = useState\(\[\s*\{ name: '', party: 'BJP', color: '#D97706' \},\s*\{ name: '', party: 'INC', color: '#2E7D32' \}\s*\]\);"
new_state = r"""const [candidatesList, setCandidatesList] = useState([
    { name: '', party: 'BJP', color: '#D97706' },
    { name: '', party: 'INC', color: '#2E7D32' }
  ]);
  const [pollType, setPollType] = useState('election');"""

if "const [pollType" not in text:
    text = re.sub(state_pattern, new_state, text)

# 2. Modify handleCreateOfficialElection to override survey options
create_pattern = r"(const handleCreateOfficialElection = async \(e\) => \{\s*e\.preventDefault\(\);\s*if \(\!electionTitle\.trim\(\) \|\| candidatesList\.filter\(c => c\.name\.trim\(\)\)\.length < 2\) return;\s*try \{)(.*?)(await api\.createOfficialElection\(\{)"
new_create = r"""\1
    const finalCandidates = candidatesList.filter(c => c.name.trim()).map(c => 
      pollType === 'survey' ? { ...c, party: 'Survey Option', color: '#475569' } : c
    );
    try {
      await api.createOfficialElection({"""
      
text = re.sub(create_pattern, new_create, text, flags=re.DOTALL)

# Modify payload to use finalCandidates
payload_pattern = r"candidates: candidatesList\.filter\(c => c\.name\.trim\(\)\),"
new_payload = r"candidates: finalCandidates,"
text = re.sub(payload_pattern, new_payload, text)

# 3. Add toggle UI and modify the Candidates section UI
ui_pattern = r"(<h3 style=\{\{ fontFamily: 'var\(--font-serif\)', fontSize: '18px', margin: 0 \}\}>.*?<\/h3>)"
new_ui = r"""\1

            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
              <button 
                type="button" 
                onClick={() => setPollType('election')} 
                className={pollType === 'election' ? 'btn-primary' : 'btn-ghost'} 
                style={{ fontSize: '11px', padding: '6px 12px', flex: 1 }}
              >🗳️ CANDIDATE ELECTION</button>
              <button 
                type="button" 
                onClick={() => setPollType('survey')} 
                className={pollType === 'survey' ? 'btn-primary' : 'btn-ghost'} 
                style={{ fontSize: '11px', padding: '6px 12px', flex: 1 }}
              >📋 ISSUE SURVEY</button>
            </div>"""

text = re.sub(ui_pattern, new_ui, text)

cand_header_pattern = r"<label style=\{\{ fontFamily: 'var\(--font-mono\)', fontSize: '11px', fontWeight: 700 \}\}>CANDIDATES & PARTIES LIST<\/label>"
new_cand_header = r"<label style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 700 }}>{pollType === 'election' ? 'CANDIDATES & PARTIES LIST' : 'SURVEY OPTIONS'}</label>"
text = re.sub(cand_header_pattern, new_cand_header, text)

# Modify the candidate row rendering to conditionally hide the party dropdown
row_pattern = r"(<input\s+type=\"text\"\s+value=\{cand\.name\}\s+onChange=\{\(e\) => handleCandidateChange\(idx, 'name', e\.target\.value\)\}\s+placeholder=\"Candidate Name\"\s+required\s+\/>\s+<select\s+value=\{cand\.party\}\s+onChange=\{\(e\) => handleCandidateChange\(idx, 'party', e\.target\.value\)\}\s+style=\{\{ fontSize: '11px', padding: '4px' \}\}\s+>\s+\{Object\.keys\(PARTIES\)\.map\(p => \(\s+<option key=\{p\} value=\{p\}>\{p\}<\/option>\s+\)\)\}\s+<\/select>)"

new_row = r"""<input
                    type="text"
                    value={cand.name}
                    onChange={(e) => handleCandidateChange(idx, 'name', e.target.value)}
                    placeholder={pollType === 'election' ? "Candidate Name" : "Survey Option (e.g. Education)"}
                    required
                  />
                  {pollType === 'election' && (
                    <select
                      value={cand.party}
                      onChange={(e) => handleCandidateChange(idx, 'party', e.target.value)}
                      style={{ fontSize: '11px', padding: '4px' }}
                    >
                      {Object.keys(PARTIES).map(p => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  )}"""

text = re.sub(row_pattern, new_row, text, flags=re.DOTALL)

# Adjust grid layout based on pollType
grid_pattern = r"(<div key=\{idx\} style=\{\{ display: 'grid', gridTemplateColumns: )'1fr 80px'(, gap: '6px' \}\}>)"
new_grid = r"\1pollType === 'election' ? '1fr 80px' : '1fr'\2"
text = re.sub(grid_pattern, new_grid, text)

# Change Add button text
add_pattern = r"\+ Add Candidate"
new_add = r"+ Add {pollType === 'election' ? 'Candidate' : 'Option'}"
text = re.sub(add_pattern, new_add, text)

# Fix literal string
text = text.replace("+ Add {pollType === 'election' ? 'Candidate' : 'Option'}", "{pollType === 'election' ? '+ Add Candidate' : '+ Add Option'}")

with open('client/src/pages/Admin.jsx', 'w', encoding='utf-8') as f:
    f.write(text)
print("Updated Admin.jsx with Survey toggle")

