"use client";

import { useRouter, useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { customersApi } from "@/lib/api/customers";

const editCustomerSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  notes: z.string().optional(),
  creditDays: z.coerce.number().min(0).optional(),
  creditLimit: z.coerce.number().min(0).optional(),
  isActive: z.boolean(),
});

type EditCustomerForm = z.infer<typeof editCustomerSchema>;

export default function EditCustomerPage() {
  const router = useRouter();
  const params = useParams();
  const queryClient = useQueryClient();
  const id = Number(params.id);

  const { data: response, isLoading } = useQuery({
    queryKey: ["customers", id],
    queryFn: () => customersApi.getById(id),
    enabled: !Number.isNaN(id),
  });

  const customer = response?.success && response?.data ? response.data : null;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<EditCustomerForm>({
    resolver: zodResolver(editCustomerSchema),
    values: customer
      ? {
          fullName: customer.fullName,
          email: customer.email || "",
          phone: customer.phone || "",
          address: customer.address || "",
          city: customer.city || "",
          notes: customer.notes || "",
          creditDays: customer.creditDays ?? 0,
          creditLimit: customer.creditLimit ?? 0,
          isActive: customer.isActive,
        }
      : undefined,
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      notes: "",
      creditDays: 0,
      creditLimit: 0,
      isActive: true,
    },
  });

  const isActive = watch("isActive");

  const updateMutation = useMutation({
    mutationFn: (data: EditCustomerForm) =>
      customersApi.update(id, {
        fullName: data.fullName,
        email: data.email || undefined,
        phone: data.phone || undefined,
        address: data.address || undefined,
        city: data.city || undefined,
        notes: data.notes || undefined,
        creditDays: data.creditDays || 0,
        creditLimit: data.creditLimit || 0,
        isActive: data.isActive,
      }),
    onSuccess: () => {
      toast.success("Customer updated", {
        description: "The customer has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      router.push("/customers");
    },
    onError: (err: unknown) => {
      const message =
        err && typeof err === "object" && "message" in err
          ? String((err as { message: string }).message)
          : "Failed to update customer. Please try again.";
      toast.error("Update failed", { description: message });
    },
  });

  const onSubmit = (data: EditCustomerForm) => {
    updateMutation.mutate(data);
  };

  if (Number.isNaN(id)) {
    return (
      <div className="space-y-6">
        <PageHeader title="Edit Customer" description="Invalid customer ID" />
      </div>
    );
  }

  if (isLoading || !customer) {
    return (
      <div className="space-y-6">
        <PageHeader title="Edit Customer" description="Loading..." />
        <Card className="max-w-2xl">
          <CardContent className="p-6">
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Edit Customer" description={`Editing ${customer.fullName}`} />

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="font-display">Customer details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name *</Label>
              <Input id="fullName" {...register("fullName")} placeholder="John Doe" />
              {errors.fullName && (
                <p className="text-sm text-destructive">{errors.fullName.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                {...register("email")}
                placeholder="john@example.com"
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" {...register("phone")} placeholder="+1234567890" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                {...register("address")}
                placeholder="123 Main St"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input id="city" {...register("city")} placeholder="Cairo" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                {...register("notes")}
                placeholder="Additional notes..."
                rows={3}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="creditDays">Credit Days</Label>
                <Input
                  id="creditDays"
                  type="number"
                  min="0"
                  {...register("creditDays")}
                  placeholder="0"
                />
                <p className="text-xs text-muted-foreground">
                  Days before payment is due (0 = no credit)
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="creditLimit">Credit Limit (QAR)</Label>
                <Input
                  id="creditLimit"
                  type="number"
                  min="0"
                  step="0.01"
                  {...register("creditLimit")}
                  placeholder="0.00"
                />
                <p className="text-xs text-muted-foreground">
                  Max outstanding balance (0 = no limit)
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={isActive}
                onCheckedChange={(checked) => setValue("isActive", checked)}
              />
              <Label htmlFor="isActive">Active</Label>
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/customers")}
                disabled={updateMutation.isPending}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
