import sys
import re

with open('client/src/pages/Polls.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

# Replace the giant category filter navigation bar
search_pattern = r"\{\/\*\s*Category Filter Navigation Bar\s*\*\/\}.*?<\/button>\s*\}\)\}\s*<\/div>\s*<\/div>"
replace_pattern = r"""{/* Minimalist Title */}
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '22px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
          🗳️ Official Election Polls
        </h2>
      </div>"""

text = re.sub(search_pattern, replace_pattern, text, flags=re.DOTALL)
with open('client/src/pages/Polls.jsx', 'w', encoding='utf-8') as f:
    f.write(text)
print("Updated Polls.jsx")

with open('client/src/components/CommunityPollsSection.jsx', 'r', encoding='utf-8') as f:
    comm_text = f.read()

search_pattern_comm = r"<div>\s*<div[^>]*>.*?CITIZEN OPINION & COMMUNITY DISCUSSIONS\s*<\/div>\s*<h2[^>]*>.*?Election Surveys & Community Mini Polls\s*<\/h2>\s*<\/div>"
replace_pattern_comm = r"""<h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
          🗣️ Community Issue Polls
        </h2>"""

comm_text = re.sub(search_pattern_comm, replace_pattern_comm, comm_text, flags=re.DOTALL)
with open('client/src/components/CommunityPollsSection.jsx', 'w', encoding='utf-8') as f:
    f.write(comm_text)
print("Updated CommunityPollsSection.jsx")

