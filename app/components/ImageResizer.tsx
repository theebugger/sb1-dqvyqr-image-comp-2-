'use client';

import React, { useState, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Download, Copy, Image as ImageIcon } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";

function sanitizeFilename(filename: string): string {
  return filename.replace(/[^a-zA-Z0-9.-_]/g, '_');
}

const ImageResizer = () => {
  const [originalImage, setOriginalImage] = useState<File | null>(null);
  const [resizedImage, setResizedImage] = useState<string | null>(null);
  const [resizePercentage, setResizePercentage] = useState<number>(33);
  const [isResizing, setIsResizing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const sanitizedFile = new File([file], sanitizeFilename(file.name), { type: file.type });
      setOriginalImage(sanitizedFile);
      setResizedImage(null);
      setError(null);
    }
  };

  const resizeImage = useCallback(async () => {
    if (!originalImage) return;

    setIsResizing(true);
    setError(null);
    const formData = new FormData();
    formData.append('image', originalImage);
    formData.append('percentage', resizePercentage.toString());

    try {
      const response = await fetch('/api/resize', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Resize failed');
      }

      const blob = await response.blob();
      setResizedImage(URL.createObjectURL(blob));
      toast({
        title: "Image resized successfully!",
        description: "Your image has been resized and is ready for download.",
      });
    } catch (error) {
      console.error('Error resizing image:', error);
      setError(error instanceof Error ? error.message : "There was a problem resizing your image. Please try again.");
      toast({
        title: "Error resizing image",
        description: error instanceof Error ? error.message : "There was a problem resizing your image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsResizing(false);
    }
  }, [originalImage, resizePercentage, toast]);

  const copyImageUrl = useCallback((url: string) => {
    navigator.clipboard.writeText(url).then(() => {
      toast({
        title: "URL copied!",
        description: "The image URL has been copied to your clipboard.",
      });
    }).catch((err) => {
      console.error('Failed to copy URL: ', err);
      toast({
        title: "Failed to copy URL",
        description: "There was an error copying the URL. Please try again.",
        variant: "destructive",
      });
    });
  }, [toast]);

  return (
    <div className="space-y-8">
      <div>
        <Label htmlFor="image-upload">Upload Image</Label>
        <Input
          id="image-upload"
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="mt-1"
        />
      </div>

      <div>
        <Label htmlFor="resize-percentage">Resize Percentage</Label>
        <Input
          id="resize-percentage"
          type="number"
          min="1"
          max="100"
          value={resizePercentage}
          onChange={(e) => setResizePercentage(Number(e.target.value))}
          className="mt-1"
        />
      </div>

      <Button onClick={resizeImage} disabled={!originalImage || isResizing}>
        {isResizing ? 'Resizing...' : 'Resize Image'}
      </Button>

      {error && (
        <div className="text-red-500 mt-2">
          Error: {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {originalImage && (
          <div className="relative">
            <h3 className="text-lg font-semibold mb-2">Original Image</h3>
            <Dialog>
              <DialogTrigger asChild>
                <div className="cursor-pointer">
                  <img
                    src={URL.createObjectURL(originalImage)}
                    alt="Original"
                    className="w-full h-48 object-cover rounded-lg"
                  />
                </div>
              </DialogTrigger>
              <DialogContent className="max-w-3xl">
                <img
                  src={URL.createObjectURL(originalImage)}
                  alt="Original (Full Size)"
                  className="w-full h-auto"
                />
              </DialogContent>
            </Dialog>
            <div className="absolute bottom-2 right-2 flex space-x-2">
              <Button
                size="icon"
                variant="secondary"
                onClick={() => copyImageUrl(URL.createObjectURL(originalImage))}
              >
                <Copy className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="secondary"
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = URL.createObjectURL(originalImage);
                  link.download = sanitizeFilename(originalImage.name);
                  link.click();
                }}
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {resizedImage && (
          <div className="relative">
            <h3 className="text-lg font-semibold mb-2">Resized Image</h3>
            <Dialog>
              <DialogTrigger asChild>
                <div className="cursor-pointer">
                  <img
                    src={resizedImage}
                    alt="Resized"
                    className="w-full h-48 object-cover rounded-lg"
                  />
                </div>
              </DialogTrigger>
              <DialogContent className="max-w-3xl">
                <img
                  src={resizedImage}
                  alt="Resized (Full Size)"
                  className="w-full h-auto"
                />
              </DialogContent>
            </Dialog>
            <div className="absolute bottom-2 right-2 flex space-x-2">
              <Button
                size="icon"
                variant="secondary"
                onClick={() => copyImageUrl(resizedImage)}
              >
                <Copy className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="secondary"
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = resizedImage;
                  link.download = `resized_${sanitizeFilename(originalImage?.name || 'image')}`;
                  link.click();
                }}
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageResizer;