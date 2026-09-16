import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import ConfirmModal from '../components/ConfirmModal';
import RepresentativeFormModal from '../components/RepresentativeFormModal';
import { api } from '../api/client';
import { STATES, PARTIES, LEADER_TYPES } from '../../../server/data/states';

export default function Admin() {
  const { isAdmin } = useAuth();
  const { showSuccess, showError } = useToast();
  const [adminTab, setAdminTab] = useState('leaders');

  // Confirmation Modal state
  const [confirmConfig, setConfirmConfig] = useState({ isOpen: false, title: '', message: '', onConfirm: () => {} });

  // Comprehensive Representative Form Modal state
  const [isRepModalOpen, setIsRepModalOpen] = useState(false);
  const [editingRepresentative, setEditingRepresentative] = useState(null);

  // Official Admin Election Form state
  const [electionCategory, setElectionCategory] = useState('state');
  const [electionTitle, setElectionTitle] = useState('');
  const [electionDesc, setElectionDesc] = useState('');
  const [electionState, setElectionState] = useState('MH');
  const [electionConstituency, setElectionConstituency] = useState('Mumbai South');
  const [candidatesList, setCandidatesList] = useState([
    { name: '', party: 'BJP', color: '#D97706' },
    { name: '', party: 'INC', color: '#2E7D32' }
  ]);
  const [pollType, setPollType] = useState('election');
  const [hasNota, setHasNota] = useState(true);
  const [officialElections, setOfficialElections] = useState([]);

  // Leaders Directory state
  const [leaders, setLeaders] = useState([]);
  const [leaderSearch, setLeaderSearch] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  // Moderation state
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    if (isAdmin) {
      fetchOfficialElections();
      fetchLeaders();
      fetchPosts();
    }
  }, [isAdmin, leaderSearch, stateFilter, typeFilter]);

  const fetchOfficialElections = () => {
    api.getOfficialElections().then(setOfficialElections).catch(() => {});
  };

  const fetchLeaders = () => {
    api.getLeaders({ search: leaderSearch, state: stateFilter, type: typeFilter }).then(res => {
      const list = Array.isArray(res) ? res : (res.leaders || []);
      setLeaders(list);
    }).catch(() => {});
  };

  const fetchPosts = () => {
    api.getPosts().then(setPosts).catch(() => {});
  };

  // Representative Modal Handlers
  const handleOpenAddRepModal = () => {
    setEditingRepresentative(null);
    setIsRepModalOpen(true);
  };

  const handleOpenEditRepModal = (rep) => {
    setEditingRepresentative(rep);
    setIsRepModalOpen(true);
  };

  const handleSaveRepresentative = async (payload) => {
    try {
      if (editingRepresentative) {
        await api.updateLeader(editingRepresentative.id, payload);
        showSuccess('Representative Portfolio Updated!');
      } else {
        await api.createLeader(payload);
        showSuccess('New Elected Representative Added to Directory!');
      }
      setIsRepModalOpen(false);
      setEditingRepresentative(null);
      fetchLeaders();
    } catch (err) {
      showError(err.response?.data?.error || 'Failed to save representative record.');
    }
  };

  const handleDeleteLeaderClick = (id) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Delete Representative',
      message: 'Are you sure you want to delete this leader from the official constituency directory?',
      onConfirm: async () => {
        try {
          await api.deleteLeader(id);
          showSuccess('Representative Deleted');
          fetchLeaders();
        } catch (e) {
          showError('Delete leader error');
        } finally {
          setConfirmConfig({ isOpen: false, title: '', message: '', onConfirm: () => {} });
        }
      }
    });
  };

  // Election Handlers
  const handleAddCandidateRow = () => {
    if (candidatesList.length < 8) {
      setCandidatesList([...candidatesList, { name: '', party: 'BJP', color: '#D97706' }]);
    }
  };

  const handleCandidateChange = (idx, field, val) => {
    const updated = [...candidatesList];
    updated[idx][field] = val;
    setCandidatesList(updated);
  };

  const handleCreateOfficialElection = async (e) => {
    e.preventDefault();
    if (!electionTitle.trim() || candidatesList.filter(c => c.name.trim()).length < 2) return;

    const finalCandidates = candidatesList.filter(c => c.name.trim()).map(c => 
      pollType === 'survey' ? { ...c, party: 'Survey Option', color: '#475569' } : c
    );
    try {
      await api.createOfficialElection({
        title: electionTitle.trim(),
        category: electionCategory,
        description: electionDesc.trim() || `Official ${electionCategory.toUpperCase()} Election Poll`,
        state: electionState,
        constituencies: [electionConstituency],
        candidates: finalCandidates,
        hasNota
      });

      setElectionTitle('');
      setElectionDesc('');
      setCandidatesList([
        { name: '', party: 'BJP', color: '#D97706' },
        { name: '', party: 'INC', color: '#2E7D32' }
      ]);
      showSuccess('Official Election Poll Published Successfully!');
      fetchOfficialElections();
    } catch (err) {
      showError('Failed to publish election poll');
    }
  };

  const handleDeleteOfficialElection = (id) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Delete Official Election Poll',
      message: 'Are you sure you want to delete this official election poll?',
      onConfirm: async () => {
        try {
          await api.deleteOfficialElection(id);
          showSuccess('Official Election Poll Deleted');
          fetchOfficialElections();
        } catch (e) {
          showError('Delete election error');
        } finally {
          setConfirmConfig({ isOpen: false, title: '', message: '', onConfirm: () => {} });
        }
      }
    });
  };

  const handleDeletePostClick = (id) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Delete Citizen Post',
      message: 'Are you sure you want to delete this post insight?',
      onConfirm: async () => {
        try {
          await api.deletePost(id);
          showSuccess('Citizen Post Deleted');
          fetchPosts();
        } catch (e) {
          showError('Delete post error');
        } finally {
          setConfirmConfig({ isOpen: false, title: '', message: '', onConfirm: () => {} });
        }
      }
    });
  };

  if (!isAdmin) {
    return (
      <div className="container" style={{ padding: '64px 24px', textAlign: 'center' }}>
        <div className="gazette-card" style={{ maxWidth: '480px', margin: '0 auto' }}>
          <h2 style={{ color: 'var(--color-error)' }}>⚠️ ADMIN ACCESS REQUIRED</h2>
          <p style={{ fontFamily: 'var(--font-sans)', color: 'var(--text-secondary)' }}>
            Please sign in with an Admin Account (`admin@votersmood.in`) to access the Official Admin Control Panel.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '32px 24px', maxWidth: '1100px' }}>
      {/* Title Banner */}
      <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-main)', borderRadius: 'var(--radius-card)', padding: '20px 24px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '28px', fontWeight: 700, margin: '0 0 4px 0' }}>
            ⚙ Official Gazette Admin Control Panel
          </h1>
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: '14px', color: 'var(--text-secondary)', margin: 0 }}>
            Comprehensive Representative Management, Election Creator, and Moderation Controls.
          </p>
        </div>
      </div>

      {/* Admin Navigation Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', borderBottom: '2px solid var(--border-main)', paddingBottom: '8px', flexWrap: 'wrap' }}>
        {[
          { id: 'leaders', label: '🗂️ Comprehensive Representative Manager' },
          { id: 'polls', label: '📊 Official Election Creator' },
          { id: 'moderation', label: '🛡️ Moderation Queue' },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setAdminTab(t.id)}
            className={adminTab === t.id ? 'btn-primary' : 'btn-ghost'}
            style={{ fontSize: '13px', fontFamily: 'var(--font-mono)', padding: '8px 16px' }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* TAB 1: COMPREHENSIVE REPRESENTATIVE MANAGER */}
      {adminTab === 'leaders' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Header Action Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', backgroundColor: 'var(--bg-card)', padding: '16px 20px', borderRadius: 'var(--radius-card)', border: '1px solid var(--border-main)' }}>
            <div>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '20px', margin: 0 }}>Elected Representatives Directory ({leaders.length})</h3>
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>Manage MPs (Lok Sabha/Rajya Sabha), MLAs, MLCs, portfolios, and committee memberships.</p>
            </div>

            <button onClick={handleOpenAddRepModal} className="btn-primary" style={{ padding: '10px 18px', fontSize: '13px' }}>
              ➕ ADD NEW REPRESENTATIVE
            </button>
          </div>

          {/* Directory Filter Controls */}
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', backgroundColor: 'var(--bg-card)', padding: '14px', borderRadius: '12px', border: '1px solid var(--border-main)' }}>
            <input
              type="text"
              placeholder="Search representative name, constituency, or portfolio..."
              value={leaderSearch}
              onChange={(e) => setLeaderSearch(e.target.value)}
              style={{ flex: 2, minWidth: '220px' }}
            />
            <select value={stateFilter} onChange={(e) => setStateFilter(e.target.value)} style={{ flex: 1, minWidth: '140px' }}>
              <option value="">All States</option>
              {STATES.map(s => (
                <option key={s.code} value={s.code}>{s.name.toUpperCase()}</option>
              ))}
            </select>
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} style={{ flex: 1, minWidth: '140px' }}>
              <option value="">All Chambers</option>
              <option value="MP_LS">MP (Lok Sabha)</option>
              <option value="MP_RS">MP (Rajya Sabha)</option>
              <option value="MLA">MLA (Assembly)</option>
              <option value="MLC">MLC (Council)</option>
            </select>
          </div>

          {/* Directory List Table */}
          <div className="gazette-card" style={{ padding: 0, overflow: 'hidden' }}>
            {leaders.map(l => (
              <div key={l.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--border-divider)', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontFamily: 'var(--font-serif)', fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>{l.name}</span>
                    <span className="badge badge-featured">{l.party}</span>
                    <span className="badge badge-verified">{l.type || l.repType}</span>
                    <span className={l.status === 'Active' ? 'badge badge-published' : 'badge badge-closed'}>{l.status || 'Active'}</span>
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-secondary)' }}>
                    📍 {l.constituency}, {l.state} • Portfolios: {l.portfolios?.join(', ') || l.portfolio || 'Representative'}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => handleOpenEditRepModal(l)} className="btn-secondary" style={{ fontSize: '12px', padding: '6px 12px' }}>
                    ✏️ Edit Record
                  </button>
                  <button onClick={() => handleDeleteLeaderClick(l.id)} className="btn-ghost" style={{ fontSize: '12px', color: 'var(--color-error)' }}>
                    🗑 Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: OFFICIAL ELECTION CREATOR */}
      {adminTab === 'polls' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '24px' }}>
          <div className="gazette-card">
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '20px', marginBottom: '16px' }}>Active Official Gazette Elections</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {officialElections.map(e => (
                <div key={e.id} style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-divider)', borderRadius: '6px', padding: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span className="badge badge-featured" style={{ fontSize: '10px', alignSelf: 'flex-start' }}>{e.category?.toUpperCase()} ELECTION</span>
                    <span style={{ fontFamily: 'var(--font-serif)', fontSize: '16px', fontWeight: 700 }}>{e.title}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-secondary)' }}>
                      CANDIDATES: {e.candidates?.length || 0} • VOTES: {e.totalVotes || 0}
                    </span>
                  </div>
                  <button onClick={() => handleDeleteOfficialElection(e.id)} className="btn-ghost" style={{ fontSize: '11px', color: 'var(--color-error)', fontWeight: 700 }}>
                    🗑 DELETE
                  </button>
                </div>
              ))}
            </div>
          </div>

          <form onSubmit={handleCreateOfficialElection} className="gazette-card" style={{ display: 'flex', flexDirection: 'column', gap: '12px', height: 'fit-content' }}>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '18px', margin: 0 }}>🏛 Dynamic Election Creator</h3>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
              <button 
                type="button" 
                onClick={() => setPollType('election')} 
                className={pollType === 'election' ? 'btn-primary' : 'btn-ghost'} 
                style={{ fontSize: '11px', padding: '6px 12px', flex: 1 }}
              >🗳️ CANDIDATE ELECTION</button>
              <button 
                type="button" 
                onClick={() => setPollType('survey')} 
                className={pollType === 'survey' ? 'btn-primary' : 'btn-ghost'} 
                style={{ fontSize: '11px', padding: '6px 12px', flex: 1 }}
              >📋 ISSUE SURVEY</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 700 }}>ELECTION CATEGORY</label>
              <select value={electionCategory} onChange={(e) => setElectionCategory(e.target.value)}>
                <option value="national">National Election (Lok Sabha)</option>
                <option value="state">State Election (Vidhan Sabha)</option>
                <option value="byelection">By-Election (Single Constituency)</option>
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 700 }}>ELECTION TITLE</label>
              <input type="text" value={electionTitle} onChange={(e) => setElectionTitle(e.target.value)} required placeholder="e.g. Maharashtra Assembly Election 2026" />
            </div>

            {electionCategory !== 'national' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 700 }}>STATE</label>
                  <select value={electionState} onChange={(e) => setElectionState(e.target.value)}>
                    {STATES.map(s => (
                      <option key={s.code} value={s.code}>{s.name.toUpperCase()}</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 700 }}>CONSTITUENCY</label>
                  <input type="text" value={electionConstituency} onChange={(e) => setElectionConstituency(e.target.value)} placeholder="e.g. Mumbai South" />
                </div>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 700 }}>{pollType === 'election' ? 'CANDIDATES & PARTIES LIST' : 'SURVEY OPTIONS'}</label>
              {candidatesList.map((cand, idx) => (
                <div key={idx} style={{ display: 'grid', gridTemplateColumns: pollType === 'election' ? '1fr 80px' : '1fr', gap: '6px' }}>
                  <input
                    type="text"
                    placeholder={`Candidate ${idx + 1} Name`}
                    value={cand.name}
                    onChange={(e) => handleCandidateChange(idx, 'name', e.target.value)}
                    style={{ fontSize: '12.5px' }}
                  />
                  <select
                    value={cand.party}
                    onChange={(e) => handleCandidateChange(idx, 'party', e.target.value)}
                    style={{ fontSize: '11.5px' }}
                  >
                    {Object.keys(PARTIES).map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
              ))}

              <button type="button" onClick={handleAddCandidateRow} className="btn-ghost" style={{ fontSize: '11px', color: 'var(--accent-primary)', alignSelf: 'flex-start' }}>
                {pollType === 'election' ? '+ Add Candidate' : '+ Add Option'}
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input type="checkbox" id="notaCheck" checked={hasNota} onChange={(e) => setHasNota(e.target.checked)} />
              <label htmlFor="notaCheck" style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 700 }}>Include NOTA Option</label>
            </div>

            <button type="submit" className="btn-primary" style={{ padding: '10px', marginTop: '6px' }}>
              PUBLISH OFFICIAL ELECTION POLL
            </button>
          </form>
        </div>
      )}

      {/* TAB 3: MODERATION */}
      {adminTab === 'moderation' && (
        <div className="gazette-card">
          <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '20px', marginBottom: '16px' }}>All Citizen Posts & Moderation</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {posts.map(p => (
              <div key={p.id} style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-divider)', borderRadius: '6px', padding: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>{p.content}</div>
                <button onClick={() => handleDeletePostClick(p.id)} className="btn-danger" style={{ fontSize: '11px', padding: '6px 12px' }}>
                  🗑 DELETE POST
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Comprehensive Representative Modal */}
      <RepresentativeFormModal
        isOpen={isRepModalOpen}
        onClose={() => { setIsRepModalOpen(false); setEditingRepresentative(null); }}
        onSave={handleSaveRepresentative}
        editingRepresentative={editingRepresentative}
      />

      <ConfirmModal 
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        onConfirm={confirmConfig.onConfirm}
        onClose={() => setConfirmConfig({ isOpen: false, title: '', message: '', onConfirm: () => {} })}
      />
    </div>
  );
}
