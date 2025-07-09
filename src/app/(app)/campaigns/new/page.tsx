
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
import { Calendar, Send, Bold, Italic, Underline, Image as ImageIcon, AlignLeft, AlignCenter, AlignRight, Palette, Smile, Minus, Save, Component, Box } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

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

function rgbToHex(rgb: string): string {
  if (rgb.startsWith('#')) return rgb;
  if (!rgb.startsWith('rgb')) return '#000000'; // Default for color names etc.

  const sep = rgb.indexOf(",") > -1 ? "," : " ";
  const rgbParts = rgb.substr(4).split(")")[0].split(sep);

  let r = (+rgbParts[0]).toString(16),
      g = (+rgbParts[1]).toString(16),
      b = (+rgbParts[2]).toString(16);

  if (r.length === 1) r = "0" + r;
  if (g.length === 1) g = "0" + g;
  if (b.length === 1) b = "0" + b;

  return "#" + r + g + b;
}

export default function NewCampaignPage() {
  const [date, setDate] = React.useState<Date>();
  const { toast } = useToast();
  const editorRef = React.useRef<HTMLDivElement>(null);
  
  const [dividerColor, setDividerColor] = React.useState('#cccccc');
  const [isSaveTemplateOpen, setIsSaveTemplateOpen] = React.useState(false);
  const [templateName, setTemplateName] = React.useState("");
  
  const [isButtonPopoverOpen, setIsButtonPopoverOpen] = React.useState(false);
  const [buttonText, setButtonText] = React.useState("Click Here");
  const [buttonUrl, setButtonUrl] = React.useState("https://");
  const [buttonBgColor, setButtonBgColor] = React.useState('#F39C12');
  const [buttonTextColor, setButtonTextColor] = React.useState('#ffffff');

  const [isBlockStylePopoverOpen, setIsBlockStylePopoverOpen] = React.useState(false);
  const [blockBgColor, setBlockBgColor] = React.useState('#f9f9f9');
  const [blockPadding, setBlockPadding] = React.useState(20);
  const [blockBorderWidth, setBlockBorderWidth] = React.useState(1);
  const [blockBorderStyle, setBlockBorderStyle] = React.useState('solid');
  const [blockBorderColor, setBlockBorderColor] = React.useState('#cccccc');
  
  const [selectedElement, setSelectedElement] = React.useState<HTMLElement | null>(null);

  const form = useForm<CampaignFormValues>({
    resolver: zodResolver(campaignFormSchema),
    mode: "onChange",
    defaultValues: {
      subject: "",
      emailBody: "",
    },
  });

  const emailBodyValue = form.watch("emailBody");

  React.useEffect(() => {
    const templateContent = sessionStorage.getItem('selectedTemplateContent');
    if (templateContent) {
      form.setValue('emailBody', templateContent, {
        shouldValidate: true,
        shouldDirty: true,
      });
      sessionStorage.removeItem('selectedTemplateContent');
    }
  }, [form]);

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

  const updateFormBody = () => {
    if (editorRef.current) {
        form.setValue("emailBody", editorRef.current.innerHTML, {
            shouldValidate: true,
            shouldDirty: true,
        });
    }
  };

  const applyFormat = (command: string, value?: string) => {
    if (editorRef.current) {
      editorRef.current.focus();
      document.execCommand(command, false, value);
      updateFormBody();
    }
  };

  const handleFontSize = (size: string) => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    if (range.collapsed) return;

    const getSelectionHtml = () => {
        const content = range.cloneContents();
        const div = document.createElement("div");
        div.appendChild(content);
        return div.innerHTML;
    };

    const html = getSelectionHtml();
    if (html) {
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
  
  const handleSaveButton = () => {
    if (buttonText && buttonUrl) {
      if (selectedElement && selectedElement.tagName === 'A') {
        const button = selectedElement as HTMLAnchorElement;
        button.href = buttonUrl;
        button.textContent = buttonText;
        button.style.backgroundColor = buttonBgColor;
        button.style.color = buttonTextColor;
      } else {
        const buttonHtml = `<p style="text-align: center; margin: 20px 0;"><a href="${buttonUrl}" target="_blank" style="background-color: ${buttonBgColor}; color: ${buttonTextColor}; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">${buttonText}</a></p><p><br></p>`;
        applyFormat("insertHTML", buttonHtml);
      }
    }
    updateFormBody();
    setIsButtonPopoverOpen(false);
  };

  const handleSaveBlockStyles = () => {
    const border = `${blockBorderWidth}px ${blockBorderStyle} ${blockBorderColor}`;

    if (selectedElement && selectedElement.dataset.styledBlock) {
      const block = selectedElement;
      block.style.backgroundColor = blockBgColor;
      block.style.padding = `${blockPadding}px`;
      block.style.border = border;
    } else {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
          toast({ variant: "destructive", title: "Selection required", description: "Please select text to apply block styles."});
          return;
      };
      
      const range = selection.getRangeAt(0);
      const selectedContent = range.extractContents();
      
      const wrapper = document.createElement('div');
      wrapper.dataset.styledBlock = "true";
      wrapper.style.backgroundColor = blockBgColor;
      wrapper.style.padding = `${blockPadding}px`;
      wrapper.style.border = border;
      wrapper.style.borderRadius = '8px';
      wrapper.style.margin = '16px 0';
      wrapper.appendChild(selectedContent);

      range.insertNode(wrapper);
      selection.removeAllRanges();
    }
    
    updateFormBody();
    setIsBlockStylePopoverOpen(false);
  };

  const handleEditorClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;

    const button = target.closest<HTMLAnchorElement>('a[style*="display: inline-block"]');
    if (button) {
      e.preventDefault();
      setSelectedElement(button);
      setButtonText(button.textContent || "Click Here");
      setButtonUrl(button.href || "https://");
      setButtonBgColor(button.style.backgroundColor ? rgbToHex(button.style.backgroundColor) : '#F39C12');
      setButtonTextColor(button.style.color ? rgbToHex(button.style.color) : '#FFFFFF');
      setIsButtonPopoverOpen(true);
      return;
    }
    
    const block = target.closest<HTMLDivElement>('[data-styled-block="true"]');
    if (block) {
      e.preventDefault();
      setSelectedElement(block);
      
      setBlockBgColor(block.style.backgroundColor ? rgbToHex(block.style.backgroundColor) : '#f9f9f9');
      setBlockPadding(block.style.padding ? parseInt(block.style.padding, 10) : 20);

      if (block.style.border) {
        setBlockBorderWidth(parseInt(block.style.borderWidth, 10) || 1);
        setBlockBorderStyle(block.style.borderStyle || 'solid');
        setBlockBorderColor(rgbToHex(block.style.borderColor) || '#cccccc');
      } else {
        setBlockBorderWidth(1);
        setBlockBorderStyle('solid');
        setBlockBorderColor('#cccccc');
      }
      setIsBlockStylePopoverOpen(true);
      return;
    }
  };

  const handlePopoverOpenChange = (open: boolean, setter: React.Dispatch<React.SetStateAction<boolean>>) => {
    setter(open);
    if (!open) {
      setSelectedElement(null);
    }
  };

  function handleEmojiClick(emoji: string) {
    applyFormat('insertText', emoji);
  }

  const handleSaveTemplate = () => {
    const emailBody = form.getValues("emailBody");
    if (!templateName.trim()) {
      toast({
        variant: "destructive",
        title: "Template name required",
        description: "Please enter a name for your template.",
      });
      return;
    }
    if (!emailBody.replace(/<[^>]*>/g, '').trim()) {
      toast({
        variant: "destructive",
        title: "Empty content",
        description: "Cannot save an empty email body as a template.",
      });
      return;
    }

    console.log("Saving template:", { name: templateName, content: emailBody });
    
    toast({
      title: "Template Saved!",
      description: `Your template "${templateName}" has been saved.`,
    });

    setTemplateName("");
    setIsSaveTemplateOpen(false);
  };

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
                  <div className="flex items-center justify-between">
                      <div className="space-y-1.5">
                        <CardTitle>Email Content</CardTitle>
                        <CardDescription>Compose your message for your audience.</CardDescription>
                      </div>
                      <Dialog open={isSaveTemplateOpen} onOpenChange={setIsSaveTemplateOpen}>
                          <DialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                  <Save className="mr-2 h-4 w-4" />
                                  Save as Template
                              </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-[425px]">
                              <DialogHeader>
                                  <DialogTitle>Save Email as Template</DialogTitle>
                                  <DialogDescription>
                                  This will save the current email body as a reusable template. The subject line and recipient list will not be saved.
                                  </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-2 py-4">
                                  <Label htmlFor="template-name" className="text-right">
                                      Template Name
                                  </Label>
                                  <Input
                                      id="template-name"
                                      value={templateName}
                                      onChange={(e) => setTemplateName(e.target.value)}
                                      placeholder="e.g., Monthly Newsletter"
                                  />
                              </div>
                              <DialogFooter>
                                  <Button variant="outline" onClick={() => setIsSaveTemplateOpen(false)}>Cancel</Button>
                                  <Button onClick={handleSaveTemplate}>Save Template</Button>
                              </DialogFooter>
                          </DialogContent>
                      </Dialog>
                  </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="subject"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subject</FormLabel>
                      <FormControl>
                        <Input placeholder="Your email subject line" {...field} />
                      </FormControl>
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
                                 <Popover open={isButtonPopoverOpen} onOpenChange={(open) => handlePopoverOpenChange(open, setIsButtonPopoverOpen)}>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" size="icon" type="button" title="Insert Button" className="h-8 w-8">
                                            <Component className="h-4 w-4" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent align="start" className="w-auto p-4">
                                        <div className="space-y-4">
                                            <p className="text-sm font-medium">{selectedElement ? 'Edit Button' : 'Button Options'}</p>
                                            <div className="space-y-2">
                                                <Label htmlFor="button-text" className="text-xs">Text</Label>
                                                <Input id="button-text" value={buttonText} onChange={(e) => setButtonText(e.target.value)} placeholder="Click Here" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="button-url" className="text-xs">URL</Label>
                                                <Input id="button-url" value={buttonUrl} onChange={(e) => setButtonUrl(e.target.value)} placeholder="https://" />
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <div className="flex items-center gap-2">
                                                    <Label htmlFor="button-bg-color" className="text-xs">Background</Label>
                                                    <Input id="button-bg-color" type="color" className="h-8 w-8 p-0 border-none" value={buttonBgColor} onChange={(e) => setButtonBgColor(e.target.value)} />
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Label htmlFor="button-text-color" className="text-xs">Text</Label>
                                                    <Input id="button-text-color" type="color" className="h-8 w-8 p-0 border-none" value={buttonTextColor} onChange={(e) => setButtonTextColor(e.target.value)} />
                                                </div>
                                            </div>
                                            <Button size="sm" className="w-full" onClick={handleSaveButton}>{selectedElement ? 'Update Button' : 'Insert Button'}</Button>
                                        </div>
                                    </PopoverContent>
                                </Popover>
                                <Popover open={isBlockStylePopoverOpen} onOpenChange={(open) => handlePopoverOpenChange(open, setIsBlockStylePopoverOpen)}>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" size="icon" type="button" title="Style Block" className="h-8 w-8">
                                            <Box className="h-4 w-4" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent align="start" className="w-auto p-4">
                                        <div className="space-y-4">
                                            <p className="text-sm font-medium">{selectedElement ? 'Edit Block' : 'Block Styling'}</p>
                                            <div className="grid gap-4">
                                                <div className="flex items-center gap-2">
                                                    <Label htmlFor="block-bg-color" className="text-xs flex-1">Background</Label>
                                                    <Input id="block-bg-color" type="color" className="h-8 w-8 p-0 border-none" value={blockBgColor} onChange={(e) => setBlockBgColor(e.target.value)} />
                                                </div>
                                                <div>
                                                    <Label htmlFor="block-padding" className="text-xs">Padding (px)</Label>
                                                    <Input id="block-padding" type="number" value={blockPadding} onChange={(e) => setBlockPadding(Number(e.target.value))} />
                                                </div>
                                                <Separator />
                                                <p className="text-xs font-medium text-muted-foreground -mb-2">Border</p>
                                                <div className="flex items-center gap-2">
                                                    <div className="flex-1 space-y-1">
                                                        <Label htmlFor="block-border-width" className="text-xs">Width (px)</Label>
                                                        <Input id="block-border-width" type="number" value={blockBorderWidth} onChange={(e) => setBlockBorderWidth(Number(e.target.value))} />
                                                    </div>
                                                    <div className="flex-1 space-y-1">
                                                        <Label htmlFor="block-border-style" className="text-xs">Style</Label>
                                                        <Select value={blockBorderStyle} onValueChange={(value) => setBlockBorderStyle(value)}>
                                                            <SelectTrigger id="block-border-style" className="h-10">
                                                                <SelectValue placeholder="Style" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="solid">Solid</SelectItem>
                                                                <SelectItem value="dashed">Dashed</SelectItem>
                                                                <SelectItem value="dotted">Dotted</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div className="flex flex-col items-center gap-1">
                                                        <Label htmlFor="block-border-color" className="text-xs">Color</Label>
                                                        <Input id="block-border-color" type="color" className="h-10 w-10 p-0 border-none" value={blockBorderColor} onChange={(e) => setBlockBorderColor(e.target.value)} />
                                                    </div>
                                                </div>
                                            </div>
                                            <Button size="sm" className="w-full" onClick={handleSaveBlockStyles}>{selectedElement ? 'Update Styles' : 'Apply Styles'}</Button>
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
                                onClick={handleEditorClick}
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
