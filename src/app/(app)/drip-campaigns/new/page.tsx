
'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm } from "react-hook-form";
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { getContactLists, saveDripCampaign, getDripCampaignById } from "@/lib/actions";
import type { ContactList, DripCampaign } from "@/lib/types";
import { PlusCircle, Trash2, Save, ArrowLeft, Loader2 } from "lucide-react";

const dripEmailSchema = z.object({
  delayDays: z.coerce.number().min(0, "Delay must be 0 or more."),
  subject: z.string().min(5, "Subject must be at least 5 characters."),
  body: z.string().min(20, "Body must be at least 20 characters."),
});

const dripCampaignFormSchema = z.object({
  name: z.string().min(3, "Campaign name must be at least 3 characters."),
  contactListId: z.string().min(1, "Please select a contact list."),
  status: z.enum(['Draft', 'Active', 'Paused']),
  emails: z.array(dripEmailSchema).min(1, "You must have at least one email in the sequence."),
});

type DripCampaignFormValues = z.infer<typeof dripCampaignFormSchema>;

export default function NewDripCampaignPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  
  const [campaignId, setCampaignId] = React.useState<string | null>(null);
  const [contactLists, setContactLists] = React.useState<ContactList[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  
  const form = useForm<DripCampaignFormValues>({
    resolver: zodResolver(dripCampaignFormSchema),
    mode: "onChange",
    defaultValues: {
      name: "",
      contactListId: "",
      status: "Draft",
      emails: [{ delayDays: 1, subject: "", body: "" }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "emails",
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
        setCampaignId(id);
        const fetchCampaign = async () => {
            const campaignToEdit = await getDripCampaignById(id);
            if (campaignToEdit) {
                form.reset(campaignToEdit);
            } else {
                toast({ variant: 'destructive', title: "Error", description: "Drip campaign not found."});
                router.push('/drip-campaigns');
            }
        };
        fetchCampaign();
    }
  }, [searchParams, form, router, toast]);

  const onSubmit = async (data: DripCampaignFormValues) => {
    setIsLoading(true);
    try {
        const sortedEmails = data.emails.sort((a, b) => a.delayDays - b.delayDays);
        const result = await saveDripCampaign({ ...data, emails: sortedEmails, id: campaignId });
        toast({ title: `Drip Campaign ${campaignId ? 'Updated' : 'Created'}!`, description: "Your drip campaign has been saved." });
        router.push('/drip-campaigns');
    } catch(error) {
        console.error("Failed to save drip campaign:", error);
        toast({ variant: "destructive", title: "An unexpected error occurred" });
    } finally {
        setIsLoading(false);
    }
  }

  const pageTitle = campaignId ? "Edit Drip Campaign" : "New Drip Campaign";

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="flex items-center gap-4">
            <Button asChild variant="outline" size="icon" className="h-8 w-8">
                <Link href="/drip-campaigns">
                    <ArrowLeft className="h-4 w-4" />
                    <span className="sr-only">Back to Drip Campaigns</span>
                </Link>
            </Button>
            <h1 className="text-3xl font-bold font-headline flex-1">{pageTitle}</h1>
            <Button type="submit" disabled={isLoading} className="bg-accent text-accent-foreground hover:bg-accent/90">
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save Campaign
            </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Campaign Settings</CardTitle>
            <CardDescription>Define the name, audience, and status of your drip campaign.</CardDescription>
          </CardHeader>
          <CardContent className="grid md:grid-cols-3 gap-6">
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem>
                <FormLabel>Campaign Name</FormLabel>
                <FormControl><Input placeholder="e.g., New User Welcome Series" {...field} /></FormControl>
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
                 <FormDescription>Contacts in this list will enter the sequence.</FormDescription>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="status" render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                  <SelectContent>
                    <SelectItem value="Draft">Draft</SelectItem>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Paused">Paused</SelectItem>
                  </SelectContent>
                </Select>
                 <FormDescription>Set to 'Active' to start sending emails.</FormDescription>
                <FormMessage />
              </FormItem>
            )} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Email Sequence</CardTitle>
            <CardDescription>Build the sequence of emails to send. Delays are in days after a contact subscribes.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {fields.map((field, index) => (
              <div key={field.id} className="p-4 border rounded-lg relative space-y-4">
                 <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 h-7 w-7"
                    onClick={() => remove(index)}
                    disabled={fields.length <= 1}
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Remove Email</span>
                </Button>

                <h3 className="font-semibold text-lg">Step {index + 1}</h3>

                <div className="grid md:grid-cols-4 gap-4">
                  <FormField control={form.control} name={`emails.${index}.delayDays`} render={({ field }) => (
                    <FormItem>
                      <FormLabel>Delay (days)</FormLabel>
                      <FormControl><Input type="number" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                   <div className="md:col-span-3">
                    <FormField control={form.control} name={`emails.${index}.subject`} render={({ field }) => (
                      <FormItem>
                        <FormLabel>Subject</FormLabel>
                        <FormControl><Input placeholder="e.g., Welcome! Here's what's next..." {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                   </div>
                </div>

                <FormField
                  control={form.control}
                  name={`emails.${index}.body`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Body</FormLabel>
                      <Tabs defaultValue="html" className="w-full">
                        <TabsList>
                          <TabsTrigger value="html">HTML</TabsTrigger>
                          <TabsTrigger value="preview">Preview</TabsTrigger>
                        </TabsList>
                        <TabsContent value="html">
                          <FormControl>
                            <Textarea
                              placeholder="<p>Hi [FirstName],</p><p>Welcome to our list!</p>"
                              {...field}
                              rows={10}
                              className="font-code"
                            />
                          </FormControl>
                          <FormDescription className="mt-2">
                            Use [FirstName], [LastName], and [Email] for personalization.
                          </FormDescription>
                        </TabsContent>
                        <TabsContent value="preview">
                          <div className="w-full rounded-md border min-h-[268px] bg-white">
                            <iframe
                              srcDoc={field.value}
                              title="Email Preview"
                              className="w-full h-full border-0 min-h-[268px]"
                            />
                          </div>
                        </TabsContent>
                      </Tabs>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            ))}
          </CardContent>
          <CardFooter>
            <Button type="button" variant="outline" onClick={() => append({ delayDays: fields.length + 1, subject: "", body: "" })}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Email Step
            </Button>
          </CardFooter>
        </Card>
      </form>
    </Form>
  );
}
