
'use client';

import React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, MoreVertical, ArrowUpDown, ArrowUp, ArrowDown, ChevronDown, Plus } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
} from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

// Mock data and types - in a real app, these would be defined in a shared types file
type Contact = {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    company?: string;
    status: 'Subscribed' | 'Unsubscribed' | 'Bounced';
    subscribedAt: string;
};

type ContactList = {
    id: string;
    name: string;
    count: number;
    createdAt: string;
    isSystemList: boolean;
    isMasterList?: boolean;
};

const columnConfig = [
    { id: 'firstName', label: 'First Name' },
    { id: 'lastName', label: 'Last Name' },
    { id: 'email', label: 'Email' },
    { id: 'phone', label: 'Phone' },
    { id: 'company', label: 'Company' },
    { id: 'status', label: 'Status' },
    { id: 'subscribedAt', label: 'Date' },
] as const;

type ColumnId = typeof columnConfig[number]['id'];

const EditContactFormSchema = z.object({
  firstName: z.string().min(1, { message: "First name is required." }),
  lastName: z.string().min(1, { message: "Last name is required." }),
  email: z.string().email({ message: "Please enter a valid email." }),
  phone: z.string().optional(),
  company: z.string().optional(),
});

type EditContactFormValues = z.infer<typeof EditContactFormSchema>;
type SortConfig = { key: keyof Contact; direction: 'ascending' | 'descending' } | null;

const CONTACT_LISTS_KEY = 'contactLists';
const CONTACTS_BY_LIST_KEY = 'contactsByList';

export default function ContactListPage() {
    const params = useParams();
    const router = useRouter();
    const listId = params.listId as string;
    const { toast } = useToast();
    
    const [list, setList] = React.useState<ContactList | null>(null);
    const [allLists, setAllLists] = React.useState<ContactList[]>([]);
    const [contacts, setContacts] = React.useState<Contact[]>([]);
    
    const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
    const [selectedContact, setSelectedContact] = React.useState<Contact | null>(null);

    const [selectedContactIds, setSelectedContactIds] = React.useState<string[]>([]);

    const [sortConfig, setSortConfig] = React.useState<SortConfig>({ key: 'lastName', direction: 'ascending' });
    const [visibleColumns, setVisibleColumns] = React.useState<Record<ColumnId, boolean>>({
        firstName: true,
        lastName: true,
        email: true,
        phone: false,
        company: false,
        status: true,
        subscribedAt: true,
    });

    const form = useForm<EditContactFormValues>({
        resolver: zodResolver(EditContactFormSchema),
    });
    
    React.useEffect(() => {
        try {
            const storedLists = localStorage.getItem(CONTACT_LISTS_KEY);
            const storedContacts = localStorage.getItem(CONTACTS_BY_LIST_KEY);
            if (storedLists && storedContacts) {
                const allListsData: ContactList[] = JSON.parse(storedLists);
                const contactsByListData = JSON.parse(storedContacts);
                
                setAllLists(allListsData);
                const currentList = allListsData.find(l => l.id === listId) || null;
                setList(currentList);
                
                if (currentList) {
                    setContacts(contactsByListData[listId] || []);
                }
            } else {
                 router.push('/contacts'); // Redirect if no data
            }
        } catch (error) {
            console.error("Failed to load contact data from localStorage", error);
        }
    }, [listId, router]);

    React.useEffect(() => {
        if (selectedContact) {
            form.reset({
                firstName: selectedContact.firstName,
                lastName: selectedContact.lastName,
                email: selectedContact.email,
                phone: selectedContact.phone || '',
                company: selectedContact.company || '',
            });
        }
    }, [selectedContact, form]);

    const handleEditClick = (contact: Contact) => {
        setSelectedContact(contact);
        setIsEditDialogOpen(true);
    };

    const handleEditSubmit = (values: EditContactFormValues) => {
        if (!selectedContact) return;
        
        const updatedContacts = contacts.map(c => 
            c.id === selectedContact.id ? { ...c, ...values } : c
        );
        setContacts(updatedContacts);

        try {
            const storedContactsByList = JSON.parse(localStorage.getItem(CONTACTS_BY_LIST_KEY) || '{}');
            storedContactsByList[listId] = updatedContacts;
            localStorage.setItem(CONTACTS_BY_LIST_KEY, JSON.stringify(storedContactsByList));
        } catch (error) {
            console.error("Failed to save updated contact:", error);
        }

        toast({
            title: "Contact Updated",
            description: `${values.firstName} ${values.lastName}'s details have been saved.`,
        });
        setIsEditDialogOpen(false);
        setSelectedContact(null);
    };

    const handleRemoveFromList = (contactId: string, contactName: string) => {
        const updatedContacts = contacts.filter(c => c.id !== contactId);
        setContacts(updatedContacts);

        try {
            const allListsData: ContactList[] = JSON.parse(localStorage.getItem(CONTACT_LISTS_KEY) || '[]');
            const contactsByListData = JSON.parse(localStorage.getItem(CONTACTS_BY_LIST_KEY) || '{}');

            // Update contacts for the current list
            contactsByListData[listId] = updatedContacts;
            
            // Also remove from the 'all' list if it exists and this isn't a system list (like 'bounces')
            if (contactsByListData['all'] && !list?.isSystemList) {
                 contactsByListData['all'] = contactsByListData['all'].filter((c: Contact) => c.id !== contactId);
            }

            localStorage.setItem(CONTACTS_BY_LIST_KEY, JSON.stringify(contactsByListData));

            // Update list counts
            const updatedLists = allListsData.map(l => {
                if (l.id === listId) {
                    return { ...l, count: l.count - 1 };
                }
                // Also decrement the master list count if not a system list
                if (l.id === 'all' && !list?.isSystemList) {
                    return { ...l, count: l.count - 1 };
                }
                return l;
            }).filter(l => l.count >= 0); // Ensure count never goes below zero
            localStorage.setItem(CONTACT_LISTS_KEY, JSON.stringify(updatedLists));

            toast({
                title: "Contact Removed",
                description: `${contactName} has been removed from this list.`,
            });
        } catch (error) {
            console.error("Failed to remove contact:", error);
            toast({ variant: 'destructive', title: "An error occurred" });
        }
    };

    const requestSort = (key: keyof Contact) => {
        let direction: 'ascending' | 'descending' = 'ascending';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const sortedContacts = React.useMemo(() => {
        let sortableItems = [...contacts];
        if (sortConfig !== null) {
            sortableItems.sort((a, b) => {
                const aValue = a[sortConfig.key] || '';
                const bValue = b[sortConfig.key] || '';
                if (aValue < bValue) {
                    return sortConfig.direction === 'ascending' ? -1 : 1;
                }
                if (aValue > bValue) {
                    return sortConfig.direction === 'ascending' ? 1 : -1;
                }
                return 0;
            });
        }
        return sortableItems;
    }, [contacts, sortConfig]);

    const toggleColumn = (columnId: ColumnId) => {
        setVisibleColumns(prev => ({...prev, [columnId]: !prev[columnId]}));
    }

    const handleSelectAll = (checked: boolean) => {
        setSelectedContactIds(checked ? sortedContacts.map(c => c.id) : []);
    };
    
    const handleSelectOne = (contactId: string, checked: boolean) => {
        if (checked) {
            setSelectedContactIds(prev => [...prev, contactId]);
        } else {
            setSelectedContactIds(prev => prev.filter(id => id !== contactId));
        }
    };
    
    const handleAddToList = (targetListId: string) => {
        const contactsToAdd = contacts.filter(c => selectedContactIds.includes(c.id));
        if (contactsToAdd.length === 0) return;

        try {
            const allListsData: ContactList[] = JSON.parse(localStorage.getItem(CONTACT_LISTS_KEY) || '[]');
            const contactsByListData = JSON.parse(localStorage.getItem(CONTACTS_BY_LIST_KEY) || '{}');

            const targetList = allListsData.find(l => l.id === targetListId);
            if (!targetList) {
                toast({ variant: 'destructive', title: "List not found" });
                return;
            }

            const existingTargetContacts = contactsByListData[targetListId] || [];
            const existingEmails = new Set(existingTargetContacts.map((c: Contact) => c.email));
            const newContactsForTarget = contactsToAdd.filter(c => !existingEmails.has(c.email));
            
            contactsByListData[targetListId] = [...existingTargetContacts, ...newContactsForTarget];
            
            const updatedLists = allListsData.map(l => 
                l.id === targetListId ? { ...l, count: contactsByListData[targetListId].length } : l
            );
            
            localStorage.setItem(CONTACTS_BY_LIST_KEY, JSON.stringify(contactsByListData));
            localStorage.setItem(CONTACT_LISTS_KEY, JSON.stringify(updatedLists));

            toast({
                title: "Contacts Added",
                description: `${newContactsForTarget.length} contact(s) added to "${targetList.name}".`,
            });
            setSelectedContactIds([]);
        } catch (error) {
            console.error("Failed to add contacts to list:", error);
            toast({ variant: 'destructive', title: "An error occurred" });
        }
    };
    
    if (!list) {
        return (
            <div className="space-y-6">
                <Button asChild variant="outline">
                    <Link href="/contacts">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Lists
                    </Link>
                </Button>
                <Card>
                    <CardHeader>
                        <CardTitle>List Not Found</CardTitle>
                        <CardDescription>The contact list you're looking for doesn't exist.</CardDescription>
                    </CardHeader>
                </Card>
            </div>
        )
    }

    const cardDescription = list.isSystemList 
        ? "This is a system-managed list. Contacts cannot be edited or removed."
        : `A list of all contacts in ${list.name}.`;

    const renderSortArrow = (columnKey: keyof Contact) => {
        if (sortConfig?.key !== columnKey) {
            return <ArrowUpDown className="ml-2 h-4 w-4" />;
        }
        return sortConfig.direction === 'ascending' ? (
            <ArrowUp className="ml-2 h-4 w-4" />
        ) : (
            <ArrowDown className="ml-2 h-4 w-4" />
        );
    };

    const isAllSelected = selectedContactIds.length > 0 && selectedContactIds.length === sortedContacts.length;
    const isSomeSelected = selectedContactIds.length > 0 && selectedContactIds.length < sortedContacts.length;

    return (
        <>
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Button asChild variant="outline" size="icon" className="h-8 w-8">
                        <Link href="/contacts">
                            <ArrowLeft className="h-4 w-4" />
                            <span className="sr-only">Back to Lists</span>
                        </Link>
                    </Button>
                    <h1 className="text-3xl font-bold font-headline">{list.name}</h1>
                </div>

                <Card>
                    <CardHeader>
                        <div className="flex items-start justify-between">
                            <div>
                                <CardTitle>Subscribers</CardTitle>
                                <CardDescription>{cardDescription}</CardDescription>
                            </div>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" className="ml-auto">
                                        Columns <ChevronDown className="ml-2 h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    {columnConfig.map(col => (
                                        <DropdownMenuCheckboxItem
                                            key={col.id}
                                            className="capitalize"
                                            checked={visibleColumns[col.id]}
                                            onCheckedChange={() => toggleColumn(col.id)}
                                        >
                                            {col.label}
                                        </DropdownMenuCheckboxItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </CardHeader>
                    <CardContent>
                         {selectedContactIds.length > 0 && (
                            <div className="mb-4 flex items-center gap-4 rounded-lg bg-secondary p-3">
                                <span className="text-sm font-medium">{selectedContactIds.length} selected</span>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button size="sm" variant="outline">
                                            <Plus className="mr-2 h-4 w-4" /> Add to list
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="start">
                                        <DropdownMenuLabel>Select a list</DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        {allLists.filter(l => !l.isSystemList && l.id !== listId).map(l => (
                                            <DropdownMenuItem key={l.id} onSelect={() => handleAddToList(l.id)}>
                                                {l.name}
                                            </DropdownMenuItem>
                                        ))}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                         )}
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        {!list.isSystemList && (
                                            <TableHead className="w-[50px]">
                                                <Checkbox 
                                                    aria-label="Select all" 
                                                    checked={isAllSelected}
                                                    data-state={isSomeSelected ? 'indeterminate' : (isAllSelected ? 'checked' : 'unchecked')}
                                                    onCheckedChange={(checked) => handleSelectAll(checked as boolean)}
                                                />
                                            </TableHead>
                                        )}
                                        {columnConfig.map(col => (
                                            visibleColumns[col.id] && (
                                                <TableHead key={col.id} style={{ whiteSpace: 'nowrap' }}>
                                                    <Button variant="ghost" onClick={() => requestSort(col.id)} className="px-2">
                                                        {col.label}
                                                        {renderSortArrow(col.id)}
                                                    </Button>
                                                </TableHead>
                                            )
                                        ))}
                                        {!list.isSystemList && (
                                            <TableHead>
                                                <span className="sr-only">Actions</span>
                                            </TableHead>
                                        )}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {sortedContacts.map((contact) => (
                                        <TableRow key={contact.id} data-state={selectedContactIds.includes(contact.id) ? 'selected' : ''}>
                                            {!list.isSystemList && (
                                                <TableCell>
                                                    <Checkbox 
                                                        aria-label={`Select ${contact.firstName} ${contact.lastName}`}
                                                        checked={selectedContactIds.includes(contact.id)}
                                                        onCheckedChange={(checked) => handleSelectOne(contact.id, checked as boolean)}
                                                     />
                                                </TableCell>
                                            )}
                                            {visibleColumns.firstName && <TableCell className="font-medium">{contact.firstName}</TableCell>}
                                            {visibleColumns.lastName && <TableCell className="font-medium">{contact.lastName}</TableCell>}
                                            {visibleColumns.email && <TableCell>{contact.email}</TableCell>}
                                            {visibleColumns.phone && <TableCell>{contact.phone}</TableCell>}
                                            {visibleColumns.company && <TableCell>{contact.company}</TableCell>}
                                            {visibleColumns.status &&
                                                <TableCell>
                                                    <Badge variant={contact.status === 'Subscribed' ? 'secondary' : 'outline'}>{contact.status}</Badge>
                                                </TableCell>
                                            }
                                            {visibleColumns.subscribedAt && <TableCell>{new Date(contact.subscribedAt).toLocaleDateString('en-US')}</TableCell>}
                                            {!list.isSystemList && (
                                                <TableCell>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button aria-haspopup="true" size="icon" variant="ghost">
                                                                <MoreVertical className="h-4 w-4" />
                                                                <span className="sr-only">Toggle menu</span>
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                            <DropdownMenuItem onClick={() => handleEditClick(contact)}>Edit Contact</DropdownMenuItem>
                                                            <AlertDialog>
                                                                <AlertDialogTrigger asChild>
                                                                    <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive">Remove from List</DropdownMenuItem>
                                                                </AlertDialogTrigger>
                                                                <AlertDialogContent>
                                                                    <AlertDialogHeader>
                                                                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                                        <AlertDialogDescription>
                                                                            This will permanently remove {contact.firstName} {contact.lastName} from this list. This action cannot be undone.
                                                                        </AlertDialogDescription>
                                                                    </AlertDialogHeader>
                                                                    <AlertDialogFooter>
                                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                        <AlertDialogAction onClick={() => handleRemoveFromList(contact.id, `${contact.firstName} ${contact.lastName}`)} className="bg-destructive hover:bg-destructive/90">Remove</AlertDialogAction>
                                                                    </AlertDialogFooter>
                                                                </AlertDialogContent>
                                                            </AlertDialog>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            )}
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </div>
            {!list.isSystemList && (
                <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Edit contact</DialogTitle>
                            <DialogDescription>
                            Update the details for {selectedContact?.firstName} {selectedContact?.lastName}. Click save when you're done.
                            </DialogDescription>
                        </DialogHeader>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(handleEditSubmit)} className="space-y-4 py-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="firstName"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>First Name</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="John" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="lastName"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Last Name</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Doe" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <FormField
                                    control={form.control}
                                    name="email"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Email</FormLabel>
                                            <FormControl>
                                                <Input placeholder="contact@email.com" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="phone"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Phone</FormLabel>
                                            <FormControl>
                                                <Input placeholder="(555) 555-5555" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="company"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Company</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Acme Inc." {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <DialogFooter>
                                    <Button type="submit">Save changes</Button>
                                </DialogFooter>
                            </form>
                        </Form>
                    </DialogContent>
                </Dialog>
            )}
        </>
    );
}
