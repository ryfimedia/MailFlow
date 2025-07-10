
import { getMediaImages } from '@/lib/actions';
import MediaClient from './media-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default async function MediaLibraryPage() {
  const images = await getMediaImages();

  return (
    <>
        <MediaClient initialImages={images} />
        <Card className="mt-6">
            <CardHeader>
                <CardTitle>Data Retention Policy</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
                <p>
                    To manage storage costs and ensure compliance, our system follows a data retention policy.
                </p>
                <ul className="list-disc pl-5 space-y-1">
                    <li>
                        <strong>Campaign Archiving:</strong> Email campaigns are archived 365 days after they are sent. The content of archived emails is removed, but the performance statistics remain available.
                    </li>
                    <li>
                        <strong>Automated Deletion:</strong> The automatic deletion of unused images requires a scheduled background task (e.g., a Cloud Function cron job). This feature is not enabled by default and must be configured separately in your Firebase project.
                    </li>
                </ul>
            </CardContent>
      </Card>
    </>
  );
}
