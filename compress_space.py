import sys

with open('client/src/components/PostCard.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

# 1. Reduce overall padding
text = text.replace("padding: '16px',", "padding: '10px 14px',")

# 2. Reduce header margin
text = text.replace("marginBottom: '12px', flexWrap: 'wrap', gap: '8px'", "marginBottom: '6px', flexWrap: 'wrap', gap: '8px'")

# 3. Reduce content margin
text = text.replace("marginBottom: '6px', wordBreak: 'break-word'", "marginBottom: '2px', wordBreak: 'break-word'")

# 4. Remove action bar top padding
text = text.replace("paddingTop: '4px'", "paddingTop: '0px'")

with open('client/src/components/PostCard.jsx', 'w', encoding='utf-8') as f:
    f.write(text)
print("PostCard vertical spacing compressed further")
