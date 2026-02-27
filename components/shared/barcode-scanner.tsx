"use client";

import { useEffect } from "react";
import { Loader2, ScanBarcode, ImageIcon, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn, getImageUrl, formatCurrency } from "@/lib/utils";
import type { ProductBarcodeDto } from "@/types";

interface BarcodeScannerProps {
  barcode: string;
  onBarcodeChange: (value: string) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
  isScanning: boolean;
  lastScannedProduct: ProductBarcodeDto | null;
  error?: string | null;
  autoFocus?: boolean;
  placeholder?: string;
  priceField?: "salePrice" | "costPrice";
  className?: string;
}

export function BarcodeScanner({
  barcode,
  onBarcodeChange,
  onKeyDown,
  inputRef,
  isScanning,
  lastScannedProduct,
  error,
  autoFocus = true,
  placeholder = "Scan barcode or type manually...",
  priceField = "salePrice",
  className,
}: BarcodeScannerProps) {
  useEffect(() => {
    if (autoFocus) {
      const timer = setTimeout(() => inputRef.current?.focus(), 100);
      return () => clearTimeout(timer);
    }
  }, [autoFocus, inputRef]);

  const primaryImage = lastScannedProduct?.images?.find((img) => img.isPrimary)
    ?? lastScannedProduct?.images?.[0];

  return (
    <div className={cn("space-y-2", className)}>
      <div className="relative">
        <ScanBarcode className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="text"
          inputMode="none"
          value={barcode}
          onChange={(e) => onBarcodeChange(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          className={cn(
            "pl-9 pr-10 font-mono tabular-nums",
            isScanning && "opacity-60"
          )}
          disabled={isScanning}
          autoComplete="off"
        />
        {isScanning && (
          <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {lastScannedProduct && !error && (
        <div className="flex items-center gap-3 rounded-md border border-green-200 bg-green-50/50 px-3 py-2 dark:border-green-900 dark:bg-green-950/30">
          {primaryImage ? (
            <img
              src={getImageUrl(primaryImage.url)}
              alt={lastScannedProduct.productName}
              className="h-9 w-9 shrink-0 rounded-md object-cover"
            />
          ) : (
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted">
              <ImageIcon className="h-4 w-4 text-muted-foreground" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-green-800 dark:text-green-300">
              {lastScannedProduct.productName}
            </p>
            <p className="text-xs text-green-700/70 dark:text-green-400/70">
              {formatCurrency(lastScannedProduct[priceField])} · Stock: {lastScannedProduct.quantityOnHand}
            </p>
          </div>
          <Badge
            variant="outline"
            className="shrink-0 border-green-300 text-green-700 dark:border-green-700 dark:text-green-400"
          >
            Added
          </Badge>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Scan a barcode or type it and press <kbd className="rounded border bg-muted px-1 py-0.5 font-mono text-[10px]">Enter</kbd>
      </p>
    </div>
  );
}
