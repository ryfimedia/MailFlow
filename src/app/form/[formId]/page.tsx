
'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Skeleton } from '@/components/ui/skeleton';
import { Rocket, PartyPopper } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { getOptInFormById, addContactFromForm } from '@/lib/actions';
import type { OptInForm } from '@/lib/types';


export default function PublicFormPage() {
  const params = useParams();
  const formId = params.formId as string;

  const [formDetails, setFormDetails] = React.useState<OptInForm | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = React.useState(false);
  
  const formSchema = React.useMemo(() => {
    return z.object({
      email: z.string().email({ message: "Please enter a valid email." }),
      firstName: formDetails?.fields.firstName ? z.string().min(1, 'First name is required.') : z.string().optional(),
      lastName: formDetails?.fields.lastName ? z.string().min(1, 'Last name is required.') : z.string().optional(),
      phone: formDetails?.fields.phone ? z.string().min(1, 'Phone is required.') : z.string().optional(),
      company: formDetails?.fields.company ? z.string().min(1, 'Company is required.') : z.string().optional(),
    });
  }, [formDetails]);

  type FormValues = z.infer<typeof formSchema>;
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: "", firstName: "", lastName: "", phone: "", company: "" },
  });

  React.useEffect(() => {
    if (!formId) {
      setError("No form ID provided.");
      setLoading(false);
      return;
    }
    async function fetchForm() {
      try {
        const result = await getOptInFormById(formId);
        if (result) {
          setFormDetails(result);
        } else {
          setError("This form could not be found.");
        }
      } catch (e) {
        setError("An error occurred while loading the form.");
      } finally {
        setLoading(false);
      }
    }
    fetchForm();
  }, [formId]);

  const onSubmit = async (data: FormValues) => {
    if (!formId) return;
    setLoading(true);
    try {
        const result = await addContactFromForm({
            formId,
            email: data.email,
            firstName: data.firstName,
            lastName: data.lastName,
            phone: data.phone,
            company: data.company,
        });

        if (result.error) {
            setError(result.error);
        } else {
            setIsSubmitted(true);
            setError(null);
        }
    } catch(e) {
        setError("An unexpected error occurred.");
    } finally {
        setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-muted flex flex-col items-center justify-center p-4">
        <div className="flex items-center gap-2 mb-6 text-2xl font-bold font-headline text-foreground">
            <div className="p-2 rounded-lg bg-primary text-primary-foreground">
              <Rocket className="w-6 h-6" />
            </div>
            <h1>RyFi MailFlow</h1>
        </div>
      <Card className="w-full max-w-md">
        <CardHeader>
          {loading && <Skeleton className="h-8 w-3/4" />}
          {formDetails && !isSubmitted && <CardTitle>{formDetails.title}</CardTitle>}
          {formDetails && !isSubmitted && formDetails.description && <CardDescription>{formDetails.description}</CardDescription>}
          {isSubmitted && (
             <div className="text-center space-y-2">
                <PartyPopper className="h-12 w-12 mx-auto text-primary" />
                <CardTitle>You're Subscribed!</CardTitle>
                <CardDescription>Thanks for signing up. Please check your inbox to confirm your subscription.</CardDescription>
             </div>
          )}
        </CardHeader>
        <CardContent>
          {loading && (
             <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
             </div>
          )}
          {error && (
             <Alert variant="destructive">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {!loading && !error && formDetails && !isSubmitted && (
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField control={form.control} name="email" render={({ field }) => (
                         <FormItem><FormLabel>Email *</FormLabel><FormControl><Input placeholder="you@example.com" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />

                    {formDetails.fields.firstName && (
                        <FormField control={form.control} name="firstName" render={({ field }) => (
                            <FormItem><FormLabel>First Name</FormLabel><FormControl><Input placeholder="Jane" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                    )}

                    {formDetails.fields.lastName && (
                        <FormField control={form.control} name="lastName" render={({ field }) => (
                            <FormItem><FormLabel>Last Name</FormLabel><FormControl><Input placeholder="Doe" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                    )}
                    
                    {formDetails.fields.phone && (
                        <FormField control={form.control} name="phone" render={({ field }) => (
                            <FormItem><FormLabel>Phone</FormLabel><FormControl><Input placeholder="(555) 123-4567" {...field} type="tel" /></FormControl><FormMessage /></FormItem>
                        )} />
                    )}

                    {formDetails.fields.company && (
                        <FormField control={form.control} name="company" render={({ field }) => (
                            <FormItem><FormLabel>Company</FormLabel><FormControl><Input placeholder="Acme Inc." {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                    )}
                    
                    <Button type="submit" className="w-full" disabled={loading}>{formDetails.buttonText}</Button>
                </form>
            </Form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
