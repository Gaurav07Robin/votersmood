import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api/client';
import { auth, googleProvider, twitterProvider, signInWithPopup } from '../firebase';

const AuthContext = createContext({
  user: null,
  userProfile: null,
  isAdmin: false,
  loading: true,
  isRegisterOpen: false,
  openRegisterModal: () => {},
  closeRegisterModal: () => {},
  login: async () => {},
  signup: async () => {},
  loginWithGoogle: async () => {},
  loginWithTwitter: async () => {},
  loginWithPhone: async () => {},
  updateUserProfile: async () => {},
  updateUserAvatar: async () => {},
  logout: () => {},
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);

  const openRegisterModal = () => setIsRegisterOpen(true);
  const closeRegisterModal = () => setIsRegisterOpen(false);

  useEffect(() => {
    const checkAuthStatus = async () => {
      const savedToken = localStorage.getItem('janmat_token');
      if (savedToken) {
        try {
          // Verify saved session with Firebase DB via backend server
          const data = await api.getMe();
          if (data && data.user) {
            setUser(data.user);
            setUserProfile(data.user);
            setIsAdmin(data.user.isAdmin === true);
          }
        } catch (e) {
          console.warn('Session verification failed, clearing tokens:', e);
          localStorage.removeItem('janmat_token');
          localStorage.removeItem('janmat_user');
          setUser(null);
          setUserProfile(null);
          setIsAdmin(false);
        }
      }
      setLoading(false);
    };

    checkAuthStatus();
  }, []);

  const login = async (email, password) => {
    try {
      const res = await api.login({ email, password });
      if (res && res.token && res.user) {
        localStorage.setItem('janmat_token', res.token);
        localStorage.setItem('janmat_user', JSON.stringify(res.user));
        setUser(res.user);
        setUserProfile(res.user);
        setIsAdmin(res.user.isAdmin === true);
        setIsRegisterOpen(false);
        return res.user;
      }
    } catch (error) {
      console.error('API Login error:', error);
      throw error;
    }
  };

  const signup = async (
    name, 
    email, 
    password, 
    state, 
    constituency, 
    isRegistered, 
    district, 
    block
  ) => {
    try {
      const res = await api.signup({
        name,
        email,
        password,
        state: state || 'MH',
        district: district || 'Nagpur',
        block: block || 'Nagpur Urban',
        constituency: constituency || 'Nagpur South West',
        isRegisteredVoter: isRegistered !== false
      });

      if (res && res.token && res.user) {
        localStorage.setItem('janmat_token', res.token);
        localStorage.setItem('janmat_user', JSON.stringify(res.user));
        setUser(res.user);
        setUserProfile(res.user);
        setIsAdmin(res.user.isAdmin === true);
        setIsRegisterOpen(false);
        return res.user;
      }
    } catch (error) {
      console.error('API Signup error:', error);
      throw error;
    }
  };

  const loginWithGoogle = async (
    state = 'MH', 
    constituency = 'Nagpur South West', 
    district = 'Nagpur', 
    block = 'Nagpur Urban'
  ) => {
    try {
      // Trigger Google popup window to select logged in Gmail account
      const result = await signInWithPopup(auth, googleProvider);
      const googleUser = result.user;
      
      const email = googleUser.email;
      const name = googleUser.displayName || email.split('@')[0];
      const password = `google_oauth_${googleUser.uid.substring(0, 10)}`;

      let res;
      try {
        // Attempt login if Google user already registered
        res = await api.login({ email, password });
      } catch (loginErr) {
        // Otherwise register new profile with Google account details & location metadata
        res = await api.signup({
          name,
          email,
          password,
          state,
          district,
          block,
          constituency,
          isRegisteredVoter: true
        });
      }

      if (res && res.token && res.user) {
        localStorage.setItem('janmat_token', res.token);
        localStorage.setItem('janmat_user', JSON.stringify(res.user));
        setUser(res.user);
        setUserProfile(res.user);
        setIsAdmin(res.user.isAdmin === true);
        setIsRegisterOpen(false);
        return res.user;
      }
    } catch (error) {
      console.error('Google Sign In error:', error);
      throw error;
    }
  };

  const loginWithTwitter = async (
    state = 'MH', 
    constituency = 'Nagpur South West', 
    district = 'Nagpur', 
    block = 'Nagpur Urban'
  ) => {
    try {
      const result = await signInWithPopup(auth, twitterProvider);
      const twitterUser = result.user;
      
      const email = twitterUser.email || `${twitterUser.providerData[0].uid}@twitter.com`;
      const name = twitterUser.displayName || `Twitter User ${twitterUser.uid.substring(0, 4)}`;
      const password = `twitter_oauth_${twitterUser.uid.substring(0, 10)}`;

      let res;
      try {
        res = await api.login({ email, password });
      } catch (loginErr) {
        res = await api.signup({
          name,
          email,
          password,
          state,
          district,
          block,
          constituency,
          isRegisteredVoter: true
        });
      }

      if (res && res.token && res.user) {
        localStorage.setItem('janmat_token', res.token);
        localStorage.setItem('janmat_user', JSON.stringify(res.user));
        setUser(res.user);
        setUserProfile(res.user);
        setIsAdmin(res.user.isAdmin === true);
        setIsRegisterOpen(false);
        return res.user;
      }
    } catch (error) {
      console.error('Twitter Sign In error:', error);
      throw error;
    }
  };

  const loginWithPhone = async (phoneNumber, uid) => {
    try {
      const email = `${phoneNumber.replace('+', '')}@janmat.in`;
      const name = `User ${phoneNumber.slice(-4)}`;
      const password = `phone_oauth_${uid.substring(0, 10)}`;

      let res;
      try {
        res = await api.login({ email, password });
      } catch (loginErr) {
        res = await api.signup({
          name,
          email,
          password,
          state: 'MH',
          district: 'Nagpur',
          block: 'Nagpur Urban',
          constituency: 'Nagpur South West',
          isRegisteredVoter: true
        });
      }

      if (res && res.token && res.user) {
        localStorage.setItem('janmat_token', res.token);
        localStorage.setItem('janmat_user', JSON.stringify(res.user));
        setUser(res.user);
        setUserProfile(res.user);
        setIsAdmin(res.user.isAdmin === true);
        setIsRegisterOpen(false);
        return res.user;
      }
    } catch (error) {
      console.error('Phone Sign In error:', error);
      throw error;
    }
  };

  const updateUserProfile = async (profileData) => {
    try {
      const res = await api.updateProfile(profileData);
      if (res && res.user) {
        setUser(res.user);
        setUserProfile(res.user);
        localStorage.setItem('janmat_user', JSON.stringify(res.user));
        return res.user;
      }
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  };

  const updateUserAvatar = async (avatarUrl, avatarStyle = 'avataaars') => {
    try {
      const res = await api.updateAvatar({ avatarUrl, avatarStyle });
      if (res && res.user) {
        setUser(res.user);
        setUserProfile(res.user);
        localStorage.setItem('janmat_user', JSON.stringify(res.user));
        return res.user;
      }
    } catch (error) {
      console.error('Update avatar error:', error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('janmat_token');
    localStorage.removeItem('janmat_user');
    setUser(null);
    setUserProfile(null);
    setIsAdmin(false);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      userProfile, 
      isAdmin, 
      loading, 
      isRegisterOpen, 
      openRegisterModal, 
      closeRegisterModal, 
      login, 
      signup, 
      loginWithGoogle, 
      loginWithTwitter,
      loginWithPhone,
      updateUserProfile,
      updateUserAvatar, 
      logout 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
