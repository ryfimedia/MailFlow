
'use client';

import React from 'react';
import { useToast } from '@/hooks/use-toast';
import { getMediaImages, deleteMediaImage } from '@/lib/actions';
import type { MediaImage } from '@/lib/types';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Trash2, Download } from 'lucide-react';
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

export default function MediaClient({ initialImages }: { initialImages: MediaImage[] }) {
  const { toast } = useToast();
  const [images, setImages] = React.useState<MediaImage[]>(initialImages);
  
  const fetchImages = React.useCallback(async () => {
    try {
      const fetchedImages = await getMediaImages();
      setImages(fetchedImages);
    } catch (error) {
      console.error("Failed to load media", error);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch your images.' });
    }
  }, [toast]);
  
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

      {images.length === 0 ? (
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
    </div>
  );
}
