
'use client';

import React from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getUnsubscribeDetails, unsubscribeContact } from '@/lib/actions';
import { Skeleton } from '@/components/ui/skeleton';
import { Rocket } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function UnsubscribePage() {
  const searchParams = useSearchParams();
  const contactId = searchParams.get('contactId');
  const listId = searchParams.get('listId');
  const all = searchParams.get('all');

  const [details, setDetails] = React.useState<{ contactEmail: string; listName?: string } | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [isDone, setIsDone] = React.useState(false);

  React.useEffect(() => {
    if (!contactId) {
      setError('Invalid unsubscribe link. Contact information is missing.');
      setLoading(false);
      return;
    }

    async function fetchDetails() {
      try {
        const result = await getUnsubscribeDetails(contactId, listId, all === 'true');
        if (result.error) {
          setError(result.error);
        } else {
          setDetails(result);
        }
      } catch (e) {
        setError('An unexpected error occurred. Please try again later.');
      } finally {
        setLoading(false);
      }
    }

    fetchDetails();
  }, [contactId, listId, all]);

  const handleUnsubscribe = async () => {
    if (!contactId) return;
    setLoading(true);
    try {
      const result = await unsubscribeContact(contactId, listId, all === 'true');
       if (result.error) {
          setError(result.error);
        } else {
          setIsDone(true);
        }
    } catch (e) {
      setError('An unexpected error occurred while trying to unsubscribe.');
    } finally {
        setLoading(false);
    }
  };
  
  const getTitle = () => {
    if (isDone) return 'You have been unsubscribed.';
    if (all === 'true') return 'Unsubscribe from all mailings?';
    return `Unsubscribe from "${details?.listName || 'this list'}"?`;
  }
  
  const getDescription = () => {
     if (isDone) return `Your email address, ${details?.contactEmail}, has been removed from future mailings.`;
     if (all === 'true') return `This will remove ${details?.contactEmail} from all current and future email lists.`;
     return `This will remove ${details?.contactEmail} from this email list.`;
  }

  return (
    <div className="min-h-screen bg-muted flex flex-col items-center justify-center p-4">
        <div className="flex items-center gap-2 mb-6 text-2xl font-bold font-headline text-foreground">
            <div className="p-2 rounded-lg bg-primary text-primary-foreground">
              <Rocket className="w-6 h-6" />
            </div>
            <h1>RyFi MailFlow</h1>
        </div>
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">{getTitle()}</CardTitle>
          {details && <CardDescription className="text-center">{getDescription()}</CardDescription>}
        </CardHeader>
        <CardContent>
          {loading && <Skeleton className="h-10 w-full" />}
          {error && (
             <Alert variant="destructive">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {!loading && !error && !isDone && (
            <Button className="w-full" onClick={handleUnsubscribe}>
              Confirm Unsubscribe
            </Button>
          )}
           {isDone && (
            <Alert>
                <AlertTitle>Success</AlertTitle>
                <AlertDescription>Your preferences have been updated.</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
