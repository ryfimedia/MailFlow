
import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, Mail, Rocket, BarChart2 } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getDashboardData } from "@/lib/actions";
import { DashboardChart } from "./dashboard-client";

const StatCard = ({ title, value, icon: Icon, description }: { title: string, value: string | number, icon: React.ElementType, description?: string }) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      {description && (
        <p className="text-xs text-muted-foreground">
          {description}
        </p>
      )}
    </CardContent>
  </Card>
);

export default async function Dashboard() {
  const {
    totalSubscribers,
    avgOpenRate,
    avgClickRate,
    campaignsSent,
    recentCampaigns,
    chartData
  } = await getDashboardData();

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold font-headline">Dashboard</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Subscribers" value={totalSubscribers.toLocaleString()} icon={Users} />
        <StatCard title="Average Open Rate" value={avgOpenRate} icon={Mail} />
        <StatCard title="Average Click Rate" value={avgClickRate} icon={BarChart2} />
        <StatCard title="Campaigns Sent" value={campaignsSent} icon={Rocket} description="in the last 30 days" />
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <DashboardChart chartData={chartData} />

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
