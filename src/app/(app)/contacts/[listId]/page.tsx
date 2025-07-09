
'use client';

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, MoreVertical } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";

// Mock data - in a real app, this would come from an API
const contactLists = [
  { id: '1', name: 'Newsletter Subscribers', count: 1250, createdAt: '2023-08-15' },
  { id: '2', name: 'Q2 Webinar Attendees', count: 320, createdAt: '2023-06-20' },
  { id: '3', name: 'High-Value Customers', count: 85, createdAt: '2023-09-01' },
  { id: '4', name: 'New Signups (Last 30 Days)', count: 450, createdAt: '2023-09-10' },
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
};


export default function ContactListPage() {
    const params = useParams();
    const listId = params.listId as string;
    
    const list = contactLists.find(l => l.id === listId);
    const contacts = contactsByList[listId] || [];
    
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

    return (
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
                    <CardDescription>A list of all contacts in {list.name}.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[50px]">
                                    <Checkbox aria-label="Select all" />
                                </TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Subscribed Date</TableHead>
                                <TableHead>
                                    <span className="sr-only">Actions</span>
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {contacts.map((contact) => (
                                <TableRow key={contact.id}>
                                     <TableCell>
                                        <Checkbox aria-label={`Select ${contact.name}`} />
                                    </TableCell>
                                    <TableCell className="font-medium">{contact.name}</TableCell>
                                    <TableCell>{contact.email}</TableCell>
                                    <TableCell>
                                        <Badge variant="secondary">{contact.status}</Badge>
                                    </TableCell>
                                    <TableCell>{contact.subscribedAt}</TableCell>
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
                                                <DropdownMenuItem>Edit Contact</DropdownMenuItem>
                                                <DropdownMenuItem className="text-destructive">Remove from List</DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
