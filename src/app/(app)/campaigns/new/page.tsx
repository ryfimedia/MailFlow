
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Wand2, Calendar, Send, Bold, Italic, Underline, Image as ImageIcon, AlignLeft, AlignCenter, AlignRight, Palette, Smile, Minus } from "lucide-react";
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
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";

// Mock data, in a real app this would come from an API
const allContactLists = [
  { id: '1', name: 'Newsletter Subscribers (1,250)', value: 'list_1' },
  { id: '2', name: 'Q2 Webinar Attendees (320)', value: 'list_2' },
  { id: '3', name: 'High-Value Customers (85)', value: 'list_3' },
  { id: '4', name: 'New Signups (Last 30 Days) (450)', value: 'list_4' },
  { id: 'unsubscribes', name: 'Unsubscribes', value: 'list_unsub', isSystemList: true },
  { id: 'bounces', name: 'Bounced Emails', value: 'list_bounces', isSystemList: true },
];

const mailingLists = allContactLists.filter(list => !list.isSystemList);

const campaignFormSchema = z.object({
  recipientListId: z.string({ required_error: "Please select a recipient list." }),
  subject: z.string().min(5, { message: "Subject must be at least 5 characters." }),
  emailBody: z.string().min(1, { message: "Email body cannot be empty." }).refine(
    (html) => {
        const textContent = html.replace(/<[^>]*>/g, '').trim();
        return textContent.length >= 20;
    },
    { message: "Email body must contain at least 20 characters of text." }
  ),
  scheduledAt: z.date().optional(),
});

type CampaignFormValues = z.infer<typeof campaignFormSchema>;

// Mock data for editor controls
const googleFonts = [
    { name: 'Roboto', family: 'sans-serif' },
    { name: 'Open Sans', family: 'sans-serif' },
    { name: 'Lato', family: 'sans-serif' },
    { name: 'Montserrat', family: 'sans-serif' },
    { name: 'Oswald', family: 'sans-serif' },
    { name: 'Raleway', family: 'sans-serif' },
    { name: 'Poppins', family: 'sans-serif' },
    { name: 'Nunito Sans', family: 'sans-serif' },
    { name: 'Merriweather', family: 'serif' },
    { name: 'Playfair Display', family: 'serif' },
    { name: 'Lora', family: 'serif' },
    { name: 'PT Serif', family: 'serif' },
    { name: 'Crimson Text', family: 'serif' },
    { name: 'EB Garamond', family: 'serif' },
    { name: 'Domine', family: 'serif' },
    { name: 'Bitter', family: 'serif' },
    { name: 'Arvo', family: 'serif' },
    { name: 'Noticia Text', family: 'serif' },
    { name: 'Inter', family: 'sans-serif' },
    { name: 'Space Grotesk', family: 'sans-serif' },
];

const fontSizes = ['10px', '12px', '14px', '16px', '18px', '20px', '24px', '30px', '36px', '48px'];

const colors = [
  '#000000', '#444444', '#666666', '#999999', '#CCCCCC', '#FFFFFF', 
  '#FF0000', '#FF9900', '#FFFF00', '#00FF00', '#00FFFF', '#0000FF', 
  '#9900FF', '#FF00FF', '#F44E3B', '#D9E3F0', '#68BC00', '#009CE0', 
  '#E53935', '#C2185B'
];

const emojis = [
    '😀', '😂', '😍', '🤔', '👍', '❤️', '🚀', '🎉', '🔥', '💡', '💯', '🙏',
    '🙌', '😎', '😮', '😢', '👋', '👏', '✅', '✨', '😊', '🥳', '😭', '🤯',
];

export default function NewCampaignPage() {
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [date, setDate] = React.useState<Date>();
  const { toast } = useToast();
  const editorRef = React.useRef<HTMLDivElement>(null);
  const [dividerColor, setDividerColor] = React.useState('#cccccc');

  const form = useForm<CampaignFormValues>({
    resolver: zodResolver(campaignFormSchema),
    mode: "onChange",
    defaultValues: {
      subject: "",
      emailBody: "",
    },
  });

  const emailBodyValue = form.watch("emailBody");
  const emailBodyForAI = emailBodyValue.replace(/<[^>]+>/g, '');

  React.useEffect(() => {
    form.setValue("scheduledAt", date);
  }, [date, form]);
  
  React.useEffect(() => {
    if (editorRef.current && emailBodyValue !== editorRef.current.innerHTML) {
      const isContentDifferent = emailBodyValue.replace(/&nbsp;/g, ' ') !== editorRef.current.innerHTML.replace(/&nbsp;/g, ' ');
      if (isContentDifferent) {
          editorRef.current.innerHTML = emailBodyValue;
      }
    }
  }, [emailBodyValue]);


  const applyFormat = (command: string, value?: string) => {
    if (editorRef.current) {
      editorRef.current.focus();
      document.execCommand(command, false, value);
      form.setValue("emailBody", editorRef.current.innerHTML, {
        shouldValidate: true,
        shouldDirty: true,
      });
    }
  };

  const handleFontSize = (size: string) => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    if (range.collapsed) return; // Only apply to selected text for simplicity

    const getSelectionHtml = () => {
        const content = range.cloneContents();
        const div = document.createElement("div");
        div.appendChild(content);
        return div.innerHTML;
    };

    const html = getSelectionHtml();
    if (html) {
      // Wrap the selected HTML with a span that sets the font size
      applyFormat("insertHTML", `<span style="font-size: ${size};">${html}</span>`);
    }
  };

  const handleImageInsert = () => {
    const url = window.prompt("Enter image URL:");
    if (url) {
      applyFormat("insertImage", url);
    }
  };
  
  const handleInsertDivider = (height: number, color: string) => {
    const dividerHtml = `<hr style="height: ${height}px; width: 70%; margin: 16px auto; background-color: ${color}; border: 0;" /><p><br></p>`;
    applyFormat("insertHTML", dividerHtml);
  };

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

  function handleEmojiClick(emoji: string) {
    applyFormat('insertText', emoji);
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
            <Button type="submit" disabled={!form.formState.isValid} className="bg-accent text-accent-foreground hover:bg-accent/90">
              <Send className="mr-2 h-4 w-4" />
              {date ? "Schedule" : "Send Now"}
            </Button>
          </div>
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
                          {mailingLists.map((list) => (
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
                           <div className="flex flex-wrap items-center gap-2 border-b p-2 bg-muted">
                            <Select onValueChange={(font) => applyFormat('fontName', font)}>
                              <SelectTrigger className="w-auto lg:w-[140px] h-8 text-xs">
                                <SelectValue placeholder="Font" />
                              </SelectTrigger>
                              <SelectContent>
                                {googleFonts.map((font) => (
                                  <SelectItem key={font.name} value={font.name} style={{ fontFamily: `${font.name}, ${font.family}` }}>
                                    {font.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>

                            <Select onValueChange={handleFontSize}>
                              <SelectTrigger className="w-[80px] h-8 text-xs">
                                <SelectValue placeholder="Size" />
                              </SelectTrigger>
                              <SelectContent>
                                {fontSizes.map((size) => (
                                  <SelectItem key={size} value={size}>{size}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>

                            <div className="h-6 border-l border-border mx-1"></div>
                            
                            <div className="flex items-center gap-1">
                                <Button variant="outline" size="icon" type="button" title="Bold" className="h-8 w-8" onClick={() => applyFormat('bold')}><Bold className="h-4 w-4" /></Button>
                                <Button variant="outline" size="icon" type="button" title="Italic" className="h-8 w-8" onClick={() => applyFormat('italic')}><Italic className="h-4 w-4" /></Button>
                                <Button variant="outline" size="icon" type="button" title="Underline" className="h-8 w-8" onClick={() => applyFormat('underline')}><Underline className="h-4 w-4" /></Button>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" size="icon" type="button" title="Text Color" className="h-8 w-8"><Palette className="h-4 w-4" /></Button>
                                    </PopoverTrigger>
                                    <PopoverContent align="start" className="w-auto p-2">
                                        <div className="space-y-2">
                                            <p className="text-xs font-medium text-muted-foreground">Swatches</p>
                                            <div className="grid grid-cols-5 gap-1">
                                                {colors.map(color => <Button key={color} style={{backgroundColor: color}} className="h-6 w-6 rounded-sm p-0 border hover:opacity-80" title={color} onClick={() => applyFormat('foreColor', color)}></Button>)}
                                            </div>
                                            <Separator />
                                            <div className="flex items-center gap-2 pt-1">
                                                <Label htmlFor="color-picker" className="text-xs font-medium flex-1">Custom</Label>
                                                <Input id="color-picker" type="color" className="h-8 w-8 p-0 border-none" defaultValue="#000000" onChange={(e) => applyFormat('foreColor', e.target.value)} />
                                            </div>
                                        </div>
                                    </PopoverContent>
                                </Popover>
                            </div>

                            <div className="h-6 border-l border-border mx-1"></div>
                            
                            <div className="flex items-center gap-1">
                                <Button variant="outline" size="icon" type="button" title="Align Left" className="h-8 w-8" onClick={() => applyFormat('justifyLeft')}><AlignLeft className="h-4 w-4" /></Button>
                                <Button variant="outline"size="icon" type="button" title="Align Center" className="h-8 w-8" onClick={() => applyFormat('justifyCenter')}><AlignCenter className="h-4 w-4" /></Button>
                                <Button variant="outline" size="icon" type="button" title="Align Right" className="h-8 w-8" onClick={() => applyFormat('justifyRight')}><AlignRight className="h-4 w-4" /></Button>
                            </div>

                            <div className="h-6 border-l border-border mx-1"></div>
                            
                            <div className="flex items-center gap-1">
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" size="icon" type="button" title="Insert Emoji" className="h-8 w-8"><Smile className="h-4 w-4" /></Button>
                                    </PopoverTrigger>
                                    <PopoverContent align="start" className="w-auto p-2">
                                        <div className="grid grid-cols-6 gap-1">
                                            {emojis.map(emoji => (
                                                <Button 
                                                    key={emoji} 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    type="button" 
                                                    className="h-8 w-8 rounded-sm p-0 text-lg" 
                                                    onClick={() => handleEmojiClick(emoji)}
                                                >
                                                    {emoji}
                                                </Button>
                                            ))}
                                        </div>
                                    </PopoverContent>
                                </Popover>
                                <Button variant="outline" size="icon" type="button" title="Insert Image" className="h-8 w-8" onClick={handleImageInsert}><ImageIcon className="h-4 w-4" /></Button>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" size="icon" type="button" title="Insert Horizontal Rule" className="h-8 w-8">
                                            <Minus className="h-4 w-4" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent align="start" className="w-auto p-2">
                                        <div className="space-y-2">
                                            <p className="text-xs font-medium text-muted-foreground">Divider Options</p>
                                            <div className="flex flex-col items-stretch gap-2">
                                                <Button variant="outline" size="sm" type="button" onClick={() => handleInsertDivider(2, dividerColor)}>Thin (2px)</Button>
                                                <Button variant="outline" size="sm" type="button" onClick={() => handleInsertDivider(5, dividerColor)}>Medium (5px)</Button>
                                                <Button variant="outline" size="sm" type="button" onClick={() => handleInsertDivider(10, dividerColor)}>Thick (10px)</Button>
                                            </div>
                                            <Separator />
                                            <div className="flex items-center gap-2 pt-1">
                                                <Label htmlFor="divider-color-picker" className="text-xs font-medium flex-1">Color</Label>
                                                <Input id="divider-color-picker" type="color" className="h-8 w-8 p-0 border-none" value={dividerColor} onChange={(e) => setDividerColor(e.target.value)} />
                                            </div>
                                        </div>
                                    </PopoverContent>
                                </Popover>
                            </div>
                          </div>
                          <FormControl>
                            <div
                                ref={editorRef}
                                contentEditable={true}
                                onInput={(e) => field.onChange(e.currentTarget.innerHTML)}
                                className="email-editor min-h-[400px] w-full rounded-b-md border-0 bg-background p-4 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                                placeholder="Write your email here..."
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
      </form>
    </Form>
  );
}
