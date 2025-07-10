
'use client';

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Users, MailOpen, MousePointerClick, TrendingUp, XCircle, Download, AlertCircle } from "lucide-react";
import React from "react";
import Papa from "papaparse";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import type { Campaign } from "@/lib/types";
import { getCampaignById } from "@/lib/actions";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";


const StatCard = ({ title, value, icon: Icon, description }: { title: string, value: string | number, icon: React.ElementType, description?: string }) => (
    <div className="flex flex-col p-4 border rounded-lg bg-card">
        <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <Icon className="h-5 w-5 text-muted-foreground" />
        </div>
        <p className="text-2xl font-bold">{value}</p>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
    </div>
);


export default function CampaignStatsPage() {
    const params = useParams();
    const campaignId = params.campaignId as string;
    const { toast } = useToast();
    const [campaign, setCampaign] = React.useState<Campaign | null | undefined>(undefined);

    React.useEffect(() => {
        if (!campaignId) return;
        
        async function fetchCampaign() {
            try {
                const foundCampaign = await getCampaignById(campaignId);
                setCampaign(foundCampaign || null);
            } catch (error) {
                console.error("Failed to load campaign from firestore", error);
                setCampaign(null);
                toast({ variant: "destructive", title: "Error", description: "Failed to load campaign data."})
            }
        }

        fetchCampaign();
    }, [campaignId, toast]);

    const handleExport = () => {
        if (!campaign) return;

        const statsData = [
            { Metric: "Campaign Name", Value: campaign.name },
            { Metric: "Subject", Value: campaign.subject },
            { Metric: "Sent Date", Value: campaign.sentDate ? new Date(campaign.sentDate).toISOString() : "N/A" },
            { Metric: "Open Rate", Value: campaign.openRate },
            { Metric: "Click Rate", Value: campaign.clickRate },
            { Metric: "Recipients", Value: campaign.recipients },
            { Metric: "Successful Deliveries", Value: campaign.successfulDeliveries },
            { Metric: "Bounces", Value: campaign.bounces },
            { Metric: "Unsubscribes", Value: campaign.unsubscribes },
        ];

        const csv = Papa.unparse(statsData);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        const safeName = campaign.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        link.setAttribute("download", `campaign_stats_${safeName}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast({
            title: "Exporting stats...",
            description: "Your CSV file will be downloaded shortly.",
        });
    }

    if (campaign === undefined) {
        return (
             <div className="space-y-6">
                <Skeleton className="h-10 w-40" />
                <Card>
                    <CardHeader>
                        <Skeleton className="h-8 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                    </CardHeader>
                    <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        {Array.from({length: 4}).map((_, i) => <Skeleton key={i} className="h-24" />)}
                    </CardContent>
                </Card>
            </div>
        )
    }

    if (!campaign) {
        return (
            <div className="space-y-6">
                <Button asChild variant="outline">
                    <Link href="/campaigns">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Campaigns
                    </Link>
                </Button>
                <Card>
                    <CardHeader>
                        <CardTitle>Campaign Not Found</CardTitle>
                        <CardDescription>The campaign you're looking for doesn't exist or is not a sent campaign.</CardDescription>
                    </CardHeader>
                </Card>
            </div>
        )
    }

    const isArchived = campaign && campaign.status === 'Sent' && campaign.sentDate && (new Date().getTime() - new Date(campaign.sentDate).getTime()) > 365 * 24 * 60 * 60 * 1000;

    return (
        <div className="space-y-6">
             {isArchived && (
                <Alert variant="default">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle className="font-bold">Archived Campaign</AlertTitle>
                    <AlertDescription>
                    This campaign is over a year old. Its content has been removed for data retention, but its statistics are still available.
                    </AlertDescription>
                </Alert>
            )}
            <div className="flex items-center gap-4">
                <Button asChild variant="outline" size="icon" className="h-8 w-8">
                    <Link href="/campaigns">
                        <ArrowLeft className="h-4 w-4" />
                        <span className="sr-only">Back to Campaigns</span>
                    </Link>
                </Button>
                <div className="flex-1">
                    <h1 className="text-3xl font-bold font-headline">{campaign.name}</h1>
                    <p className="text-muted-foreground">Sent on {new Date(campaign.sentDate as string).toLocaleDateString('en-US', { timeZone: 'UTC' })}</p>
                </div>
                <Button onClick={handleExport}>
                    <Download className="mr-2 h-4 w-4" />
                    Export to CSV
                </Button>
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle>Performance Overview</CardTitle>
                    <CardDescription>Key metrics for your campaign.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <StatCard title="Open Rate" value={campaign.openRate} icon={MailOpen} />
                    <StatCard title="Click Rate" value={campaign.clickRate} icon={MousePointerClick} />
                    <StatCard title="Recipients" value={(campaign.recipients || 0).toLocaleString()} icon={Users} description="Total number of subscribers." />
                    <StatCard title="Unsubscribes" value={(campaign.unsubscribes || 0).toLocaleString()} icon={XCircle} description="Number of users who opted out." />
                </CardContent>
                <CardFooter className="flex-col items-start gap-4 pt-6">
                     <Separator />
                     <div className="grid gap-6 md:grid-cols-3 w-full pt-4">
                        <div className="flex items-center gap-2">
                           <TrendingUp className="h-5 w-5 text-green-500"/>
                           <div>
                               <p className="font-bold">{(campaign.successfulDeliveries || 0).toLocaleString()}</p>
                               <p className="text-sm text-muted-foreground">Successful Deliveries</p>
                           </div>
                        </div>
                         <div className="flex items-center gap-2">
                           <XCircle className="h-5 w-5 text-red-500"/>
                           <div>
                               <p className="font-bold">{campaign.bounces || 0}</p>
                               <p className="text-sm text-muted-foreground">Bounces</p>
                           </div>
                        </div>
                     </div>
                </CardFooter>
            </Card>

        </div>
    );
}
