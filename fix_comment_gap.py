import sys

with open('client/src/components/PostCard.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

old_div = "<div style={{ marginTop: '14px', paddingTop: '10px' }}>"
new_div = "<div style={{ marginTop: '4px' }}>"

if old_div in text:
    text = text.replace(old_div, new_div)
else:
    print("Could not find the target div in PostCard")

with open('client/src/components/PostCard.jsx', 'w', encoding='utf-8') as f:
    f.write(text)
print("PostCard comment gap reduced")
