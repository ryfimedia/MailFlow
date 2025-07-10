
'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  User,
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  AuthError,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { createContactForNewUser } from '@/lib/actions';

type SignupData = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  company?: string;
};

type AuthContextType = {
  currentUser: User | null;
  loading: boolean;
  emailPasswordSignUp: (data: SignupData) => Promise<{ error?: AuthError }>;
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

  const emailPasswordSignUp = async (data: SignupData) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      const user = userCredential.user;
      
      if (user) {
        await createContactForNewUser({
          uid: user.uid,
          email: data.email,
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone,
          company: data.company
        });
      }

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
