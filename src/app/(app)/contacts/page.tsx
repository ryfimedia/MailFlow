
'use client';

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MoreVertical, PlusCircle, UploadCloud, Users, ShieldOff, MailWarning, ListPlus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";


// Mock data and types - in a real app, these would be defined in a shared types file
type ContactList = {
  id: string;
  name: string;
  count: number;
  createdAt: string;
  isSystemList: boolean;
  isMasterList?: boolean;
};

// Initial data to populate localStorage if it's empty
const initialContactLists: ContactList[] = [
  { id: 'all', name: 'All Subscribers', count: 1842, createdAt: 'System Managed', isSystemList: true, isMasterList: true },
  { id: '1', name: 'Newsletter Subscribers', count: 1250, createdAt: '2023-08-15', isSystemList: false },
  { id: '2', name: 'Q2 Webinar Attendees', count: 320, createdAt: '2023-06-20', isSystemList: false },
  { id: '3', name: 'High-Value Customers', count: 85, createdAt: '2023-09-01', isSystemList: false },
  { id: '4', name: 'New Signups (Last 30 Days)', count: 450, createdAt: '2023-09-10', isSystemList: false },
  { id: 'unsubscribes', name: 'Unsubscribes', count: 37, createdAt: 'System Managed', isSystemList: true },
  { id: 'bounces', name: 'Bounced Emails', count: 25, createdAt: 'System Managed', isSystemList: true },
];

const initialContactsByList = {
    '1': Array.from({ length: 1250 }, (_, i) => ({ id: `contact_${i + 1}`, firstName: `Subscriber`, lastName: `${i + 1}`, email: `subscriber.${i + 1}@example.com`, status: 'Subscribed', subscribedAt: '2023-10-01' })),
    '2': Array.from({ length: 320 }, (_, i) => ({ id: `webinar_${i + 1}`, firstName: `Attendee`, lastName: `${i + 1}`, email: `attendee.${i + 1}@example.com`, status: 'Subscribed', subscribedAt: '2023-06-21' })),
    '3': Array.from({ length: 85 }, (_, i) => ({ id: `customer_${i + 1}`, firstName: `Valued`, lastName: `Customer ${i + 1}`, email: `customer.${i + 1}@example.com`, status: 'Subscribed', subscribedAt: '2023-09-02' })),
    '4': Array.from({ length: 450 }, (_, i) => ({ id: `signup_${i + 1}`, firstName: `New`, lastName: `User ${i + 1}`, email: `newuser.${i + 1}@example.com`, status: 'Subscribed', subscribedAt: '2023-09-15' })),
    'unsubscribes': Array.from({ length: 37 }, (_, i) => ({ id: `unsub_${i + 1}`, firstName: `Former`, lastName: `Subscriber ${i + 1}`, email: `unsubscribed.${i + 1}@example.com`, status: 'Unsubscribed', subscribedAt: '2023-01-15' })),
    'bounces': Array.from({ length: 25 }, (_, i) => ({ id: `bounce_${i + 1}`, firstName: `Bounced`, lastName: `User ${i + 1}`, email: `bounced.${i + 1}@example.com`, status: 'Bounced', subscribedAt: '2023-03-10' })),
};
// 'all' list is dynamically generated from others in a real app, here we just sum them up for display.
initialContactsByList['all'] = [...initialContactsByList['1'], ...initialContactsByList['2'], ...initialContactsByList['3'], ...initialContactsByList['4']];
initialContactLists.find(l => l.id === 'all')!.count = initialContactsByList['all'].length;


const CONTACT_LISTS_KEY = 'contactLists';
const CONTACTS_BY_LIST_KEY = 'contactsByList';


const listIcons: { [key: string]: React.ElementType } = {
  unsubscribes: ShieldOff,
  bounces: MailWarning,
  all: Users,
  default: ListPlus,
};

export default function ContactsPage() {
  const [lists, setLists] = React.useState<ContactList[]>([]);
  const [file, setFile] = React.useState<File | null>(null);
  const { toast } = useToast();

  const [isCreateListOpen, setCreateListOpen] = React.useState(false);
  const [newListName, setNewListName] = React.useState("");

  const [isRenameListOpen, setRenameListOpen] = React.useState(false);
  const [listToRename, setListToRename] = React.useState<ContactList | null>(null);
  const [renamedListName, setRenamedListName] = React.useState("");
  
  const [isUploadModalOpen, setUploadModalOpen] = React.useState(false);
  const [uploadOption, setUploadOption] = React.useState('new');
  const [uploadNewListName, setUploadNewListName] = React.useState('');
  const [uploadTargetListId, setUploadTargetListId] = React.useState('');

  React.useEffect(() => {
    try {
      const storedLists = localStorage.getItem(CONTACT_LISTS_KEY);
      const storedContacts = localStorage.getItem(CONTACTS_BY_LIST_KEY);
      if (storedLists && storedContacts) {
        setLists(JSON.parse(storedLists));
      } else {
        localStorage.setItem(CONTACT_LISTS_KEY, JSON.stringify(initialContactLists));
        localStorage.setItem(CONTACTS_BY_LIST_KEY, JSON.stringify(initialContactsByList));
        setLists(initialContactLists);
      }
    } catch (error) {
      console.error("Failed to initialize contact lists from localStorage", error);
      setLists(initialContactLists);
    }
  }, []);

  const handleCreateList = () => {
    if (newListName.trim().length < 2) {
      toast({ variant: 'destructive', title: 'Invalid Name', description: 'List name must be at least 2 characters.' });
      return;
    }
    const newList: ContactList = {
      id: new Date().getTime().toString(),
      name: newListName,
      count: 0,
      createdAt: new Date().toISOString().split('T')[0],
      isSystemList: false,
    };
    const updatedLists = [...lists, newList];
    setLists(updatedLists);
    localStorage.setItem(CONTACT_LISTS_KEY, JSON.stringify(updatedLists));

    const contactsByList = JSON.parse(localStorage.getItem(CONTACTS_BY_LIST_KEY) || '{}');
    contactsByList[newList.id] = [];
    localStorage.setItem(CONTACTS_BY_LIST_KEY, JSON.stringify(contactsByList));

    toast({ title: 'List Created!', description: `"${newListName}" has been created.` });
    setNewListName('');
    setCreateListOpen(false);
  };
  
  const handleRenameClick = (list: ContactList) => {
    setListToRename(list);
    setRenamedListName(list.name);
    setRenameListOpen(true);
  };
  
  const handleRenameList = () => {
    if (!listToRename || renamedListName.trim().length < 2) {
      toast({ variant: 'destructive', title: 'Invalid Name', description: 'List name must be at least 2 characters.' });
      return;
    }
    const updatedLists = lists.map(l => l.id === listToRename.id ? { ...l, name: renamedListName } : l);
    setLists(updatedLists);
    localStorage.setItem(CONTACT_LISTS_KEY, JSON.stringify(updatedLists));

    toast({ title: 'List Renamed!', description: `The list has been renamed to "${renamedListName}".` });
    setRenamedListName('');
    setListToRename(null);
    setRenameListOpen(false);
  };

  const handleDeleteList = (listId: string) => {
    const updatedLists = lists.filter(l => l.id !== listId);
    setLists(updatedLists);
    localStorage.setItem(CONTACT_LISTS_KEY, JSON.stringify(updatedLists));

    const contactsByList = JSON.parse(localStorage.getItem(CONTACTS_BY_LIST_KEY) || '{}');
    delete contactsByList[listId];
    localStorage.setItem(CONTACTS_BY_LIST_KEY, JSON.stringify(contactsByList));

    toast({ title: 'List Deleted', description: 'The contact list has been removed.' });
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = () => {
    if (!file) return;

    // In a real app, you would parse the CSV here. We'll simulate it.
    const newContactsCount = Math.floor(Math.random() * 100) + 10;
    
    let targetListId = '';
    let targetListName = '';
    
    if (uploadOption === 'new') {
        if (uploadNewListName.trim().length < 2) {
            toast({ variant: 'destructive', title: 'Invalid Name', description: 'New list name must be at least 2 characters.' });
            return;
        }
        targetListName = uploadNewListName;
        const newList: ContactList = {
            id: new Date().getTime().toString(),
            name: targetListName,
            count: newContactsCount,
            createdAt: new Date().toISOString().split('T')[0],
            isSystemList: false,
        };
        targetListId = newList.id;
        const updatedLists = [...lists, newList];
        setLists(updatedLists);
        localStorage.setItem(CONTACT_LISTS_KEY, JSON.stringify(updatedLists));

    } else {
        if (!uploadTargetListId) {
            toast({ variant: 'destructive', title: 'No List Selected', description: 'Please select an existing list.' });
            return;
        }
        targetListId = uploadTargetListId;
        const updatedLists = lists.map(l => {
            if (l.id === targetListId) {
                targetListName = l.name;
                return { ...l, count: l.count + newContactsCount };
            }
            return l;
        });
        setLists(updatedLists);
        localStorage.setItem(CONTACT_LISTS_KEY, JSON.stringify(updatedLists));
    }
    
    // Simulate adding contacts to contactsByList
    const contactsByList = JSON.parse(localStorage.getItem(CONTACTS_BY_LIST_KEY) || '{}');
    if (!contactsByList[targetListId]) {
        contactsByList[targetListId] = [];
    }
    // Add mock contacts
    for (let i = 0; i < newContactsCount; i++) {
        contactsByList[targetListId].push({ id: `csv_${Date.now()}_${i}`, email: `csv.contact.${Date.now()}.${i}@example.com`, firstName: 'CSV', lastName: `User ${i}`, status: 'Subscribed' });
    }
    localStorage.setItem(CONTACTS_BY_LIST_KEY, JSON.stringify(contactsByList));

    toast({ title: "Upload successful!", description: `${newContactsCount} contacts added to "${targetListName}".` });
    
    const fileInput = document.getElementById('dropzone-file') as HTMLInputElement;
    if (fileInput) fileInput.value = "";
    
    setFile(null);
    setUploadModalOpen(false);
    setUploadNewListName('');
    setUploadTargetListId('');
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold font-headline">Contacts</h1>
          <Dialog open={isCreateListOpen} onOpenChange={setCreateListOpen}>
            <DialogTrigger asChild>
              <Button className="bg-accent text-accent-foreground hover:bg-accent/90">
                <PlusCircle className="mr-2 h-4 w-4" />
                Create New List
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Create New List</DialogTitle>
                <DialogDescription>Give your new contact list a name. You can add contacts later.</DialogDescription>
              </DialogHeader>
              <div className="py-4 space-y-2">
                <Label htmlFor="list-name">List Name</Label>
                <Input
                  id="list-name"
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                  placeholder="e.g., Spring Promo List"
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateListOpen(false)}>Cancel</Button>
                <Button onClick={handleCreateList}>Create List</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-2">
              <Card>
                  <CardHeader>
                      <CardTitle>Your Lists</CardTitle>
                      <CardDescription>Manage your contact lists and subscribers.</CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-4 md:grid-cols-2">
                      {lists.map(list => {
                          const Icon = listIcons[list.id] || (list.isMasterList ? listIcons['all'] : listIcons.default);
                          return (
                            <div key={list.id} className="relative group">
                                <Link href={`/contacts/${list.id}`} className="group block rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background">
                                    <Card className={`h-full transition-all group-hover:shadow-md ${list.isSystemList ? 'bg-muted/50' : 'group-hover:border-primary/50'}`}>
                                        <CardHeader className="flex flex-row items-start justify-between pb-2">
                                            <CardTitle className="text-base font-medium">{list.name}</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="flex items-center gap-2 text-2xl font-bold">
                                                <Icon className="h-6 w-6 text-muted-foreground" />
                                                {list.count.toLocaleString()}
                                            </div>
                                            <p className="text-xs text-muted-foreground">
                                            {list.isSystemList ? list.createdAt : `Created on ${new Date(list.createdAt).toLocaleDateString('en-US')}`}
                                            </p>
                                        </CardContent>
                                    </Card>
                                </Link>
                                {!list.isSystemList && (
                                    <div className="absolute top-2 right-2">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={(e) => e.preventDefault()}>
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                <DropdownMenuItem onSelect={(e) => { e.preventDefault(); handleRenameClick(list); }}>Rename</DropdownMenuItem>
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive">Delete List</DropdownMenuItem>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                This action cannot be undone. This will permanently delete the "{list.name}" list and all its contacts.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                            <AlertDialogAction onClick={() => handleDeleteList(list.id)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                )}
                            </div>
                          )
                      })}
                  </CardContent>
              </Card>
          </div>
          <div className="space-y-8">
               <Card>
                <CardHeader>
                  <CardTitle>Import Contacts</CardTitle>
                  <CardDescription>Upload a CSV. Allowed columns: email, firstName, lastName, phone, company.</CardDescription>
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
                   <Dialog open={isUploadModalOpen} onOpenChange={setUploadModalOpen}>
                      <DialogTrigger asChild>
                         <Button className="w-full" disabled={!file}>Upload CSV</Button>
                      </DialogTrigger>
                      <DialogContent>
                          <DialogHeader>
                              <DialogTitle>Import Contacts</DialogTitle>
                              <DialogDescription>Choose where to add the new contacts from your CSV file.</DialogDescription>
                          </DialogHeader>
                          <RadioGroup defaultValue="new" value={uploadOption} onValueChange={setUploadOption} className="py-4 space-y-2">
                              <div>
                                  <div className="flex items-center space-x-2">
                                      <RadioGroupItem value="new" id="r1" />
                                      <Label htmlFor="r1">Create a new list</Label>
                                  </div>
                                  {uploadOption === 'new' && (
                                      <Input 
                                          placeholder="New list name" 
                                          className="mt-2 ml-6 w-[calc(100%-1.5rem)]"
                                          value={uploadNewListName}
                                          onChange={(e) => setUploadNewListName(e.target.value)}
                                       />
                                  )}
                              </div>
                              <div>
                                  <div className="flex items-center space-x-2">
                                      <RadioGroupItem value="existing" id="r2" />
                                      <Label htmlFor="r2">Add to an existing list</Label>
                                  </div>
                                  {uploadOption === 'existing' && (
                                      <Select onValueChange={setUploadTargetListId}>
                                          <SelectTrigger className="mt-2 ml-6 w-[calc(100%-1.5rem)]">
                                              <SelectValue placeholder="Select a list..." />
                                          </SelectTrigger>
                                          <SelectContent>
                                              {lists.filter(l => !l.isSystemList).map(l => (
                                                  <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
                                              ))}
                                          </SelectContent>
                                      </Select>
                                  )}
                              </div>
                          </RadioGroup>
                          <DialogFooter>
                              <Button variant="outline" onClick={() => setUploadModalOpen(false)}>Cancel</Button>
                              <Button onClick={handleUpload}>Import Contacts</Button>
                          </DialogFooter>
                      </DialogContent>
                   </Dialog>
                </CardContent>
              </Card>
          </div>
        </div>
      </div>
      <Dialog open={isRenameListOpen} onOpenChange={setRenameListOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Rename List</DialogTitle>
            <DialogDescription>Enter a new name for the list "{listToRename?.name}".</DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-2">
            <Label htmlFor="renamed-list-name">List Name</Label>
            <Input
              id="renamed-list-name"
              value={renamedListName}
              onChange={(e) => setRenamedListName(e.target.value)}
              placeholder="e.g., Spring Promo List"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameListOpen(false)}>Cancel</Button>
            <Button onClick={handleRenameList}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
