import sys

with open('client/src/pages/ElectionsHub.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

# Fix ReferenceError by changing the dependency array
text = text.replace('}, [currentData]); // Rebind if data changes', '}, [electionType]); // Rebind if view changes')

with open('client/src/pages/ElectionsHub.jsx', 'w', encoding='utf-8') as f:
    f.write(text)
print("Fixed ReferenceError")
