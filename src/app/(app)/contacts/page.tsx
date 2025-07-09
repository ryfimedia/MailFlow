
'use client';

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MoreVertical, PlusCircle, UploadCloud, Users, ShieldOff, MailWarning } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

const contactLists = [
  { id: '1', name: 'Newsletter Subscribers', count: 1250, createdAt: '2023-08-15', isSystemList: false },
  { id: '2', name: 'Q2 Webinar Attendees', count: 320, createdAt: '2023-06-20', isSystemList: false },
  { id: '3', name: 'High-Value Customers', count: 85, createdAt: '2023-09-01', isSystemList: false },
  { id: '4', name: 'New Signups (Last 30 Days)', count: 450, createdAt: '2023-09-10', isSystemList: false },
  { id: 'unsubscribes', name: 'Unsubscribes', count: 37, createdAt: 'System Managed', isSystemList: true },
  { id: 'bounces', name: 'Bounced Emails', count: 25, createdAt: 'System Managed', isSystemList: true },
];

const listIcons: { [key: string]: React.ElementType } = {
  unsubscribes: ShieldOff,
  bounces: MailWarning,
  default: Users,
};

export default function ContactsPage() {
  const [file, setFile] = React.useState<File | null>(null);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = () => {
    if (!file) return;
    toast({ title: "Upload successful!", description: "Your contacts have been imported." });
    
    const fileInput = document.getElementById('dropzone-file') as HTMLInputElement;
    if (fileInput) {
        fileInput.value = "";
    }
    setFile(null);
  }

  return (
    <div className="space-y-6">
       <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold font-headline">Contacts</h1>
        <Button className="bg-accent text-accent-foreground hover:bg-accent/90">
          <PlusCircle className="mr-2 h-4 w-4" />
          Create New List
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2">
            <Card>
                <CardHeader>
                    <CardTitle>Your Lists</CardTitle>
                    <CardDescription>Manage your contact lists and subscribers.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                    {contactLists.map(list => {
                        const Icon = listIcons[list.id] || listIcons.default;
                        return (
                          <Link key={list.id} href={`/contacts/${list.id}`} className="group block rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background">
                              <Card className={`h-full transition-all group-hover:shadow-md ${list.isSystemList ? 'bg-muted/50' : 'group-hover:border-primary/50'}`}>
                                  <CardHeader className="flex flex-row items-start justify-between pb-2">
                                      <CardTitle className="text-base font-medium">{list.name}</CardTitle>
                                      {!list.isSystemList && (
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button size="icon" variant="ghost" className="h-8 w-8 -mt-2 -mr-2" onClick={(e) => e.preventDefault()}>
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                <DropdownMenuItem>Rename</DropdownMenuItem>
                                                <DropdownMenuItem className="text-destructive">Delete List</DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                      )}
                                  </CardHeader>
                                  <CardContent>
                                      <div className="flex items-center gap-2 text-2xl font-bold">
                                          <Icon className="h-6 w-6 text-muted-foreground" />
                                          {list.count.toLocaleString()}
                                      </div>
                                      <p className="text-xs text-muted-foreground">
                                        {list.isSystemList ? list.createdAt : `Created on ${list.createdAt}`}
                                      </p>
                                  </CardContent>
                              </Card>
                          </Link>
                        )
                    })}
                </CardContent>
            </Card>
        </div>
        <div className="space-y-8">
             <Card>
              <CardHeader>
                <CardTitle>Import Contacts</CardTitle>
                <CardDescription>Upload a CSV with 'email' and 'name' columns.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-center w-full">
                    <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer bg-secondary hover:bg-muted">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
                            <UploadCloud className="w-10 h-10 mb-3 text-muted-foreground" />
                            {file ? (
                                <p className="font-semibold text-sm px-2">{file.name}</p>
                            ) : (
                                <>
                                <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                                <p className="text-xs text-muted-foreground">CSV file up to 10MB</p>
                                </>
                            )}
                        </div>
                        <Input id="dropzone-file" type="file" className="hidden" accept=".csv" onChange={handleFileChange} />
                    </label>
                </div>
                <Button className="w-full" disabled={!file} onClick={handleUpload}>Upload CSV</Button>
              </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
