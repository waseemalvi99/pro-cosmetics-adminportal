"use client";

import { useState, useCallback, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Upload,
  X,
  Star,
  Loader2,
  ImageIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { productsApi } from "@/lib/api/products";
import { getImageUrl, cn } from "@/lib/utils";
import type { ProductImageDto } from "@/types";

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/bmp",
  "image/tiff",
];
const MAX_SIZE = 10 * 1024 * 1024;
const MAX_IMAGES = 10;

function validateFile(file: File): string | null {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return `${file.name}: Invalid type. Accepted: JPG, PNG, GIF, WebP, BMP, TIFF`;
  }
  if (file.size > MAX_SIZE) {
    return `${file.name}: Too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Max: 10 MB`;
  }
  return null;
}

interface ProductImageUploadProps {
  productId: number;
}

export function ProductImageUpload({ productId }: ProductImageUploadProps) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ProductImageDto | null>(null);

  const { data: imagesResponse, isLoading } = useQuery({
    queryKey: ["product-images", productId],
    queryFn: () => productsApi.listImages(productId),
    enabled: !!productId,
  });

  const images =
    imagesResponse?.success && imagesResponse?.data ? imagesResponse.data : [];

  const uploadMutation = useMutation({
    mutationFn: async (files: File[]) => {
      const formData = new FormData();
      if (files.length === 1) {
        formData.append("file", files[0]);
        return productsApi.uploadImage(productId, formData);
      }
      for (const file of files) {
        formData.append("files", file);
      }
      return productsApi.uploadImagesBulk(productId, formData);
    },
    onSuccess: (res) => {
      if (res.success) {
        toast.success("Image(s) uploaded successfully");
        queryClient.invalidateQueries({ queryKey: ["product-images", productId] });
        queryClient.invalidateQueries({ queryKey: ["products"] });
      } else {
        toast.error(res.message || "Upload failed");
      }
    },
    onError: () => {
      toast.error("Failed to upload image(s)");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (imageId: number) => {
      const res = await productsApi.deleteImage(productId, imageId);
      if (!res.success) throw new Error(res.message || "Failed to delete image");
      return res;
    },
    onSuccess: () => {
      toast.success("Image deleted");
      queryClient.invalidateQueries({ queryKey: ["product-images", productId] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setDeleteTarget(null);
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const setPrimaryMutation = useMutation({
    mutationFn: async (imageId: number) => {
      const res = await productsApi.setPrimaryImage(productId, imageId);
      if (!res.success) throw new Error(res.message || "Failed to set primary image");
      return res;
    },
    onSuccess: () => {
      toast.success("Primary image updated");
      queryClient.invalidateQueries({ queryKey: ["product-images", productId] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const handleFiles = useCallback(
    (files: FileList | File[]) => {
      const fileArray = Array.from(files);
      const remaining = MAX_IMAGES - images.length;

      if (remaining <= 0) {
        toast.error(`Maximum of ${MAX_IMAGES} images reached`);
        return;
      }

      const toUpload = fileArray.slice(0, remaining);
      if (fileArray.length > remaining) {
        toast.warning(
          `Only ${remaining} more image(s) allowed. ${fileArray.length - remaining} file(s) skipped.`
        );
      }

      const errors: string[] = [];
      const valid: File[] = [];
      for (const file of toUpload) {
        const err = validateFile(file);
        if (err) {
          errors.push(err);
        } else {
          valid.push(file);
        }
      }

      if (errors.length > 0) {
        errors.forEach((e) => toast.error(e));
      }

      if (valid.length > 0) {
        uploadMutation.mutate(valid);
      }
    },
    [images.length, uploadMutation]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (e.dataTransfer.files.length > 0) {
        handleFiles(e.dataTransfer.files);
      }
    },
    [handleFiles]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        handleFiles(e.target.files);
        e.target.value = "";
      }
    },
    [handleFiles]
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display text-sm font-semibold">Product Images</h3>
          <p className="text-xs text-muted-foreground">
            {images.length}/{MAX_IMAGES} images
          </p>
        </div>
      </div>

      {images.length < MAX_IMAGES && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors",
            isDragging
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25 hover:border-primary/50 hover:bg-accent/50"
          )}
        >
          {uploadMutation.isPending ? (
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          ) : (
            <Upload className="h-8 w-8 text-muted-foreground" />
          )}
          <p className="mt-2 text-sm font-medium">
            {uploadMutation.isPending
              ? "Uploading..."
              : "Drop images here or click to browse"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            JPG, PNG, GIF, WebP, BMP, TIFF — up to 10 MB each
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileInput}
            className="hidden"
          />
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="aspect-square animate-pulse rounded-lg bg-muted"
            />
          ))}
        </div>
      ) : images.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-8 text-center">
          <ImageIcon className="h-10 w-10 text-muted-foreground/50" />
          <p className="mt-2 text-sm text-muted-foreground">
            No images yet. Upload your first product image above.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {images.map((image) => (
            <div
              key={image.id}
              className="group relative aspect-square overflow-hidden rounded-lg border bg-muted"
            >
              <img
                src={getImageUrl(image.url)}
                alt={image.fileName}
                className="h-full w-full object-cover transition-transform group-hover:scale-105"
              />

              {image.isPrimary && (
                <div className="absolute left-1.5 top-1.5 flex items-center gap-1 rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-semibold text-white shadow">
                  <Star className="h-3 w-3 fill-white" />
                  Primary
                </div>
              )}

              <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100">
                <div className="flex w-full items-center justify-between p-2">
                  {!image.isPrimary && (
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      className="h-7 gap-1 text-xs"
                      disabled={setPrimaryMutation.isPending}
                      onClick={() => setPrimaryMutation.mutate(image.id)}
                    >
                      <Star className="h-3 w-3" />
                      Set Primary
                    </Button>
                  )}
                  {image.isPrimary && <span />}
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() => setDeleteTarget(image)}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display">
              Delete image?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove this image. This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() =>
                deleteTarget && deleteMutation.mutate(deleteTarget.id)
              }
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
