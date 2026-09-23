import sys

with open('client/src/components/PostCard.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

# Make comments hidden by default
text = text.replace("const [showComments, setShowComments] = useState(true);", "const [showComments, setShowComments] = useState(false);")

# Reduce padding from 20px to 16px for entire card
text = text.replace("padding: '20px', \n          boxShadow: isHighlighted", "padding: '16px', \n          boxShadow: isHighlighted")

# Reduce margin under the content text
text = text.replace("marginBottom: '14px', wordBreak: 'break-word'", "marginBottom: '6px', wordBreak: 'break-word'")

with open('client/src/components/PostCard.jsx', 'w', encoding='utf-8') as f:
    f.write(text)
print("PostCard fixed")
