
"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis, Tooltip, Bar } from "recharts";
import { ArrowUpRight, Users, Mail, BarChart2, Rocket } from "lucide-react";
import { ChartTooltipContent, ChartContainer } from "@/components/ui/chart";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

const CAMPAIGNS_KEY = 'campaigns';
const CONTACT_LISTS_KEY = 'contactLists';
const CONTACTS_BY_LIST_KEY = 'contactsByList';

type Campaign = {
    id: string;
    name: string;
    status: string;
    sentDate?: string;
    openRate: string;
    clickRate: string;
};

type ContactList = {
    id: string;
    name: string;
    count: number;
    isMasterList?: boolean;
};

const chartConfig = {
  sent: {
    label: "Sent",
    color: "hsl(var(--primary))",
  },
  opened: {
    label: "Opened",
    color: "hsl(var(--accent))",
  },
};

const StatCard = ({ title, value, icon: Icon, change, changeType }: { title: string, value: string | number, icon: React.ElementType, change?: string, changeType?: 'increase' | 'decrease' }) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      {change && (
        <p className="text-xs text-muted-foreground flex items-center">
          <ArrowUpRight className={`h-4 w-4 mr-1 ${changeType === 'decrease' ? 'text-red-500 rotate-90' : 'text-green-500'}`} />
          {change}
        </p>
      )}
    </CardContent>
  </Card>
);

export default function Dashboard() {
  const [loading, setLoading] = React.useState(true);
  const [totalSubscribers, setTotalSubscribers] = React.useState(0);
  const [avgOpenRate, setAvgOpenRate] = React.useState('0.0%');
  const [avgClickRate, setAvgClickRate] = React.useState('0.0%');
  const [campaignsSent, setCampaignsSent] = React.useState(0);
  const [recentCampaigns, setRecentCampaigns] = React.useState<Campaign[]>([]);
  const [chartData, setChartData] = React.useState<any[]>([]);

  React.useEffect(() => {
    try {
      const storedCampaignsRaw = localStorage.getItem(CAMPAIGNS_KEY);
      const storedContactListsRaw = localStorage.getItem(CONTACT_LISTS_KEY);
      
      const campaigns: Campaign[] = storedCampaignsRaw ? JSON.parse(storedCampaignsRaw) : [];
      const contactLists: ContactList[] = storedContactListsRaw ? JSON.parse(storedContactListsRaw) : [];

      // Calculate Total Subscribers
      const masterList = contactLists.find(l => l.isMasterList);
      setTotalSubscribers(masterList?.count || 0);
      
      const sentCampaigns = campaigns.filter(c => c.status === 'Sent');

      // Calculate Average Rates
      if (sentCampaigns.length > 0) {
        const totalOpenRate = sentCampaigns.reduce((acc, c) => acc + parseFloat(c.openRate), 0);
        const totalClickRate = sentCampaigns.reduce((acc, c) => acc + parseFloat(c.clickRate), 0);
        setAvgOpenRate(`${(totalOpenRate / sentCampaigns.length).toFixed(1)}%`);
        setAvgClickRate(`${(totalClickRate / sentCampaigns.length).toFixed(1)}%`);
      }

      // Calculate Campaigns Sent in last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const recentSent = sentCampaigns.filter(c => c.sentDate && new Date(c.sentDate) > thirtyDaysAgo);
      setCampaignsSent(recentSent.length);

      // Get Recent Campaigns
      setRecentCampaigns([...campaigns].reverse().slice(0, 5));

      // Generate Chart Data (mock logic for now, could be enhanced)
       const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
       const monthlyData: {[key: string]: { sent: number, opened: number }} = {};
       
       sentCampaigns.forEach(c => {
         if (c.sentDate) {
           const month = new Date(c.sentDate).getMonth();
           const monthName = monthNames[month];
           if (!monthlyData[monthName]) {
             monthlyData[monthName] = { sent: 0, opened: 0 };
           }
           monthlyData[monthName].sent += 1;
           // This is a mock calculation for opened
           if (Math.random() < parseFloat(c.openRate) / 100) {
             monthlyData[monthName].opened += 1;
           }
         }
       });

       const generatedChartData = monthNames.map(month => ({
         month,
         sent: monthlyData[month]?.sent || 0,
         opened: monthlyData[month]?.opened || 0,
       })).slice(0, 6); // Display first 6 months for example
       setChartData(generatedChartData);

    } catch (error) {
      console.error("Failed to load dashboard data from localStorage", error);
    } finally {
      setLoading(false);
    }
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold font-headline">Dashboard</h1>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
        <Skeleton className="h-[400px]" />
        <Skeleton className="h-[300px]" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold font-headline">Dashboard</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Subscribers" value={totalSubscribers.toLocaleString()} icon={Users} change="+201 this month" changeType="increase" />
        <StatCard title="Average Open Rate" value={avgOpenRate} icon={Mail} change="+2.1% MoM" changeType="increase" />
        <StatCard title="Average Click Rate" value={avgClickRate} icon={BarChart2} change="-0.5% MoM" changeType="decrease" />
        <StatCard title="Campaigns Sent" value={campaignsSent} icon={Rocket} change="in the last 30 days" />
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="font-headline">Campaign Performance</CardTitle>
             <CardDescription>Monthly overview of sent vs. opened emails.</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <BarChart data={chartData} accessibilityLayer>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                  stroke="hsl(var(--muted-foreground))"
                />
                <YAxis stroke="hsl(var(--muted-foreground))" allowDecimals={false} />
                <Tooltip
                  cursor={false}
                  content={<ChartTooltipContent indicator="dot" />}
                />
                <Bar dataKey="sent" fill="var(--color-sent)" radius={4} />
                <Bar dataKey="opened" fill="var(--color-opened)" radius={4} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Your latest campaigns and their status.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Campaign</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentCampaigns.length > 0 ? recentCampaigns.map((campaign) => (
                  <TableRow key={campaign.id}>
                    <TableCell className="font-medium p-2">
                      <Link href={`/campaigns/${campaign.id}`} className="hover:underline">{campaign.name}</Link>
                    </TableCell>
                    <TableCell className="p-2">
                       <Badge variant={
                        campaign.status === 'Sent' ? 'default' :
                        campaign.status === 'Draft' ? 'secondary' : 'outline'
                       }>
                        {campaign.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center h-24">
                       No campaigns found.
                       <Button asChild size="sm" className="mt-2">
                         <Link href="/campaigns/new">Create one now</Link>
                       </Button>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

    </div>
  );
}
