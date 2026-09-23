import sys

with open('client/src/components/PostCard.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

# Remove Share Post Button block
start_idx = text.find("{/* Share Post Button */}")
end_idx = text.find("{/* Insights Count */}")
if start_idx != -1 and end_idx != -1:
    text = text[:start_idx] + text[end_idx:]

with open('client/src/components/PostCard.jsx', 'w', encoding='utf-8') as f:
    f.write(text)
print("Removed Share Button from PostCard")
