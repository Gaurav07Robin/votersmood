import sys

with open('client/src/components/OfficialElectionPoll.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

# Remove the top row entirely
header_block = """        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-muted)' }}>
            OFFICIAL GAZETTE (ADMIN)
          </span>
          <div style={{ display: 'flex', gap: '6px' }}>
            {hasVotedBefore && (
              <span className="badge badge-published animate-bounce-in" style={{ fontSize: '9px' }}>
                ✓ VOTE CONFIRMED
              </span>
            )}
            <span className="badge badge-featured" style={{ fontSize: '9px' }}>★ FEATURED SURVEY</span>
          </div>
        </div>"""
text = text.replace(header_block, "")

# Remove the refresh button
refresh_btn = """          <button onClick={refreshLiveResults} className="btn-ghost" style={{ fontSize: '10px', color: 'var(--accent-primary)' }}>
            Refresh Live DB
          </button>"""
text = text.replace(refresh_btn, "")

with open('client/src/components/OfficialElectionPoll.jsx', 'w', encoding='utf-8') as f:
    f.write(text)
print("Removed texts")
