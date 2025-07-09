
'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Eye, PlusCircle, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { getTemplates, deleteTemplate } from '@/lib/actions';
import type { Template } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
  } from "@/components/ui/alert-dialog";

export default function TemplatesPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [templates, setTemplates] = React.useState<Template[]>([]);
    const [loading, setLoading] = React.useState(true);

    const fetchTemplates = React.useCallback(async () => {
        setLoading(true);
        try {
            const fetchedTemplates = await getTemplates();
            setTemplates(fetchedTemplates);
        } catch (error) {
            console.error("Failed to load templates", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch templates.' });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    React.useEffect(() => {
        fetchTemplates();
    }, [fetchTemplates]);

    const handleUseTemplate = (content: string) => {
        sessionStorage.setItem('selectedTemplateContent', content);
        router.push('/campaigns/new');
    }

    const handleDelete = async (templateId: string, templateName: string) => {
        try {
            await deleteTemplate(templateId);
            toast({ title: 'Template Deleted', description: `Template "${templateName}" has been removed.` });
            fetchTemplates();
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not delete template.' });
        }
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
                    {loading ? (
                        Array.from({length: 3}).map((_, i) => (
                            <Card key={i} className="flex flex-col">
                                <CardHeader><Skeleton className="h-6 w-3/4" /></CardHeader>
                                <CardContent className="flex-grow"><Skeleton className="aspect-[4/3] w-full" /></CardContent>
                                <CardFooter className="flex justify-end gap-2"><Skeleton className="h-9 w-20" /><Skeleton className="h-9 w-24" /></CardFooter>
                            </Card>
                        ))
                    ) : (
                        templates.map(template => (
                             <Card key={template.id} className="flex flex-col">
                                <CardHeader>
                                    <CardTitle className="truncate">{template.name}</CardTitle>
                                </CardHeader>
                                <CardContent className="flex-grow">
                                    <div className="aspect-[4/3] w-full rounded-md border bg-muted overflow-hidden">
                                         <div 
                                            className="p-4 scale-[0.3] origin-top-left bg-white h-[333.33%] w-[333.33%] pointer-events-none"
                                            dangerouslySetInnerHTML={{ __html: template.content }} 
                                         />
                                    </div>
                                </CardContent>
                                <CardFooter className="flex justify-between items-center">
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="destructive" size="icon" className="h-8 w-8"><Trash2 className="h-4 w-4" /></Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                <AlertDialogDescription>This will permanently delete the "{template.name}" template.</AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleDelete(template.id, template.name)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>

                                    <div className='flex gap-2'>
                                        <Dialog>
                                            <DialogTrigger asChild>
                                                <Button variant="ghost" size="sm"><Eye className="mr-2 h-4 w-4" />Preview</Button>
                                            </DialogTrigger>
                                            <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
                                                <DialogHeader>
                                                    <DialogTitle>{template.name}</DialogTitle>
                                                </DialogHeader>
                                                <div className="flex-grow border rounded-md overflow-hidden bg-white">
                                                     <iframe srcDoc={template.content} title={template.name} className="w-full h-full" />
                                                </div>
                                            </DialogContent>
                                        </Dialog>
                                        <Button size="sm" onClick={() => handleUseTemplate(template.content)}>Use Template</Button>
                                    </div>
                                </CardFooter>
                            </Card>
                        ))
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
