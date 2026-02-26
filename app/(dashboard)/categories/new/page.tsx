"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
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
import { categoriesApi } from "@/lib/api/categories";
import type { CreateCategoryRequest } from "@/types";

const createCategorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  parentCategoryId: z.number().nullable().optional(),
});

type CreateCategoryForm = z.infer<typeof createCategorySchema>;

export default function NewCategoryPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: categoriesResponse } = useQuery({
    queryKey: ["categories"],
    queryFn: () => categoriesApi.list(),
  });

  const categories = categoriesResponse?.success && categoriesResponse?.data
    ? categoriesResponse.data
    : [];

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreateCategoryForm>({
    resolver: zodResolver(createCategorySchema),
    defaultValues: {
      name: "",
      description: "",
      parentCategoryId: undefined,
    },
  });

  const parentCategoryId = watch("parentCategoryId");

  const createMutation = useMutation({
    mutationFn: async (data: CreateCategoryRequest) => {
      const res = await categoriesApi.create(data);
      if (!res.success) throw new Error(res.message || "Failed to create category");
      return res;
    },
    onSuccess: () => {
      toast.success("Category created", {
        description: "The category has been added successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      router.push("/categories");
    },
    onError: (err: Error) => {
      toast.error("Create failed", { description: err.message });
    },
  });

  const onSubmit = (data: CreateCategoryForm) => {
    createMutation.mutate({
      name: data.name,
      description: data.description || undefined,
      parentCategoryId: data.parentCategoryId ?? undefined,
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader title="New Category" description="Add a new product category" />

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
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id.toString()}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
            <CardFooter className="flex gap-3 border-t pt-6">
              <Button type="submit" disabled={isSubmitting || createMutation.isPending}>
                {(isSubmitting || createMutation.isPending) && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Create Category
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
