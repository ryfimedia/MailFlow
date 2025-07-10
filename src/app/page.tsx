'use client';

import React from 'react';
import Link from 'next/link';
import { Rocket, Mail, BarChart2, Zap, LogIn, LayoutDashboard } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import Image from 'next/image';

const FeatureCard = ({ icon: Icon, title, children }: { icon: React.ElementType, title: string, children: React.ReactNode }) => (
  <div className="flex flex-col items-center p-6 text-center bg-card rounded-lg border">
    <div className="p-3 mb-4 bg-primary/10 rounded-full">
      <Icon className="w-8 h-8 text-primary" />
    </div>
    <h3 className="text-xl font-bold mb-2">{title}</h3>
    <p className="text-muted-foreground">{children}</p>
  </div>
);

export default function LandingPage() {
  const { currentUser, loading } = useAuth();

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Rocket className="w-7 h-7 text-primary" />
            <span className="text-2xl font-bold font-headline">Ryfi MailFlow</span>
          </Link>
          <div className="flex items-center gap-2">
            {loading ? (
              <Button variant="ghost" disabled>Loading...</Button>
            ) : currentUser ? (
              <>
                <Button asChild>
                  <Link href="/dashboard">
                    <LayoutDashboard className="mr-2" />
                    Dashboard
                  </Link>
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" asChild>
                  <Link href="/login">Sign In</Link>
                </Button>
                <Button asChild>
                  <Link href="/signup">
                    <LogIn className="mr-2" />
                    Sign Up Free
                  </Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="flex-grow">
        <section className="py-20 text-center">
          <div className="container">
            <h1 className="text-5xl md:text-6xl font-extrabold font-headline mb-6 tracking-tighter">
              Smarter Email Marketing, Better Results.
            </h1>
            <p className="max-w-2xl mx-auto text-lg text-muted-foreground mb-8">
              Leverage the power of AI to craft stunning emails, manage your contacts with ease, and track your campaign performance like never before.
            </p>
            <Button size="lg" asChild>
              <Link href={currentUser ? "/dashboard" : "/signup"}>
                Get Started for Free
                <Rocket className="ml-2" />
              </Link>
            </Button>
          </div>
        </section>

        <section className="py-20 bg-muted/50">
          <div className="container">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold font-headline">Why Ryfi MailFlow?</h2>
              <p className="text-muted-foreground mt-2">Everything you need to grow your audience.</p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              <FeatureCard icon={Zap} title="AI-Powered Content">
                Generate compelling subject lines and entire email bodies with our intelligent AI assistant. Break through writer's block forever.
              </FeatureCard>
              <FeatureCard icon={Mail} title="Intuitive Campaign Editor">
                Design beautiful, responsive emails with our easy-to-use editor. No coding required, just drag, drop, and style.
              </FeatureCard>
              <FeatureCard icon={BarChart2} title="Powerful Analytics">
                Track your success with detailed reports on open rates, click rates, and more. Make data-driven decisions to improve your strategy.
              </FeatureCard>
            </div>
          </div>
        </section>
        
        <section className="py-20">
            <div className="container grid md:grid-cols-2 gap-12 items-center">
                <div>
                    <h2 className="text-4xl font-bold font-headline mb-4">Effortless Contact Management</h2>
                    <p className="text-muted-foreground mb-6 text-lg">
                        Import, organize, and segment your subscribers with tags and lists. Our system handles bounces and unsubscribes automatically, keeping your lists clean and your deliverability high.
                    </p>
                     <Button variant="outline" asChild><Link href="/login">Learn More</Link></Button>
                </div>
                <div>
                     <Image
                        src="https://placehold.co/600x400.png"
                        alt="Contact management interface"
                        width={600}
                        height={400}
                        className="rounded-lg shadow-lg"
                        data-ai-hint="dashboard interface"
                    />
                </div>
            </div>
        </section>

      </main>

      <footer className="py-8 border-t">
        <div className="container text-center text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Ryfi MailFlow. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
