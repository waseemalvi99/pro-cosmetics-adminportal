"use client";

import { ImageIcon } from "lucide-react";
import { cn, getImageUrl } from "@/lib/utils";
import type { ProductImageDto } from "@/types";

interface ProductThumbnailProps {
  images?: ProductImageDto[] | null;
  alt?: string;
  className?: string;
  iconSize?: string;
}

export function ProductThumbnail({
  images,
  alt = "Product",
  className,
  iconSize = "h-4 w-4",
}: ProductThumbnailProps) {
  const primaryImage = images?.find((img) => img.isPrimary) ?? images?.[0];

  if (primaryImage) {
    return (
      <img
        src={getImageUrl(primaryImage.url)}
        alt={alt}
        className={cn("rounded-md object-cover", className)}
      />
    );
  }

  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-md bg-muted",
        className
      )}
    >
      <ImageIcon className={cn("text-muted-foreground", iconSize)} />
    </div>
  );
}
