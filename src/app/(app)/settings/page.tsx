
'use client';

import React from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from '@/components/ui/textarea';
import { getSettings, saveSettings, sendVerificationEmail, verifyEmailCode } from '@/lib/actions';
import type { Settings } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useSettings as useSettingsContext } from '@/contexts/settings-context';
import { Loader2 } from 'lucide-react';

const profileFormSchema = z.object({
  companyName: z.string().min(2, "Company name must be at least 2 characters."),
  address: z.string().min(10, "A valid mailing address is required."),
  fromName: z.string().min(2, "From name must be at least 2 characters."),
});

const defaultsFormSchema = z.object({
  fromEmail: z.string().email("Please enter a valid email address."),
});

const apiFormSchema = z.object({
    resendApiKey: z.string().refine(key => key.startsWith('re_'), {
        message: "Your Resend API key should start with 're_'"
    }),
});

const verificationFormSchema = z.object({
    code: z.string().length(6, "The verification code must be 6 digits."),
})

type ProfileFormValues = z.infer<typeof profileFormSchema>;
type DefaultsFormValues = z.infer<typeof defaultsFormSchema>;
type ApiFormValues = z.infer<typeof apiFormSchema>;
type VerificationFormValues = z.infer<typeof verificationFormSchema>;

export default function SettingsPage() {
  const { toast } = useToast();
  const { settings, loading, reloadSettings } = useSettingsContext();
  
  const [isVerifying, setIsVerifying] = React.useState(false);
  const [isResending, setIsResending] = React.useState(false);

  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    mode: "onChange",
  });

  const defaultsForm = useForm<DefaultsFormValues>({
    resolver: zodResolver(defaultsFormSchema),
    mode: "onChange",
  });

  const apiForm = useForm<ApiFormValues>({
    resolver: zodResolver(apiFormSchema),
    mode: "onChange",
  });

  const verificationForm = useForm<VerificationFormValues>({
    resolver: zodResolver(verificationFormSchema),
    mode: "onChange",
  });

  React.useEffect(() => {
    if (settings) {
        profileForm.reset({
            companyName: settings.profile?.companyName || '',
            address: settings.profile?.address || '',
            fromName: settings.defaults?.fromName || '',
        });
        defaultsForm.reset({
            fromEmail: settings.defaults?.fromEmail || '',
        });
        apiForm.reset({
            resendApiKey: settings.api?.resendApiKey || '',
        });
    }
  }, [settings, profileForm, defaultsForm, apiForm]);
  
  const handleSave = async (formName: 'profile' | 'defaults' | 'api', data: any) => {
    try {
      const result = await saveSettings(formName, data);
      
      if (result?.needsVerification) {
        toast({
          title: "Verification Required",
          description: `We've sent a verification code to ${data.fromEmail}. Please check your inbox.`,
        });
      } else {
        toast({
          title: "Settings Saved",
          description: `Your ${formName} settings have been updated successfully.`,
        });
      }
      reloadSettings();

    } catch (error: any) {
       console.error("Failed to save settings:", error);
       toast({ variant: "destructive", title: "Error", description: error.message || "Could not save settings." });
    }
  };

  const handleVerifyCode = async (data: VerificationFormValues) => {
    setIsVerifying(true);
    try {
        await verifyEmailCode(data.code);
        toast({ title: "Email Verified!", description: "You can now send campaigns from this address." });
        reloadSettings();
        verificationForm.reset();
    } catch (error: any) {
        toast({ variant: "destructive", title: "Verification Failed", description: error.message });
    } finally {
        setIsVerifying(false);
    }
  };
  
  const handleResendCode = async () => {
    setIsResending(true);
    try {
        await sendVerificationEmail();
        toast({ title: "Code Sent", description: "A new verification code has been sent to your email." });
    } catch (error: any) {
        toast({ variant: "destructive", title: "Failed to Send Code", description: error.message });
    } finally {
        setIsResending(false);
    }
  };
  
  if (loading) {
    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold font-headline">Settings</h1>
            <Skeleton className='w-[400px] h-10' />
            <Skeleton className='w-full h-80' />
        </div>
    )
  }

  const showVerification = settings?.defaults?.fromEmail && !settings.defaults.isVerified;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold font-headline">Settings</h1>
      
      {showVerification && (
        <Card className="border-accent">
            <Form {...verificationForm}>
                <form onSubmit={verificationForm.handleSubmit(handleVerifyCode)}>
                    <CardHeader>
                        <CardTitle>Verify Your "From" Email</CardTitle>
                        <CardDescription>
                            A verification code was sent to <span className='font-semibold'>{settings.defaults?.fromEmail}</span>. Please enter it below. Codes expire in 24 hours.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                         <FormField
                            control={verificationForm.control}
                            name="code"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Verification Code</FormLabel>
                                <FormControl>
                                <Input placeholder="123456" {...field} className="max-w-xs" />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                    </CardContent>
                    <CardFooter className="border-t px-6 py-4 justify-between">
                        <Button type="submit" disabled={isVerifying}>
                            {isVerifying && <Loader2 className='animate-spin mr-2' />}
                            Verify Email
                        </Button>
                        <Button type="button" variant="secondary" onClick={handleResendCode} disabled={isResending}>
                           {isResending && <Loader2 className='animate-spin mr-2' />}
                            Resend Code
                        </Button>
                    </CardFooter>
                </form>
            </Form>
        </Card>
      )}

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-3 md:w-[600px]">
          <TabsTrigger value="profile">Profile & From</TabsTrigger>
          <TabsTrigger value="email">Sending Email</TabsTrigger>
          <TabsTrigger value="api">API Keys</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Form {...profileForm}>
            <form onSubmit={profileForm.handleSubmit(data => handleSave('profile', data))} className="space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle>Company & Sender Profile</CardTitle>
                  <CardDescription>
                    This information is used for your email footers and sender identity.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={profileForm.control}
                    name="companyName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Your Company LLC" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={profileForm.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mailing Address</FormLabel>
                        <FormControl>
                          <Textarea placeholder="123 Main St, Anytown, USA 12345" {...field} />
                        </FormControl>
                         <FormDescription>
                          A physical mailing address is required for all marketing emails.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                   <FormField
                    control={profileForm.control}
                    name="fromName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Default "From" Name</FormLabel>
                        <FormControl>
                          <Input placeholder="John Doe" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
                <CardFooter className="border-t px-6 py-4">
                  <Button type="submit" disabled={profileForm.formState.isSubmitting}>Save</Button>
                </CardFooter>
              </Card>
            </form>
          </Form>
        </TabsContent>

        <TabsContent value="email">
           <Form {...defaultsForm}>
            <form onSubmit={defaultsForm.handleSubmit(data => handleSave('defaults', data))} className="space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle>Sending Email Address</CardTitle>
                  <CardDescription>
                    Set the default email address for new campaigns. You must verify ownership.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={defaultsForm.control}
                    name="fromEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Default "From" Email</FormLabel>
                        <FormControl>
                          <Input placeholder="hello@yourcompany.com" {...field} />
                        </FormControl>
                        <FormDescription>
                            If you change this, you will need to re-verify the new address.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
                <CardFooter className="border-t px-6 py-4">
                   <Button type="submit" disabled={defaultsForm.formState.isSubmitting}>Save</Button>
                </CardFooter>
              </Card>
            </form>
          </Form>
        </TabsContent>

        <TabsContent value="api">
           <Form {...apiForm}>
            <form onSubmit={apiForm.handleSubmit(data => handleSave('api', data))} className="space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle>API Keys</CardTitle>
                  <CardDescription>
                    Connect third-party services to enable application features.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={apiForm.control}
                    name="resendApiKey"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Resend API Key</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="re_..." {...field} />
                        </FormControl>
                        <FormDescription>
                            Your API key for sending emails via Resend. The free plan allows 100 emails/day.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
                <CardFooter className="border-t px-6 py-4">
                   <Button type="submit" disabled={apiForm.formState.isSubmitting}>Save</Button>
                </CardFooter>
              </Card>
            </form>
          </Form>
        </TabsContent>

      </Tabs>
    </div>
  );
}
