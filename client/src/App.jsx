import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './components/Toast';
import Navbar from './components/Navbar';
import RegisterModal from './components/RegisterModal';
import Home from './pages/Home';
const Polls = React.lazy(() => import('./pages/Polls'));
const Insights = React.lazy(() => import('./pages/Insights'));
const Leaders = React.lazy(() => import('./pages/Leaders'));
const LeaderDetail = React.lazy(() => import('./pages/LeaderDetail'));
const Admin = React.lazy(() => import('./pages/Admin'));
const ElectionsHub = React.lazy(() => import('./pages/ElectionsHub'));
const ElectionYearDetail = React.lazy(() => import('./pages/ElectionYearDetail'));
const ConstituencyResult = React.lazy(() => import('./pages/ConstituencyResult'));
const PrivacyPolicy = React.lazy(() => import('./pages/PrivacyPolicy'));

const KNOWN_TABS = ['discussions', 'polls', 'insights', 'directory', 'trending', 'admin', 'elections'];

function AppContent() {
  const { isRegisterOpen, openRegisterModal, closeRegisterModal } = useAuth();
  const [activeTab, setActiveTab] = useState('discussions');
  const [selectedLeaderSlug, setSelectedLeaderSlug] = useState(null);
  const [selectedInsightSlug, setSelectedInsightSlug] = useState(null);
  const [selectedElection, setSelectedElection] = useState(null); // { year, stateSlug, constituencySlug }
  const [electionCategory, setElectionCategory] = useState('LOK_SABHA');
  const [lastSelectedState, setLastSelectedState] = useState('Uttar Pradesh');
  const [lastSelectedYear, setLastSelectedYear] = useState(2026);

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
      } else if (path.startsWith('elections/lok-sabha/') || path.startsWith('elections/state/')) {
        const parts = path.split('/');
        if (parts[1] === 'lok-sabha') {
          setElectionCategory('LOK_SABHA');
          const year = parts[2];
          const stateSlug = parts[3];
          const constituencySlug = parts[4];
          if (constituencySlug) {
              setSelectedElection({ year, stateSlug, constituencySlug, isLS: true });
              setActiveTab('constituency-result');
          } else if (year) {
              setSelectedElection({ year, isLS: true });
              setActiveTab('election-year-detail');
          }
        } else if (parts[1] === 'state') {
          setElectionCategory('ASSEMBLY');
          const stateSlug = parts[2];
          const year = parts[3];
          const constituencySlug = parts[4];
          const state = stateSlug ? stateSlug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : null;
          if (state) setLastSelectedState(state);
          if (year) setLastSelectedYear(parseInt(year, 10));
          if (constituencySlug) {
              setSelectedElection({ year, stateSlug, constituencySlug, state, isLS: false });
              setActiveTab('constituency-result');
          } else if (year) {
              setSelectedElection({ year, stateSlug, state, isLS: false });
              setActiveTab('election-year-detail');
          } else {
              setActiveTab('elections');
          }
        }
      } else if (path === 'elections' || path === 'elections/lok-sabha' || path === 'elections/state') {
        if (path === 'elections/state') setElectionCategory('ASSEMBLY');
        if (path === 'elections/lok-sabha') setElectionCategory('LOK_SABHA');
        setActiveTab('elections');
        setSelectedElection(null);
      } else if (path.startsWith('insights/')) {
        const slug = path.split('insights/')[1];
        setSelectedInsightSlug(slug);
        setActiveTab('insights');
        setSelectedLeaderSlug(null);
        setSelectedElection(null);
        document.title = `Political Reel • Opinar`;
      } else if (KNOWN_TABS.includes(path)) {
        setActiveTab(path);
        setSelectedLeaderSlug(null);
        setSelectedElection(null);
        setSelectedInsightSlug(null);
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
    setSelectedInsightSlug(null);
    setActiveTab(tab);
    const newPath = tab === 'discussions' ? '/' : `/${tab}`;
    window.history.pushState({}, '', newPath);
  };

  const handleSelectYear = (year, isLS = true, state = null) => {
    setSelectedElection({ year, isLS, state });
    setActiveTab('election-year-detail');
    if (isLS) {
      setElectionCategory('LOK_SABHA');
      setLastSelectedYear(year);
      window.history.pushState({}, '', `/elections/lok-sabha/${year}`);
    } else {
      setElectionCategory('ASSEMBLY');
      if (state) setLastSelectedState(state);
      setLastSelectedYear(year);
      const stateSlug = state.toLowerCase().replace(/ /g, '-');
      window.history.pushState({}, '', `/elections/state/${stateSlug}/${year}`);
    }
  };

  const handleBackFromElection = () => {
    const isStateAssembly = selectedElection?.isLS === false || electionCategory === 'ASSEMBLY';
    setSelectedElection(null);
    setActiveTab('elections');
    const path = isStateAssembly ? '/elections/state' : '/elections/lok-sabha';
    window.history.pushState({}, '', path);
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
        <React.Suspense fallback={<div style={{padding:"40px", textAlign:"center", fontFamily:"var(--font-mono)", fontSize:"12px"}}>LOADING MODULE...</div>}>
        {activeTab === 'discussions' && <Home openRegisterModal={openRegisterModal} />}
        {activeTab === 'polls' && <Polls />}
        {activeTab === 'insights' && (
          <Insights 
            initialSlug={selectedInsightSlug}
            onSelectSlug={(slug) => {
              setSelectedInsightSlug(slug);
              if (slug) {
                window.history.pushState({}, '', `/insights/${slug}`);
              } else {
                window.history.pushState({}, '', `/insights`);
              }
            }}
          />
        )}
        {activeTab === 'directory' && <Leaders onSelectLeader={handleSelectLeader} />}
        {activeTab === 'elections' && (
          <ElectionsHub 
            onSelectYear={handleSelectYear} 
            initialType={electionCategory}
            initialSelectedState={lastSelectedState}
            initialSelectedYear={lastSelectedYear}
            onTypeChange={setElectionCategory}
            onStateChange={setLastSelectedState}
            onYearChange={setLastSelectedYear}
          />
        )}
        
        {activeTab === 'election-year-detail' && selectedElection?.year && (
          <ElectionYearDetail 
            year={selectedElection.year} 
            isLS={selectedElection.isLS}
            state={selectedElection.state}
            onBack={handleBackFromElection}
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
        {activeTab === 'admin' && <Admin />}
              </React.Suspense>
      </main>

      

      <RegisterModal isOpen={isRegisterOpen} onClose={closeRegisterModal} />
    </div>
  );
}

export default function App() {
  if (window.location.pathname.includes('/privacy-policy')) {
    return <React.Suspense fallback={<div>Loading...</div>}><PrivacyPolicy /></React.Suspense>;
  }

  return (
    <AuthProvider>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </AuthProvider>
  );
}
