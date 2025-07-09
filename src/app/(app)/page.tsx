
"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Bar } from "recharts";
import { ArrowUpRight, Users, Mail, BarChart2, Rocket } from "lucide-react";
import { ChartTooltipContent, ChartContainer } from "@/components/ui/chart";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { getDashboardData } from "@/lib/actions";
import type { Campaign } from "@/lib/types";

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
    async function fetchData() {
      try {
        const data = await getDashboardData();
        setTotalSubscribers(data.totalSubscribers);
        setAvgOpenRate(data.avgOpenRate);
        setAvgClickRate(data.avgClickRate);
        setCampaignsSent(data.campaignsSentLast30Days);
        setRecentCampaigns(data.recentCampaigns);
        setChartData(data.chartData);
      } catch (error) {
        console.error("Failed to load dashboard data", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
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
