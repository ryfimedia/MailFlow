
'use client';

import Link from "next/link";
import { usePathname } from 'next/navigation';
import { Button } from "./ui/button";
import { useAuth } from "@/contexts/auth-context";

export function AuthButtons() {
    const { user, loading } = useAuth();
    const pathname = usePathname();

    if (loading) {
        return <div className="h-10 w-24 rounded-md bg-muted animate-pulse" />;
    }

    if (user) {
        return (
             <Button asChild>
                <Link href="/dashboard">Dashboard</Link>
            </Button>
        )
    }

    return (
        <div className="flex gap-2">
            <Button asChild variant={pathname === '/signin' ? 'default' : 'secondary'}>
                <Link href="/signin">Sign In</Link>
            </Button>
            <Button asChild variant={pathname === '/signup' ? 'default' : 'outline'}>
                <Link href="/signup">Sign Up</Link>
            </Button>
        </div>
    )
}
