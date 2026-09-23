import sys

with open('client/src/components/PostCard.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

old_style = """          boxShadow: isHighlighted ? '0 0 20px rgba(217, 119, 6, 0.35)' : '0 2px 8px rgba(0,0,0,0.02)', 
          marginBottom: '16px',
          transition: 'all 300ms ease'
        }}"""

new_style = """          boxShadow: isHighlighted ? '0 0 20px rgba(217, 119, 6, 0.35)' : '0 2px 8px rgba(0,0,0,0.02)', 
          marginBottom: '16px',
          transition: 'all 300ms ease',
          width: 'fit-content',
          maxWidth: '100%'
        }}"""

if old_style in text:
    text = text.replace(old_style, new_style)
else:
    print("Could not find the style block in PostCard")

with open('client/src/components/PostCard.jsx', 'w', encoding='utf-8') as f:
    f.write(text)
print("PostCard width updated")
