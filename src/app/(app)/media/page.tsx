
'use client';

import React from 'react';
import { useToast } from '@/hooks/use-toast';
import { getMediaImages, deleteMediaImage } from '@/lib/actions';
import type { MediaImage } from '@/lib/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Trash2, Download } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export default function MediaLibraryPage() {
  const { toast } = useToast();
  const [images, setImages] = React.useState<MediaImage[]>([]);
  const [loading, setLoading] = React.useState(true);
  
  const fetchImages = React.useCallback(async () => {
    setLoading(true);
    try {
      const fetchedImages = await getMediaImages();
      setImages(fetchedImages);
    } catch (error) {
      console.error("Failed to load media", error);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch your images.' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  React.useEffect(() => {
    fetchImages();
  }, [fetchImages]);
  
  const handleDelete = async (fileName: string) => {
    const result = await deleteMediaImage(fileName);
    if (result.success) {
      toast({ title: 'Image Deleted', description: 'The image has been removed from your library.' });
      fetchImages(); // Refresh the list
    } else {
      toast({ variant: 'destructive', title: 'Error', description: result.error });
    }
  };

  const handleDownload = (url: string) => {
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold font-headline">Media Library</h1>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-0">
                <Skeleton className="aspect-square w-full" />
              </CardContent>
              <CardFooter className="p-2">
                <Skeleton className="h-8 w-full" />
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : images.length === 0 ? (
        <Card className="text-center py-12">
            <CardContent>
                <h3 className="text-xl font-semibold">Your Media Library is Empty</h3>
                <p className="text-muted-foreground mt-2">Start by uploading images in a new campaign or template.</p>
            </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {images.map((image) => (
            <Card key={image.name} className="overflow-hidden">
              <CardContent className="p-0 aspect-square relative">
                <Image
                  src={image.url}
                  alt={image.name}
                  fill
                  sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 20vw"
                  className="object-cover"
                />
              </CardContent>
              <CardFooter className="p-2 bg-muted/50 flex justify-end gap-2">
                 <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDownload(image.url)}>
                    <Download className="h-4 w-4" />
                    <span className="sr-only">Download</span>
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="icon" className="h-8 w-8">
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Delete</span>
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action will permanently delete the image. If it is used in any
                        campaigns, it will no longer display. This cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDelete(image.name)}
                        className="bg-destructive hover:bg-destructive/90"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
      <Card>
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
    </div>
  );
}
