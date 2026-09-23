import sys

with open('client/src/pages/Admin.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

bad_try = """    try {
    const finalCandidates = candidatesList.filter(c => c.name.trim()).map(c => 
      pollType === 'survey' ? { ...c, party: 'Survey Option', color: '#475569' } : c
    );
    try {"""

good_try = """    const finalCandidates = candidatesList.filter(c => c.name.trim()).map(c => 
      pollType === 'survey' ? { ...c, party: 'Survey Option', color: '#475569' } : c
    );
    try {"""

text = text.replace(bad_try, good_try)

with open('client/src/pages/Admin.jsx', 'w', encoding='utf-8') as f:
    f.write(text)
print("Fixed syntax error")
