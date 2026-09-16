import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import OfficialElectionPoll from '../components/OfficialElectionPoll';
import CommunityPollsSection from '../components/CommunityPollsSection';
import RegisterModal from '../components/RegisterModal';
import { PollSkeleton } from '../components/Skeleton';
import EngagementSidebar from '../components/EngagementSidebar';

export default function Polls() {
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [officialElections, setOfficialElections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    let catParam = 'all';
    if (categoryFilter === 'National Elections') catParam = 'national';
    if (categoryFilter === 'State Elections') catParam = 'state';
    if (categoryFilter === 'By-Elections') catParam = 'byelection';

    api.getOfficialElections({ category: catParam }).then(data => {
      if (isMounted) {
        const electionsList = Array.isArray(data) ? data : (data?.elections || []);
        setOfficialElections(electionsList);
        setLoading(false);
      }
    }).catch(() => {
      if (isMounted) setLoading(false);
    });

    return () => { isMounted = false; };
  }, [categoryFilter]);

  const safeElections = Array.isArray(officialElections) ? officialElections : [];

  return (
    <div className="container" style={{ padding: '32px 24px' }}>
      
      {/* Minimalist Title */}
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '22px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
          🗳️ Official Election Polls
        </h2>
      </div>

      {/* Main Two-Column Layout */}
      <div className="two-column-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '32px' }}>
        
        {/* Left Column */}
        <div>
          {loading ? (
            <div>
              <PollSkeleton />
              <PollSkeleton />
            </div>
          ) : (
            <div>
              {safeElections.map(election => (
                <OfficialElectionPoll 
                  key={election.id} 
                  election={election} 
                  openRegisterModal={() => setIsRegisterOpen(true)} 
                />
              ))}

              <CommunityPollsSection openRegisterModal={() => setIsRegisterOpen(true)} />
            </div>
          )}
        </div>

        {/* Right Sidebar */}
        <div>
          <EngagementSidebar />
        </div>

      </div>

      <RegisterModal isOpen={isRegisterOpen} onClose={() => setIsRegisterOpen(false)} />
    </div>
  );
}
