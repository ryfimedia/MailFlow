
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
import { getSettings, saveSettings } from '@/lib/actions';
import type { Settings } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

const profileFormSchema = z.object({
  companyName: z.string().min(2, "Company name must be at least 2 characters."),
  address: z.string().min(10, "A valid mailing address is required."),
});

const defaultsFormSchema = z.object({
  fromName: z.string().min(2, "From name must be at least 2 characters."),
  fromEmail: z.string().email("Please enter a valid email address."),
});

const apiFormSchema = z.object({
    resendApiKey: z.string().min(10, "Please enter a valid Resend API key."),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;
type DefaultsFormValues = z.infer<typeof defaultsFormSchema>;
type ApiFormValues = z.infer<typeof apiFormSchema>;

export default function SettingsPage() {
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(true);

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

  React.useEffect(() => {
    async function fetchSettings() {
        setLoading(true);
        try {
            const settings = await getSettings();
            if (settings) {
                profileForm.reset(settings.profile || {});
                defaultsForm.reset(settings.defaults || {});
                apiForm.reset(settings.api || {});
            }
        } catch (error) {
            console.error("Failed to load settings:", error);
            toast({ variant: "destructive", title: "Error", description: "Could not load settings." });
        } finally {
            setLoading(false);
        }
    }
    fetchSettings();
  }, [profileForm, defaultsForm, apiForm, toast]);
  
  const handleSave = async (data: ProfileFormValues | DefaultsFormValues | ApiFormValues, formName: 'profile' | 'defaults' | 'api') => {
    try {
      await saveSettings(formName, data);
      toast({
        title: "Settings Saved",
        description: `Your ${formName} settings have been updated successfully.`,
      });
    } catch (error) {
       console.error("Failed to save settings:", error);
       toast({ variant: "destructive", title: "Error", description: "Could not save settings." });
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

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold font-headline">Settings</h1>
      
      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-3 md:w-[600px]">
          <TabsTrigger value="profile">Company Profile</TabsTrigger>
          <TabsTrigger value="defaults">Campaign Defaults</TabsTrigger>
          <TabsTrigger value="api">API Keys</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Form {...profileForm}>
            <form onSubmit={profileForm.handleSubmit(data => handleSave(data, 'profile'))} className="space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle>Company Profile</CardTitle>
                  <CardDescription>
                    This information is used for your email footers to comply with anti-spam laws.
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
                </CardContent>
                <CardFooter className="border-t px-6 py-4">
                  <Button type="submit" disabled={profileForm.formState.isSubmitting}>Save</Button>
                </CardFooter>
              </Card>
            </form>
          </Form>
        </TabsContent>

        <TabsContent value="defaults">
           <Form {...defaultsForm}>
            <form onSubmit={defaultsForm.handleSubmit(data => handleSave(data, 'defaults'))} className="space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle>Campaign Defaults</CardTitle>
                  <CardDescription>
                    Set the default sender information for new campaigns.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={defaultsForm.control}
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
                  <FormField
                    control={defaultsForm.control}
                    name="fromEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Default "From" Email</FormLabel>
                        <FormControl>
                          <Input placeholder="hello@yourcompany.com" {...field} />
                        </FormControl>
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
            <form onSubmit={apiForm.handleSubmit(data => handleSave(data, 'api'))} className="space-y-8">
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
