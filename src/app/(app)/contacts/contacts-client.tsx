
'use client';

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MoreVertical, PlusCircle, UploadCloud, Users, ShieldOff, MailWarning, ListPlus, Loader2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import Papa from 'papaparse';
import { Separator } from "@/components/ui/separator";
import type { ContactList } from "@/lib/types";
import { getContactLists, createList, renameList, deleteList, importContacts, getContactsByListId } from "@/lib/actions";

const APP_CONTACT_FIELDS = [
  { key: 'email', label: 'Email Address', required: true },
  { key: 'firstName', label: 'First Name', required: false },
  { key: 'lastName', label: 'Last Name', required: false },
  { key: 'phone', label: 'Phone', required: false },
  { key: 'company', label: 'Company', required: false },
  { key: 'tags', label: 'Tags (comma-separated)', required: false },
] as const;


const listIcons: { [key: string]: React.ElementType } = {
  unsubscribes: ShieldOff,
  bounces: MailWarning,
  all: Users,
  default: ListPlus,
};

export default function ContactsClient({ initialLists }: { initialLists: ContactList[] }) {
  const [lists, setLists] = React.useState<ContactList[]>(initialLists);
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(false);

  const [isCreateListOpen, setCreateListOpen] = React.useState(false);
  const [newListName, setNewListName] = React.useState("");

  const [isRenameListOpen, setRenameListOpen] = React.useState(false);
  const [listToRename, setListToRename] = React.useState<ContactList | null>(null);
  const [renamedListName, setRenamedListName] = React.useState("");
  
  const [isUploadModalOpen, setUploadModalOpen] = React.useState(false);
  const [isUploading, setIsUploading] = React.useState(false);
  const [file, setFile] = React.useState<File | null>(null);
  const [csvHeaders, setCsvHeaders] = React.useState<string[]>([]);
  const [columnMapping, setColumnMapping] = React.useState<Record<string, string>>({});
  const [uploadOption, setUploadOption] = React.useState('new');
  const [uploadNewListName, setUploadNewListName] = React.useState('');
  const [uploadTargetListId, setUploadTargetListId] = React.useState('');
  
  const fetchLists = React.useCallback(async () => {
    setLoading(true);
    try {
      const fetchedLists = await getContactLists();
      setLists(fetchedLists);
    } catch (error) {
      console.error("Failed to fetch contact lists", error);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch contact lists.' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const handleCreateList = async () => {
    if (newListName.trim().length < 2) {
      toast({ variant: 'destructive', title: 'Invalid Name', description: 'List name must be at least 2 characters.' });
      return;
    }
    try {
      await createList(newListName);
      toast({ title: 'List Created!', description: `"${newListName}" has been created.` });
      setNewListName('');
      setCreateListOpen(false);
      fetchLists();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to create list.' });
    }
  };
  
  const handleRenameClick = (list: ContactList) => {
    setListToRename(list);
    setRenamedListName(list.name);
    setRenameListOpen(true);
  };
  
  const handleRenameList = async () => {
    if (!listToRename || renamedListName.trim().length < 2) {
      toast({ variant: 'destructive', title: 'Invalid Name', description: 'List name must be at least 2 characters.' });
      return;
    }
    try {
      await renameList(listToRename.id, renamedListName);
      toast({ title: 'List Renamed!', description: `The list has been renamed to "${renamedListName}".` });
      setRenamedListName('');
      setListToRename(null);
      setRenameListOpen(false);
      fetchLists();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to rename list.' });
    }
  };

  const handleDeleteList = async (listId: string) => {
    try {
      await deleteList(listId);
      toast({ title: 'List Deleted', description: 'The contact list has been removed.' });
      fetchLists();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete list.' });
    }
  };

  const handleExportList = async (listId: string, listName: string) => {
    toast({
        title: "Exporting contacts...",
        description: "Your CSV file will be downloaded shortly.",
    });

    try {
        const contactsToExport = await getContactsByListId(listId);

        if (contactsToExport.length === 0) {
            toast({
                variant: "default",
                title: "List is empty",
                description: "There are no contacts in this list to export.",
            });
            return;
        }

        const dataForCsv = contactsToExport.map(contact => ({
            "Email Address": contact.email,
            "First Name": contact.firstName,
            "Last Name": contact.lastName,
            "Phone": contact.phone || '',
            "Company": contact.company || '',
            "Status": contact.status,
            "Subscribed At": contact.subscribedAt,
            "Tags": contact.tags?.join(', ') || '',
        }));

        const csv = Papa.unparse(dataForCsv);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        const safeName = listName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        link.setAttribute("download", `contacts_${safeName}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } catch (error) {
        console.error("Failed to export contacts", error);
        toast({
            variant: "destructive",
            title: "Export Failed",
            description: "An unexpected error occurred while exporting contacts.",
        });
    }
};
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setCsvHeaders([]);
      setColumnMapping({});

      Papa.parse(selectedFile, {
        preview: 1,
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const headers = results.meta.fields || [];
          setCsvHeaders(headers);
          
          const newMapping: Record<string, string> = {};
          const lowerCaseHeaders = headers.map(h => h.toLowerCase().replace(/[\s_]/g, ''));

          APP_CONTACT_FIELDS.forEach(field => {
            const fieldVariations = [field.key.toLowerCase()];
            if (field.key === 'firstName') fieldVariations.push('first');
            if (field.key === 'lastName') fieldVariations.push('last', 'surname');
            if (field.key === 'email') fieldVariations.push('emailaddress');
            
            const foundIndex = lowerCaseHeaders.findIndex(header => 
              fieldVariations.some(variation => header.includes(variation))
            );

            if (foundIndex !== -1) {
              newMapping[field.key] = headers[foundIndex];
            }
          });
          setColumnMapping(newMapping);
        },
      });
    } else {
      setFile(null);
      setCsvHeaders([]);
      setColumnMapping({});
    }
  };

  const handleUpload = () => {
    if (!file) return;

    if (uploadOption === 'new' && uploadNewListName.trim().length < 2) {
        toast({ variant: 'destructive', title: 'Invalid Name', description: 'New list name must be at least 2 characters.' });
        return;
    }
    if (uploadOption === 'existing' && !uploadTargetListId) {
        toast({ variant: 'destructive', title: 'No List Selected', description: 'Please select an existing list.' });
        return;
    }
    if (!columnMapping.email) {
        toast({ variant: 'destructive', title: 'Email Column Required', description: 'Please map the Email Address field to a column from your CSV.' });
        return;
    }
    
    setIsUploading(true);

    Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: async (results) => {
            const parsedContacts = results.data as Array<Record<string, string>>;

            try {
                const result = await importContacts({
                    contacts: parsedContacts,
                    columnMapping,
                    uploadOption,
                    uploadNewListName,
                    uploadTargetListId
                });

                const { newContactsAddedCount, duplicatesSkippedCount, targetListName } = result;
                
                const mappedHeaders = new Set(Object.values(columnMapping).filter(Boolean));
                const allCsvHeaders = new Set(csvHeaders);
                const ignoredHeaders = [...allCsvHeaders].filter(h => !mappedHeaders.has(h));

                let toastDescription = `${newContactsAddedCount} contacts added to "${targetListName}".`;
                if (duplicatesSkippedCount > 0) {
                    toastDescription += ` ${duplicatesSkippedCount} duplicates were skipped.`;
                }
                if (ignoredHeaders.length > 0) {
                    toastDescription += ` Ignored columns: ${ignoredHeaders.join(', ')}.`;
                }
                
                toast({
                    title: "Import Complete!",
                    description: toastDescription,
                });
                
                fetchLists();

                const fileInput = document.getElementById('dropzone-file') as HTMLInputElement;
                if (fileInput) fileInput.value = "";
                setFile(null);
                setUploadModalOpen(false);
                setUploadNewListName('');
                setUploadTargetListId('');
                setCsvHeaders([]);
                setColumnMapping({});

            } catch (error) {
                console.error("Error processing CSV:", error);
                toast({ variant: 'destructive', title: "An error occurred during import." });
            } finally {
              setIsUploading(false);
            }
        },
        error: (error: Error) => {
            console.error("CSV parsing error:", error);
            toast({ variant: 'destructive', title: "CSV Parsing Error", description: error.message });
            setIsUploading(false);
        }
    });
  };

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
                      {loading ? (
                          Array.from({length: 4}).map((_, i) => (
                              <Card key={i} className="h-32"><CardContent className="h-full w-full bg-muted/50 animate-pulse rounded-lg"></CardContent></Card>
                          ))
                      ) : (
                          lists.map(list => {
                              const Icon = listIcons[list.id] || (list.isMasterList ? listIcons['all'] : listIcons.default);
                              return (
                                <div key={list.id} className="relative group">
                                    <Card className={`h-full transition-all group-hover:shadow-md ${list.isSystemList ? 'bg-muted/50' : 'group-hover:border-primary/50'}`}>
                                        <Link href={`/contacts/${list.id}`} className="block h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-lg">
                                            <CardHeader className="flex flex-row items-start justify-between pb-2">
                                                <CardTitle className="text-base font-medium">{list.name}</CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="flex items-center gap-2 text-2xl font-bold">
                                                    <Icon className="h-6 w-6 text-muted-foreground" />
                                                    {list.count.toLocaleString()}
                                                </div>
                                                <p className="text-xs text-muted-foreground">
                                                {list.isSystemList ? 'System Managed' : `Created on ${new Date(list.createdAt).toLocaleDateString('en-US', { timeZone: 'UTC' })}`}
                                                </p>
                                            </CardContent>
                                        </Link>
                                    </Card>
                                    <div className="absolute top-2 right-2">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={(e) => e.preventDefault()}>
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                <DropdownMenuItem onSelect={() => handleExportList(list.id, list.name)}>
                                                    Export to CSV
                                                </DropdownMenuItem>
                                                {!list.isSystemList && (
                                                    <>
                                                        <DropdownMenuItem onSelect={(e) => { e.preventDefault(); handleRenameClick(list); }}>
                                                            Rename
                                                        </DropdownMenuItem>
                                                        <AlertDialog>
                                                            <AlertDialogTrigger asChild>
                                                                <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive">Delete List</DropdownMenuItem>
                                                            </AlertDialogTrigger>
                                                            <AlertDialogContent>
                                                                <AlertDialogHeader>
                                                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                                    <AlertDialogDescription>
                                                                        This action cannot be undone. This will permanently delete the "{list.name}" list. Contacts in this list will not be deleted from the system, only from this list.
                                                                    </AlertDialogDescription>
                                                                </AlertDialogHeader>
                                                                <AlertDialogFooter>
                                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                    <AlertDialogAction onClick={() => handleDeleteList(list.id)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                                                                </AlertDialogFooter>
                                                            </AlertDialogContent>
                                                        </AlertDialog>
                                                    </>
                                                )}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>
                              )
                          })
                      )}
                  </CardContent>
              </Card>
          </div>
          <div className="space-y-8">
               <Card>
                <CardHeader>
                  <CardTitle>Import Contacts</CardTitle>
                  <CardDescription>Upload a CSV. Allowed columns: email, firstName, lastName, phone, company, tags.</CardDescription>
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
                      <DialogContent className="sm:max-w-lg">
                          <DialogHeader>
                              <DialogTitle>Import Contacts</DialogTitle>
                              <DialogDescription>Choose where to add the new contacts and map your CSV columns.</DialogDescription>
                          </DialogHeader>
                          
                          <div className="space-y-2 pt-4">
                            <Label>Destination List</Label>
                            <RadioGroup defaultValue="new" value={uploadOption} onValueChange={setUploadOption} className="space-y-2">
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
                          </div>

                          {csvHeaders.length > 0 && (
                            <>
                              <Separator className="my-4" />
                              <div className="space-y-4">
                                  <h3 className="text-sm font-medium">Map Columns</h3>
                                  <p className="text-sm text-muted-foreground">Match columns from your file to the contact fields.</p>
                                  {APP_CONTACT_FIELDS.map(field => (
                                      <div key={field.key} className="grid grid-cols-3 items-center gap-4">
                                          <Label htmlFor={`map-${field.key}`} className="text-right">
                                              {field.label} {field.required && <span className="text-destructive">*</span>}
                                          </Label>
                                          <Select
                                              value={columnMapping[field.key] || 'none'}
                                              onValueChange={(value) => setColumnMapping(prev => ({...prev, [field.key]: value === 'none' ? '' : value}))}
                                          >
                                              <SelectTrigger id={`map-${field.key}`} className="col-span-2">
                                                  <SelectValue placeholder="Select a column..." />
                                              </SelectTrigger>
                                              <SelectContent>
                                                  <SelectItem value="none">-- Do not import --</SelectItem>
                                                  {csvHeaders.map(header => (
                                                      <SelectItem key={header} value={header}>{header}</SelectItem>
                                                  ))}
                                              </SelectContent>
                                          </Select>
                                      </div>
                                  ))}
                              </div>
                            </>
                          )}

                          <DialogFooter className="pt-4">
                              <Button variant="outline" onClick={() => setUploadModalOpen(false)} disabled={isUploading}>Cancel</Button>
                              <Button onClick={handleUpload} disabled={isUploading}>
                                {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Import Contacts
                              </Button>
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
