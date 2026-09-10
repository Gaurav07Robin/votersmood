import React, { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '../api/client';
import { STATES, PARTIES, LEADER_TYPES } from '../../../server/data/states';
import LeaderCard from '../components/LeaderCard';
import { LeaderSkeleton } from '../components/Skeleton';
import EmptyState from '../components/EmptyState';

export default function Leaders({ onSelectLeader }) {
  const [leaders, setLeaders] = useState([]);
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [partyFilter, setPartyFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  
  // Pagination & Scroll State
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  const observerTarget = useRef(null);

  // 1. Debounce Search Input (250ms delay to eliminate typing lag)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
    }, 250);
    return () => clearTimeout(handler);
  }, [searchInput]);

  // 2. Fetch Initial Page or Reset Filters
  const fetchLeaders = useCallback(async (pageNum, isReset = false) => {
    if (pageNum === 1) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const data = await api.getLeaders({
        page: pageNum,
        limit: 6,
        search: debouncedSearch,
        state: stateFilter,
        party: partyFilter,
        type: typeFilter
      });

      const newLeaders = Array.isArray(data) ? data : (data.leaders || []);
      const moreAvailable = data.hasMore !== undefined ? data.hasMore : false;
      const count = data.total !== undefined ? data.total : newLeaders.length;

      if (isReset || pageNum === 1) {
        setLeaders(newLeaders);
      } else {
        setLeaders(prev => [...prev, ...newLeaders]);
      }

      setHasMore(moreAvailable);
      setTotalCount(count);
    } catch (err) {
      console.warn('Error fetching leaders:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [debouncedSearch, stateFilter, partyFilter, typeFilter]);

  // Trigger initial fetch on filter change
  useEffect(() => {
    setPage(1);
    fetchLeaders(1, true);
  }, [debouncedSearch, stateFilter, partyFilter, typeFilter, fetchLeaders]);

  // 3. Scroll-Based Infinite Loading Observer
  useEffect(() => {
    const target = observerTarget.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading && !loadingMore) {
          setPage(prevPage => {
            const nextPage = prevPage + 1;
            fetchLeaders(nextPage, false);
            return nextPage;
          });
        }
      },
      { threshold: 0.2, rootMargin: '100px' }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [hasMore, loading, loadingMore, fetchLeaders]);

  return (
    <div className="container" style={{ padding: '32px 24px' }}>
      
      {/* Header Banner */}
      <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-main)', borderRadius: 'var(--radius-card)', padding: '24px', marginBottom: '28px' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 600, color: 'var(--accent-primary)', letterSpacing: '0.08em', marginBottom: '4px' }}>
          🗂️ OFFICIAL CONSTITUENCY DIRECTORY
        </div>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '32px', fontWeight: 800, margin: '0 0 8px 0', color: 'var(--text-primary)' }}>
          Elected Representatives & Citizen Open Questions
        </h1>
        <p style={{ fontFamily: 'var(--font-sans)', fontSize: '14px', color: 'var(--text-secondary)', margin: 0 }}>
          Server-indexed performance metrics, verified open questions, and constituency accountability statistics.
          {totalCount > 0 && <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, marginLeft: '8px', color: 'var(--accent-primary)' }}>• Showing {leaders.length} of {totalCount} Representatives</span>}
        </p>
      </div>

      {/* Server-Side Filter Controls Bar */}
      <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-main)', borderRadius: 'var(--radius-card)', padding: '16px 20px', marginBottom: '28px', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 2, minWidth: '220px' }}>
          <input
            type="text"
            placeholder="Search by leader name or constituency..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            style={{ width: '100%', fontSize: '14px' }}
          />
          {searchInput && (
            <button onClick={() => setSearchInput('')} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', color: 'var(--text-muted)' }}>
              ✕
            </button>
          )}
        </div>

        <select value={stateFilter} onChange={(e) => setStateFilter(e.target.value)} style={{ flex: 1, minWidth: '140px', fontSize: '13px' }}>
          <option value="">All States</option>
          {STATES.map(s => (
            <option key={s.code} value={s.name}>{s.name.toUpperCase()}</option>
          ))}
        </select>

        <select value={partyFilter} onChange={(e) => setPartyFilter(e.target.value)} style={{ flex: 1, minWidth: '130px', fontSize: '13px' }}>
          <option value="">All Parties</option>
          {Object.keys(PARTIES).map(p => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>

        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} style={{ flex: 1, minWidth: '130px', fontSize: '13px' }}>
          <option value="">All Chambers</option>
          {Object.keys(LEADER_TYPES).map(t => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      {/* Leader Directory Grid */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
          <LeaderSkeleton />
          <LeaderSkeleton />
          <LeaderSkeleton />
        </div>
      ) : leaders.length === 0 ? (
        <EmptyState 
          icon="🗂️"
          title="No Representatives Match Your Filters"
          description="Try resetting your search term, state, or party selection to discover elected leaders."
          actionLabel="Reset All Filters"
          onAction={() => { setSearchInput(''); setDebouncedSearch(''); setStateFilter(''); setPartyFilter(''); setTypeFilter(''); }}
        />
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
            {leaders.map(leader => (
              <LeaderCard key={leader.id} leader={leader} onSelect={onSelectLeader} />
            ))}
          </div>

          {/* Scroll-Trigger Target Element */}
          <div ref={observerTarget} style={{ height: '40px', marginTop: '24px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            {loadingMore && (
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-secondary)' }}>
                <span className="skeleton-box" style={{ width: '16px', height: '16px', borderRadius: '50%' }} />
                <span>Loading more representatives based on scroll...</span>
              </div>
            )}
            {!hasMore && leaders.length > 0 && (
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-muted)' }}>
                ✓ All {totalCount} representatives loaded
              </span>
            )}
          </div>
        </>
      )}
    </div>
  );
}
