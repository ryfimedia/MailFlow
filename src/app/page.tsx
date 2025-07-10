import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, Users, Rocket, BarChart2, Mailbox, ClipboardList } from 'lucide-react';

const features = [
  {
    icon: <Mail className="h-8 w-8 text-primary" />,
    title: 'Intuitive Campaign Editor',
    description: 'Design beautiful, responsive emails with our easy-to-use editor. Add text, images, buttons, and custom HTML.',
  },
  {
    icon: <Users className="h-8 w-8 text-primary" />,
    title: 'Contact Management',
    description: 'Import, organize, and segment your audience with contact lists and tags. Keep your data clean and actionable.',
  },
  {
    icon: <Mailbox className="h-8 w-8 text-primary" />,
    title: 'Automated Drip Campaigns',
    description: 'Nurture your leads automatically. Set up email sequences that trigger based on when a user subscribes.',
  },
  {
    icon: <ClipboardList className="h-8 w-8 text-primary" />,
    title: 'Opt-In Forms',
    description: 'Grow your audience with customizable opt-in forms. Share a public link to start collecting new subscribers.',
  },
  {
    icon: <BarChart2 className="h-8 w-8 text-primary" />,
    title: 'Insightful Analytics',
    description: 'Track your success. Monitor open rates, click rates, and more for every campaign you send.',
  },
  {
    icon: <Rocket className="h-8 w-8 text-primary" />,
    title: 'AI-Powered Content',
    description: 'Beat writer\'s block. Generate compelling subject lines and email body content with our integrated AI assistant.',
  },
];

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-primary text-primary-foreground">
            <Rocket className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold font-headline text-foreground">
            RyFi MailFlow
          </h1>
        </div>
        <Button asChild>
          <Link href="/start">Get Started</Link>
        </Button>
      </header>

      <main className="flex-grow">
        <section className="text-center py-20 lg:py-32">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-4xl md:text-6xl font-extrabold font-headline tracking-tighter mb-4">
              Smarter Email Marketing
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              RyFi MailFlow provides all the tools you need to engage your audience, from automated drip campaigns to powerful analytics and AI-driven content creation.
            </p>
            <Button asChild size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
              <Link href="/start">Get Started for Free</Link>
            </Button>
          </div>
        </section>

        <section className="py-20 lg:py-24 bg-muted/50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold font-headline">Everything You Need to Succeed</h2>
              <p className="text-lg text-muted-foreground mt-2">All the features of a professional email platform, built for you.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <Card key={index} className="text-center shadow-lg hover:shadow-xl transition-shadow duration-300">
                  <CardHeader>
                    <div className="mx-auto bg-primary/10 p-3 rounded-full w-fit">
                      {feature.icon}
                    </div>
                    <CardTitle className="mt-4">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="py-8 bg-background border-t">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} RyFi MailFlow. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
