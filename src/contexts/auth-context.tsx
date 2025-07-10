
'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode, useRef } from 'react';
import { onAuthStateChanged, User, signOut as firebaseSignOut, getIdToken } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const initialLoadHandled = useRef(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (newUser) => {
      const wasJustSignedOut = user && !newUser;
      const wasJustSignedIn = !user && newUser;
      
      setUser(newUser);
      
      if (newUser) {
        const token = await getIdToken(newUser);
        Cookies.set('firebaseIdToken', token, { expires: 1, path: '/' });
      } else {
        Cookies.remove('firebaseIdToken');
      }

      // This logic ensures the redirect only happens on the initial sign-in event.
      if (wasJustSignedIn && !initialLoadHandled.current) {
        router.push('/start');
      }

      if (!initialLoadHandled.current) {
        initialLoadHandled.current = true;
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, router]);
  
  const signOut = async () => {
      try {
          await firebaseSignOut(auth);
          router.push('/signin');
      } catch (error) {
          console.error("Error signing out:", error);
      }
  };


  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
