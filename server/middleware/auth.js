import { getAuthAdmin } from '../config/firebase-admin.js';
import { db } from '../config/firebase.js';
import { collection, getDocs, query, where } from 'firebase/firestore';

export const verifyAuthToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    req.user = null;
    return next();
  }

  const token = authHeader.split('Bearer ')[1];

  // Custom JanMat JWT Token Parser (Per-User Unique ID Extraction)
  if (token.startsWith('janmat_jwt_')) {
    try {
      const parts = token.split('_');
      const roleType = parts[2]; // 'admin' or 'user'
      const emailBase64 = parts[3];
      
      if (emailBase64) {
        const email = Buffer.from(emailBase64, 'base64').toString('utf-8').toLowerCase().trim();
        let userData = null;

        if (db) {
          try {
            const snap = await getDocs(query(collection(db, 'users'), where('email', '==', email)));
            if (!snap.empty) {
              userData = snap.docs[0].data();
            }
          } catch (e) {}
        }

        if (userData) {
          req.user = {
            uid: userData.uid,
            email: userData.email,
            name: userData.displayName || userData.email.split('@')[0].toUpperCase(),
            avatarUrl: userData.avatarUrl || `https://api.dicebear.com/10.x/avataaars/svg?seed=${userData.uid || 'voter'}`,
            isAdmin: userData.isAdmin === true
          };
          return next();
        }

        // Fallback unique UID generated from user's email
        req.user = {
          uid: 'uid_' + Buffer.from(email).toString('hex').substring(0, 16),
          email: email,
          name: email.split('@')[0].toUpperCase(),
          avatarUrl: `https://api.dicebear.com/10.x/avataaars/svg?seed=${email}`,
          isAdmin: roleType === 'admin'
        };
        return next();
      }
    } catch (tokenErr) {
      console.warn('⚠️ JanMat JWT token decode warning:', tokenErr.message);
    }
  }

  // Dev / Demo local token support
  if (token.startsWith('token_') || token.startsWith('demo_')) {
    const isDemoAdmin = token.includes('admin');
    req.user = {
      uid: isDemoAdmin ? 'admin-user-id' : 'demo-voter-' + Date.now(),
      email: isDemoAdmin ? 'admin@votersmood.in' : 'demo@votersmood.in',
      name: isDemoAdmin ? 'Official Gazette Admin' : 'DEMO VOTER',
      avatarUrl: `https://api.dicebear.com/10.x/avataaars/svg?seed=admin`,
      isAdmin: isDemoAdmin
    };
    return next();
  }

  // Standard Firebase Auth Token fallback
  try {
    const auth = await getAuthAdmin();
    if (auth && typeof auth.verifyIdToken === 'function') {
      const decodedToken = await auth.verifyIdToken(token);
      req.user = decodedToken;
    } else {
      req.user = {
        uid: 'user_fallback_' + Date.now(),
        email: 'voter@votersmood.in',
        name: 'VERIFIED CITIZEN',
        avatarUrl: `https://api.dicebear.com/10.x/avataaars/svg?seed=fallback`,
        isAdmin: false
      };
    }
  } catch (error) {
    req.user = {
      uid: 'user_anon_' + Date.now(),
      email: 'anonymous@votersmood.in',
      name: 'VERIFIED CITIZEN',
      avatarUrl: `https://api.dicebear.com/10.x/avataaars/svg?seed=anon`,
      isAdmin: false
    };
  }
  next();
};

export const requireAuth = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required. Please register or sign in.' });
  }
  next();
};

export const requireAdmin = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  if (req.user.isAdmin === true) {
    return next();
  }

  return res.status(403).json({ error: 'Admin access privileges required' });
};
