import sys
import re

with open('client/src/components/OfficialElectionPoll.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

# Replace column wrapper
text = text.replace(
    """{/* COLUMN B: OBSERVER VOTES */}
              <div style={{ backgroundColor: '#F9F8F6', border: '1px solid var(--border-divider)', borderRadius: '8px', padding: '16px' }}>""",
    """{/* COLUMN B: OBSERVER VOTES */}
              {!isSurvey && (
              <div style={{ backgroundColor: '#F9F8F6', border: '1px solid var(--border-divider)', borderRadius: '8px', padding: '16px' }}>"""
)

# Replace column end
text = text.replace(
    """                </div>
              </div>

            </div>""",
    """                </div>
              </div>
              )}

            </div>"""
)

# And hide the observer span inside step 6 loop that says ({cand.party})
cand_party_obs_regex = r'<span>\{cand\.name\} \(\{cand\.party\}\)<\/span>'
text = re.sub(cand_party_obs_regex, "<span>{cand.name} {!isSurvey && `(${cand.party})`}</span>", text)

with open('client/src/components/OfficialElectionPoll.jsx', 'w', encoding='utf-8') as f:
    f.write(text)
print("Observer column hidden for surveys")
