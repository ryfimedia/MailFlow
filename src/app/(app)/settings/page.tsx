
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

const SETTINGS_KEY = 'appSettings';

const profileFormSchema = z.object({
  companyName: z.string().min(2, "Company name must be at least 2 characters."),
  address: z.string().min(10, "A valid mailing address is required."),
});

const defaultsFormSchema = z.object({
  fromName: z.string().min(2, "From name must be at least 2 characters."),
  fromEmail: z.string().email("Please enter a valid email address."),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;
type DefaultsFormValues = z.infer<typeof defaultsFormSchema>;

export default function SettingsPage() {
  const { toast } = useToast();

  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    mode: "onChange",
  });

  const defaultsForm = useForm<DefaultsFormValues>({
    resolver: zodResolver(defaultsFormSchema),
    mode: "onChange",
  });

  React.useEffect(() => {
    try {
      const storedSettings = localStorage.getItem(SETTINGS_KEY);
      if (storedSettings) {
        const settings = JSON.parse(storedSettings);
        profileForm.reset(settings.profile || {});
        defaultsForm.reset(settings.defaults || {});
      }
    } catch (error) {
      console.error("Failed to load settings:", error);
    }
  }, [profileForm, defaultsForm]);
  
  const handleSave = (data: ProfileFormValues | DefaultsFormValues, formName: 'profile' | 'defaults') => {
    try {
      const storedSettingsRaw = localStorage.getItem(SETTINGS_KEY);
      const existingSettings = storedSettingsRaw ? JSON.parse(storedSettingsRaw) : {};
      
      const updatedSettings = {
        ...existingSettings,
        [formName]: data
      };

      localStorage.setItem(SETTINGS_KEY, JSON.stringify(updatedSettings));
      toast({
        title: "Settings Saved",
        description: `Your ${formName} settings have been updated successfully.`,
      });
    } catch (error) {
       console.error("Failed to save settings:", error);
       toast({ variant: "destructive", title: "Error", description: "Could not save settings." });
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold font-headline">Settings</h1>
      
      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:w-[400px]">
          <TabsTrigger value="profile">Company Profile</TabsTrigger>
          <TabsTrigger value="defaults">Campaign Defaults</TabsTrigger>
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
                  <Button type="submit">Save</Button>
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
                   <Button type="submit">Save</Button>
                </CardFooter>
              </Card>
            </form>
          </Form>
        </TabsContent>
      </Tabs>
    </div>
  );
}
