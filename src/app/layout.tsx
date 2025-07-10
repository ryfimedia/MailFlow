import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { Inter, Space_Grotesk } from 'next/font/google';
import { AuthProvider } from '@/contexts/auth-context';
import { SettingsProvider } from '@/contexts/settings-context';

export const metadata: Metadata = {
  title: 'RyFi MailFlow',
  description: 'Smarter email marketing for better results.',
};

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-space-grotesk',
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${spaceGrotesk.variable} font-body antialiased`}>
        <AuthProvider>
            <SettingsProvider>
                {children}
                <Toaster />
            </SettingsProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
