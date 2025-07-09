
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
        name: `Subscriber ${i + 1}`,
        email: `subscriber.${i + 1}@example.com`,
        status: 'Subscribed',
        subscribedAt: '2023-10-01',
    })),
    '2': Array.from({ length: 10 }, (_, i) => ({
        id: `webinar_${i + 1}`,
        name: `Attendee ${i + 1}`,
        email: `attendee.${i + 1}@example.com`,
        status: 'Subscribed',
        subscribedAt: '2023-06-21',
    })),
    '3': Array.from({ length: 5 }, (_, i) => ({
        id: `customer_${i + 1}`,
        name: `Valued Customer ${i + 1}`,
        email: `customer.${i + 1}@example.com`,
        status: 'Subscribed',
        subscribedAt: '2023-09-02',
    })),
    '4': Array.from({ length: 15 }, (_, i) => ({
        id: `signup_${i + 1}`,
        name: `New User ${i + 1}`,
        email: `newuser.${i + 1}@example.com`,
        status: 'Subscribed',
        subscribedAt: '2023-09-15',
    })),
    'unsubscribes': Array.from({ length: 37 }, (_, i) => ({
        id: `unsub_${i + 1}`,
        name: `Former Subscriber ${i + 1}`,
        email: `unsubscribed.${i + 1}@example.com`,
        status: 'Unsubscribed',
        subscribedAt: '2023-01-15',
    })),
    'bounces': Array.from({ length: 25 }, (_, i) => ({
        id: `bounce_${i + 1}`,
        name: `Bounced User ${i + 1}`,
        email: `bounced.${i + 1}@example.com`,
        status: 'Bounced',
        subscribedAt: '2023-03-10',
    })),
};

type Contact = {
    id: string;
    name: string;
    email: string;
    status: string;
    subscribedAt: string;
};

const EditContactFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email." }),
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
                name: selectedContact.name,
                email: selectedContact.email,
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
            description: `${values.name}'s details have been saved.`,
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
                                                <Checkbox aria-label={`Select ${contact.name}`} />
                                            </TableCell>
                                        )}
                                        <TableCell className="font-medium">{contact.name}</TableCell>
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
                            Update the details for {selectedContact?.name}. Click save when you're done.
                            </DialogDescription>
                        </DialogHeader>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(handleEditSubmit)} className="space-y-4 py-4">
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Name</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Contact's name" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
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
