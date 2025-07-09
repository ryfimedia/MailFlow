
'use client';

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Users, MailOpen, MousePointerClick, TrendingUp, XCircle, Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";


// Mock data - in a real app, this would be fetched from an API
const campaigns = [
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

    const campaign = campaigns.find(c => c.id === campaignId);

    const handleExport = () => {
        toast({
            title: "Exporting stats...",
            description: "Your CSV file will be downloaded shortly.",
        });
        console.log("Exporting stats for campaign:", campaign?.name);
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

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button asChild variant="outline" size="icon" className="h-8 w-8">
                    <Link href="/campaigns">
                        <ArrowLeft className="h-4 w-4" />
                        <span className="sr-only">Back to Campaigns</span>
                    </Link>
                </Button>
                <div className="flex-1">
                    <h1 className="text-3xl font-bold font-headline">{campaign.name}</h1>
                    <p className="text-muted-foreground">Sent on {new Date(campaign.sentDate).toLocaleDateString('en-US')}</p>
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
                    <StatCard title="Recipients" value={campaign.recipients.toLocaleString()} icon={Users} description="Total number of subscribers." />
                    <StatCard title="Unsubscribes" value={campaign.unsubscribes.toLocaleString()} icon={XCircle} description="Number of users who opted out." />
                </CardContent>
                <CardFooter className="flex-col items-start gap-4 pt-6">
                     <Separator />
                     <div className="grid gap-6 md:grid-cols-3 w-full pt-4">
                        <div className="flex items-center gap-2">
                           <TrendingUp className="h-5 w-5 text-green-500"/>
                           <div>
                               <p className="font-bold">{campaign.successfulDeliveries.toLocaleString()}</p>
                               <p className="text-sm text-muted-foreground">Successful Deliveries</p>
                           </div>
                        </div>
                         <div className="flex items-center gap-2">
                           <XCircle className="h-5 w-5 text-red-500"/>
                           <div>
                               <p className="font-bold">{campaign.bounces}</p>
                               <p className="text-sm text-muted-foreground">Bounces</p>
                           </div>
                        </div>
                     </div>
                </CardFooter>
            </Card>

        </div>
    );
}
