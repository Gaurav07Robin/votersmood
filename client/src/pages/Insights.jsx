import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { CardSkeleton } from '../components/Skeleton';
import EmptyState from '../components/EmptyState';

export default function Insights() {
  const [liveElections, setLiveElections] = useState([]);
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      setLoading(true);
      try {
        const [electionsData, blogsData] = await Promise.all([
          api.getLiveElections(),
          api.getInsights()
        ]);
        if (isMounted) {
          setLiveElections(electionsData || []);
          setBlogs(blogsData || []);
        }
      } catch (error) {
        console.error("Failed to load insights:", error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    loadData();
    return () => { isMounted = false; };
  }, []);

  if (loading) {
    return (
      <div className="container page-main-container">
        <h2 style={{ fontFamily: 'var(--font-brand)', fontSize: '24px', fontWeight: 700, margin: '20px 0' }}>AI Election Insights</h2>
        <CardSkeleton lines={4} />
        <CardSkeleton lines={4} />
      </div>
    );
  }

  return (
    <div className="container page-main-container" style={{ padding: '20px 0' }}>

      <section style={{ marginBottom: '40px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#EF4444', animation: 'pulse 2s infinite' }}></span>
          <h2 style={{ fontFamily: 'var(--font-brand)', fontSize: '20px', fontWeight: 700, margin: 0 }}>Live Scraped Elections</h2>
        </div>
        
        {liveElections.length === 0 ? (
          <EmptyState message="No live elections actively tracked right now." icon="📊" />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
            {liveElections.map(election => (
              <div key={election.id} style={{ backgroundColor: '#FFF', borderRadius: '12px', border: '1px solid var(--border-subtle)', padding: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <span style={{ backgroundColor: 'var(--bg-canvas)', color: 'var(--bg-navy-authority)', fontSize: '12px', fontWeight: 700, padding: '4px 8px', borderRadius: '4px', letterSpacing: '0.05em' }}>
                    {election.electionType}
                  </span>
                  <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600 }}>{election.year}</span>
                </div>
                <h3 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: 700 }}>{election.electionName}</h3>
                <p style={{ margin: '0 0 16px 0', fontSize: '14px', color: 'var(--text-muted)' }}>{election.state}</p>
                
                {election.partyStandings && election.partyStandings.length > 0 && (
                  <div>
                    <h4 style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '8px' }}>Current Standings</h4>
                    {election.partyStandings.slice(0, 3).map((standing, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', padding: '4px 0', borderBottom: idx !== 2 ? '1px solid #F1F5F9' : 'none' }}>
                        <span style={{ fontWeight: 600 }}>{standing.party}</span>
                        <span>{standing.seatsWon} seats</span>
                      </div>
                    ))}
                  </div>
                )}
                
                <div style={{ marginTop: '16px', fontSize: '12px', color: '#94A3B8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span>🤖</span> Auto-scraped by Election Agent
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 style={{ fontFamily: 'var(--font-brand)', fontSize: '20px', fontWeight: 700, marginBottom: '16px' }}>Editorial Insights</h2>
        {blogs.length === 0 ? (
          <EmptyState message="The AI Journalist is currently writing its first piece. Check back soon!" icon="✍️" />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {blogs.map(blog => (
              <article key={blog.id} style={{ backgroundColor: '#FFF', borderRadius: '12px', border: '1px solid var(--border-subtle)', padding: '24px' }}>
                <h3 style={{ margin: '0 0 8px 0', fontSize: '22px', fontWeight: 800 }}>{blog.title}</h3>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
                  By <strong>Opinar Journalist AI</strong> • {new Date(blog.createdAt?.seconds * 1000 || Date.now()).toLocaleDateString()}
                </div>
                <div style={{ fontSize: '15px', lineHeight: 1.6, color: 'var(--text-primary)', whiteSpace: 'pre-wrap' }}>
                  {blog.content}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
      
      <style>{`
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
          70% { box-shadow: 0 0 0 6px rgba(239, 68, 68, 0); }
          100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
        }
      `}</style>
    </div>
  );
}
