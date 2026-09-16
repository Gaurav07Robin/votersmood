import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { 
  STATES as DEFAULT_STATES, 
  getDistrictsForState, 
  getBlocksForDistrict, 
  getConstituenciesForDistrict 
} from '../utils/locationData';

export default function ProfileModal({ isOpen, onClose }) {
  const { userProfile, updateUserProfile } = useAuth();
  
  const [dbLocations, setDbLocations] = useState(null);
  const [isDbLoading, setIsDbLoading] = useState(true);

  // Form Fields
  const [name, setName] = useState(userProfile?.displayName || '');
  const [isRegistered, setIsRegistered] = useState(userProfile?.isRegisteredVoter ?? true);
  
  // Location Fields
  const [state, setState] = useState(userProfile?.state || 'MH');
  const [districtsList, setDistrictsList] = useState(getDistrictsForState('MH'));
  const [district, setDistrict] = useState(userProfile?.district || 'Nagpur');

  const [blocksList, setBlocksList] = useState(getBlocksForDistrict('Nagpur', 'MH'));
  const [block, setBlock] = useState(userProfile?.block || 'Nagpur Urban');

  const [constituenciesList, setConstituenciesList] = useState(getConstituenciesForDistrict('Nagpur', 'MH'));
  const [constituency, setConstituency] = useState(userProfile?.constituency || 'Nagpur South West');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Sync state if userProfile updates
  useEffect(() => {
    if (userProfile) {
      setName(userProfile.displayName || '');
      setIsRegistered(userProfile.isRegisteredVoter ?? true);
      setState(userProfile.state || 'MH');
      setDistrict(userProfile.district || 'Nagpur');
      setBlock(userProfile.block || 'Nagpur Urban');
      setConstituency(userProfile.constituency || 'Nagpur South West');
    }
  }, [userProfile]);

  useEffect(() => {
    let isMounted = true;
    const fetchDbLocations = async () => {
      try {
        setIsDbLoading(true);
        const data = await api.getLocations();
        if (data && isMounted) {
          setDbLocations(data);
          
          const currentState = userProfile?.state || 'MH';
          const currentDistrict = userProfile?.district || 'Nagpur';

          const availableDists = data.districtsByState?.[currentState] || getDistrictsForState(currentState);
          setDistrictsList(availableDists);

          const availableConsts = data.constituenciesByDistrict?.[currentDistrict] || data.constituenciesByState?.[currentState] || getConstituenciesForDistrict(currentDistrict, currentState);
          setConstituenciesList(availableConsts);

          const availableBlocks = data.blocksByDistrict?.[currentDistrict] || getBlocksForDistrict(currentDistrict, currentState);
          setBlocksList(availableBlocks);
        }
      } catch (err) {
        console.warn('Could not fetch location dataset from DB, using fallback:', err);
      } finally {
        if (isMounted) setIsDbLoading(false);
      }
    };
    if (isOpen) fetchDbLocations();
    return () => { isMounted = false; };
  }, [isOpen, userProfile]);

  const handleStateChange = (newCode) => {
    setState(newCode);
    const availableDists = dbLocations?.districtsByState?.[newCode] || getDistrictsForState(newCode);
    setDistrictsList(availableDists);
    const defaultDist = availableDists.length > 0 ? availableDists[0] : '';
    setDistrict(defaultDist);

    const availableBlocks = dbLocations?.blocksByDistrict?.[defaultDist] || getBlocksForDistrict(defaultDist, newCode);
    setBlocksList(availableBlocks);
    setBlock(availableBlocks[0] || '');

    const availableConsts = dbLocations?.constituenciesByDistrict?.[defaultDist] || dbLocations?.constituenciesByState?.[newCode] || getConstituenciesForDistrict(defaultDist, newCode);
    setConstituenciesList(availableConsts);
    setConstituency(availableConsts[0] || '');
  };

  const handleDistrictChange = (newDist) => {
    setDistrict(newDist);

    const availableBlocks = dbLocations?.blocksByDistrict?.[newDist] || getBlocksForDistrict(newDist, state);
    setBlocksList(availableBlocks);
    setBlock(availableBlocks[0] || '');

    const availableConsts = dbLocations?.constituenciesByDistrict?.[newDist] || dbLocations?.constituenciesByState?.[state] || getConstituenciesForDistrict(newDist, state);
    setConstituenciesList(availableConsts);
    setConstituency(availableConsts[0] || '');
  };

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg('');
    try {
      await updateUserProfile({
        name,
        state,
        district,
        block,
        constituency,
        isRegisteredVoter: isRegistered
      });
      onClose();
    } catch (err) {
      setErrorMsg(err?.response?.data?.error || 'Failed to update profile.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getNormalizedStates = () => {
    if (!dbLocations?.states) return DEFAULT_STATES;
    if (Array.isArray(dbLocations.states)) return dbLocations.states;
    return Object.entries(dbLocations.states).map(([code, name]) => ({ code, name }));
  };
  const normalizedStatesList = getNormalizedStates();

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.65)', backdropFilter: 'blur(2px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
      <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', width: '100%', maxWidth: '420px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)', overflow: 'hidden', position: 'relative', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>
        
        <button onClick={onClose} type="button" style={{ position: 'absolute', top: '16px', right: '16px', color: '#94A3B8', fontSize: '20px', cursor: 'pointer', background: 'none', border: 'none', zIndex: 10, padding: '4px' }}>✕</button>

        <div style={{ padding: '32px 24px 24px 24px', overflowY: 'auto' }}>
          <h2 style={{ fontFamily: 'var(--font-sans)', fontSize: '24px', fontWeight: 800, color: '#0F172A', margin: '0 0 20px 0', textAlign: 'center' }}>
            Edit Profile
          </h2>

          {errorMsg && (
            <div style={{ width: '100%', backgroundColor: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', marginBottom: '20px', lineHeight: 1.4, textAlign: 'center' }}>
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontFamily: 'var(--font-sans)', fontSize: '13px', fontWeight: 600, color: '#334155' }}>Display Name</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Your Name" style={{ padding: '12px', borderRadius: '8px', border: '1px solid #CBD5E1', outline: 'none', fontFamily: 'var(--font-sans)', fontSize: '14px' }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontFamily: 'var(--font-sans)', fontSize: '13px', fontWeight: 600, color: '#334155' }}>Home State</label>
              <select value={state} onChange={(e) => handleStateChange(e.target.value)} disabled={isDbLoading} style={{ padding: '12px', borderRadius: '8px', border: '1px solid #CBD5E1', outline: 'none', fontFamily: 'var(--font-sans)', fontSize: '14px', backgroundColor: isDbLoading ? '#F8FAFC' : '#FFF' }}>
                {isDbLoading ? <option>Loading states...</option> : normalizedStatesList.map((st) => (
                  <option key={st.code} value={st.code}>{st.name}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontFamily: 'var(--font-sans)', fontSize: '13px', fontWeight: 600, color: '#334155' }}>District</label>
              <select value={district} onChange={(e) => handleDistrictChange(e.target.value)} style={{ padding: '12px', borderRadius: '8px', border: '1px solid #CBD5E1', outline: 'none', fontFamily: 'var(--font-sans)', fontSize: '14px' }}>
                {districtsList.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontFamily: 'var(--font-sans)', fontSize: '13px', fontWeight: 600, color: '#334155' }}>Assembly Constituency</label>
              <select value={constituency} onChange={(e) => setConstituency(e.target.value)} style={{ padding: '12px', borderRadius: '8px', border: '1px solid #CBD5E1', outline: 'none', fontFamily: 'var(--font-sans)', fontSize: '14px' }}>
                {constituenciesList.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px', marginBottom: '8px' }}>
              <input type="checkbox" id="profileRegCheck" checked={isRegistered} onChange={(e) => setIsRegistered(e.target.checked)} style={{ width: '18px', height: '18px', accentColor: '#0F172A', cursor: 'pointer' }} />
              <label htmlFor="profileRegCheck" style={{ fontFamily: 'var(--font-sans)', fontSize: '14px', color: '#475569', cursor: 'pointer', userSelect: 'none' }}>
                I am a registered voter in this constituency
              </label>
            </div>

            <button type="submit" disabled={isSubmitting} style={{ width: '100%', padding: '14px', backgroundColor: '#0F172A', color: '#FFF', border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: 600, cursor: 'pointer', transition: 'opacity 0.2s', opacity: isSubmitting ? 0.7 : 1 }}>
              {isSubmitting ? 'Saving...' : 'Save Profile'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
