
'use client';

import React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, MoreVertical } from "lucide-react";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

// Mock data - in a real app, this would come from an API
const contactLists = [
  { id: '1', name: 'Newsletter Subscribers', count: 1250, createdAt: '2023-08-15', isSystemList: false },
  { id: '2', name: 'Q2 Webinar Attendees', count: 320, createdAt: '2023-06-20', isSystemList: false },
  { id: '3', name: 'High-Value Customers', count: 85, createdAt: '2023-09-01', isSystemList: false },
  { id: '4', name: 'New Signups (Last 30 Days)', count: 450, createdAt: '2023-09-10', isSystemList: false },
  { id: 'unsubscribes', name: 'Unsubscribes', count: 37, createdAt: 'System Managed', isSystemList: true },
  { id: 'bounces', name: 'Bounced Emails', count: 25, createdAt: 'System Managed', isSystemList: true },
];

const contactsByList: { [key: string]: any[] } = {
    '1': Array.from({ length: 25 }, (_, i) => ({
        id: `contact_${i + 1}`,
        firstName: `Subscriber`,
        lastName: `${i + 1}`,
        email: `subscriber.${i + 1}@example.com`,
        phone: `555-010${i % 10}`,
        company: `Company ${String.fromCharCode(65 + (i % 26))}`,
        status: 'Subscribed',
        subscribedAt: '2023-10-01',
    })),
    '2': Array.from({ length: 10 }, (_, i) => ({
        id: `webinar_${i + 1}`,
        firstName: `Attendee`,
        lastName: `${i + 1}`,
        email: `attendee.${i + 1}@example.com`,
        phone: `555-011${i % 10}`,
        company: `Corp ${String.fromCharCode(65 + (i % 26))}`,
        status: 'Subscribed',
        subscribedAt: '2023-06-21',
    })),
    '3': Array.from({ length: 5 }, (_, i) => ({
        id: `customer_${i + 1}`,
        firstName: `Valued`,
        lastName: `Customer ${i + 1}`,
        email: `customer.${i + 1}@example.com`,
        phone: `555-012${i % 10}`,
        company: `Client Inc. ${String.fromCharCode(65 + (i % 26))}`,
        status: 'Subscribed',
        subscribedAt: '2023-09-02',
    })),
    '4': Array.from({ length: 15 }, (_, i) => ({
        id: `signup_${i + 1}`,
        firstName: `New`,
        lastName: `User ${i + 1}`,
        email: `newuser.${i + 1}@example.com`,
        phone: `555-013${i % 10}`,
        company: `Startup ${String.fromCharCode(65 + (i % 26))}`,
        status: 'Subscribed',
        subscribedAt: '2023-09-15',
    })),
    'unsubscribes': Array.from({ length: 37 }, (_, i) => ({
        id: `unsub_${i + 1}`,
        firstName: `Former`,
        lastName: `Subscriber ${i + 1}`,
        email: `unsubscribed.${i + 1}@example.com`,
        status: 'Unsubscribed',
        subscribedAt: '2023-01-15',
    })),
    'bounces': Array.from({ length: 25 }, (_, i) => ({
        id: `bounce_${i + 1}`,
        firstName: `Bounced`,
        lastName: `User ${i + 1}`,
        email: `bounced.${i + 1}@example.com`,
        status: 'Bounced',
        subscribedAt: '2023-03-10',
    })),
};

type Contact = {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    company?: string;
    status: string;
    subscribedAt: string;
};

const EditContactFormSchema = z.object({
  firstName: z.string().min(1, { message: "First name is required." }),
  lastName: z.string().min(1, { message: "Last name is required." }),
  email: z.string().email({ message: "Please enter a valid email." }),
  phone: z.string().optional(),
  company: z.string().optional(),
});

type EditContactFormValues = z.infer<typeof EditContactFormSchema>;


export default function ContactListPage() {
    const params = useParams();
    const listId = params.listId as string;
    const { toast } = useToast();
    
    const list = contactLists.find(l => l.id === listId);
    const [contacts, setContacts] = React.useState<Contact[]>(contactsByList[listId] || []);
    
    const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
    const [selectedContact, setSelectedContact] = React.useState<Contact | null>(null);

    const form = useForm<EditContactFormValues>({
        resolver: zodResolver(EditContactFormSchema),
    });

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
        
        setContacts(prevContacts => prevContacts.map(c => 
            c.id === selectedContact.id ? { ...c, ...values } : c
        ));

        toast({
            title: "Contact Updated",
            description: `${values.firstName} ${values.lastName}'s details have been saved.`,
        });
        setIsEditDialogOpen(false);
        setSelectedContact(null);
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
                        <CardTitle>Subscribers</CardTitle>
                        <CardDescription>{cardDescription}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    {!list.isSystemList && (
                                        <TableHead className="w-[50px]">
                                            <Checkbox aria-label="Select all" />
                                        </TableHead>
                                    )}
                                    <TableHead>Name</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Date</TableHead>
                                    {!list.isSystemList && (
                                        <TableHead>
                                            <span className="sr-only">Actions</span>
                                        </TableHead>
                                    )}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {contacts.map((contact) => (
                                    <TableRow key={contact.id}>
                                        {!list.isSystemList && (
                                            <TableCell>
                                                <Checkbox aria-label={`Select ${contact.firstName} ${contact.lastName}`} />
                                            </TableCell>
                                        )}
                                        <TableCell className="font-medium">{`${contact.firstName} ${contact.lastName}`}</TableCell>
                                        <TableCell>{contact.email}</TableCell>
                                        <TableCell>
                                            <Badge variant={contact.status === 'Subscribed' ? 'secondary' : 'outline'}>{contact.status}</Badge>
                                        </TableCell>
                                        <TableCell>{contact.subscribedAt}</TableCell>
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
                                                        <DropdownMenuItem className="text-destructive">Remove from List</DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        )}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
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
