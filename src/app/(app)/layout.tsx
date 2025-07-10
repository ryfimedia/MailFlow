
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarTrigger,
  SidebarInset,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Mail,
  Users,
  Settings,
  Rocket,
  PlusCircle,
  LayoutTemplate,
  Image,
} from "lucide-react";
import { SettingsProvider, useSettings } from "@/contexts/settings-context";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

function SetupBanner() {
    const { isSetupComplete, loading } = useSettings();

    if (loading || isSetupComplete) {
        return null;
    }

    return (
        <Alert className="m-4 mb-0 border-accent bg-accent/10 text-foreground rounded-lg">
            <AlertTitle className="font-bold">Complete Your Account Setup!</AlertTitle>
            <AlertDescription>
                You need to configure your settings before you can send emails. 
                <Button asChild variant="link" className="p-0 pl-1 h-auto font-semibold">
                    <Link href="/settings">Go to Settings</Link>
                </Button>
            </AlertDescription>
        </Alert>
    );
}


export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const menuItems = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/campaigns", label: "Campaigns", icon: Mail },
    { href: "/templates", label: "Templates", icon: LayoutTemplate },
    { href: "/contacts", label: "Contacts", icon: Users },
    { href: "/media", label: "Media Library", icon: Image },
    { href: "/settings", label: "Settings", icon: Settings },
  ];

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary text-primary-foreground">
              <Rocket className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold font-headline text-foreground">
              Ryfi MailFlow
            </h1>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <Button asChild className="w-full justify-start bg-accent text-accent-foreground hover:bg-accent/90">
                <Link href="/campaigns/new">
                  <PlusCircle className="mr-2" />
                  New Campaign
                </Link>
              </Button>
            </SidebarMenuItem>
          </SidebarMenu>
          <SidebarMenu>
            {menuItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={
                    item.href === "/"
                      ? pathname === "/"
                      : pathname.startsWith(item.href)
                  }
                  tooltip={item.label}
                >
                  <Link href={item.href}>
                    <item.icon />
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className="p-4">
          <div className="flex flex-col">
            <span className="text-sm font-semibold">User</span>
            <span className="text-xs text-muted-foreground">user@email.com</span>
          </div>
        </SidebarFooter>
      </Sidebar>
      <SettingsProvider>
        <SidebarInset>
            <header className="flex items-center justify-between p-4 bg-background border-b md:justify-end">
            <SidebarTrigger className="md:hidden" />
            <div className="flex items-center gap-4">
                {/* Future user menu can be added here */}
            </div>
            </header>
            <SetupBanner />
            <main className="p-4 md:p-6 lg:p-8">{children}</main>
        </SidebarInset>
      </SettingsProvider>
    </SidebarProvider>
  );
}
