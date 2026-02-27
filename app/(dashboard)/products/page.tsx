"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  ImageIcon,
  Printer,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { SearchableCombobox } from "@/components/ui/searchable-combobox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { productsApi } from "@/lib/api/products";
import { useCategoryCombo } from "@/hooks/use-combo-search";
import type { ProductDto } from "@/types";
import { formatCurrency, getImageUrl } from "@/lib/utils";

const PAGE_SIZE = 20;
const DEBOUNCE_MS = 500;

function isLowStock(product: ProductDto) {
  return product.quantityOnHand <= product.reorderLevel;
}

export default function ProductsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [categoryId, setCategoryId] = useState<string>("all");
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [isPrinting, setIsPrinting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [search]);

  const { data: productsResponse, isLoading } = useQuery({
    queryKey: ["products", page, debouncedSearch, categoryId],
    queryFn: () =>
      productsApi.list({
        page,
        pageSize: PAGE_SIZE,
        search: debouncedSearch || undefined,
        categoryId: categoryId && categoryId !== "all" ? Number(categoryId) : undefined,
      }),
  });

  const categoryCombo = useCategoryCombo();

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await productsApi.delete(id);
      if (!res.success) throw new Error(res.message || "Failed to delete product");
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Product deleted successfully");
      setDeleteId(null);
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to delete product");
    },
  });

  const pagedData =
    productsResponse?.success && productsResponse?.data ? productsResponse.data : null;
  const products = pagedData?.items ?? [];
  const totalPages = pagedData?.totalPages ?? 1;

  const handleDelete = useCallback(() => {
    if (deleteId) {
      deleteMutation.mutate(deleteId);
    }
  }, [deleteId, deleteMutation]);

  const toggleSelect = useCallback((id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    if (selectedIds.size === products.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(products.map((p) => p.id)));
    }
  }, [products, selectedIds.size]);

  const handlePrintBarcodes = useCallback(async () => {
    if (selectedIds.size === 0) {
      toast.error("Select at least one product to print barcodes.");
      return;
    }
    setIsPrinting(true);
    try {
      await productsApi.printBarcodeLabels(Array.from(selectedIds));
      toast.success("Barcode labels PDF opened in a new tab.");
    } catch {
      toast.error("Failed to generate barcode labels.");
    } finally {
      setIsPrinting(false);
    }
  }, [selectedIds]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Products"
        description="Manage your product catalog"
        action={
          <div className="flex items-center gap-2">
            {selectedIds.size > 0 && (
              <Button
                variant="outline"
                onClick={handlePrintBarcodes}
                disabled={isPrinting}
              >
                {isPrinting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Printer className="mr-2 h-4 w-4" />
                )}
                Print Barcodes ({selectedIds.size})
              </Button>
            )}
            <Button asChild>
              <Link href="/products/new">
                <Plus className="mr-2 h-4 w-4" />
                Add Product
              </Link>
            </Button>
          </div>
        }
      />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="w-full sm:w-[220px]">
          <SearchableCombobox
            options={[{ value: "all", label: "All categories" }, ...categoryCombo.options]}
            value={categoryId}
            onValueChange={(v) => { setCategoryId(v || "all"); setPage(1); }}
            onSearchChange={categoryCombo.setSearch}
            isLoading={categoryCombo.isLoading}
            placeholder="All categories"
            searchPlaceholder="Search categories..."
            emptyMessage="No categories found."
          />
        </div>
      </div>

      <div className="rounded-lg border">
        {isLoading ? (
          <div className="p-6 space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex gap-4">
                <Skeleton className="h-10 flex-1" />
                <Skeleton className="h-10 w-24" />
                <Skeleton className="h-10 w-24" />
                <Skeleton className="h-10 w-20" />
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="font-display text-lg font-medium text-muted-foreground">
              No products found
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {debouncedSearch || (categoryId && categoryId !== "all")
                ? "Try adjusting your search or filters"
                : "Get started by adding your first product"}
            </p>
            {!debouncedSearch && (!categoryId || categoryId === "all") && (
              <Button asChild className="mt-4">
                <Link href="/products/new">Add Product</Link>
              </Button>
            )}
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px]">
                    <Checkbox
                      checked={products.length > 0 && selectedIds.size === products.length}
                      onCheckedChange={toggleSelectAll}
                      aria-label="Select all"
                    />
                  </TableHead>
                  <TableHead className="w-[60px]"></TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Cost Price</TableHead>
                  <TableHead className="text-right">Sale Price</TableHead>
                  <TableHead className="text-right">Stock</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product: ProductDto) => {
                  const primaryImage = product.images?.find((img) => img.isPrimary) ?? product.images?.[0];
                  return (
                  <TableRow key={product.id} data-state={selectedIds.has(product.id) ? "selected" : undefined}>
                    <TableCell>
                      <Checkbox
                        checked={selectedIds.has(product.id)}
                        onCheckedChange={() => toggleSelect(product.id)}
                        aria-label={`Select ${product.name}`}
                      />
                    </TableCell>
                    <TableCell>
                      {primaryImage ? (
                        <img
                          src={getImageUrl(primaryImage.url)}
                          alt={product.name}
                          className="h-10 w-10 rounded-md object-cover"
                        />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted">
                          <ImageIcon className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {product.sku || "—"}
                    </TableCell>
                    <TableCell>{product.categoryName || "—"}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(product.costPrice)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(product.salePrice)}
                    </TableCell>
                    <TableCell>
                      {isLowStock(product) ? (
                        <Badge variant="destructive" className="text-xs">
                          {product.quantityOnHand}
                        </Badge>
                      ) : (
                        <span>{product.quantityOnHand}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={product.isActive ? "default" : "secondary"}
                        className={
                          product.isActive
                            ? "bg-emerald-600 hover:bg-emerald-600"
                            : ""
                        }
                      >
                        {product.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          asChild
                        >
                          <Link href={`/products/${product.id}/edit`}>
                            <Pencil className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => setDeleteId(product.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Delete</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                  );
                })}
              </TableBody>
            </Table>

            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t px-4 py-3">
                <p className="text-sm text-muted-foreground">
                  Page {page} of {totalPages}
                </p>
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          if (page > 1) setPage((p) => p - 1);
                        }}
                        className={
                          page <= 1 ? "pointer-events-none opacity-50" : ""
                        }
                      />
                    </PaginationItem>
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(
                        (p) =>
                          p === 1 ||
                          p === totalPages ||
                          (p >= page - 2 && p <= page + 2)
                      )
                      .map((p, idx, arr) => (
                        <PaginationItem key={p}>
                          {idx > 0 && arr[idx - 1] !== p - 1 && (
                            <span className="px-2">…</span>
                          )}
                          <PaginationLink
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              setPage(p);
                            }}
                            isActive={page === p}
                          >
                            {p}
                          </PaginationLink>
                        </PaginationItem>
                      ))}
                    <PaginationItem>
                      <PaginationNext
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          if (page < totalPages) setPage((p) => p + 1);
                        }}
                        className={
                          page >= totalPages
                            ? "pointer-events-none opacity-50"
                            : ""
                        }
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </>
        )}
      </div>

      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display">
              Delete product?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              product.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
