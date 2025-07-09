'use client';

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
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Wand2, Calendar, Send, Bold, Italic, Underline, Image as ImageIcon } from "lucide-react";
import { generateSubjectLine } from "@/ai/flows/generate-subject-line";
import React from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Link from "next/link";

// Mock data, in a real app this would come from an API
const contactLists = [
  { id: '1', name: 'Newsletter Subscribers (1,250)', value: 'list_1' },
  { id: '2', name: 'Q2 Webinar Attendees (320)', value: 'list_2' },
  { id: '3', name: 'High-Value Customers (85)', value: 'list_3' },
  { id: '4', name: 'New Signups (Last 30 Days) (450)', value: 'list_4' },
];

const campaignFormSchema = z.object({
  recipientListId: z.string({ required_error: "Please select a recipient list." }),
  subject: z.string().min(5, { message: "Subject must be at least 5 characters." }),
  emailBody: z.string().min(20, { message: "Email body must be at least 20 characters." }),
  scheduledAt: z.date().optional(),
});

type CampaignFormValues = z.infer<typeof campaignFormSchema>;

export default function NewCampaignPage() {
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [date, setDate] = React.useState<Date>();
  const { toast } = useToast();

  const form = useForm<CampaignFormValues>({
    resolver: zodResolver(campaignFormSchema),
    defaultValues: {
      subject: "",
      emailBody: "",
    },
  });

  const emailBodyForAI = form.watch("emailBody");

  React.useEffect(() => {
    form.setValue("scheduledAt", date);
  }, [date, form]);


  async function handleGenerateSubject() {
    if (!emailBodyForAI || emailBodyForAI.length < 20) {
      form.setError("emailBody", { type: "manual", message: "Please write some email content (at least 20 characters) first to generate a subject." });
      return;
    }
    setIsGenerating(true);
    try {
      const result = await generateSubjectLine({ emailBody: emailBodyForAI });
      form.setValue("subject", result.subjectLine);
      form.clearErrors("subject");
    } catch (error) {
      console.error("Failed to generate subject line:", error);
      form.setError("subject", { type: "manual", message: "AI generation failed. Please try again." });
    } finally {
      setIsGenerating(false);
    }
  }

  function onSubmit(data: CampaignFormValues) {
    console.log(data);
    const action = data.scheduledAt ? "scheduled" : "sent";
    toast({
      title: `Campaign ${action}!`,
      description: `Your email campaign has been successfully ${action}.`,
    });
    form.reset();
    setDate(undefined);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold font-headline">New Campaign</h1>
          <div className="flex gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline">
                  <Calendar className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : <span>Schedule Send</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <CalendarComponent
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <Button type="submit" className="bg-accent text-accent-foreground hover:bg-accent/90">
              <Send className="mr-2 h-4 w-4" />
              {date ? "Schedule" : "Send Now"}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-2 space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Email Content</CardTitle>
                <CardDescription>Compose your message for your audience.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="subject"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subject</FormLabel>
                      <div className="flex gap-2">
                        <FormControl>
                          <Input placeholder="Your email subject line" {...field} />
                        </FormControl>
                        <Button type="button" variant="outline" onClick={handleGenerateSubject} disabled={isGenerating}>
                          <Wand2 className="mr-2 h-4 w-4" />
                          {isGenerating ? "Generating..." : "AI Generate"}
                        </Button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="emailBody"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Body</FormLabel>
                        <div className="rounded-md border">
                          <div className="flex items-center gap-1 border-b p-2 bg-muted">
                            <Button variant="outline" size="icon" type="button" title="Bold"><Bold className="h-4 w-4" /></Button>
                            <Button variant="outline" size="icon" type="button" title="Italic"><Italic className="h-4 w-4" /></Button>
                            <Button variant="outline" size="icon" type="button" title="Underline"><Underline className="h-4 w-4" /></Button>
                            <Button variant="outline" size="icon" type="button" title="Insert Image"><ImageIcon className="h-4 w-4" /></Button>
                          </div>
                          <FormControl>
                            <Textarea
                              placeholder="Write your email here..."
                              className="min-h-[400px] border-0 rounded-t-none focus-visible:ring-0 focus-visible:ring-offset-0"
                              {...field}
                            />
                          </FormControl>
                        </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </div>

          <div className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Recipients</CardTitle>
                <CardDescription>Select the contact list to send this campaign to.</CardDescription>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="recipientListId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact List</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a list" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {contactLists.map((list) => (
                            <SelectItem key={list.id} value={list.value}>
                              {list.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        You can manage your lists on the <Link href="/contacts" className="underline">Contacts page</Link>.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </Form>
  );
}
