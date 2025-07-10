'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  User,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  AuthError,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';

type AuthContextType = {
  currentUser: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  emailPasswordSignUp: (email: string, pass: string) => Promise<{ error?: AuthError }>;
  emailPasswordSignIn: (email: string, pass:string) => Promise<{ error?: AuthError }>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      router.push('/dashboard');
    } catch (error) {
      console.error('Google Sign-In Error:', error);
    }
  };

  const emailPasswordSignUp = async (email: string, pass: string) => {
    try {
      await createUserWithEmailAndPassword(auth, email, pass);
      router.push('/dashboard');
      return {};
    } catch (error) {
      console.error('Email Sign-Up Error:', error);
      return { error: error as AuthError };
    }
  };

  const emailPasswordSignIn = async (email: string, pass: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, pass);
      router.push('/dashboard');
      return {};
    } catch (error) {
        console.error('Email Sign-In Error:', error);
        return { error: error as AuthError };
    }
  };

  const logout = async () => {
    await signOut(auth);
    router.push('/');
  };

  const value = {
    currentUser,
    loading,
    signInWithGoogle,
    emailPasswordSignUp,
    emailPasswordSignIn,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
