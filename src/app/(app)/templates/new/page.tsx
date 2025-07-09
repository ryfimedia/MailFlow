
'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Save, Bold, Italic, Underline, Image as ImageIcon, AlignLeft, AlignCenter, AlignRight, Palette, Smile, Minus, Component, Box, Undo, Paintbrush, RemoveFormatting, Tags } from "lucide-react";
import React from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { saveTemplate } from "@/lib/actions";

const templateFormSchema = z.object({
  name: z.string().min(3, { message: "Template name must be at least 3 characters." }),
  emailBody: z.string().min(1, { message: "Email body cannot be empty." }).refine(
    (html) => {
        const textContent = (html || "").replace(/<[^>]*>/g, '').trim();
        return textContent.length >= 20;
    },
    { message: "Email body must contain at least 20 characters of text." }
  ),
  emailBackgroundColor: z.string().optional(),
});

type TemplateFormValues = z.infer<typeof templateFormSchema>;

// Mock data for editor controls
const googleFonts = [
    { name: 'Roboto', family: 'sans-serif' }, { name: 'Open Sans', family: 'sans-serif' },
    { name: 'Lato', family: 'sans-serif' }, { name: 'Montserrat', family: 'sans-serif' },
    { name: 'Oswald', family: 'sans-serif' }, { name: 'Raleway', family: 'sans-serif' },
    { name: 'Poppins', family: 'sans-serif' }, { name: 'Nunito Sans', family: 'sans-serif' },
    { name: 'Merriweather', family: 'serif' }, { name: 'Playfair Display', family: 'serif' },
    { name: 'Lora', family: 'serif' }, { name: 'PT Serif', family: 'serif' },
    { name: 'Crimson Text', family: 'serif' }, { name: 'EB Garamond', family: 'serif' },
    { name: 'Domine', family: 'serif' }, { name: 'Bitter', family: 'serif' },
    { name: 'Arvo', family: 'serif' }, { name: 'Noticia Text', family: 'serif' },
    { name: 'Inter', family: 'sans-serif' }, { name: 'Space Grotesk', family: 'sans-serif' },
];
const fontSizes = ['10px', '12px', '14px', '16px', '18px', '20px', '24px', '30px', '36px', '48px'];
const colors = [
  '#000000', '#444444', '#666666', '#999999', '#CCCCCC', '#FFFFFF', 
  '#FF0000', '#FF9900', '#FFFF00', '#00FF00', '#00FFFF', '#0000FF', 
  '#9900FF', '#FF00FF', '#F44E3B', '#D9E3F0', '#68BC00', '#009CE0', 
  '#E53935', '#C2185B'
];
const emojis = ['😀', '😂', '😍', '🤔', '👍', '❤️', '🚀', '🎉', '🔥', '💡', '💯', '🙏', '🙌', '😎', '😮', '😢', '👋', '👏', '✅', '✨', '😊', '🥳', '😭', '🤯'];
const personalizationTags = [
  { label: 'First Name', value: '[FirstName]' },
  { label: 'Last Name', value: '[LastName]' },
  { label: 'Full Name', value: '[FullName]' },
  { label: 'Email Address', value: '[Email]' },
  { label: 'Phone Number', value: '[Phone]' },
  { label: 'Company Name', value: '[Company]' },
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

export default function NewTemplatePage() {
  const { toast } = useToast();
  const router = useRouter();
  const editorRef = React.useRef<HTMLDivElement>(null);
  
  const [dividerColor, setDividerColor] = React.useState('#cccccc');
  
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

  const [isPageStylePopoverOpen, setIsPageStylePopoverOpen] = React.useState(false);
  const [isSelectionCollapsed, setIsSelectionCollapsed] = React.useState(true);

  const form = useForm<TemplateFormValues>({
    resolver: zodResolver(templateFormSchema),
    mode: "onChange",
    defaultValues: {
      name: "",
      emailBody: "",
      emailBackgroundColor: "#ffffff",
    },
  });

  const emailBodyValue = form.watch("emailBody");
  const emailBackgroundColor = form.watch("emailBackgroundColor");

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
    if (editorRef.current && emailBodyValue !== editorRef.current.innerHTML) {
      const isContentDifferent = (emailBodyValue || '').replace(/&nbsp;/g, ' ') !== (editorRef.current.innerHTML || '').replace(/&nbsp;/g, ' ');
      if (isContentDifferent) {
          editorRef.current.innerHTML = emailBodyValue || '';
      }
    }
  }, [emailBodyValue]);
  
  React.useEffect(() => {
    const handleSelectionChange = () => {
        const selection = window.getSelection();
        if (selection) {
            setIsSelectionCollapsed(selection.isCollapsed);
        }
    };
    document.addEventListener('selectionchange', handleSelectionChange);
    handleSelectionChange(); // Initial check
    return () => {
        document.removeEventListener('selectionchange', handleSelectionChange);
    };
  }, []);

  const updateFormBody = React.useCallback(() => {
    if (editorRef.current) {
        form.setValue("emailBody", editorRef.current.innerHTML, {
            shouldValidate: true,
            shouldDirty: true,
        });
    }
  }, [form]);

  const applyFormat = (command: string, value?: string) => {
    if (editorRef.current) {
      editorRef.current.focus();
      document.execCommand(command, false, value);
      updateFormBody();
    }
  };
  
  const handleClearFormatting = () => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return;
    
    document.execCommand('removeFormat');
    
    const range = selection.getRangeAt(0);
    let container = range.commonAncestorContainer;
    
    if (container.nodeType === Node.TEXT_NODE) {
        container = container.parentElement!;
    }
    
    const styledBlock = (container as HTMLElement).closest<HTMLElement>('[data-styled-block="true"]');
    if (styledBlock) {
        const parent = styledBlock.parentNode!;
        while (styledBlock.firstChild) {
            parent.insertBefore(styledBlock.firstChild, styledBlock);
        }
        parent.removeChild(styledBlock);
    }
    
    updateFormBody();
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
    let blockToUpdate: HTMLElement | null = null;

    if (selectedElement && selectedElement.dataset.styledBlock) {
        blockToUpdate = selectedElement;
    } else {
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            const container = range.commonAncestorContainer;
            const parentElement = container.nodeType === Node.ELEMENT_NODE 
                ? (container as HTMLElement) 
                : container.parentElement;
            
            if (parentElement) {
                const existingBlock = parentElement.closest<HTMLElement>('[data-styled-block="true"]');
                if (existingBlock) {
                    blockToUpdate = existingBlock;
                }
            }
        }
    }

    if (blockToUpdate) {
        blockToUpdate.style.backgroundColor = blockBgColor;
        blockToUpdate.style.padding = `${blockPadding}px`;
        blockToUpdate.style.border = border;
        blockToUpdate.style.borderRadius = '8px';
    } else {
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
            toast({ variant: "destructive", title: "Selection required", description: "Please select text to wrap in a block."});
            return;
        }
        
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

    const styledBlock = target.closest<HTMLElement>('[data-styled-block="true"]');
    if (styledBlock) {
        e.preventDefault();
        setSelectedElement(styledBlock);
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

  async function onSubmit(data: TemplateFormValues) {
    try {
      await saveTemplate({
        name: data.name,
        content: data.emailBody,
      });

      toast({
        title: "Template Saved!",
        description: `Your template "${data.name}" has been successfully saved.`,
      });
      router.push('/templates');
    } catch (error) {
      console.error("Failed to save template", error);
      toast({
        variant: "destructive",
        title: "Error saving template",
        description: "Could not save the template. Please try again.",
      });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold font-headline">New Template</h1>
          <Button type="submit" disabled={!form.formState.isValid || form.formState.isSubmitting} className="bg-accent text-accent-foreground hover:bg-accent/90">
            <Save className="mr-2 h-4 w-4" />
            Save Template
          </Button>
        </div>

        <div className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Template Details</CardTitle>
                <CardDescription>Give your new template a memorable name.</CardDescription>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Template Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Monthly Newsletter Template" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                  <CardTitle>Email Content</CardTitle>
                  <CardDescription>Design your template using the editor below.</CardDescription>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="emailBody"
                  render={({ field }) => (
                    <FormItem>
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
                                <Button variant="outline" size="icon" type="button" title="Undo" className="h-8 w-8" onClick={() => applyFormat('undo')}><Undo className="h-4 w-4" /></Button>
                                <Button variant="outline" size="icon" type="button" title="Clear Formatting" className="h-8 w-8" onClick={handleClearFormatting} disabled={isSelectionCollapsed}><RemoveFormatting className="h-4 w-4" /></Button>
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
                                 <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" size="icon" type="button" title="Insert Personalization Tag" className="h-8 w-8">
                                            <Tags className="h-4 w-4" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent align="start" className="w-auto p-2">
                                        <div className="space-y-1">
                                            <p className="text-xs font-medium text-muted-foreground px-2">Personalization</p>
                                            {personalizationTags.map(tag => (
                                                <Button 
                                                    key={tag.value} 
                                                    variant="ghost" 
                                                    size="sm" 
                                                    type="button" 
                                                    className="w-full justify-start" 
                                                    onClick={() => applyFormat('insertText', tag.value)}>
                                                    {tag.label}
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
                            <div className="h-6 border-l border-border mx-1"></div>
                            <div className="flex items-center gap-1">
                                <Popover open={isPageStylePopoverOpen} onOpenChange={setIsPageStylePopoverOpen}>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" size="icon" type="button" title="Page Styles" className="h-8 w-8">
                                            <Paintbrush className="h-4 w-4" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent align="start" className="w-auto p-4">
                                        <div className="space-y-4">
                                            <p className="text-sm font-medium">Page Styles</p>
                                            <div className="flex items-center gap-2">
                                                <Label htmlFor="page-bg-color" className="text-xs whitespace-nowrap">Background Color</Label>
                                                <Input
                                                    id="page-bg-color"
                                                    type="color"
                                                    className="h-8 w-8 p-0 border-none"
                                                    value={emailBackgroundColor || '#ffffff'}
                                                    onChange={(e) => form.setValue("emailBackgroundColor", e.target.value)}
                                                />
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
                                onInput={updateFormBody}
                                onClick={handleEditorClick}
                                className="email-editor min-h-[400px] w-full rounded-b-md border-0 p-4 text-base ring-offset-background text-black placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                                placeholder="Design your template here..."
                                style={{ backgroundColor: emailBackgroundColor || '#ffffff' }}
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
