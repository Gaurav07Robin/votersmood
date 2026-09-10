import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import AvatarSelectionModal from './AvatarSelectionModal';
import StreakBadge from './StreakBadge';

// Official Gazette Icons
const GazetteLogo = ({ size = 28 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2" />
    <path d="M18 14h-8" />
    <path d="M15 18h-5" />
    <path d="M10 6h8v4h-8V6Z" />
  </svg>
);

const EditorialFeed = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z" />
    <path d="M7 7h10" />
    <path d="M7 11h10" />
    <path d="M7 15h6" />
  </svg>
);

const BallotBox = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 20V10M12 20V4M6 20v-6" />
  </svg>
);

const AssemblyPillar = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 21h18M3 7h18M6 7v14M10 7v14M14 7v14M18 7v14M12 3l9 4H3l9-4z" />
  </svg>
);

const SignalPulse = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
  </svg>
);

export default function Navbar({ activeTab = 'discussions', setActiveTab, openRegisterModal: propOpenRegisterModal }) {
  const { user, userProfile, logout, isAdmin, openRegisterModal: contextOpenRegisterModal } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [avatarModalOpen, setAvatarModalOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const handleRegisterClick = propOpenRegisterModal || contextOpenRegisterModal;

  // Dynamic Avatar Resolution:
  const userAvatar = userProfile?.avatarUrl 
    || user?.avatarUrl 
    || `https://api.dicebear.com/10.x/avataaars/svg?seed=${encodeURIComponent(user?.uid || user?.displayName || 'voter')}`;

  const isVerifiedStreak = !!(userProfile?.isVerifiedStreak || user?.isVerifiedStreak);
  const streakCount = userProfile?.streakCount || user?.streakCount || 0;

  // Close profile dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNavClick = (tabId) => {
    if (setActiveTab) setActiveTab(tabId);
    setMobileMenuOpen(false);
  };

  return (
    <>
      <header style={{ width: '100%', position: 'sticky', top: 0, zIndex: 100, backgroundColor: '#FFFFFF', borderBottom: '1px solid var(--border-subtle)' }}>
        
        {/* Main Navigation Bar */}
        <nav style={{ height: '64px', display: 'flex', alignItems: 'center' }}>
          <div className="container page-main-container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '100%' }}>
            
            {/* Left: Brand Identity */}
            <div 
              onClick={() => handleNavClick('discussions')}
              style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
            >
              <div style={{ color: 'var(--bg-navy-authority)', display: 'flex', alignItems: 'center' }}>
                <GazetteLogo size={26} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span className="brand-logo-text" style={{ fontFamily: 'var(--font-brand)', fontSize: '24px', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text-primary)', lineHeight: 1 }}>
                  THE STATE UNION
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', letterSpacing: '0.15em', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  जनमत • PUBLIC VOICE PORTAL
                </span>
              </div>
            </div>

            {/* Desktop Center Links */}
            <div className="desktop-nav" style={{ display: 'flex', gap: '28px', height: '100%', alignItems: 'center' }}>
              {[
                { id: 'discussions', label: 'Discussions', icon: EditorialFeed },
                { id: 'polls', label: 'Election Polls', icon: BallotBox },
                { id: 'directory', label: 'Directory', icon: AssemblyPillar },
                { id: 'elections', label: 'Elections', icon: AssemblyPillar },
                { id: 'trending', label: 'Trending', icon: SignalPulse },
              ].map((tab) => {
                const IconComp = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleNavClick(tab.id)}
                    style={{
                      height: '100%',
                      background: 'none',
                      border: 'none',
                      borderBottom: isActive ? '2px solid var(--bg-navy-authority)' : '2px solid transparent',
                      color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
                      fontWeight: isActive ? 700 : 500,
                      fontSize: '14px',
                      borderRadius: 0,
                      cursor: 'pointer',
                      padding: '0 2px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'color 150ms ease, border-color 150ms ease'
                    }}
                  >
                    <IconComp size={16} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Desktop Right Actions */}
            <div className="desktop-nav" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              {isAdmin && (
                <button onClick={() => handleNavClick('admin')} className="btn-authority" style={{ height: '36px', padding: '0 14px', fontSize: '12px' }}>
                  ADMIN PANEL
                </button>
              )}

              {user ? (
                <div ref={dropdownRef} style={{ position: 'relative' }}>
                  {/* Clean Profile Badge Trigger */}
                  <div 
                    onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                    title="Open Citizen Profile Menu"
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px', 
                      cursor: 'pointer', 
                      backgroundColor: profileDropdownOpen ? '#F1F5F9' : 'var(--bg-canvas)', 
                      border: '1px solid var(--border-subtle)', 
                      borderRadius: '20px', 
                      padding: '3px 12px 3px 3px',
                      transition: 'background-color 150ms ease'
                    }}
                  >
                    <img 
                      src={userAvatar} 
                      alt="Profile Avatar" 
                      style={{ width: '30px', height: '30px', borderRadius: '50%', border: '1px solid var(--border-subtle)', backgroundColor: '#FFFFFF' }} 
                    />
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12.5px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {userProfile?.displayName || user.email?.split('@')[0]}
                    </span>

                    {/* Catchy 7-Day Active Streak Tick Badge with Hover Popover */}
                    {isVerifiedStreak && <StreakBadge isVerified={true} size="16px" fontSize="10px" />}

                    <span style={{ fontSize: '10px', color: 'var(--text-muted)', marginLeft: '2px' }}>
                      {profileDropdownOpen ? '▲' : '▼'}
                    </span>
                  </div>

                  {/* Profile Dropdown Popup Menu */}
                  {profileDropdownOpen && (
                    <div 
                      style={{ 
                        position: 'absolute', 
                        top: 'calc(100% + 8px)', 
                        right: 0, 
                        width: '260px', 
                        backgroundColor: '#FFFFFF', 
                        border: '1px solid #E2E8F0', 
                        borderRadius: '12px', 
                        boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)', 
                        padding: '12px', 
                        zIndex: 200 
                      }}
                    >
                      {/* User Info Header */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingBottom: '10px', borderBottom: '1px solid #F1F5F9', marginBottom: '8px' }}>
                        <img src={userAvatar} alt="User Avatar" style={{ width: '38px', height: '38px', borderRadius: '50%', border: '1px solid #E2E8F0', backgroundColor: '#F8F9FA' }} />
                        <div style={{ overflow: 'hidden' }}>
                          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {userProfile?.displayName || user.email?.split('@')[0]}
                          </div>
                          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {user.email}
                          </div>
                        </div>
                      </div>

                      {/* Citizen Details Strip */}
                      <div style={{ backgroundColor: '#F8FAFC', borderRadius: '6px', padding: '8px 10px', marginBottom: '8px', fontSize: '11px', fontFamily: 'var(--font-mono)', color: '#475569', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div>📍 {userProfile?.constituency || 'Mumbai South'}, {userProfile?.state || 'MH'}</div>
                        <div style={{ color: isVerifiedStreak ? '#0284C7' : '#D97706', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span>🔥 Streak: {streakCount} Days</span>
                          <StreakBadge isVerified={isVerifiedStreak} size="15px" fontSize="9px" />
                        </div>
                      </div>

                      {/* Menu Actions */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <button 
                          onClick={() => { setAvatarModalOpen(true); setProfileDropdownOpen(false); }}
                          className="btn-ghost"
                          style={{ width: '100%', textAlign: 'left', fontSize: '12.5px', padding: '8px 10px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '8px', color: '#1E293B', fontWeight: 600 }}
                        >
                          <span>🎨</span> Change 2D Avatar
                        </button>

                        <button 
                          onClick={() => { logout(); setProfileDropdownOpen(false); }}
                          className="btn-ghost"
                          style={{ width: '100%', textAlign: 'left', fontSize: '12.5px', padding: '8px 10px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '8px', color: '#DC2626', fontWeight: 700 }}
                        >
                          <span>🚪</span> Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <button onClick={handleRegisterClick} className="btn-primary" style={{ height: '36px', padding: '0 16px', fontSize: '13px' }}>
                  REGISTER VOTER
                </button>
              )}
            </div>

            {/* Mobile Hamburger Toggle Button */}
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="mobile-hamburger"
              aria-label="Toggle navigation menu"
              style={{ display: 'none', background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer', padding: '4px 8px', color: 'var(--text-primary)' }}
            >
              {mobileMenuOpen ? '✕' : '☰'}
            </button>
          </div>

          {/* Mobile Dropdown Navigation Menu */}
          {mobileMenuOpen && (
            <div style={{ backgroundColor: '#FFFFFF', borderTop: '1px solid var(--border-subtle)', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {user && (
                <div 
                  onClick={() => { setAvatarModalOpen(true); setMobileMenuOpen(false); }}
                  style={{ display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: 'var(--bg-canvas)', border: '1px solid var(--border-subtle)', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer' }}
                >
                  <img src={userAvatar} alt="Mobile Avatar" style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#FFFFFF' }} />
                  <div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>{userProfile?.displayName || user.email?.split('@')[0]}</span>
                      {isVerifiedStreak && <StreakBadge isVerified={true} size="15px" fontSize="9px" />}
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--accent-copper-text)' }}>
                      🎨 Tap to change 2D Avatar (Streak: 🔥 {streakCount}d)
                    </div>
                  </div>
                </div>
              )}

              {[
                { id: 'discussions', label: 'Discussions', icon: EditorialFeed },
                { id: 'polls', label: 'Election Polls', icon: BallotBox },
                { id: 'directory', label: 'Directory', icon: AssemblyPillar },
                { id: 'elections', label: 'Elections', icon: AssemblyPillar },
                { id: 'trending', label: 'Trending', icon: SignalPulse },
              ].map((tab) => {
                const IconComp = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleNavClick(tab.id)}
                    className="btn-ghost"
                    style={{
                      textAlign: 'left',
                      fontSize: '14px',
                      fontWeight: isActive ? 700 : 500,
                      color: isActive ? 'var(--bg-navy-authority)' : 'var(--text-primary)',
                      padding: '10px 12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      backgroundColor: isActive ? 'var(--bg-canvas)' : 'transparent',
                      borderRadius: '6px'
                    }}
                  >
                    <IconComp size={16} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}

              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {isAdmin && (
                  <button onClick={() => handleNavClick('admin')} className="btn-authority" style={{ width: '100%', height: '38px', fontSize: '13px' }}>
                    ⚙ ADMIN PANEL
                  </button>
                )}

                {user ? (
                  <button onClick={logout} className="btn-secondary" style={{ width: '100%', height: '38px', fontSize: '13px', color: '#DC2626', fontWeight: 700 }}>
                    🚪 Sign Out ({user.email?.split('@')[0]})
                  </button>
                ) : (
                  <button onClick={() => { if (handleRegisterClick) handleRegisterClick(); setMobileMenuOpen(false); }} className="btn-primary" style={{ width: '100%', height: '38px', fontSize: '13px' }}>
                    🔑 REGISTER VOTER
                  </button>
                )}
              </div>
            </div>
          )}
        </nav>
      </header>

      {/* Avatar Selection Modal */}
      <AvatarSelectionModal 
        isOpen={avatarModalOpen}
        onClose={() => setAvatarModalOpen(false)}
      />
    </>
  );
}
