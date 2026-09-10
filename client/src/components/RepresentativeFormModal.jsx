import React, { useState } from 'react';
import { STATES, PARTIES, getDistrictsForState, getConstituencies } from '../../../server/data/states';

const POSITIONS_LIST = [
  'Prime Minister', 'Chief Minister', 'Deputy Chief Minister', 'Cabinet Minister',
  'Minister of State', 'Speaker', 'Deputy Speaker', 'Governor', 'Lieutenant Governor',
  'Leader of Opposition', 'Chief Whip', 'Party President'
];

const DEFAULT_PORTFOLIOS = [
  'Home Affairs', 'Finance', 'Defence', 'External Affairs', 'Education', 'Health',
  'Railways', 'Road Transport', 'Agriculture', 'Rural Development', 'Women & Child Development',
  'Commerce', 'Labour', 'IT', 'Skill Development', 'Environment', 'Water Resources',
  'Housing', 'Urban Development', 'Power', 'MSME'
];

const DEFAULT_COMMITTEES = [
  'Public Accounts Committee', 'Estimates Committee', 'Committee on Public Undertakings',
  'Ethics Committee', 'Privileges Committee', 'Department Related Standing Committees'
];

export default function RepresentativeFormModal({ isOpen, onClose, onSave, editingRepresentative = null }) {
  if (!isOpen) return null;

  // Form State
  const initialType = editingRepresentative?.type || editingRepresentative?.repType || 'MP_LS';
  const isKnownType = ['MP_LS', 'MP_RS', 'MLA', 'MLC'].includes(initialType);

  const [repType, setRepType] = useState(isKnownType ? initialType : 'OTHER');
  const [customRepType, setCustomRepType] = useState(!isKnownType ? initialType : '');

  // Basic Info
  const [name, setName] = useState(editingRepresentative?.name || '');
  const [displayName, setDisplayName] = useState(editingRepresentative?.displayName || '');
  const [profilePhoto, setProfilePhoto] = useState(editingRepresentative?.profilePhoto || editingRepresentative?.profilePhotoUrl || editingRepresentative?.photoURL || '');
  const [gender, setGender] = useState(editingRepresentative?.gender || 'Male');
  const [dob, setDob] = useState(editingRepresentative?.dob || '');
  const [email, setEmail] = useState(editingRepresentative?.email || '');
  const [phone, setPhone] = useState(editingRepresentative?.phone || '');
  const [website, setWebsite] = useState(editingRepresentative?.website || '');
  const [biography, setBiography] = useState(editingRepresentative?.biography || '');
  
  // Party state with Custom Party support
  const initialParty = editingRepresentative?.party || 'BJP';
  const isKnownParty = Object.keys(PARTIES).includes(initialParty);
  const [party, setParty] = useState(isKnownParty ? initialParty : 'CUSTOM');
  const [customParty, setCustomParty] = useState(!isKnownParty ? initialParty : '');

  const [status, setStatus] = useState(editingRepresentative?.status || 'Active');
  const [verificationStatus, setVerificationStatus] = useState(editingRepresentative?.verificationStatus || 'Verified');

  // Geographic & Dynamic Specs
  const [stateCode, setStateCode] = useState(editingRepresentative?.state || 'MH');
  const [district, setDistrict] = useState(editingRepresentative?.district || '');
  const [constituency, setConstituency] = useState(editingRepresentative?.constituency || '');
  const [seatType, setSeatType] = useState(editingRepresentative?.seatType || 'General');
  const [electionYear, setElectionYear] = useState(editingRepresentative?.electionYear || '2024');
  const [termStart, setTermStart] = useState(editingRepresentative?.termStart || '');
  const [termEnd, setTermEnd] = useState(editingRepresentative?.termEnd || '');

  // RS & MLC specific
  const [electionMethod, setElectionMethod] = useState(editingRepresentative?.electionMethod || 'Elected');
  const [nominatedBy, setNominatedBy] = useState(editingRepresentative?.nominatedBy || 'President');
  const [mlcCategory, setMlcCategory] = useState(editingRepresentative?.mlcCategory || 'Graduates');

  // Multi-Select Chips & Custom Additions
  const [selectedPositions, setSelectedPositions] = useState(editingRepresentative?.governmentPositions || []);
  const [customPositionInput, setCustomPositionInput] = useState('');

  const [selectedPortfolios, setSelectedPortfolios] = useState(editingRepresentative?.portfolios || []);
  const [customPortfolioInput, setCustomPortfolioInput] = useState('');

  const [selectedCommittees, setSelectedCommittees] = useState(editingRepresentative?.committees || []);
  const [customCommitteeInput, setCustomCommitteeInput] = useState('');

  // Social & Office Details
  const [twitter, setTwitter] = useState(editingRepresentative?.socialMedia?.twitter || '');
  const [facebook, setFacebook] = useState(editingRepresentative?.socialMedia?.facebook || '');
  const [instagram, setInstagram] = useState(editingRepresentative?.socialMedia?.instagram || '');
  const [officeAddress, setOfficeAddress] = useState(editingRepresentative?.officeDetails?.address || '');

  // Validation Error state
  const [errorMsg, setErrorMsg] = useState('');

  const toggleArrayItem = (arr, setArr, item) => {
    if (arr.includes(item)) {
      setArr(arr.filter(i => i !== item));
    } else {
      setArr([...arr, item]);
    }
  };

  const handleAddCustomPosition = (e) => {
    if (e) e.preventDefault();
    const trimmed = customPositionInput.trim();
    if (trimmed && !selectedPositions.includes(trimmed)) {
      setSelectedPositions([...selectedPositions, trimmed]);
      setCustomPositionInput('');
    }
  };

  const handleAddCustomPortfolio = (e) => {
    if (e) e.preventDefault();
    const trimmed = customPortfolioInput.trim();
    if (trimmed && !selectedPortfolios.includes(trimmed)) {
      setSelectedPortfolios([...selectedPortfolios, trimmed]);
      setCustomPortfolioInput('');
    }
  };

  const handleAddCustomCommittee = (e) => {
    if (e) e.preventDefault();
    const trimmed = customCommitteeInput.trim();
    if (trimmed && !selectedCommittees.includes(trimmed)) {
      setSelectedCommittees([...selectedCommittees, trimmed]);
      setCustomCommitteeInput('');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');

    // Validations
    if (!name.trim()) {
      setErrorMsg('Full Name is required');
      return;
    }

    const finalParty = party === 'CUSTOM' ? (customParty.trim() || 'INDEPENDENT') : party;
    const finalType = repType === 'OTHER' ? (customRepType.trim() || 'REPRESENTATIVE') : repType;

    if (finalType === 'MP_LS' && !constituency.trim()) {
      setErrorMsg('Lok Sabha MPs require a Parliamentary Constituency name.');
      return;
    }

    if (finalType === 'MLA' && !constituency.trim()) {
      setErrorMsg('MLAs require a Legislative Assembly Constituency name.');
      return;
    }

    const payload = {
      name: name.trim(),
      displayName: displayName.trim() || name.trim(),
      profilePhoto: profilePhoto.trim(),
      gender,
      dob,
      email,
      phone,
      website: website.trim(),
      biography,
      party: finalParty,
      status,
      verificationStatus,
      type: finalType,
      repType: finalType,
      state: stateCode,
      district: district,
      constituency: (finalType === 'MP_RS' || finalType === 'OTHER') && !constituency.trim() ? 'State Wide' : constituency.trim(),
      seatType,
      electionYear,
      termStart,
      termEnd,
      electionMethod,
      nominatedBy,
      mlcCategory,
      governmentPositions: selectedPositions,
      portfolios: selectedPortfolios,
      committees: selectedCommittees,
      socialMedia: { twitter, facebook, instagram },
      officeDetails: { address: officeAddress }
    };

    onSave(payload);
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 15, 14, 0.75)', backdropFilter: 'blur(6px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div className="gazette-card" style={{ width: '100%', maxWidth: '840px', maxHeight: '90vh', overflowY: 'auto', position: 'relative', display: 'flex', flexDirection: 'column', gap: '20px', padding: '32px' }}>
        
        {/* Modal Header */}
        <div style={{ borderBottom: '1px solid var(--border-divider)', paddingBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span className="badge badge-featured" style={{ fontSize: '10px' }}>ADMIN REPRESENTATIVE MODULE</span>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '26px', margin: '4px 0 0 0' }}>
              {editingRepresentative ? 'Edit Representative Record' : 'Add New Elected Representative'}
            </h2>
          </div>
          <button onClick={onClose} className="btn-ghost" style={{ fontSize: '18px' }}>✕</button>
        </div>

        {errorMsg && (
          <div className="badge badge-alert" style={{ width: '100%', padding: '10px', fontSize: '12px', backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5', color: '#DC2626' }}>
            ⚠️ {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Section 1: Representative Type Selection & Custom Type */}
          <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-main)' }}>
            <label style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 700, letterSpacing: '0.05em', color: 'var(--accent-primary)', display: 'block', marginBottom: '8px' }}>
              1. REPRESENTATIVE TYPE (SELECT OR TYPE CUSTOM TYPE)
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px', marginBottom: repType === 'OTHER' ? '12px' : '0' }}>
              {[
                { id: 'MP_LS', label: 'MP (Lok Sabha)' },
                { id: 'MP_RS', label: 'MP (Rajya Sabha)' },
                { id: 'MLA', label: 'MLA (Assembly)' },
                { id: 'MLC', label: 'MLC (Council)' },
                { id: 'OTHER', label: '✏️ Custom / Other' }
              ].map(type => (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => setRepType(type.id)}
                  className={repType === type.id ? 'btn-primary' : 'btn-secondary'}
                  style={{ fontSize: '12px', justifyContent: 'center' }}
                >
                  {type.label}
                </button>
              ))}
            </div>

            {repType === 'OTHER' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '10px' }}>
                <label style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 600 }}>CUSTOM REPRESENTATIVE TYPE / TITLE *</label>
                <input
                  type="text"
                  placeholder="e.g. Mayor, Corporator, Governor, Union Minister..."
                  value={customRepType}
                  onChange={(e) => setCustomRepType(e.target.value)}
                  required
                />
              </div>
            )}
          </div>

          {/* Section 2: Basic Information */}
          <div>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '18px', marginBottom: '12px', color: 'var(--text-primary)' }}>
              Basic Personal & Political Details
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 600 }}>FULL NAME *</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} required placeholder="e.g. Devendra Fadnavis" />
              </div>

              <div>
                <label style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 600 }}>DISPLAY NAME</label>
                <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="e.g. Devendra Fadnavis" />
              </div>
            </div>

            {/* DEDICATED PROMINENT MEDIA & PROFILE LINKS HIGHLIGHT BOX */}
            <div style={{ backgroundColor: '#F0F9FF', border: '1px solid #BAE6FD', borderRadius: '10px', padding: '16px', margin: '14px 0', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 800, color: '#0284C7', letterSpacing: '0.05em' }}>
                📷 REPRESENTATIVE MEDIA & PROFILE URLS
              </div>

              <div>
                <label style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 700, color: '#0F172A', display: 'block', marginBottom: '4px' }}>
                  📷 PROFILE PHOTO / IMAGE URL
                </label>
                <input 
                  type="url" 
                  value={profilePhoto} 
                  onChange={(e) => setProfilePhoto(e.target.value)} 
                  placeholder="e.g. https://images.unsplash.com/... or https://upload.wikimedia.org/.../Devendra_Fadnavis.jpg" 
                  style={{ width: '100%', backgroundColor: '#FFFFFF', border: '1px solid #93C5FD' }}
                />
              </div>

              <div>
                <label style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 700, color: '#0F172A', display: 'block', marginBottom: '4px' }}>
                  🔗 OFFICIAL WEBSITE / PROFILE LINK (URL)
                </label>
                <input 
                  type="url" 
                  value={website} 
                  onChange={(e) => setWebsite(e.target.value)} 
                  placeholder="e.g. https://devendrafadnavis.in or https://rahulgandhi.in" 
                  style={{ width: '100%', backgroundColor: '#FFFFFF', border: '1px solid #93C5FD' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              {/* Political Party Selector + Custom Party Option */}
              <div>
                <label style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 600 }}>POLITICAL PARTY *</label>
                <select value={party} onChange={(e) => setParty(e.target.value)}>
                  {Object.keys(PARTIES).map(p => (
                    <option key={p} value={p}>{p} ({PARTIES[p].name})</option>
                  ))}
                  <option value="CUSTOM">➕ Custom Party / Independent Party...</option>
                </select>

                {party === 'CUSTOM' && (
                  <input
                    type="text"
                    placeholder="Enter custom party name or abbreviation (e.g. MNS)..."
                    value={customParty}
                    onChange={(e) => setCustomParty(e.target.value)}
                    required
                    style={{ marginTop: '8px', fontSize: '13px' }}
                  />
                )}
              </div>

              <div>
                <label style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 600 }}>GENDER</label>
                <select value={gender} onChange={(e) => setGender(e.target.value)}>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 600 }}>STATUS</label>
                <select value={status} onChange={(e) => setStatus(e.target.value)}>
                  <option value="Active">Active Representative</option>
                  <option value="Former">Former Representative</option>
                  <option value="Suspended">Suspended</option>
                  <option value="Vacant Seat">Vacant Seat</option>
                </select>
              </div>

              <div>
                <label style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 600 }}>VERIFICATION STATUS</label>
                <select value={verificationStatus} onChange={(e) => setVerificationStatus(e.target.value)}>
                  <option value="Verified">Official Gazette Verified</option>
                  <option value="Pending">Unverified Entry</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 3: Dynamic Specifications based on Representative Type */}
          <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-main)' }}>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '18px', marginBottom: '12px', color: 'var(--text-primary)' }}>
              Geographic & Chamber Details ({repType === 'OTHER' ? customRepType || 'Custom' : repType})
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 600 }}>STATE / UNION TERRITORY</label>
                <select value={stateCode} onChange={(e) => { setStateCode(e.target.value); setDistrict(''); setConstituency(''); }}>
                  <option value="">Select State</option>
                  {STATES.map(s => (
                    <option key={s.code} value={s.name}>{s.name.toUpperCase()}</option>
                  ))}
                </select>
              </div>

              {/* District Field */}
              {repType !== 'MP_RS' && (
                <div>
                  <label style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 600 }}>DISTRICT</label>
                  <select value={district} onChange={(e) => { setDistrict(e.target.value); setConstituency(''); }}>
                    <option value="">Select District</option>
                    {getDistrictsForState(stateCode).map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Conditional Constituency Field */}
              {repType !== 'MP_RS' && (
                <div>
                  <label style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 600 }}>
                    {repType === 'MP_LS' ? 'PARLIAMENTARY CONSTITUENCY *' : 'ASSEMBLY / LOCAL CONSTITUENCY'}
                  </label>
                  <select value={constituency} onChange={(e) => setConstituency(e.target.value)}>
                    <option value="">{repType.startsWith('MP_') ? 'Select Parliamentary Constituency' : 'Select Assembly Constituency'}</option>
                    {getConstituencies(stateCode, district, repType).map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Lok Sabha / MLA Seat Type */}
              {(repType === 'MP_LS' || repType === 'MLA') && (
                <div>
                  <label style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 600 }}>SEAT TYPE</label>
                  <select value={seatType} onChange={(e) => setSeatType(e.target.value)}>
                    <option value="General">General</option>
                    <option value="SC">Scheduled Caste (SC)</option>
                    <option value="ST">Scheduled Tribe (ST)</option>
                  </select>
                </div>
              )}

              {/* Rajya Sabha Specific Fields */}
              {repType === 'MP_RS' && (
                <>
                  <div>
                    <label style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 600 }}>ELECTION METHOD</label>
                    <select value={electionMethod} onChange={(e) => setElectionMethod(e.target.value)}>
                      <option value="Elected">Elected by State Assembly</option>
                      <option value="Nominated">Nominated</option>
                    </select>
                  </div>
                  {electionMethod === 'Nominated' && (
                    <div>
                      <label style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 600 }}>NOMINATED BY</label>
                      <select value={nominatedBy} onChange={(e) => setNominatedBy(e.target.value)}>
                        <option value="President">President of India</option>
                        <option value="State Legislature">State Legislature</option>
                      </select>
                    </div>
                  )}
                </>
              )}

              {/* MLC Specific Fields */}
              {repType === 'MLC' && (
                <div>
                  <label style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 600 }}>LEGISLATIVE COUNCIL CATEGORY</label>
                  <select value={mlcCategory} onChange={(e) => setMlcCategory(e.target.value)}>
                    <option value="Local Authorities">Local Authorities</option>
                    <option value="Graduates">Graduates Constituency</option>
                    <option value="Teachers">Teachers Constituency</option>
                    <option value="Legislative Assembly Members">Legislative Assembly Members</option>
                    <option value="Governor Nominee">Governor Nominee</option>
                  </select>
                </div>
              )}

              <div>
                <label style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 600 }}>ELECTION YEAR</label>
                <input type="text" value={electionYear} onChange={(e) => setElectionYear(e.target.value)} placeholder="2024" />
              </div>
            </div>
          </div>

          {/* Section 4: Government Positions (Multi-Select Chips + Custom Addition) */}
          <div>
            <label style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '6px' }}>
              OFFICIAL GOVERNMENT POSITIONS (SELECT CHIPS OR ADD CUSTOM)
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
              {POSITIONS_LIST.concat(selectedPositions.filter(p => !POSITIONS_LIST.includes(p))).map(pos => {
                const isSelected = selectedPositions.includes(pos);
                return (
                  <button
                    key={pos}
                    type="button"
                    onClick={() => toggleArrayItem(selectedPositions, setSelectedPositions, pos)}
                    className={isSelected ? 'btn-primary' : 'btn-secondary'}
                    style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '20px' }}
                  >
                    {isSelected ? '✓ ' : '+ '} {pos}
                  </button>
                );
              })}
            </div>

            {/* Custom Government Position Input */}
            <div style={{ display: 'flex', gap: '8px', maxWidth: '440px' }}>
              <input
                type="text"
                placeholder="Type custom position (e.g. Mayor, Zilla Parishad Chief)..."
                value={customPositionInput}
                onChange={(e) => setCustomPositionInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleAddCustomPosition(e); }}
                style={{ fontSize: '12px' }}
              />
              <button type="button" onClick={handleAddCustomPosition} className="btn-secondary" style={{ fontSize: '12px', whiteSpace: 'nowrap' }}>
                + Add Custom Position
              </button>
            </div>
          </div>

          {/* Section 5: Portfolios Assignment (Multi-Select Chips & Custom Entry) */}
          <div>
            <label style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '6px' }}>
              MINISTERIAL PORTFOLIOS ASSIGNMENT (SELECT CHIPS OR ADD CUSTOM)
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
              {DEFAULT_PORTFOLIOS.concat(selectedPortfolios.filter(p => !DEFAULT_PORTFOLIOS.includes(p))).map(port => {
                const isSelected = selectedPortfolios.includes(port);
                return (
                  <button
                    key={port}
                    type="button"
                    onClick={() => toggleArrayItem(selectedPortfolios, setSelectedPortfolios, port)}
                    className={isSelected ? 'btn-primary' : 'btn-secondary'}
                    style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '20px' }}
                  >
                    {isSelected ? '✓ ' : '+ '} {port}
                  </button>
                );
              })}
            </div>
            
            {/* Custom Portfolio Input */}
            <div style={{ display: 'flex', gap: '8px', maxWidth: '440px' }}>
              <input
                type="text"
                placeholder="Type custom portfolio (e.g. Water Distribution & Drainage)..."
                value={customPortfolioInput}
                onChange={(e) => setCustomPortfolioInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleAddCustomPortfolio(e); }}
                style={{ fontSize: '12px' }}
              />
              <button type="button" onClick={handleAddCustomPortfolio} className="btn-secondary" style={{ fontSize: '12px', whiteSpace: 'nowrap' }}>
                + Add Custom Portfolio
              </button>
            </div>
          </div>

          {/* Section 6: Committee Memberships (Multi-Select Chips & Custom Entry) */}
          <div>
            <label style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '6px' }}>
              PARLIAMENTARY / LEGISLATIVE COMMITTEES (SELECT CHIPS OR ADD CUSTOM)
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
              {DEFAULT_COMMITTEES.concat(selectedCommittees.filter(c => !DEFAULT_COMMITTEES.includes(c))).map(comm => {
                const isSelected = selectedCommittees.includes(comm);
                return (
                  <button
                    key={comm}
                    type="button"
                    onClick={() => toggleArrayItem(selectedCommittees, setSelectedCommittees, comm)}
                    className={isSelected ? 'btn-primary' : 'btn-secondary'}
                    style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '20px' }}
                  >
                    {isSelected ? '✓ ' : '+ '} {comm}
                  </button>
                );
              })}
            </div>

            {/* Custom Committee Input */}
            <div style={{ display: 'flex', gap: '8px', maxWidth: '440px' }}>
              <input
                type="text"
                placeholder="Type custom committee name..."
                value={customCommitteeInput}
                onChange={(e) => setCustomCommitteeInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleAddCustomCommittee(e); }}
                style={{ fontSize: '12px' }}
              />
              <button type="button" onClick={handleAddCustomCommittee} className="btn-secondary" style={{ fontSize: '12px', whiteSpace: 'nowrap' }}>
                + Add Custom Committee
              </button>
            </div>
          </div>

          {/* Sticky Bottom Action Bar */}
          <div style={{ position: 'sticky', bottom: '-32px', backgroundColor: 'var(--bg-card)', borderTop: '1px solid var(--border-main)', padding: '16px 0 0 0', display: 'flex', justifyContent: 'flex-end', gap: '12px', zIndex: 10 }}>
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              💾 Save Representative Record
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
