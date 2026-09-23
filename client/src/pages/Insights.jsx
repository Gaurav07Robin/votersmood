import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { CardSkeleton } from '../components/Skeleton';
import EmptyState from '../components/EmptyState';

export default function Insights() {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      setLoading(true);
      try {
        const blogsData = await api.getInsights();
        if (isMounted) {
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
