"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { productsApi } from "@/lib/api/products";
import { categoriesApi } from "@/lib/api/categories";
import type { CategoryDto } from "@/types";

const createProductSchema = z.object({
  name: z.string().min(1, "Name is required"),
  sku: z.string().optional(),
  barcode: z.string().optional(),
  description: z.string().optional(),
  categoryId: z.string().optional(),
  costPrice: z.coerce.number().min(0, "Cost price must be 0 or greater"),
  salePrice: z.coerce.number().min(0, "Sale price must be 0 or greater"),
  reorderLevel: z.coerce.number().min(0, "Reorder level must be 0 or greater"),
});

type CreateProductFormValues = z.infer<typeof createProductSchema>;

export default function NewProductPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateProductFormValues>({
    resolver: zodResolver(createProductSchema),
    defaultValues: {
      name: "",
      sku: "",
      barcode: "",
      description: "",
      categoryId: "",
      costPrice: 0,
      salePrice: 0,
      reorderLevel: 0,
    },
  });

  const categoryId = watch("categoryId");

  const { data: categoriesResponse } = useQuery({
    queryKey: ["categories"],
    queryFn: () => categoriesApi.list(),
  });

  const createMutation = useMutation({
    mutationFn: async (data: CreateProductFormValues) => {
      const res = await productsApi.create({
        name: data.name,
        sku: data.sku || undefined,
        barcode: data.barcode || undefined,
        description: data.description || undefined,
        categoryId: data.categoryId ? Number(data.categoryId) : undefined,
        costPrice: data.costPrice,
        salePrice: data.salePrice,
        reorderLevel: data.reorderLevel,
      });
      if (!res.success) throw new Error(res.message || "Failed to create product");
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Product created successfully");
      router.push("/products");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to create product");
    },
  });

  const categories = categoriesResponse?.data ?? [];

  const onSubmit = (data: CreateProductFormValues) => {
    createMutation.mutate(data);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="New Product"
        description="Add a new product to your catalog"
      />

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="font-display">Product details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
                rows={4}
                {...register("description")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="categoryId">Category</Label>
              <Select
                value={categoryId}
                onValueChange={(v) => setValue("categoryId", v)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                    {categories.map((cat: CategoryDto) => (
                    <SelectItem key={cat.id} value={String(cat.id)}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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

            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Creating…" : "Create Product"}
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href="/products">Cancel</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
