import sys

with open('client/src/components/PostCard.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

# Replace the Insights button text
old_btn = """            {/* Insights Count */}
            <button 
              onClick={() => setShowComments(!showComments)}
              className="btn-ghost" 
              style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-secondary)' }}
            >
              💬 {formatCompactNumber(post.commentCount || 0)} INSIGHTS
            </button>"""

new_btn = """            {/* Insights Count */}
            <button 
              onClick={() => setShowComments(!showComments)}
              className="btn-ghost" 
              style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--bg-navy-authority)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}
            >
              <span>↪</span> {post.commentCount ? `${formatCompactNumber(post.commentCount)} ${post.commentCount === 1 ? 'REPLY' : 'REPLIES'}` : 'REPLY'}
            </button>"""

if old_btn in text:
    text = text.replace(old_btn, new_btn)
else:
    print("Could not find the exact old_btn string. Let's try a softer replace.")
    text = text.replace("💬 {formatCompactNumber(post.commentCount || 0)} INSIGHTS", "<span>↪</span> {post.commentCount ? `${formatCompactNumber(post.commentCount)} ${post.commentCount === 1 ? 'REPLY' : 'REPLIES'}` : 'REPLY'}")
    text = text.replace("style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-secondary)' }}", "style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--bg-navy-authority)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}")


with open('client/src/components/PostCard.jsx', 'w', encoding='utf-8') as f:
    f.write(text)
print("PostCard updated with REPLY text")
