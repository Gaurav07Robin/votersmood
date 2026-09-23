import sys

# 1. Update Polls.jsx
with open('client/src/pages/Polls.jsx', 'r', encoding='utf-8') as f:
    polls_text = f.read()

# Replace the giant category filter navigation bar
search_polls = """      {/* Category Filter Navigation Bar */}
      <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-main)', borderRadius: 'var(--radius-card)', padding: '16px 20px', marginBottom: '28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 700, color: 'var(--accent-primary)', letterSpacing: '0.08em' }}>
            🖨️ OFFICIAL GAZETTE ELECTION POLLING CENTER
          </div>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '24px', fontWeight: 700, margin: 0 }}>
            Constituency Elections & Citizen Surveys
          </h2>
        </div>

        <div style={{ display: 'flex', gap: '6px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-main)', padding: '4px', borderRadius: 'var(--radius-button)', flexWrap: 'wrap' }}>
          {[
            { label: 'All', val: 'All' },
            { label: 'National Elections', val: 'National Elections' },
            { label: 'State Elections', val: 'State Elections' },
            { label: 'By-Elections', val: 'By-Elections' }
          ].map(tab => (
            <button
              key={tab.val}
              onClick={() => setCategoryFilter(tab.val)}
              className={categoryFilter === tab.val ? 'btn-primary' : 'btn-ghost'}
              style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', padding: '6px 14px' }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>"""

replace_polls = """      {/* Minimalist Title */}
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '22px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
          🗳️ Official Election Polls
        </h2>
      </div>"""

if search_polls in polls_text:
    polls_text = polls_text.replace(search_polls, replace_polls)
    with open('client/src/pages/Polls.jsx', 'w', encoding='utf-8') as f:
        f.write(polls_text)
    print("Updated Polls.jsx")
else:
    print("Could not find block in Polls.jsx")


# 2. Update CommunityPollsSection.jsx
with open('client/src/components/CommunityPollsSection.jsx', 'r', encoding='utf-8') as f:
    comm_text = f.read()

search_comm = """        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 700, color: 'var(--accent-primary)', letterSpacing: '0.06em' }}>
            🗣️ CITIZEN OPINION & COMMUNITY DISCUSSIONS
          </div>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            Election Surveys & Community Mini Polls
          </h2>
        </div>"""

replace_comm = """        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
          🗣️ Community Issue Polls
        </h2>"""

if search_comm in comm_text:
    comm_text = comm_text.replace(search_comm, replace_comm)
    with open('client/src/components/CommunityPollsSection.jsx', 'w', encoding='utf-8') as f:
        f.write(comm_text)
    print("Updated CommunityPollsSection.jsx")
else:
    print("Could not find block in CommunityPollsSection.jsx")
