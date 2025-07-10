
'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { createUserDocument } from '@/lib/actions';
import Cookies from 'js-cookie';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Rocket, Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const formSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string().min(8, { message: "Password must be at least 8 characters." }),
  terms: z.boolean().refine((val) => val === true, {
    message: "You must accept the terms and conditions.",
  }),
});

type FormValues = z.infer<typeof formSchema>;

export default function SignUpPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "", email: "", password: "", terms: false },
  });

  const onSubmit = async (data: FormValues) => {
    setLoading(true);
    setError(null);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      await updateProfile(userCredential.user, { displayName: data.name });
      
      const token = await userCredential.user.getIdToken();
      
      await createUserDocument(userCredential.user.uid, data.email, data.name);
      
      Cookies.set('firebaseIdToken', token, { expires: 1, path: '/' });
      
      router.push('/start');
      toast({ title: "Account created!", description: "Welcome to RyFi MailFlow." });

    } catch (error: any) {
      const errorCode = error.code;
      let errorMessage = "An unknown error occurred.";
      if (errorCode === 'auth/email-already-in-use') {
          errorMessage = 'This email address is already in use.';
      } else {
          console.error('Firebase sign up error:', error);
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted flex flex-col items-center justify-center p-4">
      <Link href="/" className="flex items-center gap-2 mb-6 text-2xl font-bold font-headline text-foreground">
        <div className="p-2 rounded-lg bg-primary text-primary-foreground">
          <Rocket className="w-6 h-6" />
        </div>
        <h1>RyFi MailFlow</h1>
      </Link>
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Create an Account</CardTitle>
          <CardDescription>Start your email marketing journey today.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
               {error && (
                <Alert variant="destructive">
                  <AlertTitle>Registration Failed</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl><Input placeholder="Jane Doe" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl><Input placeholder="you@example.com" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl><Input type="password" placeholder="••••••••" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="terms"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="font-normal">
                        I agree to the{" "}
                        <Link href="/terms" target="_blank" className="underline hover:text-primary">
                          Terms and Conditions
                        </Link>
                      </FormLabel>
                       <FormMessage />
                    </div>
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Account
              </Button>
            </form>
          </Form>
          <div className="mt-4 text-center text-sm">
            Already have an account?{" "}
            <Link href="/signin" className="underline">
              Sign in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
