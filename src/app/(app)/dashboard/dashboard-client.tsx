
'use client';

import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Bar } from "recharts";
import { ChartTooltipContent, ChartContainer } from "@/components/ui/chart";
import type { ChartConfig } from "@/components/ui/chart";

const chartConfig = {
  sent: {
    label: "Sent",
    color: "hsl(var(--primary))",
  },
  opened: {
    label: "Opened",
    color: "hsl(var(--accent))",
  },
} satisfies ChartConfig;

type DashboardChartProps = {
    chartData: any[];
}

export function DashboardChart({ chartData }: DashboardChartProps) {
    return (
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
    );
}
