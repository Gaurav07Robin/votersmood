import sys

with open('client/src/components/PostCard.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

target_block = """            {!post.isOpenQuestion && post.leaderTag && (
              <span 
                onClick={() => handleLeaderTagClick(post.leaderTag)}
                style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 600, color: 'var(--text-primary)', backgroundColor: 'var(--bg-canvas)', padding: '3px 8px', borderRadius: '4px', textTransform: 'uppercase', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
              >
                📍 {post.leaderTag}
              </span>
            )}"""

if target_block in text:
    text = text.replace(target_block, "")
    print("Removed leaderTag block from PostCard.jsx")
else:
    print("Could not find leaderTag block to remove")

with open('client/src/components/PostCard.jsx', 'w', encoding='utf-8') as f:
    f.write(text)
