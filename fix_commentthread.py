import sys

with open('client/src/components/CommentThread.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

# Make input shown by default when thread opens
text = text.replace("const [showMainInput, setShowMainInput] = useState(false);", "const [showMainInput, setShowMainInput] = useState(true);")

# Remove the Pen Icon button completely (the toggle button)
start_idx = text.find("{/* Horizontally Aligned Action Row: Pen Icon Write Option & Bubble Icon Insights */}")
end_idx = text.find("      {/* Top Level Comment Input Box")

if start_idx != -1 and end_idx != -1:
    text = text[:start_idx] + text[end_idx:]

with open('client/src/components/CommentThread.jsx', 'w', encoding='utf-8') as f:
    f.write(text)
print("CommentThread fixed")
