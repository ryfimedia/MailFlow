
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
} from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast";

const CAMPAIGNS_KEY = 'campaigns';

const initialCampaigns = [
  {
    id: "1",
    name: "🚀 Q2 Product Launch",
    status: "Sent",
    sentDate: "2023-06-15",
    openRate: "35.2%",
    clickRate: "5.8%",
    recipients: 8500,
    successfulDeliveries: 8495,
    bounces: 5,
    unsubscribes: 12,
  },
  {
    id: "2",
    name: "☀️ Summer Sale Promo",
    status: "Sent",
    sentDate: "2023-07-01",
    openRate: "28.9%",
    clickRate: "4.1%",
    recipients: 12500,
    successfulDeliveries: 12480,
    bounces: 20,
    unsubscribes: 25,
  },
  {
    id: "3",
    name: "🍂 Fall Newsletter",
    status: "Draft",
    sentDate: "-",
    openRate: "-",
    clickRate: "-",
  },
  {
    id: "4",
    name: "🎁 Holiday Greetings",
    status: "Scheduled",
    sentDate: "2023-12-20",
    openRate: "-",
    clickRate: "-",
  },
  {
    id: "5",
    name: "Webinars Coming Up",
    status: "Sent",
    sentDate: "2023-08-10",
    openRate: "22.1%",
    clickRate: "3.5%",
    recipients: 320,
    successfulDeliveries: 320,
    bounces: 0,
    unsubscribes: 2,
  },
];

type Campaign = typeof initialCampaigns[0];

export default function CampaignsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [campaigns, setCampaigns] = React.useState<Campaign[]>([]);

  React.useEffect(() => {
    try {
      const storedCampaigns = localStorage.getItem(CAMPAIGNS_KEY);
      if (storedCampaigns) {
        setCampaigns(JSON.parse(storedCampaigns));
      } else {
        localStorage.setItem(CAMPAIGNS_KEY, JSON.stringify(initialCampaigns));
        setCampaigns(initialCampaigns);
      }
    } catch (error) {
      console.error("Failed to load campaigns from localStorage", error);
      setCampaigns(initialCampaigns);
    }
  }, []);

  const handleRowClick = (campaign: Campaign) => {
    if (campaign.status === "Sent") {
      router.push(`/campaigns/${campaign.id}`);
    }
  };

  const handleDuplicate = (campaignId: string) => {
    const campaignToDuplicate = campaigns.find(c => c.id === campaignId);
    if (!campaignToDuplicate) {
        toast({ variant: 'destructive', title: 'Error', description: 'Campaign not found for duplication.' });
        return;
    }

    const newCampaign = {
        ...campaignToDuplicate,
        id: new Date().getTime().toString(),
        name: `Copy of ${campaignToDuplicate.name}`,
        status: 'Draft',
        sentDate: '-',
        openRate: '-',
        clickRate: '-',
    };

    const updatedCampaigns = [...campaigns, newCampaign];
    setCampaigns(updatedCampaigns);
    localStorage.setItem(CAMPAIGNS_KEY, JSON.stringify(updatedCampaigns));
    toast({ title: 'Campaign Duplicated', description: `A new draft "${newCampaign.name}" has been created.` });
  };

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
              {campaigns.map((campaign) => (
                <TableRow 
                  key={campaign.id} 
                  onClick={() => handleRowClick(campaign)}
                  className={campaign.status === 'Sent' ? 'cursor-pointer' : ''}
                >
                  <TableCell className="font-medium">{campaign.name}</TableCell>
                  <TableCell>
                    <Badge variant={
                      campaign.status === 'Sent' ? 'default' :
                      campaign.status === 'Draft' ? 'secondary' : 'outline'
                    }>
                      {campaign.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{campaign.sentDate !== '-' ? new Date(campaign.sentDate).toLocaleDateString('en-US', { timeZone: 'UTC' }) : '-'}</TableCell>
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
                        <DropdownMenuItem onSelect={(e) => e.preventDefault()} asChild disabled={campaign.status === 'Sent'}>
                           <Link href={campaign.status !== 'Sent' ? `/campaigns/new?id=${campaign.id}` : '#'}>Edit</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => handleDuplicate(campaign.id)}>Duplicate</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
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
