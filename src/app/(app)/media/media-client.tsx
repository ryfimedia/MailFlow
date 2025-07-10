
'use client';

import React from 'react';
import { useToast } from '@/hooks/use-toast';
import { getMediaImages, deleteMediaImage, uploadImage } from '@/lib/actions';
import type { MediaImage } from '@/lib/types';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Trash2, Download, Upload, Loader2 } from 'lucide-react';
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
import { Input } from '@/components/ui/input';


const resizeImage = (file: File, maxWidth = 1080, maxHeight = 1920, quality = 0.8): Promise<Blob> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            if (!event.target?.result) return reject(new Error("Could not read file."));

            const img = new Image();
            img.onload = () => {
                let { width, height } = img;

                if (width > maxWidth || height > maxHeight) {
                    const widthRatio = maxWidth / width;
                    const heightRatio = maxHeight / height;
                    const ratio = Math.min(widthRatio, heightRatio);
                    width = Math.round(width * ratio);
                    height = Math.round(height * ratio);
                }

                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                if (!ctx) return reject(new Error("Could not get canvas context."));
                
                ctx.drawImage(img, 0, 0, width, height);
                
                const outputFormat = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
                canvas.toBlob((blob) => {
                    if (!blob) {
                        return reject(new Error("Canvas to Blob conversion failed."));
                    }
                    resolve(blob);
                }, outputFormat, quality);
            };
            img.onerror = (err) => reject(err);
            img.src = event.target.result as string;
        };
        reader.onerror = (err) => reject(err);
        reader.readAsDataURL(file);
    });
};


export default function MediaClient({ initialImages }: { initialImages: MediaImage[] }) {
  const { toast } = useToast();
  const [images, setImages] = React.useState<MediaImage[]>(initialImages);
  const [isUploading, setIsUploading] = React.useState(false);

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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const target = e.target as HTMLInputElement;
    if (target.files && target.files.length > 0) {
        const file = target.files[0];
        setIsUploading(true);
        try {
            toast({
                title: "Optimizing & uploading...",
                description: "Your image is being prepared and uploaded.",
            });
            const resizedBlob = await resizeImage(file);

            const formData = new FormData();
            formData.append('image', resizedBlob, file.name);

            const { url, error } = await uploadImage(formData);

            if (error || !url) {
                throw new Error(error || "Image URL not returned from server.");
            }
            
            toast({
                title: "Image Uploaded",
                description: "Your image has been added to the library.",
            });
            fetchImages(); // Refresh the library view
        } catch (error: any) {
            console.error("Image upload failed:", error);
            toast({
                variant: "destructive",
                title: "Image Error",
                description: error.message || "Could not upload the image.",
            });
        } finally {
            setIsUploading(false);
            target.value = ''; // Reset file input
        }
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold font-headline">Media Library</h1>
        <div>
            <Button asChild>
                <label htmlFor="media-upload">
                    {isUploading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <Upload className="mr-2 h-4 w-4" />
                    )}
                    Upload Image
                </label>
            </Button>
            <Input id="media-upload" type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={isUploading} />
        </div>
      </div>

      {images.length === 0 ? (
        <Card className="text-center py-12">
            <CardContent>
                <h3 className="text-xl font-semibold">Your Media Library is Empty</h3>
                <p className="text-muted-foreground mt-2">Start by uploading images here or in a new campaign.</p>
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
