"use client";

import { useRouter, useParams } from "next/navigation";
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
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { salesmenApi } from "@/lib/api/salesmen";
import type { UpdateSalesmanRequest } from "@/types";

const updateSalesmanSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().optional(),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  commissionRate: z
    .number({ invalid_type_error: "Commission rate is required" })
    .min(0, "Commission rate must be at least 0")
    .max(100, "Commission rate must be at most 100"),
  isActive: z.boolean(),
});

type UpdateSalesmanForm = z.infer<typeof updateSalesmanSchema>;

export default function EditSalesmanPage() {
  const router = useRouter();
  const params = useParams();
  const queryClient = useQueryClient();
  const id = Number(params.id);

  const { data: response, isLoading } = useQuery({
    queryKey: ["salesmen", id],
    queryFn: () => salesmenApi.getById(id),
    enabled: !Number.isNaN(id),
  });

  const salesman = response?.success && response?.data ? response.data : null;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<UpdateSalesmanForm>({
    resolver: zodResolver(updateSalesmanSchema),
    values: salesman
      ? {
          name: salesman.name,
          phone: salesman.phone || "",
          email: salesman.email || "",
          commissionRate: salesman.commissionRate,
          isActive: salesman.isActive,
        }
      : undefined,
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      commissionRate: 0,
      isActive: true,
    },
  });

  const isActive = watch("isActive");

  const updateMutation = useMutation({
    mutationFn: async (data: UpdateSalesmanRequest) => {
      const res = await salesmenApi.update(id, data);
      if (!res.success) throw new Error(res.message || "Failed to update salesman");
      return res;
    },
    onSuccess: () => {
      toast.success("Salesman updated", {
        description: "The salesman has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["salesmen"] });
      router.push("/salesmen");
    },
    onError: (err: Error) => {
      toast.error("Update failed", { description: err.message });
    },
  });

  const onSubmit = (data: UpdateSalesmanForm) => {
    updateMutation.mutate({
      name: data.name,
      phone: data.phone || undefined,
      email: data.email || undefined,
      commissionRate: data.commissionRate,
      isActive: data.isActive,
    });
  };

  if (Number.isNaN(id)) {
    return (
      <div className="space-y-6">
        <PageHeader title="Edit Salesman" description="Invalid salesman ID" />
        <p className="text-destructive">Invalid salesman ID.</p>
        <Button asChild variant="outline">
          <Link href="/salesmen">Back to Salesmen</Link>
        </Button>
      </div>
    );
  }

  if (isLoading || !salesman) {
    return (
      <div className="space-y-6">
        <PageHeader title="Edit Salesman" description="Loading..." />
        <div className="max-w-2xl">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent className="space-y-6">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Edit Salesman"
        description={`Edit ${salesman.name}`}
      />

      <div className="max-w-2xl">
        <form onSubmit={handleSubmit(onSubmit)}>
          <Card>
            <CardHeader>
              <CardTitle className="font-display">Salesman details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  placeholder="e.g. Ahmed Salah"
                  {...register("name")}
                  aria-invalid={!!errors.name}
                />
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  placeholder="e.g. +201001234567"
                  {...register("phone")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="e.g. ahmed@company.com"
                  {...register("email")}
                  aria-invalid={!!errors.email}
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="commissionRate">Commission Rate (%)</Label>
                <Input
                  id="commissionRate"
                  type="number"
                  min={0}
                  max={100}
                  step={0.01}
                  placeholder="e.g. 5"
                  {...register("commissionRate", { valueAsNumber: true })}
                  aria-invalid={!!errors.commissionRate}
                />
                {errors.commissionRate && (
                  <p className="text-sm text-destructive">{errors.commissionRate.message}</p>
                )}
              </div>

              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label htmlFor="isActive" className="font-display">Active</Label>
                  <p className="text-sm text-muted-foreground">
                    When inactive, this salesman will not appear in selection lists.
                  </p>
                </div>
                <Switch
                  id="isActive"
                  checked={isActive}
                  onCheckedChange={(checked) => setValue("isActive", checked)}
                />
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
                <Link href="/salesmen">Cancel</Link>
              </Button>
            </CardFooter>
          </Card>
        </form>
      </div>
    </div>
  );
}
