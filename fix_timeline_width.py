import sys

with open('client/src/pages/ElectionsHub.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

# Replace timelineWidth line
text = text.replace(
    "const timelineWidth = Math.max(100, currentData.length * 6); // roughly 6% per item, or fixed pixels",
    "// We just want it to fit 100% now without horizontal scroll\n  const timelineWidth = 100;"
)

with open('client/src/pages/ElectionsHub.jsx', 'w', encoding='utf-8') as f:
    f.write(text)
print("Fixed timeline width!")
