
'use client';

import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlusCircle, MoreHorizontal, Mailbox } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { getDripCampaigns, deleteDripCampaign, getContactLists } from "@/lib/actions";
import type { DripCampaign, ContactList } from "@/lib/types";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

export default function DripCampaignsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [campaigns, setCampaigns] = React.useState<DripCampaign[]>([]);
  const [contactLists, setContactLists] = React.useState<Record<string, string>>({});
  const [loading, setLoading] = React.useState(true);

  const fetchCampaigns = React.useCallback(async () => {
    setLoading(true);
    try {
      const [fetchedCampaigns, fetchedLists] = await Promise.all([
        getDripCampaigns(),
        getContactLists()
      ]);
      setCampaigns(fetchedCampaigns);
      
      const listMap: Record<string, string> = {};
      fetchedLists.forEach(list => {
        listMap[list.id] = list.name;
      });
      setContactLists(listMap);

    } catch (error) {
      console.error("Failed to load drip campaigns", error);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch drip campaigns.' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  React.useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  const handleDelete = async (campaignId: string) => {
     try {
        await deleteDripCampaign(campaignId);
        toast({ title: 'Drip Campaign Deleted', description: 'The campaign has been removed.' });
        fetchCampaigns();
     } catch (error) {
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete campaign.' });
     }
  }

  const getBadgeVariant = (status: DripCampaign['status']) => {
    switch (status) {
        case 'Active': return 'default';
        case 'Draft': return 'secondary';
        case 'Paused': return 'outline';
        default: return 'secondary';
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold font-headline">Drip Campaigns</h1>
        <Button asChild className="bg-accent text-accent-foreground hover:bg-accent/90">
          <Link href="/drip-campaigns/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            New Drip Campaign
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Drip Campaigns</CardTitle>
          <CardDescription>Manage your automated email sequences.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Linked List</TableHead>
                <TableHead>Emails in Sequence</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({length: 3}).map((_, i) => (
                    <TableRow key={i}>
                        <TableCell colSpan={5} className="p-0">
                            <div className="h-14 w-full bg-muted/50 animate-pulse" />
                        </TableCell>
                    </TableRow>
                ))
              ) : campaigns.length === 0 ? (
                <TableRow>
                    <TableCell colSpan={5} className="text-center h-48">
                        <Mailbox className="mx-auto h-12 w-12 text-muted-foreground" />
                        <h3 className="mt-4 text-lg font-medium">No drip campaigns yet</h3>
                        <p className="text-muted-foreground mt-1">Create your first automated email sequence.</p>
                        <Button asChild size="sm" className="mt-4">
                            <Link href="/drip-campaigns/new">Create Drip Campaign</Link>
                        </Button>
                    </TableCell>
                </TableRow>
              ) : (
                campaigns.map((campaign) => (
                  <TableRow 
                    key={campaign.id} 
                    onClick={() => router.push(`/drip-campaigns/new?id=${campaign.id}`)}
                    className="cursor-pointer"
                  >
                    <TableCell className="font-medium">{campaign.name}</TableCell>
                    <TableCell>
                        <Badge variant={getBadgeVariant(campaign.status)}>
                          {campaign.status}
                        </Badge>
                    </TableCell>
                    <TableCell>{contactLists[campaign.contactListId] || 'Unknown List'}</TableCell>
                    <TableCell>{campaign.emails.length}</TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()} className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button aria-haspopup="true" size="icon" variant="ghost">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Toggle menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onSelect={() => router.push(`/drip-campaigns/new?id=${campaign.id}`)}>
                            Edit
                          </DropdownMenuItem>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive">Delete</DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This action cannot be undone. This will permanently delete the "{campaign.name}" drip campaign.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDelete(campaign.id)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </DropdownMenuContent>
                      </DropdownMenu>
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
