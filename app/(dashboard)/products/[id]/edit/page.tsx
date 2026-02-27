"use client";

import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Printer } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { ProductImageUpload } from "@/components/shared/product-image-upload";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { SearchableCombobox } from "@/components/ui/searchable-combobox";
import { Skeleton } from "@/components/ui/skeleton";
import { productsApi } from "@/lib/api/products";
import { useCategoryCombo } from "@/hooks/use-combo-search";
import type { UpdateProductRequest } from "@/types";

const updateProductSchema = z.object({
  name: z.string().min(1, "Name is required"),
  sku: z.string().optional(),
  barcode: z.string().optional(),
  description: z.string().optional(),
  categoryId: z.string().optional(),
  costPrice: z.coerce.number().min(0, "Cost price must be 0 or greater"),
  salePrice: z.coerce.number().min(0, "Sale price must be 0 or greater"),
  reorderLevel: z.coerce.number().min(0, "Reorder level must be 0 or greater"),
  isActive: z.boolean(),
});

type UpdateProductFormValues = z.infer<typeof updateProductSchema>;

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const queryClient = useQueryClient();
  const id = params.id ? Number(params.id) : NaN;

  const { data: productResponse, isLoading: productLoading } = useQuery({
    queryKey: ["products", id],
    queryFn: () => productsApi.getById(id),
    enabled: !isNaN(id),
  });

  const categoryCombo = useCategoryCombo();

  const product =
    productResponse?.success && productResponse?.data ? productResponse.data : null;
  const productError = productResponse && !productResponse.success;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<UpdateProductFormValues>({
    resolver: zodResolver(updateProductSchema),
    defaultValues: {
      name: "",
      sku: "",
      barcode: "",
      description: "",
      categoryId: "",
      costPrice: 0,
      salePrice: 0,
      reorderLevel: 0,
      isActive: true,
    },
  });

  const categoryId = watch("categoryId");
  const isActive = watch("isActive");

  useEffect(() => {
    if (product) {
      reset({
        name: product.name,
        sku: product.sku ?? "",
        barcode: product.barcode ?? "",
        description: product.description ?? "",
        categoryId: product.categoryId ? String(product.categoryId) : "",
        costPrice: product.costPrice,
        salePrice: product.salePrice,
        reorderLevel: product.reorderLevel,
        isActive: product.isActive,
      });
    }
  }, [product, reset]);

  const updateMutation = useMutation({
    mutationFn: async (data: UpdateProductRequest) => {
      const res = await productsApi.update(id, data);
      if (!res.success) throw new Error(res.message || "Failed to update product");
      return res;
    },
    onSuccess: () => {
      toast.success("Product updated successfully");
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["products", id] });
      router.push("/products");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to update product");
    },
  });

  const [isPrintingBarcode, setIsPrintingBarcode] = useState(false);

  const onSubmit = (data: UpdateProductFormValues) => {
    updateMutation.mutate({
      name: data.name,
      sku: data.sku || undefined,
      barcode: data.barcode || undefined,
      description: data.description || undefined,
      categoryId: data.categoryId ? Number(data.categoryId) : undefined,
      costPrice: data.costPrice,
      salePrice: data.salePrice,
      reorderLevel: data.reorderLevel,
      isActive: data.isActive,
    });
  };

  const handlePrintBarcode = async () => {
    setIsPrintingBarcode(true);
    try {
      await productsApi.printBarcodeLabels([id]);
      toast.success("Barcode label PDF opened in a new tab.");
    } catch {
      toast.error("Failed to generate barcode label.");
    } finally {
      setIsPrintingBarcode(false);
    }
  };

  if (productLoading || (!product && !productError)) {
    return (
      <div className="space-y-6">
        <PageHeader title="Edit Product" description="Update product details" />
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader><Skeleton className="h-6 w-40" /></CardHeader>
            <CardContent className="space-y-6">
              <Skeleton className="h-9 w-full" />
              <div className="grid gap-4 sm:grid-cols-2">
                <Skeleton className="h-9 w-full" />
                <Skeleton className="h-9 w-full" />
              </div>
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-9 w-full" />
              <div className="grid gap-4 sm:grid-cols-3">
                <Skeleton className="h-9 w-full" />
                <Skeleton className="h-9 w-full" />
                <Skeleton className="h-9 w-full" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><Skeleton className="h-6 w-24" /></CardHeader>
            <CardContent>
              <Skeleton className="aspect-square w-full rounded-lg" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (productError || !product) {
    return (
      <div className="space-y-6">
        <PageHeader title="Edit Product" description="Update product details" />
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <p className="font-display text-lg font-semibold text-muted-foreground">
              Product not found
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              The product you&apos;re looking for doesn&apos;t exist or has been removed.
            </p>
            <Button asChild className="mt-4">
              <Link href="/products">Back to Products</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Edit Product"
        description="Update product details"
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <form onSubmit={handleSubmit(onSubmit)}>
          <Card>
            <CardHeader>
              <CardTitle className="font-display">Product details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input id="name" placeholder="Product name" {...register("name")} />
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name.message}</p>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="sku">SKU</Label>
                  <Input id="sku" placeholder="SKU" {...register("sku")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="barcode">Barcode</Label>
                  <Input id="barcode" placeholder="Barcode" {...register("barcode")} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Product description"
                  rows={3}
                  {...register("description")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="categoryId">Category</Label>
                <SearchableCombobox
                  options={categoryCombo.options}
                  value={categoryId || ""}
                  onValueChange={(v) => setValue("categoryId", v)}
                  onSearchChange={categoryCombo.setSearch}
                  isLoading={categoryCombo.isLoading}
                  placeholder="Select category"
                  searchPlaceholder="Search categories..."
                  emptyMessage="No categories found."
                  clearable
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="costPrice">Cost Price *</Label>
                  <Input
                    id="costPrice"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    {...register("costPrice")}
                  />
                  {errors.costPrice && (
                    <p className="text-sm text-destructive">{errors.costPrice.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="salePrice">Sale Price *</Label>
                  <Input
                    id="salePrice"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    {...register("salePrice")}
                  />
                  {errors.salePrice && (
                    <p className="text-sm text-destructive">{errors.salePrice.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reorderLevel">Reorder Level *</Label>
                  <Input
                    id="reorderLevel"
                    type="number"
                    step="1"
                    min="0"
                    placeholder="0"
                    {...register("reorderLevel")}
                  />
                  {errors.reorderLevel && (
                    <p className="text-sm text-destructive">{errors.reorderLevel.message}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label htmlFor="isActive">Active</Label>
                  <p className="text-sm text-muted-foreground">
                    Inactive products won&apos;t appear in sales or inventory.
                  </p>
                </div>
                <Switch
                  id="isActive"
                  checked={isActive}
                  onCheckedChange={(checked) => setValue("isActive", checked)}
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-wrap gap-3 border-t pt-6">
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Save Changes
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handlePrintBarcode}
                disabled={isPrintingBarcode}
              >
                {isPrintingBarcode ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Printer className="mr-2 h-4 w-4" />
                )}
                Print Barcode
              </Button>
              <Button variant="outline" asChild>
                <Link href="/products">Cancel</Link>
              </Button>
            </CardFooter>
          </Card>
        </form>

        <div className="lg:sticky lg:top-6 lg:self-start">
          <Card>
            <CardHeader>
              <CardTitle className="font-display">Images</CardTitle>
            </CardHeader>
            <CardContent>
              <ProductImageUpload productId={id} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
