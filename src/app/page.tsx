
'use client';

import React from 'react';
import Link from 'next/link';
import { Rocket, Mail, BarChart2, Zap, LogIn, LayoutDashboard, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";


const FeatureCard = ({ icon: Icon, title, children }: { icon: React.ElementType, title: string, children: React.ReactNode }) => (
  <div className="flex flex-col items-center p-6 text-center bg-card rounded-lg border">
    <div className="p-3 mb-4 bg-primary/10 rounded-full">
      <Icon className="w-8 h-8 text-primary" />
    </div>
    <h3 className="text-xl font-bold mb-2">{title}</h3>
    <p className="text-muted-foreground">{children}</p>
  </div>
);

const loginFormSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  password: z.string().min(1, { message: 'Password is required.' }),
});

const signupFormSchema = z.object({
  firstName: z.string().min(2, { message: "First name is required." }),
  lastName: z.string().min(2, { message: "Last name is required." }),
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
  phone: z.string().optional(),
  company: z.string().optional(),
});


type LoginFormValues = z.infer<typeof loginFormSchema>;
type SignupFormValues = z.infer<typeof signupFormSchema>;

function AuthTabs() {
  const { emailPasswordSignIn, emailPasswordSignUp } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: { email: '', password: '' },
  });

  const signupForm = useForm<SignupFormValues>({
    resolver: zodResolver(signupFormSchema),
    defaultValues: { firstName: '', lastName: '', email: '', password: '', phone: '', company: '' },
  });

  const onLoginSubmit = async (data: LoginFormValues) => {
    setIsSubmitting(true);
    const { error } = await emailPasswordSignIn(data.email, data.password);
    if (error) {
      toast({
        variant: 'destructive',
        title: 'Sign In Failed',
        description: error.message,
      });
    }
    setIsSubmitting(false);
  };

  const onSignupSubmit = async (data: SignupFormValues) => {
    setIsSubmitting(true);
    const { error } = await emailPasswordSignUp(data);
    if (error) {
      toast({
        variant: 'destructive',
        title: 'Sign Up Failed',
        description: error.message,
      });
    }
    setIsSubmitting(false);
  };
  
  return (
    <Card className="w-full max-w-md">
      <CardContent className="p-0">
          <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="signin">Sign In</TabsTrigger>
                  <TabsTrigger value="signup">Create Account</TabsTrigger>
              </TabsList>
              <TabsContent value="signin" className="p-6">
                 <CardHeader className="p-0 mb-4">
                    <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
                    <CardDescription>Enter your credentials to access your dashboard.</CardDescription>
                </CardHeader>
                <Form {...loginForm}>
                    <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-6">
                        <FormField control={loginForm.control} name="email" render={({ field }) => (
                            <FormItem><FormLabel>Email</FormLabel><FormControl><Input placeholder="name@example.com" {...field} /></FormControl><FormMessage /></FormItem>
                        )}/>
                        <FormField control={loginForm.control} name="password" render={({ field }) => (
                            <FormItem><FormLabel>Password</FormLabel><FormControl><Input type="password" placeholder="********" {...field} /></FormControl><FormMessage /></FormItem>
                        )}/>
                        <Button type="submit" className="w-full" disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Sign In
                        </Button>
                    </form>
                </Form>
              </TabsContent>
              <TabsContent value="signup" className="p-6">
                 <CardHeader className="p-0 mb-4">
                    <CardTitle className="text-2xl font-bold">Create an Account</CardTitle>
                    <CardDescription>Get started with Ryfi MailFlow.</CardDescription>
                </CardHeader>
                 <Form {...signupForm}>
                    <form onSubmit={signupForm.handleSubmit(onSignupSubmit)} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <FormField control={signupForm.control} name="firstName" render={({ field }) => (
                                <FormItem><FormLabel>First Name</FormLabel><FormControl><Input placeholder="John" {...field} /></FormControl><FormMessage /></FormItem>
                            )}/>
                            <FormField control={signupForm.control} name="lastName" render={({ field }) => (
                                <FormItem><FormLabel>Last Name</FormLabel><FormControl><Input placeholder="Doe" {...field} /></FormControl><FormMessage /></FormItem>
                            )}/>
                        </div>
                        <FormField control={signupForm.control} name="email" render={({ field }) => (
                            <FormItem><FormLabel>Email</FormLabel><FormControl><Input placeholder="name@example.com" {...field} /></FormControl><FormMessage /></FormItem>
                        )}/>
                        <FormField control={signupForm.control} name="password" render={({ field }) => (
                            <FormItem><FormLabel>Password</FormLabel><FormControl><Input type="password" placeholder="********" {...field} /></FormControl><FormMessage /></FormItem>
                        )}/>
                        <div className="grid grid-cols-2 gap-4">
                             <FormField control={signupForm.control} name="phone" render={({ field }) => (
                                <FormItem><FormLabel>Phone <span className='text-muted-foreground'>(Optional)</span></FormLabel><FormControl><Input placeholder="(555) 123-4567" {...field} /></FormControl><FormMessage /></FormItem>
                            )}/>
                            <FormField control={signupForm.control} name="company" render={({ field }) => (
                                <FormItem><FormLabel>Company <span className='text-muted-foreground'>(Optional)</span></FormLabel><FormControl><Input placeholder="Acme Inc." {...field} /></FormControl><FormMessage /></FormItem>
                            )}/>
                        </div>
                        <Button type="submit" className="w-full" disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                           Create Account
                        </Button>
                    </form>
                </Form>
              </TabsContent>
          </Tabs>
      </CardContent>
    </Card>
  );
}


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
           {loading ? (
              <Button variant="ghost" disabled>Loading...</Button>
            ) : currentUser ? (
              <Button asChild>
                <Link href="/dashboard">
                  <LayoutDashboard className="mr-2" />
                  Dashboard
                </Link>
              </Button>
            ) : null}
        </div>
      </header>

      <main className="flex-grow">
        <section className="py-20">
          <div className="container grid md:grid-cols-2 gap-12 items-center">
              <div className="max-w-xl">
                <h1 className="text-5xl md:text-6xl font-extrabold font-headline mb-6 tracking-tighter">
                  Smarter Email Marketing, Better Results.
                </h1>
                <p className="text-lg text-muted-foreground mb-8">
                  Leverage the power of AI to craft stunning emails, manage your contacts with ease, and track your campaign performance like never before.
                </p>
              </div>
              <div>
                { !currentUser && <AuthTabs /> }
              </div>
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

      </main>

      <footer className="py-8 border-t">
        <div className="container text-center text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Ryfi MailFlow. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

