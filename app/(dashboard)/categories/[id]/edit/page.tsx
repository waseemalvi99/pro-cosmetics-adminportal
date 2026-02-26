"use client";

import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Skeleton } from "@/components/ui/skeleton";
import { categoriesApi } from "@/lib/api/categories";
import type { UpdateCategoryRequest } from "@/types";

const updateCategorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  parentCategoryId: z.number().nullable().optional(),
});

type UpdateCategoryForm = z.infer<typeof updateCategorySchema>;

export default function EditCategoryPage() {
  const router = useRouter();
  const params = useParams();
  const queryClient = useQueryClient();
  const id = params.id ? Number(params.id) : NaN;

  const { data: categoryResponse, isLoading: categoryLoading } = useQuery({
    queryKey: ["categories", id],
    queryFn: () => categoriesApi.getById(id),
    enabled: !isNaN(id),
  });

  const { data: categoriesResponse } = useQuery({
    queryKey: ["categories"],
    queryFn: () => categoriesApi.list(),
  });

  const category =
    categoryResponse?.success && categoryResponse?.data ? categoryResponse.data : null;
  const categoryError = categoryResponse && !categoryResponse.success;
  const categories =
    categoriesResponse?.success && categoriesResponse?.data ? categoriesResponse.data : [];
  const parentOptions = categories.filter((c) => c.id !== id);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UpdateCategoryForm>({
    resolver: zodResolver(updateCategorySchema),
    defaultValues: {
      name: "",
      description: "",
      parentCategoryId: undefined,
    },
  });

  const parentCategoryId = watch("parentCategoryId");

  useEffect(() => {
    if (category) {
      reset({
        name: category.name,
        description: category.description ?? "",
        parentCategoryId: category.parentCategoryId ?? undefined,
      });
    }
  }, [category, reset]);

  const updateMutation = useMutation({
    mutationFn: async (data: UpdateCategoryRequest) => {
      const res = await categoriesApi.update(id, data);
      if (!res.success) throw new Error(res.message || "Failed to update category");
      return res;
    },
    onSuccess: () => {
      toast.success("Category updated", {
        description: "The category has been saved successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["categories", id] });
      router.push("/categories");
    },
    onError: (err: Error) => {
      toast.error("Update failed", { description: err.message });
    },
  });

  const onSubmit = (data: UpdateCategoryForm) => {
    updateMutation.mutate({
      name: data.name,
      description: data.description || undefined,
      parentCategoryId: data.parentCategoryId ?? undefined,
    });
  };

  if (categoryLoading || (!category && !categoryError)) {
    return (
      <div className="space-y-6">
        <PageHeader title="Edit Category" description="Update category details" />
        <div className="max-w-2xl">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-40" />
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-9 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-24 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-9 w-full" />
              </div>
            </CardContent>
            <CardFooter>
              <Skeleton className="h-9 w-32" />
            </CardFooter>
          </Card>
        </div>
      </div>
    );
  }

  if (categoryError || !category) {
    return (
      <div className="space-y-6">
        <PageHeader title="Edit Category" description="Update category details" />
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <p className="font-display text-lg font-semibold text-muted-foreground">
              Category not found
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              The category you&apos;re looking for doesn&apos;t exist or has been removed.
            </p>
            <Button asChild className="mt-4">
              <Link href="/categories">Back to Categories</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Edit Category" description="Update category details" />

      <div className="max-w-2xl">
        <form onSubmit={handleSubmit(onSubmit)}>
          <Card>
            <CardHeader>
              <CardTitle className="font-display">Category details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  placeholder="e.g. Skincare"
                  {...register("name")}
                  aria-invalid={!!errors.name}
                />
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Optional description for this category"
                  rows={4}
                  className="resize-none"
                  {...register("description")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="parentCategoryId">Parent Category</Label>
                <Select
                  value={parentCategoryId != null ? parentCategoryId.toString() : "none"}
                  onValueChange={(v) =>
                    setValue("parentCategoryId", v === "none" ? undefined : Number(v))
                  }
                >
                  <SelectTrigger id="parentCategoryId" className="w-full">
                    <SelectValue placeholder="None (top-level category)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None (top-level category)</SelectItem>
                    {parentOptions.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id.toString()}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
            <CardFooter className="flex gap-3 border-t pt-6">
              <Button type="submit" disabled={isSubmitting || updateMutation.isPending}>
                {(isSubmitting || updateMutation.isPending) && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Save Changes
              </Button>
              <Button variant="outline" asChild>
                <Link href="/categories">Cancel</Link>
              </Button>
            </CardFooter>
          </Card>
        </form>
      </div>
    </div>
  );
}
