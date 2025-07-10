'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Rocket } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard');
  }, [router]);

  return (
    <div className="flex h-screen w-full items-center justify-center">
        <Rocket className="w-12 h-12 animate-pulse" />
    </div>
  );
}
