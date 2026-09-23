import sys

with open('client/src/pages/Home.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

# 1. Inject logic
inject_logic = """  const getTrending = (arr) => {
    const counts = {};
    arr.forEach(item => {
      if (item && item.trim()) {
        const val = item.trim().toUpperCase();
        counts[val] = (counts[val] || 0) + 1;
      }
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);
  };

  const trendingIssues = getTrending(safePosts.map(p => p.questionCategory).filter(Boolean));
  const trendingElections = getTrending(safePosts.map(p => p.topicTag).filter(Boolean));

  return ("""
  
text = text.replace("  return (", inject_logic)

# 2. Replace Sidebar
start_sidebar = text.find("{/* Sidebar Column: Top 5 Featured Representatives")
end_sidebar = text.find("      </div>\n    </div>\n  );\n}")

if start_sidebar != -1 and end_sidebar != -1:
    new_sidebar = """{/* Sidebar Column: Trending Topics and Elections */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Trending Issues Module */}
          <div className="gazette-card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '18px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                🔥 Trending Issues
              </h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {trendingIssues.length > 0 ? trendingIssues.map(([issue, count], idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '12px', borderBottom: idx !== trendingIssues.length - 1 ? '1px solid #F1F5F9' : 'none' }}>
                  <span style={{ fontFamily: 'var(--font-sans)', fontSize: '14px', fontWeight: 600, color: '#334155' }}>
                    {idx + 1}. {issue}
                  </span>
                  <span className="badge badge-verified" style={{ fontSize: '10px' }}>
                    {count} POSTS
                  </span>
                </div>
              )) : (
                <div style={{ fontSize: '13px', color: '#94A3B8' }}>No issues trending yet.</div>
              )}
            </div>
          </div>

          {/* Trending Elections Module */}
          <div className="gazette-card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '18px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                🗳️ Trending Elections
              </h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {trendingElections.length > 0 ? trendingElections.map(([election, count], idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '12px', borderBottom: idx !== trendingElections.length - 1 ? '1px solid #F1F5F9' : 'none' }}>
                  <span style={{ fontFamily: 'var(--font-sans)', fontSize: '14px', fontWeight: 600, color: '#0369A1' }}>
                    {election.startsWith('#') ? election : `#${election}`}
                  </span>
                  <span className="badge badge-trending" style={{ fontSize: '10px' }}>
                    {count} POSTS
                  </span>
                </div>
              )) : (
                <div style={{ fontSize: '13px', color: '#94A3B8' }}>No elections trending yet.</div>
              )}
            </div>
          </div>

        </div>\n"""
        
    text = text[:start_sidebar] + new_sidebar + text[end_sidebar:]
else:
    print("Sidebar block not found!")

with open('client/src/pages/Home.jsx', 'w', encoding='utf-8') as f:
    f.write(text)
print("Sidebar replaced successfully")
