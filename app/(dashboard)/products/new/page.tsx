"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Upload, X, ImageIcon } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SearchableCombobox } from "@/components/ui/searchable-combobox";
import { productsApi } from "@/lib/api/products";
import { useCategoryCombo } from "@/hooks/use-combo-search";
import { cn } from "@/lib/utils";

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

interface StagedFile {
  file: File;
  preview: string;
}

function validateFile(file: File): string | null {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return `${file.name}: Invalid type. Accepted: JPG, PNG, GIF, WebP, BMP, TIFF`;
  }
  if (file.size > MAX_SIZE) {
    return `${file.name}: Too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Max: 10 MB`;
  }
  return null;
}

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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [stagedFiles, setStagedFiles] = useState<StagedFile[]>([]);

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
  const categoryCombo = useCategoryCombo();

  const handleAddFiles = useCallback(
    (files: FileList | File[]) => {
      const fileArray = Array.from(files);
      const remaining = MAX_IMAGES - stagedFiles.length;

      if (remaining <= 0) {
        toast.error(`Maximum of ${MAX_IMAGES} images allowed`);
        return;
      }

      const toAdd = fileArray.slice(0, remaining);
      if (fileArray.length > remaining) {
        toast.warning(
          `Only ${remaining} more image(s) allowed. ${fileArray.length - remaining} file(s) skipped.`
        );
      }

      const validFiles: StagedFile[] = [];
      for (const file of toAdd) {
        const err = validateFile(file);
        if (err) {
          toast.error(err);
        } else {
          validFiles.push({ file, preview: URL.createObjectURL(file) });
        }
      }

      if (validFiles.length > 0) {
        setStagedFiles((prev) => [...prev, ...validFiles]);
      }
    },
    [stagedFiles.length]
  );

  const removeStaged = useCallback((index: number) => {
    setStagedFiles((prev) => {
      const removed = prev[index];
      if (removed) URL.revokeObjectURL(removed.preview);
      return prev.filter((_, i) => i !== index);
    });
  }, []);

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
        handleAddFiles(e.dataTransfer.files);
      }
    },
    [handleAddFiles]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        handleAddFiles(e.target.files);
        e.target.value = "";
      }
    },
    [handleAddFiles]
  );

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

      const productId = res.data;

      if (productId && stagedFiles.length > 0) {
        const formData = new FormData();
        if (stagedFiles.length === 1) {
          formData.append("file", stagedFiles[0].file);
          await productsApi.uploadImage(productId, formData);
        } else {
          for (const sf of stagedFiles) {
            formData.append("files", sf.file);
          }
          await productsApi.uploadImagesBulk(productId, formData);
        }
      }

      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Product created successfully");
      stagedFiles.forEach((sf) => URL.revokeObjectURL(sf.preview));
      router.push("/products");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to create product");
    },
  });

  const onSubmit = (data: CreateProductFormValues) => {
    createMutation.mutate(data);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="New Product"
        description="Add a new product to your catalog"
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <form onSubmit={handleSubmit(onSubmit)} id="create-product-form">
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
            </CardContent>
            <CardFooter className="flex gap-3 border-t pt-6">
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {stagedFiles.length > 0 ? "Creating & uploading…" : "Creating…"}
                  </>
                ) : (
                  "Create Product"
                )}
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href="/products">Cancel</Link>
              </Button>
            </CardFooter>
          </Card>
        </form>

        <div className="lg:sticky lg:top-6 lg:self-start">
          <Card>
            <CardHeader>
              <CardTitle className="font-display">Images</CardTitle>
              <p className="text-xs text-muted-foreground">
                {stagedFiles.length}/{MAX_IMAGES} images
                {stagedFiles.length > 0 && " — will upload on create"}
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {stagedFiles.length < MAX_IMAGES && (
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
                  <Upload className="h-8 w-8 text-muted-foreground" />
                  <p className="mt-2 text-sm font-medium">
                    Drop images here or click to browse
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

              {stagedFiles.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-8 text-center">
                  <ImageIcon className="h-10 w-10 text-muted-foreground/50" />
                  <p className="mt-2 text-sm text-muted-foreground">
                    No images yet. Add images before or after creating.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {stagedFiles.map((sf, index) => (
                    <div
                      key={sf.preview}
                      className="group relative aspect-square overflow-hidden rounded-lg border bg-muted"
                    >
                      <img
                        src={sf.preview}
                        alt={sf.file.name}
                        className="h-full w-full object-cover"
                      />
                      {index === 0 && (
                        <div className="absolute left-1.5 top-1.5 rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-semibold text-white shadow">
                          Primary
                        </div>
                      )}
                      <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100">
                        <div className="flex w-full items-center justify-end p-2">
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={() => removeStaged(index)}
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
