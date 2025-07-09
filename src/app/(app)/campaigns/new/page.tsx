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
import { UploadCloud, Wand2, Calendar, Send } from "lucide-react";
import { generateSubjectLine } from "@/ai/flows/generate-subject-line";
import React from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

const campaignFormSchema = z.object({
  recipientsFile: z.any().optional(),
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
      toast({
        title: "Subject line generated!",
        description: "The AI has created a new subject line for you.",
      });
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
              Send Now
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
                      <FormControl>
                        <Textarea
                          placeholder="Write your email here. A rich text editor will be implemented here."
                          className="min-h-[400px]"
                          {...field}
                        />
                      </FormControl>
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
                <CardDescription>Upload a CSV with 'email' and 'name' columns.</CardDescription>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="recipientsFile"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <div className="flex items-center justify-center w-full">
                            <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer bg-secondary hover:bg-muted">
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    <UploadCloud className="w-10 h-10 mb-3 text-muted-foreground" />
                                    <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                                    <p className="text-xs text-muted-foreground">CSV file up to 10MB</p>
                                </div>
                                <Input id="dropzone-file" type="file" className="hidden" accept=".csv" onChange={(e) => field.onChange(e.target.files)} />
                            </label>
                        </div> 
                      </FormControl>
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
