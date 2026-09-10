import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './components/Toast';
import Navbar from './components/Navbar';
import RegisterModal from './components/RegisterModal';
import Home from './pages/Home';
import Polls from './pages/Polls';
import Leaders from './pages/Leaders';
import LeaderDetail from './pages/LeaderDetail';
import Trending from './pages/Trending';
import Admin from './pages/Admin';
import ElectionsHub from './pages/ElectionsHub';
import ElectionYearDetail from './pages/ElectionYearDetail';
import ConstituencyResult from './pages/ConstituencyResult';

const KNOWN_TABS = ['discussions', 'polls', 'directory', 'trending', 'admin', 'elections'];

function AppContent() {
  const { isRegisterOpen, openRegisterModal, closeRegisterModal } = useAuth();
  const [activeTab, setActiveTab] = useState('discussions');
  const [selectedLeaderSlug, setSelectedLeaderSlug] = useState(null);
  const [selectedElection, setSelectedElection] = useState(null); // { year, stateSlug, constituencySlug }

  // Sync client route with window.location.pathname
  useEffect(() => {
    const parseUrlRoute = () => {
      const path = window.location.pathname.replace(/^\/+/, '').trim();
      
      if (!path || path === 'discussions') {
        setActiveTab('discussions');
        setSelectedLeaderSlug(null);
        setSelectedElection(null);
        document.title = "JanMat | Political Intelligence & Verified Constituency Portal";
      } else if (path.startsWith('directory/')) {
        const slug = path.split('directory/')[1];
        setSelectedLeaderSlug(slug);
        setActiveTab('leader-detail');
      } else if (path.startsWith('elections/lok-sabha/')) {
        const parts = path.split('/');
        const year = parts[2];
        const stateSlug = parts[3];
        const constituencySlug = parts[4];
        if (constituencySlug) {
            setSelectedElection({ year, stateSlug, constituencySlug });
            setActiveTab('constituency-result');
        } else if (year) {
            setSelectedElection({ year });
            setActiveTab('election-year-detail');
        }
      } else if (path === 'elections') {
        setActiveTab('elections');
        setSelectedElection(null);
      } else if (KNOWN_TABS.includes(path)) {
        setActiveTab(path);
        setSelectedLeaderSlug(null);
        setSelectedElection(null);
        document.title = `JanMat Gazette • ${path.toUpperCase()}`;
      } else {
        // Fallback for old URLs
        setSelectedLeaderSlug(path);
        setActiveTab('leader-detail');
      }
    };

    parseUrlRoute();

    const handlePopState = () => parseUrlRoute();
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleSelectLeader = (leaderIdOrSlug) => {
    const cleanSlug = String(leaderIdOrSlug).toLowerCase().trim().replace(/[^a-z0-9]+/g, '-');
    setSelectedLeaderSlug(cleanSlug);
    setActiveTab('leader-detail');
    window.history.pushState({}, '', `/directory/${cleanSlug}`);
  };

  const handleTabChange = (tab) => {
    setSelectedLeaderSlug(null);
    setSelectedElection(null);
    setActiveTab(tab);
    const newPath = tab === 'discussions' ? '/' : `/${tab}`;
    window.history.pushState({}, '', newPath);
  };

  const handleSelectYear = (year) => {
    setSelectedElection({ year });
    setActiveTab('election-year-detail');
    window.history.pushState({}, '', `/elections/lok-sabha/${year}`);
  };

  const handleSelectConstituency = (year, stateSlug, constituencySlug) => {
    setSelectedElection({ year, stateSlug, constituencySlug });
    setActiveTab('constituency-result');
    window.history.pushState({}, '', `/elections/lok-sabha/${year}/${stateSlug}/${constituencySlug}`);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-primary)' }}>
      <Navbar 
        activeTab={activeTab} 
        setActiveTab={handleTabChange} 
        openRegisterModal={openRegisterModal}
      />

      <main style={{ flex: 1 }}>
        {activeTab === 'discussions' && <Home openRegisterModal={openRegisterModal} />}
        {activeTab === 'polls' && <Polls />}
        {activeTab === 'directory' && <Leaders onSelectLeader={handleSelectLeader} />}
        {activeTab === 'elections' && <ElectionsHub onSelectYear={handleSelectYear} />}
        
        {activeTab === 'election-year-detail' && selectedElection?.year && (
          <ElectionYearDetail 
            year={selectedElection.year} 
            onBack={() => handleTabChange('elections')}
            onSelectConstituency={handleSelectConstituency}
          />
        )}
        
        {activeTab === 'constituency-result' && selectedElection?.constituencySlug && (
          <ConstituencyResult 
            year={selectedElection.year}
            stateSlug={selectedElection.stateSlug}
            constituencySlug={selectedElection.constituencySlug}
            onBack={() => handleSelectYear(selectedElection.year)}
          />
        )}

        {activeTab === 'leader-detail' && selectedLeaderSlug && (
          <LeaderDetail 
            leaderId={selectedLeaderSlug} 
            onBack={() => handleTabChange('directory')} 
          />
        )}
        {activeTab === 'trending' && <Trending openRegisterModal={openRegisterModal} />}
        {activeTab === 'admin' && <Admin />}
      </main>

      <footer style={{ backgroundColor: 'var(--bg-navbar)', color: 'var(--text-muted)', borderTop: '1px solid #222222', padding: '24px 0', marginTop: '64px', textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
        <div className="container">
          JanMat Official Gazette Political Portal • Security Isolated Decoupled Express API Backend & React UI
        </div>
      </footer>

      <RegisterModal isOpen={isRegisterOpen} onClose={closeRegisterModal} />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </AuthProvider>
  );
}
