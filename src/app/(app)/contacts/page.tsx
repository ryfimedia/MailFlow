import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users } from "lucide-react";

export default function ContactsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold font-headline">Contacts</h1>
      <Card className="flex flex-col items-center justify-center text-center p-12 min-h-[400px]">
        <Users className="w-16 h-16 mb-4 text-muted-foreground" />
        <CardHeader>
          <CardTitle>Contact Management</CardTitle>
          <CardDescription>
            This is where you'll manage your contact lists and subscribers. <br />
            This feature is coming soon.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
