import sys
import re

with open('client/src/pages/Polls.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

# We know the block starts with `{/* Category Filter Navigation Bar */}`
# and ends right before `{/* Main Two-Column Layout */}`

search_pattern = r"\{\/\*\s*Category Filter Navigation Bar\s*\*\/\}.*?(?=\{\/\*\s*Main Two-Column Layout\s*\*\/\})"

replace_pattern = r"""{/* Minimalist Title */}
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '22px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
          🗳️ Official Election Polls
        </h2>
      </div>

      """

text = re.sub(search_pattern, replace_pattern, text, flags=re.DOTALL)

with open('client/src/pages/Polls.jsx', 'w', encoding='utf-8') as f:
    f.write(text)
print("Updated Polls.jsx via regex")
