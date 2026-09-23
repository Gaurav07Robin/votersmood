import sys

# 1. Update CommunityPollsSection.jsx
with open('client/src/components/CommunityPollsSection.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

# Remove the VOTE CONFIRMED badge
badge = """                  {userVotedOpt && (
                    <span className="badge badge-published animate-bounce-in" style={{ fontSize: '9px' }}>
                      ✓ VOTE CONFIRMED
                    </span>
                  )}"""
text = text.replace(badge, "")

# Same badge but maybe powershell corrupted the checkmark: Let's use regex
import re
badge_regex = r'\{userVotedOpt && \(\s*<span className="badge badge-published animate-bounce-in" style=\{\{ fontSize: \'9px\' \}\}>\s*.*?VOTE CONFIRMED\s*<\/span>\s*\)\}'
text = re.sub(badge_regex, "", text)

# Replace authorName rendering to strip ' (Verified Citizen)'
author_regex = r'\{poll\.authorName\}'
new_author = "{poll.authorName?.replace(' (Verified Citizen)', '')}"
text = re.sub(author_regex, new_author, text)

with open('client/src/components/CommunityPollsSection.jsx', 'w', encoding='utf-8') as f:
    f.write(text)

# 2. Update server/routes/polls.js
with open('server/routes/polls.js', 'r', encoding='utf-8') as f:
    server_text = f.read()

server_author_regex = r"authorName: \(req\.user\.name \|\| req\.user\.displayName \|\| 'VERIFIED CITIZEN'\) \+ ' \(Verified Citizen\)',"
new_server_author = "authorName: (req.user.name || req.user.displayName || 'VERIFIED CITIZEN'),"
server_text = re.sub(server_author_regex, new_server_author, server_text)

with open('server/routes/polls.js', 'w', encoding='utf-8') as f:
    f.write(server_text)

print("Removed Verified Citizen and Vote Confirmed")
