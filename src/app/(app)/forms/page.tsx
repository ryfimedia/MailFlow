
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle } from "lucide-react";
import Link from "next/link";
import React from "react";

export default function FormsPage() {
  // This will be expanded later to show a list of forms.
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold font-headline">Opt-In Forms</h1>
        <Button asChild className="bg-accent text-accent-foreground hover:bg-accent/90">
          <Link href="/forms/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            New Form
          </Link>
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Your Forms</CardTitle>
          <CardDescription>Manage your opt-in forms. Share the public link or embed them on your site.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <p>You haven't created any forms yet.</p>
            <Button variant="link" asChild><Link href="/forms/new">Create one now</Link></Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
