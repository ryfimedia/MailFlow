
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Rocket, ArrowLeft } from 'lucide-react';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-muted flex flex-col items-center p-4">
      <header className="w-full max-w-4xl py-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-2xl font-bold font-headline text-foreground">
            <div className="p-2 rounded-lg bg-primary text-primary-foreground">
              <Rocket className="w-6 h-6" />
            </div>
            <h1>RyFi MailFlow</h1>
          </Link>
          <Button asChild variant="outline">
              <Link href="/signup"><ArrowLeft className="mr-2 h-4 w-4" />Back to Sign Up</Link>
          </Button>
      </header>
      <main className="w-full max-w-4xl bg-background p-8 rounded-lg border">
        <div className="prose prose-sm md:prose-base dark:prose-invert max-w-none">
          <h1>Terms and Conditions</h1>
          <p>Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

          <h2>1. Introduction</h2>
          <p>Welcome to RyFi MailFlow ("we", "our", "us"). These Terms and Conditions govern your use of our email marketing platform and services (the "Service"). By accessing or using the Service, you agree to be bound by these Terms. If you disagree with any part of the terms, then you may not access the Service.</p>

          <h2>2. Accounts</h2>
          <p>When you create an account with us, you must provide us information that is accurate, complete, and current at all times. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account on our Service. You are responsible for safeguarding the password that you use to access the Service and for any activities or actions under your password.</p>

          <h2>3. User Content</h2>
          <p>Our Service allows you to create, send, and manage email campaigns ("User Content"). You are responsible for the User Content, including its legality, reliability, and appropriateness. You retain any and all of your rights to any User Content you submit, and you are responsible for protecting those rights.</p>
          <p>You may not use the Service for any unlawful purpose, including but not limited to:</p>
          <ul>
            <li>Sending spam or otherwise duplicative or unsolicited messages in violation of applicable laws (e.g., CAN-SPAM Act).</li>
            <li>Sending emails to purchased, rented, or third-party lists of email addresses.</li>
            <li>Sending content that is infringing, obscene, threatening, libelous, or otherwise unlawful or tortious.</li>
          </ul>

          <h2>4. Service Usage and Limitations</h2>
          <p>The Service is provided on an "as is" and "as available" basis. We may impose limits on certain features and services or restrict your access to parts or all of the Service without notice or liability. We do not guarantee that the Service will be uninterrupted, secure, or error-free.</p>
          
          <h2>5. Termination</h2>
          <p>We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms. Upon termination, your right to use the Service will immediately cease.</p>

          <h2>6. Intellectual Property</h2>
          <p>The Service and its original content (excluding User Content), features, and functionality are and will remain the exclusive property of RyFi MailFlow and its licensors. The Service is protected by copyright, trademark, and other laws of both the United States and foreign countries.</p>

          <h2>7. Limitation of Liability</h2>
          <p>In no event shall RyFi MailFlow, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the Service.</p>
          
          <h2>8. Changes</h2>
          <p>We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material we will provide at least 30 days' notice prior to any new terms taking effect. What constitutes a material change will be determined at our sole discretion.</p>

          <h2>9. Contact Us</h2>
          <p>If you have any questions about these Terms, please contact us at support@ryfimailflow.example.com.</p>
        </div>
      </main>
    </div>
  );
}
