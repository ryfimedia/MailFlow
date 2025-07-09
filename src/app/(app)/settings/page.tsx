import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Settings as SettingsIcon } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold font-headline">Settings</h1>
      <Card className="flex flex-col items-center justify-center text-center p-12 min-h-[400px]">
        <SettingsIcon className="w-16 h-16 mb-4 text-muted-foreground" />
        <CardHeader>
          <CardTitle>Application Settings</CardTitle>
          <CardDescription>
            Manage your account and application settings here. <br />
            This feature is coming soon.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
