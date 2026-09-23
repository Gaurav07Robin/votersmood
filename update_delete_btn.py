import sys

with open('client/src/components/PostCard.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

old_btn = """            {(isAdmin || user?.uid === post.authorId) && (
              <button onClick={handleDeletePost} className="btn-ghost" style={{ fontSize: '11px', color: 'var(--color-error)', fontWeight: 700 }}>
                🗑️ DELETE
              </button>
            )}"""

new_btn = """            {(isAdmin || user?.uid === post.authorId) && (
              <button onClick={handleDeletePost} className="btn-ghost" style={{ fontSize: '14px', padding: '2px 4px', color: 'var(--color-error)' }} title="Delete Post">
                🗑️
              </button>
            )}"""

if old_btn in text:
    text = text.replace(old_btn, new_btn)
else:
    print("Could not find the specific old_btn block. Trying alternative match.")
    old_btn2 = "🗑️ DELETE"
    if old_btn2 in text:
        text = text.replace("🗑️ DELETE", "🗑️")
        text = text.replace("style={{ fontSize: '11px', color: 'var(--color-error)', fontWeight: 700 }}", "style={{ fontSize: '14px', padding: '2px 4px', color: 'var(--color-error)' }} title=\"Delete Post\"")

with open('client/src/components/PostCard.jsx', 'w', encoding='utf-8') as f:
    f.write(text)
print("Updated DELETE button to symbol only in PostCard.jsx")
