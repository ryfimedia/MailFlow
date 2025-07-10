
'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { getContactLists, saveOptInForm, getOptInFormById } from "@/lib/actions";
import type { ContactList, OptInForm } from "@/lib/types";
import { Save, ArrowLeft, Loader2 } from "lucide-react";
import { Label } from "@/components/ui/label";

const optInFormSchema = z.object({
  name: z.string().min(3, "Form name must be at least 3 characters."),
  contactListId: z.string().min(1, "Please select a contact list."),
  title: z.string().min(5, "Title must be at least 5 characters."),
  description: z.string().optional(),
  buttonText: z.string().min(1, "Button text is required."),
  fields: z.object({
    firstName: z.boolean().default(false),
    lastName: z.boolean().default(false),
  }).default({ firstName: false, lastName: false }),
});

type OptInFormValues = z.infer<typeof optInFormSchema>;

export default function NewOptInFormPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  
  const [formId, setFormId] = React.useState<string | null>(null);
  const [contactLists, setContactLists] = React.useState<ContactList[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  
  const form = useForm<OptInFormValues>({
    resolver: zodResolver(optInFormSchema),
    mode: "onChange",
    defaultValues: {
      name: "",
      contactListId: "",
      title: "Subscribe to our Newsletter",
      description: "Get the latest news and updates delivered to your inbox.",
      buttonText: "Subscribe",
      fields: {
        firstName: true,
        lastName: false,
      },
    },
  });

  React.useEffect(() => {
    async function loadLists() {
        const lists = await getContactLists();
        setContactLists(lists.filter(l => !l.isSystemList));
    }
    loadLists();
  }, []);

  React.useEffect(() => {
    const id = searchParams.get('id');
    if (id) {
        setFormId(id);
        const fetchForm = async () => {
            const formToEdit = await getOptInFormById(id);
            if (formToEdit) {
                form.reset(formToEdit);
            } else {
                toast({ variant: 'destructive', title: "Error", description: "Opt-in form not found."});
                router.push('/forms');
            }
        };
        fetchForm();
    }
  }, [searchParams, form, router, toast]);

  const onSubmit = async (data: OptInFormValues) => {
    setIsLoading(true);
    try {
        const result = await saveOptInForm({ ...data, id: formId });
        toast({ title: `Form ${formId ? 'Updated' : 'Created'}!`, description: "Your opt-in form has been saved." });
        router.push('/forms');
    } catch(error) {
        console.error("Failed to save opt-in form:", error);
        toast({ variant: "destructive", title: "An unexpected error occurred" });
    } finally {
        setIsLoading(false);
    }
  }

  const pageTitle = formId ? "Edit Form" : "New Opt-In Form";

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="flex items-center gap-4">
            <Button asChild variant="outline" size="icon" className="h-8 w-8">
                <Link href="/forms">
                    <ArrowLeft className="h-4 w-4" />
                    <span className="sr-only">Back to Forms</span>
                </Link>
            </Button>
            <h1 className="text-3xl font-bold font-headline flex-1">{pageTitle}</h1>
            <Button type="submit" disabled={isLoading} className="bg-accent text-accent-foreground hover:bg-accent/90">
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save Form
            </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            <div className="lg:col-span-2 space-y-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Form Settings</CardTitle>
                        <CardDescription>Give your form an internal name and link it to a contact list.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <FormField control={form.control} name="name" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Internal Form Name</FormLabel>
                                <FormControl><Input placeholder="e.g., Website Footer Signup" {...field} /></FormControl>
                                <FormDescription>This name is for your reference only.</FormDescription>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="contactListId" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Contact List</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl><SelectTrigger><SelectValue placeholder="Select a list" /></SelectTrigger></FormControl>
                                <SelectContent>
                                    {contactLists.map((list) => (
                                    <SelectItem key={list.id} value={list.id}>{list.name}</SelectItem>
                                    ))}
                                </SelectContent>
                                </Select>
                                <FormDescription>New subscribers will be added to this list.</FormDescription>
                                <FormMessage />
                            </FormItem>
                        )} />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Form Content</CardTitle>
                        <CardDescription>Customize the text that appears on your form.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <FormField control={form.control} name="title" render={({ field }) => (
                            <FormItem><FormLabel>Title</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="description" render={({ field }) => (
                            <FormItem><FormLabel>Description (optional)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="buttonText" render={({ field }) => (
                            <FormItem><FormLabel>Button Text</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                    </CardContent>
                </Card>

                 <Card>
                    <CardHeader>
                        <CardTitle>Form Fields</CardTitle>
                        <CardDescription>Choose which optional fields to include. Email is always required.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <FormField control={form.control} name="fields.firstName" render={({ field }) => (
                            <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4">
                               <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                               <div className="space-y-1 leading-none"><FormLabel>First Name</FormLabel></div>
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="fields.lastName" render={({ field }) => (
                            <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4">
                               <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                               <div className="space-y-1 leading-none"><FormLabel>Last Name</FormLabel></div>
                            </FormItem>
                        )} />
                    </CardContent>
                </Card>
            </div>
            
            <div className="lg:sticky top-8">
                 <Card>
                    <CardHeader>
                        <CardTitle>Form Preview</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="w-full p-6 space-y-4 rounded-lg border bg-background">
                            <h2 className="text-xl font-semibold">{form.watch('title') || 'Form Title'}</h2>
                            <p className="text-sm text-muted-foreground">{form.watch('description') || 'Form description text.'}</p>
                            <div className="space-y-3">
                                <div className="space-y-1">
                                    <Label>Email *</Label>
                                    <Input placeholder="you@example.com" readOnly />
                                </div>
                                {form.watch('fields.firstName') && (
                                     <div className="space-y-1">
                                        <Label>First Name</Label>
                                        <Input placeholder="Jane" readOnly />
                                    </div>
                                )}
                                {form.watch('fields.lastName') && (
                                     <div className="space-y-1">
                                        <Label>Last Name</Label>
                                        <Input placeholder="Doe" readOnly />
                                    </div>
                                )}
                            </div>
                            <Button className="w-full" disabled>{form.watch('buttonText') || 'Button Text'}</Button>
                        </div>
                    </CardContent>
                 </Card>
            </div>
        </div>
      </form>
    </Form>
  );
}
