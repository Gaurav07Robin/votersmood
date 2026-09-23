import sys

with open('client/src/components/PostCard.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

# 1. Remove the entire OPEN QUESTION SPECIAL BADGE STRIP
start_badge = text.find("{/* OPEN QUESTION SPECIAL BADGE STRIP */}")
end_badge = text.find("{/* Header */}")
if start_badge != -1 and end_badge != -1:
    text = text[:start_badge] + text[end_badge:]

# 2. Insert the new compact tags into the Header's right-side flex container
header_right_side_marker = "<div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>"
new_tags = """<div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            {post.isOpenQuestion && (
              <>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', fontWeight: 800, color: '#D97706', backgroundColor: '#FEF3C7', padding: '3px 8px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  ❓ OPEN Q
                </span>
                {post.questionCategory && (
                  <span className="badge badge-verified" style={{ fontSize: '10px', padding: '3px 8px', borderRadius: '4px', backgroundColor: '#E0F2FE', color: '#0369A1', border: 'none' }}>
                    {post.questionCategory.toUpperCase()}
                  </span>
                )}
              </>
            )}"""

text = text.replace(header_right_side_marker, new_tags)

with open('client/src/components/PostCard.jsx', 'w', encoding='utf-8') as f:
    f.write(text)
print("PostCard updated with compact Open Question tags")
