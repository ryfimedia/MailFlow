
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
import { Skeleton } from '@/components/ui/skeleton';
import { useSettings as useSettingsContext } from '@/contexts/settings-context';
import type { Settings } from '@/lib/types';

const profileFormSchema = z.object({
  companyName: z.string().min(2, "Company name must be at least 2 characters."),
  address: z.string().min(10, "A valid mailing address is required."),
  fromName: z.string().min(2, "From name must be at least 2 characters."),
});

const defaultsFormSchema = z.object({
  fromEmail: z.string().email("Please enter a valid email address."),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;
type DefaultsFormValues = z.infer<typeof defaultsFormSchema>;

export default function SettingsPage() {
  const { toast } = useToast();
  const { settings, loading, reloadSettings } = useSettingsContext();
  
  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    mode: "onChange",
    defaultValues: {
      companyName: "",
      address: "",
      fromName: "",
    },
  });

  const defaultsForm = useForm<DefaultsFormValues>({
    resolver: zodResolver(defaultsFormSchema),
    mode: "onChange",
    defaultValues: {
      fromEmail: "",
    },
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
    }
  }, [settings, profileForm, defaultsForm]);
  
  const handleSave = async (formName: 'profile' | 'defaults') => {
    let settingsToSave: Partial<Settings> = {};

    // Get values from both forms to create a complete settings object
    const profileValues = profileForm.getValues();
    const defaultsValues = defaultsForm.getValues();

    settingsToSave = {
        profile: {
            companyName: profileValues.companyName,
            address: profileValues.address,
        },
        defaults: {
            fromName: profileValues.fromName,
            fromEmail: defaultsValues.fromEmail,
        }
    };
    
    try {
      await saveSettings(settingsToSave);
      
      toast({
        title: "Settings Saved",
        description: "Your settings have been updated successfully.",
      });
      await reloadSettings();

    } catch (error: any) {
       console.error("Failed to save settings:", error);
       toast({ variant: "destructive", title: "Error", description: error.message || "Could not save settings." });
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
        <TabsList className="grid w-full grid-cols-2 md:w-[400px]">
          <TabsTrigger value="profile">Profile & From</TabsTrigger>
          <TabsTrigger value="email">Sending Email</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Form {...profileForm}>
            <form onSubmit={profileForm.handleSubmit(() => handleSave('profile'))} className="space-y-8">
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
            <form onSubmit={defaultsForm.handleSubmit(() => handleSave('defaults'))} className="space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle>Sending Email Address</CardTitle>
                  <CardDescription>
                    Set the default email address for new campaigns.
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
                           This will be the default "from" email address for new campaigns.
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

      </Tabs>
    </div>
  );
}
