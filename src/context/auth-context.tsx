'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  type User as FirebaseUser,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import type { UserProfile } from '@/lib/types';

interface SignUpFields {
  name: string;
  rollNumber: string;
  phone: string;
  gender: string;
}

interface AuthContextValue {
  user: FirebaseUser | null;
  profile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<UserProfile>;
  signUp: (email: string, password: string, fields: SignUpFields) => Promise<UserProfile>;
  signInWithGoogle: () => Promise<UserProfile>;
  signOut: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const NOT_CONFIGURED_ERROR =
  'Firebase is not configured yet. Create a Firebase project and fill in .env.local (see .env.local.example).';

async function fetchProfile(uid: string): Promise<UserProfile | null> {
  if (!db) return null;
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? (snap.data() as UserProfile) : null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      setProfile(firebaseUser ? await fetchProfile(firebaseUser.uid) : null);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const signIn: AuthContextValue['signIn'] = async (email, password) => {
    if (!auth) throw new Error(NOT_CONFIGURED_ERROR);
    const credential = await signInWithEmailAndPassword(auth, email, password);
    const userProfile = await fetchProfile(credential.user.uid);
    if (!userProfile) {
      throw new Error('No profile found for this account. Please contact support.');
    }
    setUser(credential.user);
    setProfile(userProfile);
    return userProfile;
  };

  const signUp: AuthContextValue['signUp'] = async (email, password, fields) => {
    if (!auth || !db) throw new Error(NOT_CONFIGURED_ERROR);
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    const userProfile: UserProfile = {
      uid: credential.user.uid,
      email,
      role: 'student',
      ...fields,
      createdAt: new Date().toISOString(),
    };
    await setDoc(doc(db, 'users', credential.user.uid), userProfile);
    setUser(credential.user);
    setProfile(userProfile);
    return userProfile;
  };

  const signInWithGoogle: AuthContextValue['signInWithGoogle'] = async () => {
    if (!auth || !db) throw new Error(NOT_CONFIGURED_ERROR);
    const result = await signInWithPopup(auth, new GoogleAuthProvider());
    let userProfile = await fetchProfile(result.user.uid);
    if (!userProfile) {
      userProfile = {
        uid: result.user.uid,
        email: result.user.email ?? '',
        name: result.user.displayName ?? '',
        role: 'student',
        createdAt: new Date().toISOString(),
      };
      await setDoc(doc(db, 'users', result.user.uid), userProfile);
    }
    setUser(result.user);
    setProfile(userProfile);
    return userProfile;
  };

  const signOut: AuthContextValue['signOut'] = async () => {
    if (!auth) throw new Error(NOT_CONFIGURED_ERROR);
    await firebaseSignOut(auth);
    setUser(null);
    setProfile(null);
  };

  const sendPasswordReset: AuthContextValue['sendPasswordReset'] = async (email) => {
    if (!auth) throw new Error(NOT_CONFIGURED_ERROR);
    await sendPasswordResetEmail(auth, email);
  };

  return (
    <AuthContext.Provider
      value={{ user, profile, loading, signIn, signUp, signInWithGoogle, signOut, sendPasswordReset }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function dashboardPathForRole(role: UserProfile['role']): string {
  switch (role) {
    case 'admin':
      return '/admin/dashboard';
    case 'driver':
      return '/driver/dashboard';
    case 'student-driver':
      return '/student-driver/dashboard';
    default:
      return '/dashboard';
  }
}
