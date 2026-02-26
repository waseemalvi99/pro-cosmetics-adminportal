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
import { deliveryMenApi } from "@/lib/api/delivery-men";
import type { UpdateDeliveryManRequest } from "@/types";

const updateDeliveryManSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().optional(),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  isAvailable: z.boolean(),
  isActive: z.boolean(),
});

type UpdateDeliveryManForm = z.infer<typeof updateDeliveryManSchema>;

export default function EditDeliveryManPage() {
  const router = useRouter();
  const params = useParams();
  const queryClient = useQueryClient();
  const id = Number(params.id);

  const { data: response, isLoading } = useQuery({
    queryKey: ["delivery-men", id],
    queryFn: () => deliveryMenApi.getById(id),
    enabled: !Number.isNaN(id),
  });

  const deliveryMan = response?.success && response?.data ? response.data : null;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<UpdateDeliveryManForm>({
    resolver: zodResolver(updateDeliveryManSchema),
    values: deliveryMan
      ? {
          name: deliveryMan.name,
          phone: deliveryMan.phone || "",
          email: deliveryMan.email || "",
          isAvailable: deliveryMan.isAvailable,
          isActive: deliveryMan.isActive,
        }
      : undefined,
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      isAvailable: true,
      isActive: true,
    },
  });

  const isAvailable = watch("isAvailable");
  const isActive = watch("isActive");

  const updateMutation = useMutation({
    mutationFn: async (data: UpdateDeliveryManRequest) => {
      const res = await deliveryMenApi.update(id, data);
      if (!res.success) throw new Error(res.message || "Failed to update delivery man");
      return res;
    },
    onSuccess: () => {
      toast.success("Delivery man updated", {
        description: "The delivery man has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["delivery-men"] });
      router.push("/delivery-men");
    },
    onError: (err: Error) => {
      toast.error("Update failed", { description: err.message });
    },
  });

  const onSubmit = (data: UpdateDeliveryManForm) => {
    updateMutation.mutate({
      name: data.name,
      phone: data.phone || undefined,
      email: data.email || undefined,
      isAvailable: data.isAvailable,
      isActive: data.isActive,
    });
  };

  if (Number.isNaN(id)) {
    return (
      <div className="space-y-6">
        <PageHeader title="Edit Delivery Man" description="Invalid delivery man ID" />
        <p className="text-destructive">Invalid delivery man ID.</p>
        <Button asChild variant="outline">
          <Link href="/delivery-men">Back to Delivery Men</Link>
        </Button>
      </div>
    );
  }

  if (isLoading || !deliveryMan) {
    return (
      <div className="space-y-6">
        <PageHeader title="Edit Delivery Man" description="Loading..." />
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
        title="Edit Delivery Man"
        description={`Edit ${deliveryMan.name}`}
      />

      <div className="max-w-2xl">
        <form onSubmit={handleSubmit(onSubmit)}>
          <Card>
            <CardHeader>
              <CardTitle className="font-display">Delivery man details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  placeholder="e.g. Omar Khaled"
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
                  placeholder="e.g. omar@company.com"
                  {...register("email")}
                  aria-invalid={!!errors.email}
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email.message}</p>
                )}
              </div>

              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label htmlFor="isAvailable" className="font-display">Available</Label>
                  <p className="text-sm text-muted-foreground">
                    When unavailable, this delivery man will not be assigned to new deliveries.
                  </p>
                </div>
                <Switch
                  id="isAvailable"
                  checked={isAvailable}
                  onCheckedChange={(checked) => setValue("isAvailable", checked)}
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label htmlFor="isActive" className="font-display">Active</Label>
                  <p className="text-sm text-muted-foreground">
                    When inactive, this delivery man will not appear in selection lists.
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
                <Link href="/delivery-men">Cancel</Link>
              </Button>
            </CardFooter>
          </Card>
        </form>
      </div>
    </div>
  );
}
