'use client';

import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import React from 'react';
import { Rocket } from 'lucide-react';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { currentUser, loading } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (!loading && currentUser) {
      router.push('/dashboard');
    }
  }, [currentUser, loading, router]);
  
  if (loading || currentUser) {
    return (
        <div className="flex h-screen w-full items-center justify-center bg-background">
            <Rocket className="w-12 h-12 animate-pulse text-primary" />
        </div>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 rounded-lg bg-primary text-primary-foreground">
          <Rocket className="w-8 h-8" />
        </div>
        <h1 className="text-4xl font-bold font-headline text-foreground">
          Ryfi MailFlow
        </h1>
      </div>
      {children}
    </main>
  );
}
