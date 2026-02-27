"use client";

import { useQuery } from "@tanstack/react-query";
import { ImageIcon } from "lucide-react";
import { productsApi } from "@/lib/api/products";
import { getImageUrl } from "@/lib/utils";

interface SaleItemImageProps {
  productId: number;
  alt?: string;
}

export function SaleItemImage({ productId, alt = "Product" }: SaleItemImageProps) {
  const { data } = useQuery({
    queryKey: ["product-images", productId],
    queryFn: () => productsApi.listImages(productId),
    staleTime: 5 * 60 * 1000,
  });

  const images = data?.success && data?.data ? data.data : [];
  const primaryImage = images.find((img) => img.isPrimary) ?? images[0];

  if (primaryImage) {
    return (
      <img
        src={getImageUrl(primaryImage.url)}
        alt={alt}
        className="h-9 w-9 rounded-md object-cover"
      />
    );
  }

  return (
    <div className="flex h-9 w-9 items-center justify-center rounded-md bg-muted">
      <ImageIcon className="h-3.5 w-3.5 text-muted-foreground" />
    </div>
  );
}
