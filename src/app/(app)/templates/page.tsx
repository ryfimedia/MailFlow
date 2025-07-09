
'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Eye, PlusCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

// Mock data for templates
const initialTemplates = [
  {
    id: '1',
    name: 'Welcome Email',
    content: `
      <h1 style="font-size: 24px; font-weight: bold; color: #333;">Welcome aboard!</h1>
      <p>Hi [Name],</p>
      <p>We're so excited to have you join our community. We're here to help you get started with [Your Product/Service].</p>
      <p>To get the most out of it, we recommend you check out our getting started guide:</p>
      <p style="text-align: center; margin: 20px 0;">
        <a href="#" style="background-color: hsl(var(--primary)); color: hsl(var(--primary-foreground)); padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Read the Guide</a>
      </p>
      <p>If you have any questions, feel free to reply to this email. We're always happy to help!</p>
      <p>Cheers,<br>The Team</p>
    `,
  },
  {
    id: '2',
    name: 'Product Announcement',
    content: `
      <div style="text-align: center;">
        <img src="https://placehold.co/600x300.png" alt="Product Image" style="max-width: 100%; border-radius: 8px;" data-ai-hint="product launch">
      </div>
      <h2 style="font-size: 22px; font-weight: bold; color: #333; margin-top: 20px;">Introducing Our Newest Feature!</h2>
      <p>We've been working hard on something special, and we're thrilled to finally share it with you.</p>
      <p>Our new [Feature Name] will help you [benefit of the feature]. It's designed to make your experience even better.</p>
      <hr style="height: 2px; width: 70%; margin: 16px auto; background-color: #cccccc; border: 0;" />
      <p style="text-align: center; margin: 20px 0;">
        <a href="#" style="background-color: hsl(var(--primary)); color: hsl(var(--primary-foreground)); padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Learn More</a>
      </p>
      <p>Let us know what you think!</p>
    `,
  },
  {
    id: '3',
    name: 'Flash Sale',
    content: `
      <div style="text-align: center; background-color: #f8e7b3; padding: 20px; border-radius: 8px;">
        <h1 style="font-size: 36px; font-weight: bold; color: #333; margin:0;">FLASH SALE!</h1>
        <p style="font-size: 18px; color: #555;">For the next 48 hours only</p>
      </div>
      <h2 style="font-size: 28px; font-weight: bold; text-align: center; margin: 20px 0;">Get 50% Off Everything!</h2>
      <p>That's right! We're having a massive sale, but it won't last long. Use the code below at checkout to get 50% off your entire order.</p>
      <div style="text-align: center; margin: 20px 0; padding: 15px; border: 2px dashed hsl(var(--primary)); border-radius: 5px; background-color: #f9f9f9;">
        <strong style="font-size: 20px; letter-spacing: 2px;">SALE50</strong>
      </div>
      <p style="text-align: center; margin: 20px 0;">
        <a href="#" style="background-color: hsl(var(--primary)); color: hsl(var(--primary-foreground)); padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Shop Now</a>
      </p>
    `,
  },
];

export default function TemplatesPage() {
    const router = useRouter();
    const [templates, setTemplates] = React.useState(initialTemplates);

    const handleUseTemplate = (content: string) => {
        sessionStorage.setItem('selectedTemplateContent', content);
        router.push('/campaigns/new');
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold font-headline">Email Templates</h1>
                <Button asChild className="bg-accent text-accent-foreground hover:bg-accent/90">
                    <Link href="/templates/new">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Create New Template
                    </Link>
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Your Saved Templates</CardTitle>
                    <CardDescription>Use these templates to kickstart your next campaign. You can save new templates from the campaign editor.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {templates.map(template => (
                         <Card key={template.id} className="flex flex-col">
                            <CardHeader>
                                <CardTitle>{template.name}</CardTitle>
                            </CardHeader>
                            <CardContent className="flex-grow">
                                <div className="aspect-[4/3] w-full rounded-md border bg-muted overflow-hidden">
                                     <div 
                                        className="p-4 scale-[0.3] origin-top-left bg-white h-[333.33%] w-[333.33%] pointer-events-none"
                                        dangerouslySetInnerHTML={{ __html: template.content }} 
                                     />
                                </div>
                            </CardContent>
                            <CardFooter className="flex justify-end gap-2">
                                <Dialog>
                                    <DialogTrigger asChild>
                                        <Button variant="ghost" size="sm"><Eye className="mr-2 h-4 w-4" />Preview</Button>
                                    </DialogTrigger>
                                    <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
                                        <DialogHeader>
                                            <DialogTitle>{template.name}</DialogTitle>
                                        </DialogHeader>
                                        <div className="flex-grow border rounded-md overflow-hidden bg-white">
                                             <iframe srcDoc={template.content} className="w-full h-full" />
                                        </div>
                                    </DialogContent>
                                </Dialog>
                                <Button size="sm" onClick={() => handleUseTemplate(template.content)}>Use Template</Button>
                            </CardFooter>
                        </Card>
                    ))}
                </CardContent>
            </Card>
        </div>
    );
}
