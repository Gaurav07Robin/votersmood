import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { 
  STATES as DEFAULT_STATES, 
  getDistrictsForState, 
  getBlocksForDistrict, 
  getConstituenciesForDistrict 
} from '../utils/locationData';
import { auth, RecaptchaVerifier, signInWithPhoneNumber } from '../firebase';

export default function RegisterModal({ isOpen, onClose }) {
  const { signup, login, loginWithGoogle, loginWithTwitter, loginWithPhone } = useAuth();
  
  // Top Level Tab: 'signin' or 'signup'
  const [mainTab, setMainTab] = useState('signup'); 
  
  // View Method: 'main' | 'email' | 'phone'
  const [authMethod, setAuthMethod] = useState('main');

  // Dynamic Location Data fetched directly from Cloud Firestore DB
  const [dbLocations, setDbLocations] = useState(null);
  const [isDbLoading, setIsDbLoading] = useState(true);

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Phone Auth State
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState(null);
  
  // 4-Tier Cascading Location Fields: State -> District -> Block -> Voting Constituency
  const [state, setState] = useState('MH');
  const [districtsList, setDistrictsList] = useState(getDistrictsForState('MH'));
  const [district, setDistrict] = useState('Nagpur');

  const [blocksList, setBlocksList] = useState(getBlocksForDistrict('Nagpur', 'MH'));
  const [block, setBlock] = useState('Nagpur Urban');
  const [customBlock, setCustomBlock] = useState('');
  const [useCustomBlock, setUseCustomBlock] = useState(false);

  const [constituenciesList, setConstituenciesList] = useState(getConstituenciesForDistrict('Nagpur', 'MH'));
  const [constituency, setConstituency] = useState('Nagpur South West');
  const [customConstituency, setCustomConstituency] = useState('');
  const [useCustomConstituency, setUseCustomConstituency] = useState(false);

  const [isRegistered, setIsRegistered] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    let isMounted = true;
    const fetchDbLocations = async () => {
      try {
        setIsDbLoading(true);
        const data = await api.getLocations();
        if (data && isMounted) {
          setDbLocations(data);
          const mhDists = data.districtsByState?.MH || getDistrictsForState('MH');
          setDistrictsList(mhDists);
          const defaultDist = mhDists[0] || 'Nagpur';
          setDistrict(defaultDist);

          const mhConsts = data.constituenciesByDistrict?.[defaultDist] || data.constituenciesByState?.MH || getConstituenciesForDistrict(defaultDist, 'MH');
          setConstituenciesList(mhConsts);
          if (mhConsts.length > 0) setConstituency(mhConsts[0]);

          const mhBlocks = data.blocksByDistrict?.[defaultDist] || getBlocksForDistrict(defaultDist, 'MH');
          setBlocksList(mhBlocks);
          if (mhBlocks.length > 0) setBlock(mhBlocks[0]);
        }
      } catch (err) {
        console.warn('Could not fetch location dataset from DB, using fallback:', err);
      } finally {
        if (isMounted) setIsDbLoading(false);
      }
    };
    if (isOpen) fetchDbLocations();
    return () => { isMounted = false; };
  }, [isOpen]);

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

  const finalBlock = useCustomBlock ? customBlock : block;
  const finalConstituency = useCustomConstituency ? customConstituency : constituency;

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg('');
    try {
      if (mainTab === 'signin') {
        await login(email, password);
      } else {
        await signup(name, email, password, state, finalConstituency, isRegistered, district, finalBlock);
      }
      onClose();
    } catch (err) {
      const serverErr = err.response?.data?.error;
      if (serverErr) {
        setErrorMsg(serverErr);
        if (serverErr.includes('already exists')) setMainTab('signin');
      } else {
        setErrorMsg(mainTab === 'signin' ? 'Invalid email or password.' : 'Registration failed.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleAuth = async () => {
    setIsSubmitting(true);
    setErrorMsg('');
    try {
      if (loginWithGoogle) {
        await loginWithGoogle(state, finalConstituency, district, finalBlock);
      } else {
        await signup('Google User', `user.${Date.now()}@gmail.com`, 'googlepass123', state, finalConstituency, true, district, finalBlock);
      }
      onClose();
    } catch (err) {
      console.error('Google Auth Error:', err);
      setErrorMsg('Google authentication failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTwitterAuth = async () => {
    setIsSubmitting(true);
    setErrorMsg('');
    try {
      if (loginWithTwitter) {
        await loginWithTwitter(state, finalConstituency, district, finalBlock);
      }
      onClose();
    } catch (err) {
      console.error('Twitter Auth Error:', err);
      setErrorMsg('Twitter authentication failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const setupRecaptcha = () => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', { size: 'invisible' });
    }
  };

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setIsSubmitting(true);
    try {
      setupRecaptcha();
      const appVerifier = window.recaptchaVerifier;
      const formattedPhone = phoneNumber.startsWith('+91') ? phoneNumber : '+91' + phoneNumber;
      const result = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
      setConfirmationResult(result);
      setOtpSent(true);
    } catch (err) {
      console.error('OTP Send Error:', err);
      setErrorMsg('Failed to send OTP. Please check the number.');
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = null;
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setIsSubmitting(true);
    try {
      const result = await confirmationResult.confirm(otp);
      if (loginWithPhone) await loginWithPhone(phoneNumber, result.user.uid);
      onClose();
    } catch (err) {
      console.error('OTP Verify Error:', err);
      setErrorMsg('Invalid OTP. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetAuthMethod = () => {
    setAuthMethod('main');
    setErrorMsg('');
    setOtpSent(false);
  };

  const toggleMainTab = () => {
    setMainTab(mainTab === 'signin' ? 'signup' : 'signin');
    resetAuthMethod();
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.65)', backdropFilter: 'blur(2px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
      <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', width: '100%', maxWidth: '420px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)', overflow: 'hidden', position: 'relative', display: 'flex', flexDirection: 'column' }}>
        
        {authMethod !== 'main' && (
          <button onClick={resetAuthMethod} style={{ position: 'absolute', top: '20px', left: '20px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', color: '#64748B', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', zIndex: 10 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            Back
          </button>
        )}
        <button onClick={onClose} style={{ position: 'absolute', top: '16px', right: '16px', color: '#94A3B8', fontSize: '20px', cursor: 'pointer', background: 'none', border: 'none', zIndex: 10, padding: '4px' }}>✕</button>

        <div style={{ padding: '40px 32px 32px 32px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          
          <h2 style={{ fontFamily: 'var(--font-sans)', fontSize: '26px', fontWeight: 800, color: '#0F172A', margin: '0 0 24px 0', textAlign: 'center' }}>
            {authMethod === 'main' ? (mainTab === 'signin' ? 'Sign in to JanMat' : 'Create an account') : ''}
            {authMethod === 'email' && (mainTab === 'signin' ? 'Sign in with Email' : 'Sign up with Email')}
            {authMethod === 'phone' && 'Continue with Phone'}
          </h2>

          {errorMsg && (
            <div style={{ width: '100%', backgroundColor: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', marginBottom: '20px', lineHeight: 1.4, textAlign: 'center' }}>
              {errorMsg}
            </div>
          )}

          <div style={{ width: '100%' }}>
            {/* MAIN SELECTION VIEW */}
            {authMethod === 'main' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <button type="button" onClick={handleGoogleAuth} disabled={isSubmitting} style={{ width: '100%', padding: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', backgroundColor: '#FFFFFF', color: '#0F172A', border: '1px solid #CBD5E1', fontSize: '15px', fontWeight: 600, cursor: 'pointer', borderRadius: '8px', transition: 'background-color 0.2s' }}>
                  <img src="https://www.google.com/favicon.ico" alt="Google" style={{ width: '18px', height: '18px' }} />
                  Continue with Google
                </button>
                <button type="button" onClick={handleTwitterAuth} disabled={isSubmitting} style={{ width: '100%', padding: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', backgroundColor: '#1DA1F2', color: '#FFFFFF', border: 'none', fontSize: '15px', fontWeight: 600, cursor: 'pointer', borderRadius: '8px', transition: 'background-color 0.2s' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/></svg>
                  Continue with Twitter
                </button>
                <button type="button" onClick={() => setAuthMethod('phone')} style={{ width: '100%', padding: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', backgroundColor: '#FFFFFF', color: '#0F172A', border: '1px solid #CBD5E1', fontSize: '15px', fontWeight: 600, cursor: 'pointer', borderRadius: '8px', transition: 'background-color 0.2s' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>
                  Continue with Phone
                </button>
                
                <div style={{ display: 'flex', alignItems: 'center', margin: '16px 0', color: '#94A3B8' }}>
                  <div style={{ flex: 1, height: '1px', backgroundColor: '#E2E8F0' }}></div>
                  <span style={{ padding: '0 12px', fontSize: '13px', fontWeight: 500 }}>or</span>
                  <div style={{ flex: 1, height: '1px', backgroundColor: '#E2E8F0' }}></div>
                </div>

                <button type="button" onClick={() => setAuthMethod('email')} style={{ width: '100%', padding: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', backgroundColor: '#F1F5F9', color: '#0F172A', border: 'none', fontSize: '15px', fontWeight: 600, cursor: 'pointer', borderRadius: '8px', transition: 'background-color 0.2s' }}>
                  Continue with Email
                </button>
              </div>
            )}

            {/* EMAIL VIEW */}
            {authMethod === 'email' && (
              <form onSubmit={handleEmailSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {mainTab === 'signup' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontFamily: 'var(--font-sans)', fontSize: '13px', fontWeight: 600, color: '#334155' }}>Full Name</label>
                    <input type="text" value={name} onChange={(e) => setName(e.target.value)} required placeholder="e.g. Anand Verma" style={{ padding: '14px', borderRadius: '8px', border: '1px solid #CBD5E1', outline: 'none', fontFamily: 'var(--font-sans)', fontSize: '15px', transition: 'border-color 0.2s' }} />
                  </div>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontFamily: 'var(--font-sans)', fontSize: '13px', fontWeight: 600, color: '#334155' }}>Email Address</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="voter@janmat.in" style={{ padding: '14px', borderRadius: '8px', border: '1px solid #CBD5E1', outline: 'none', fontFamily: 'var(--font-sans)', fontSize: '15px', transition: 'border-color 0.2s' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontFamily: 'var(--font-sans)', fontSize: '13px', fontWeight: 600, color: '#334155' }}>Password</label>
                  <input type="password" value={password} minLength={4} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••" style={{ padding: '14px', borderRadius: '8px', border: '1px solid #CBD5E1', outline: 'none', fontFamily: 'var(--font-sans)', fontSize: '15px', transition: 'border-color 0.2s' }} />
                </div>
                {mainTab === 'signup' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px' }}>
                    <input type="checkbox" id="modalRegCheck" checked={isRegistered} onChange={(e) => setIsRegistered(e.target.checked)} style={{ width: '18px', height: '18px', accentColor: '#0F172A', cursor: 'pointer' }} />
                    <label htmlFor="modalRegCheck" style={{ fontFamily: 'var(--font-sans)', fontSize: '14px', color: '#475569', cursor: 'pointer', userSelect: 'none' }}>
                      I am a registered voter
                    </label>
                  </div>
                )}
                <button type="submit" disabled={isSubmitting} style={{ width: '100%', padding: '14px', backgroundColor: '#0F172A', color: '#FFF', border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: 600, cursor: 'pointer', marginTop: '8px', transition: 'opacity 0.2s', opacity: isSubmitting ? 0.7 : 1 }}>
                  {isSubmitting ? 'Please wait...' : 'Continue'}
                </button>
              </form>
            )}

            {/* PHONE VIEW */}
            {authMethod === 'phone' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {!otpSent ? (
                  <form onSubmit={handleSendOTP} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontFamily: 'var(--font-sans)', fontSize: '13px', fontWeight: 600, color: '#334155' }}>Mobile Number</label>
                      <input type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} required placeholder="+91 99999 99999" style={{ padding: '14px', borderRadius: '8px', border: '1px solid #CBD5E1', outline: 'none', fontFamily: 'var(--font-sans)', fontSize: '15px', transition: 'border-color 0.2s' }} />
                    </div>
                    <div id="recaptcha-container"></div>
                    <button type="submit" disabled={isSubmitting} style={{ width: '100%', padding: '14px', backgroundColor: '#0F172A', color: '#FFF', border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: 600, cursor: 'pointer', transition: 'opacity 0.2s', opacity: isSubmitting ? 0.7 : 1 }}>
                      {isSubmitting ? 'Sending code...' : 'Send code'}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleVerifyOTP} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontFamily: 'var(--font-sans)', fontSize: '13px', fontWeight: 600, color: '#334155' }}>Enter 6-digit Code</label>
                      <input type="text" value={otp} onChange={(e) => setOtp(e.target.value)} required placeholder="123 456" maxLength={6} style={{ padding: '14px', borderRadius: '8px', border: '1px solid #CBD5E1', textAlign: 'center', letterSpacing: '12px', fontSize: '20px', outline: 'none', fontFamily: 'var(--font-sans)' }} />
                    </div>
                    <button type="submit" disabled={isSubmitting} style={{ width: '100%', padding: '14px', backgroundColor: '#0F172A', color: '#FFF', border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: 600, cursor: 'pointer', transition: 'opacity 0.2s', opacity: isSubmitting ? 0.7 : 1 }}>
                      {isSubmitting ? 'Verifying...' : 'Verify & Continue'}
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>

        {/* FOOTER TOGGLE */}
        {authMethod === 'main' && (
          <div style={{ padding: '20px', backgroundColor: '#F8FAFC', borderTop: '1px solid #E2E8F0', textAlign: 'center' }}>
            <span style={{ fontSize: '14px', color: '#64748B' }}>
              {mainTab === 'signin' ? "Don't have an account? " : "Already have an account? "}
            </span>
            <button type="button" onClick={toggleMainTab} style={{ background: 'none', border: 'none', color: '#0F172A', fontWeight: 700, fontSize: '14px', cursor: 'pointer', padding: 0 }}>
              {mainTab === 'signin' ? 'Sign up' : 'Sign in'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
