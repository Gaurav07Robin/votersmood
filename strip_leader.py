import sys
import re

with open('client/src/pages/LeaderDetail.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

# 1. Remove LEADER STATISTICS SUMMARY BOX
# Find the start
stat_start = text.find("{/* LEADER STATISTICS SUMMARY BOX */}")
# Find the end of it, which is right before {/* POLITICAL PROFILE & TIMELINE */}
stat_end = text.find("{/* POLITICAL PROFILE & TIMELINE */}")

if stat_start != -1 and stat_end != -1:
    text = text[:stat_start] + text[stat_end:]
    print("Removed stats box")
else:
    print("Could not find stats box")

# 2. Remove Post Composer, Filter Bar, and Questions List
comp_start = text.find("{/* Post Composer for Asking Questions */}")
comp_end = text.find("{/* Share Leader Modal */}")

if comp_start != -1 and comp_end != -1:
    text = text[:comp_start] + text[comp_end:]
    print("Removed composer, filters, and list")
else:
    print("Could not find composer section")

with open('client/src/pages/LeaderDetail.jsx', 'w', encoding='utf-8') as f:
    f.write(text)
print("Done.")
