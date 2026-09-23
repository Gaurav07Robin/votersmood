import sys

with open('client/src/pages/ElectionsHub.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

# Make the State Assembly route show the "Module Active" blank state
text = text.replace('!isLS && !isAS', '!isLS')
text = text.replace('(isLS || isAS)', 'isLS')

with open('client/src/pages/ElectionsHub.jsx', 'w', encoding='utf-8') as f:
    f.write(text)
print("State Assembly view hidden temporarily")
