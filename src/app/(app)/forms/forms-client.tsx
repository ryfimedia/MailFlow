
'use client';

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlusCircle, MoreHorizontal, Link as LinkIcon, Clipboard, ClipboardList } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import type { OptInForm } from "@/lib/types";
import { getOptInForms, deleteOptInForm } from "@/lib/actions";
import { Skeleton } from "@/components/ui/skeleton";

export default function FormsClient({ initialForms, listMap }: { initialForms: OptInForm[], listMap: Record<string, string> }) {
  const router = useRouter();
  const { toast } = useToast();
  const [forms, setForms] = React.useState<OptInForm[]>(initialForms);
  const [loading, setLoading] = React.useState(false);
  const [formLink, setFormLink] = React.useState("");

  const fetchForms = React.useCallback(async () => {
    setLoading(true);
    try {
      const fetchedForms = await getOptInForms();
      setForms(fetchedForms);
    } catch (error) {
      console.error("Failed to load forms", error);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch forms.' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const handleDelete = async (formId: string) => {
    try {
      await deleteOptInForm(formId);
      toast({ title: 'Form Deleted', description: 'The form has been removed.' });
      fetchForms();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete form.' });
    }
  };

  const handleGetLink = (formId: string) => {
    const url = `${window.location.origin}/form/${formId}`;
    setFormLink(url);
  };
  
  const copyToClipboard = () => {
    navigator.clipboard.writeText(formLink);
    toast({ title: "Copied to clipboard!", description: "The form link has been copied." });
  };


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold font-headline">Opt-In Forms</h1>
        <Button asChild className="bg-accent text-accent-foreground hover:bg-accent/90">
          <Link href="/forms/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            New Form
          </Link>
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Your Forms</CardTitle>
          <CardDescription>Manage your opt-in forms. Share the public link to start collecting subscribers.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Form Name</TableHead>
                <TableHead>Linked List</TableHead>
                <TableHead>Submissions</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({length: 3}).map((_, i) => (
                    <TableRow key={i}><TableCell colSpan={4}><Skeleton className="h-10 w-full" /></TableCell></TableRow>
                ))
              ) : forms.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-48 text-center">
                     <ClipboardList className="mx-auto h-12 w-12 text-muted-foreground" />
                     <h3 className="mt-4 text-lg font-medium">No forms created yet</h3>
                     <p className="text-muted-foreground mt-1">Create your first opt-in form to start collecting subscribers.</p>
                     <Button asChild size="sm" className="mt-4">
                        <Link href="/forms/new">Create a Form</Link>
                     </Button>
                  </TableCell>
                </TableRow>
              ) : (
                forms.map((form) => (
                  <TableRow key={form.id}>
                    <TableCell className="font-medium">{form.name}</TableCell>
                    <TableCell>{listMap[form.contactListId] || 'Unknown List'}</TableCell>
                    <TableCell>--</TableCell>
                    <TableCell className="text-right">
                       <Dialog onOpenChange={(open) => !open && setFormLink("")}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button aria-haspopup="true" size="icon" variant="ghost">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Toggle menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onSelect={() => router.push(`/forms/new?id=${form.id}`)}>
                              Edit
                            </DropdownMenuItem>
                            <DialogTrigger asChild>
                                <DropdownMenuItem onSelect={() => handleGetLink(form.id)}>
                                    <LinkIcon className="mr-2 h-4 w-4" />
                                    Get Link
                                </DropdownMenuItem>
                            </DialogTrigger>
                             <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive">Delete</DropdownMenuItem>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                        <AlertDialogDescription>This will permanently delete the "{form.name}" form.</AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleDelete(form.id)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                          </DropdownMenuContent>
                        </DropdownMenu>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Get Your Form Link</DialogTitle>
                                <DialogDescription>Share this link to let people subscribe to your list.</DialogDescription>
                            </DialogHeader>
                            <div className="flex items-center space-x-2 pt-4">
                                <div className="grid flex-1 gap-2">
                                    <Label htmlFor="link" className="sr-only">Link</Label>
                                    <Input id="link" defaultValue={formLink} readOnly />
                                </div>
                                <Button type="button" size="sm" className="px-3" onClick={copyToClipboard}>
                                    <span className="sr-only">Copy</span>
                                    <Clipboard className="h-4 w-4" />
                                </Button>
                            </div>
                        </DialogContent>
                       </Dialog>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

