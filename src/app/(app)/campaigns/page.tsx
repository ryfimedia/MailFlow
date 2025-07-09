
'use client';

import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlusCircle, MoreHorizontal } from "lucide-react";
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
import { getCampaigns, duplicateCampaign, deleteCampaign } from "@/lib/actions";
import type { Campaign } from "@/lib/types";

export default function CampaignsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [campaigns, setCampaigns] = React.useState<Campaign[]>([]);
  const [loading, setLoading] = React.useState(true);

  const fetchCampaigns = React.useCallback(async () => {
    setLoading(true);
    try {
      const fetchedCampaigns = await getCampaigns();
      setCampaigns(fetchedCampaigns);
    } catch (error) {
      console.error("Failed to load campaigns", error);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch campaigns.' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  React.useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  const handleRowClick = (campaign: Campaign) => {
    if (campaign.status === "Sent") {
      router.push(`/campaigns/${campaign.id}`);
    } else {
        router.push(`/campaigns/new?id=${campaign.id}`);
    }
  };

  const handleDuplicate = async (campaignId: string) => {
    try {
      const newCampaign = await duplicateCampaign(campaignId);
      if (newCampaign) {
        toast({ title: 'Campaign Duplicated', description: `A new draft "${newCampaign.name}" has been created.` });
        fetchCampaigns(); // Refresh the list
      }
    } catch (error) {
       toast({ variant: 'destructive', title: 'Error', description: 'Failed to duplicate campaign.' });
    }
  };

  const handleDelete = async (campaignId: string) => {
     try {
        await deleteCampaign(campaignId);
        toast({ title: 'Campaign Deleted', description: 'The campaign has been removed.' });
        fetchCampaigns();
     } catch (error) {
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete campaign.' });
     }
  }

  const getBadgeVariant = (status: Campaign['status']) => {
    switch (status) {
        case 'Sent': return 'default';
        case 'Draft': return 'secondary';
        case 'Scheduled': return 'outline';
        case 'Sending': return 'destructive'; // Using destructive for visibility
        default: return 'secondary';
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold font-headline">Campaigns</h1>
        <Button asChild className="bg-accent text-accent-foreground hover:bg-accent/90">
          <Link href="/campaigns/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            New Campaign
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Campaigns</CardTitle>
          <CardDescription>View and manage all your email campaigns.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Open Rate</TableHead>
                <TableHead>Click Rate</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({length: 5}).map((_, i) => (
                    <TableRow key={i}>
                        <TableCell colSpan={6} className="p-0">
                            <div className="h-14 w-full bg-muted/50 animate-pulse" />
                        </TableCell>
                    </TableRow>
                ))
              ) : campaigns.length === 0 ? (
                <TableRow>
                    <TableCell colSpan={6} className="text-center h-24">
                        No campaigns found.
                    </TableCell>
                </TableRow>
              ) : (
                campaigns.map((campaign) => (
                  <TableRow 
                    key={campaign.id} 
                    onClick={() => handleRowClick(campaign)}
                    className="cursor-pointer"
                  >
                    <TableCell className="font-medium">{campaign.name}</TableCell>
                    <TableCell>
                      <Badge variant={getBadgeVariant(campaign.status)}>
                        {campaign.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{campaign.sentDate ? new Date(campaign.sentDate).toLocaleDateString('en-US', { timeZone: 'UTC' }) : '-'}</TableCell>
                    <TableCell>{campaign.openRate}</TableCell>
                    <TableCell>{campaign.clickRate}</TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button aria-haspopup="true" size="icon" variant="ghost">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Toggle menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onSelect={(e) => e.preventDefault()} asChild>
                             <Link href={`/campaigns/new?id=${campaign.id}`}>Edit</Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => handleDuplicate(campaign.id)}>Duplicate</DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => handleDelete(campaign.id)} className="text-destructive">Delete</DropdownMenuItem>
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
