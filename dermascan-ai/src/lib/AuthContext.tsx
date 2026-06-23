import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

// ─── Dev bypass ────────────────────────────────────────────────────────────────
// Set DEV_MODE to true to bypass Firebase auth and preview the UI as a fake user.
const DEV_MODE = false;
const DEV_USER = {
  id: 'dev-user-1',
  full_name: 'Dr. Sarah Johnson',
  email: 'sarah.johnson@dermascan.ai',
  role: 'doctor',          // change to 'admin' to preview the admin panel
  specialty: 'Dermatology',
};
// ───────────────────────────────────────────────────────────────────────────────

const AuthContext = createContext<any>(undefined);

// Merges the Firebase Auth identity with the matching users/{uid} Firestore profile.
// Returns null if no profile document exists for this uid.
const loadUserProfile = async (firebaseUser: FirebaseUser) => {
  const snap = await getDoc(doc(db, 'users', firebaseUser.uid));
  if (!snap.exists()) return null;
  const data = snap.data();
  // TODO: remove this temporary diagnostic once field-loading is confirmed fixed in production.
  console.log('[AuthContext] Firestore profile fields for', firebaseUser.uid, ':', data);
  return {
    uid: firebaseUser.uid,
    id: firebaseUser.uid,
    email: firebaseUser.email,
    ...data,
    // Explicit fallbacks so these fields are always present on the context
    // user object, even if the Firestore doc was created without them.
    full_name: data.full_name || '',
    role: data.role || '',
    username: data.username || '',
    phonenumber: data.phonenumber || '',
    specialty: data.specialty || '',
    hospital: data.hospital || '',
    license_number: data.license_number || '',
  };
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any>(DEV_MODE ? DEV_USER : null);
  const [isAuthenticated, setIsAuthenticated] = useState(DEV_MODE);
  const [isLoadingAuth, setIsLoadingAuth] = useState(!DEV_MODE);
  // No backend equivalent of base44's app-level public settings under Firebase Auth.
  // Kept (always false) so existing consumers (e.g. App.tsx) don't need to change.
  const [isLoadingPublicSettings] = useState(false);
  const [authError, setAuthError] = useState<any>(null);
  const [authChecked, setAuthChecked] = useState(DEV_MODE);

  // When we force-signOut a user for having no Firestore profile, the resulting
  // null-user callback below should NOT wipe the error we just set for them.
  const suppressNextErrorClear = useRef(false);

  useEffect(() => {
    if (DEV_MODE) return;

    const unsubscribe = onAuthStateChanged(
      auth,
      async (firebaseUser) => {
        if (!firebaseUser) {
          setUser(null);
          setIsAuthenticated(false);
          if (!suppressNextErrorClear.current) {
            setAuthError(null);
          }
          suppressNextErrorClear.current = false;
          setIsLoadingAuth(false);
          setAuthChecked(true);
          return;
        }

        // Keep loading while we resolve the Firestore profile so ProtectedRoute
        // doesn't redirect (or render) before we know the user's role.
        setIsLoadingAuth(true);
        try {
          const profile = await loadUserProfile(firebaseUser);
          if (!profile) {
            // Authenticated with Firebase but no matching Firestore profile —
            // never fall back to a default role, treat as unauthorized.
            setAuthError({ type: 'user_not_registered', message: 'No profile found for this account.' });
            setUser(null);
            setIsAuthenticated(false);
            setIsLoadingAuth(false);
            setAuthChecked(true);
            suppressNextErrorClear.current = true;
            await signOut(auth);
            return;
          }
          setUser(profile);
          setIsAuthenticated(true);
          setAuthError(null);
        } catch (error) {
          setAuthError({ type: 'unknown', message: error.message });
          setUser(null);
          setIsAuthenticated(false);
        } finally {
          setIsLoadingAuth(false);
          setAuthChecked(true);
        }
      },
      (error) => {
        console.error('Firebase auth state error:', error);
        setAuthError({ type: 'unknown', message: error.message });
        setIsLoadingAuth(false);
        setAuthChecked(true);
      }
    );

    return unsubscribe;
  }, []);

  // Resolves with the merged Firestore profile (including role) so callers like
  // Login.tsx can redirect immediately without waiting on context state to propagate.
  const login = async (email: string, password: string) => {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    const profile = await loadUserProfile(credential.user);
    if (!profile) {
      await signOut(auth);
      throw new Error('Your account is not fully configured. Please contact an administrator.');
    }
    return profile;
  };

  const logout = async (shouldRedirect = true) => {
    if (DEV_MODE) return;
    await signOut(auth);
    setUser(null);
    setIsAuthenticated(false);

    if (shouldRedirect) {
      window.location.href = '/login';
    }
  };

  const navigateToLogin = () => {
    if (DEV_MODE) return;
    window.location.href = '/login';
  };

  // Firebase auth state is tracked automatically via onAuthStateChanged above;
  // kept as a no-op so existing callers (e.g. ProtectedRoute) don't break.
  const checkUserAuth = async () => {};

  // No base44-style app-level check under Firebase Auth; kept as a no-op for API compatibility.
  const checkAppState = async () => {};

  const getIdToken = async (): Promise<string | null> => {
    if (DEV_MODE) return null;
    return auth.currentUser ? auth.currentUser.getIdToken() : null;
  };

  // Patches the in-memory user object after a profile save, so pages reflect
  // the change immediately without waiting for onAuthStateChanged to re-fire.
  const updateUserProfile = (updates: Record<string, any>) => {
    setUser((prev: any) => (prev ? { ...prev, ...updates } : prev));
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isLoadingAuth,
      isLoadingPublicSettings,
      authError,
      appPublicSettings: null,
      authChecked,
      login,
      logout,
      navigateToLogin,
      checkUserAuth,
      checkAppState,
      getIdToken,
      updateUserProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
