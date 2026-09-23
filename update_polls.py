import sys

with open('server/routes/polls.js', 'r', encoding='utf-8') as f:
    text = f.read()

# Update backend route to accept targetElection
old_route = """router.post('/community', verifyAuthToken, requireAuth, async (req, res) => {
  const { question, options } = req.body;"""

new_route = """router.post('/community', verifyAuthToken, requireAuth, async (req, res) => {
  const { question, options, targetElection } = req.body;"""

if old_route in text:
    text = text.replace(old_route, new_route)
    
old_poll_obj = """  const newPoll = {
    question: question.trim(),"""
    
new_poll_obj = """  const newPoll = {
    question: question.trim(),
    targetElection: targetElection || 'General',"""

if old_poll_obj in text:
    text = text.replace(old_poll_obj, new_poll_obj)

with open('server/routes/polls.js', 'w', encoding='utf-8') as f:
    f.write(text)
print("Updated server/routes/polls.js")

# Now update the UI
with open('client/src/components/CreateCommunityPollModal.jsx', 'r', encoding='utf-8') as f:
    ui_text = f.read()

# Add target scopes to UI
target_scopes = """const TARGET_SCOPES = [
  { value: 'mh2024', label: 'Maharashtra 2024 Assembly Elections' },
  { value: 'delhi2025', label: 'Delhi 2025 Assembly Elections' },
  { value: 'bihar2025', label: 'Bihar 2025 Assembly Elections' },
  { value: 'wb2026', label: 'West Bengal 2026 Assembly Elections' },
  { value: 'up2027', label: 'Uttar Pradesh 2027 Assembly Elections' },
  { value: 'central', label: 'Central Government Administration' }
];

export default function CreateCommunityPollModal"""

ui_text = ui_text.replace("export default function CreateCommunityPollModal", target_scopes)

# Add state variable
state_var = """  const [options, setOptions] = useState(['', '']);
  const [targetScope, setTargetScope] = useState('mh2024');"""
ui_text = ui_text.replace("  const [options, setOptions] = useState(['', '']);", state_var)

# Update payload
old_payload = """      const created = await api.createCommunityPoll({
        question: question.trim(),
        options: validOptions
      });"""
      
new_payload = """      const created = await api.createCommunityPoll({
        question: question.trim(),
        options: validOptions,
        targetElection: targetScope
      });"""
ui_text = ui_text.replace(old_payload, new_payload)

# Add dropdown to form
old_form = """        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>"""

new_form = """        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 700 }}>TARGET ELECTION</label>
            <select 
              value={targetScope} 
              onChange={(e) => setTargetScope(e.target.value)} 
              style={{ padding: '8px', borderRadius: '4px', border: '1px solid var(--border-subtle)' }}
            >
              {TARGET_SCOPES.map(scope => (
                <option key={scope.value} value={scope.value}>{scope.label}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>"""

ui_text = ui_text.replace(old_form, new_form)

with open('client/src/components/CreateCommunityPollModal.jsx', 'w', encoding='utf-8') as f:
    f.write(ui_text)
print("Updated client/src/components/CreateCommunityPollModal.jsx")
