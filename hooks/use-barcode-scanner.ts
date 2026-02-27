import { useState, useCallback, useRef } from "react";
import { productsApi } from "@/lib/api/products";
import type { ProductBarcodeDto } from "@/types";

interface UseBarcodeScanner {
  onProductFound: (product: ProductBarcodeDto) => void;
  onError?: (message: string) => void;
}

export function useBarcodeScanner({ onProductFound, onError }: UseBarcodeScanner) {
  const [barcode, setBarcode] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [lastScannedProduct, setLastScannedProduct] = useState<ProductBarcodeDto | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const cooldownRef = useRef(false);

  const lookup = useCallback(
    async (code: string) => {
      const trimmed = code.trim();
      if (!trimmed || cooldownRef.current) return;

      cooldownRef.current = true;
      setIsScanning(true);

      try {
        const res = await productsApi.getByBarcode(trimmed);

        if (res.success && res.data) {
          setLastScannedProduct(res.data);
          onProductFound(res.data);
          setBarcode("");
        } else {
          setLastScannedProduct(null);
          onError?.(res.message || "Product not found for this barcode.");
        }
      } catch {
        onError?.("Failed to look up barcode. Please try again.");
      } finally {
        setIsScanning(false);
        setTimeout(() => {
          inputRef.current?.focus();
          cooldownRef.current = false;
        }, 50);
      }
    },
    [onProductFound, onError]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        lookup(barcode);
      }
    },
    [barcode, lookup]
  );

  const focusInput = useCallback(() => {
    inputRef.current?.focus();
  }, []);

  return {
    barcode,
    setBarcode,
    isScanning,
    lastScannedProduct,
    handleKeyDown,
    inputRef,
    focusInput,
    lookup,
  };
}
