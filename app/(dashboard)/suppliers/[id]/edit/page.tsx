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
import { suppliersApi } from "@/lib/api/suppliers";

const editSupplierSchema = z.object({
  name: z.string().min(1, "Name is required"),
  contactPerson: z.string().optional(),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
  paymentTermDays: z.coerce.number().min(0).optional(),
  isActive: z.boolean(),
});

type EditSupplierForm = z.infer<typeof editSupplierSchema>;

export default function EditSupplierPage() {
  const router = useRouter();
  const params = useParams();
  const queryClient = useQueryClient();
  const id = Number(params.id);

  const { data: response, isLoading } = useQuery({
    queryKey: ["suppliers", id],
    queryFn: () => suppliersApi.getById(id),
    enabled: !Number.isNaN(id),
  });

  const supplier = response?.success && response?.data ? response.data : null;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<EditSupplierForm>({
    resolver: zodResolver(editSupplierSchema),
    values: supplier
      ? {
          name: supplier.name,
          contactPerson: supplier.contactPerson || "",
          email: supplier.email || "",
          phone: supplier.phone || "",
          address: supplier.address || "",
          notes: supplier.notes || "",
          paymentTermDays: supplier.paymentTermDays ?? 0,
          isActive: supplier.isActive,
        }
      : undefined,
    defaultValues: {
      name: "",
      contactPerson: "",
      email: "",
      phone: "",
      address: "",
      notes: "",
      paymentTermDays: 0,
      isActive: true,
    },
  });

  const isActive = watch("isActive");

  const updateMutation = useMutation({
    mutationFn: (data: EditSupplierForm) =>
      suppliersApi.update(id, {
        name: data.name,
        contactPerson: data.contactPerson || undefined,
        email: data.email || undefined,
        phone: data.phone || undefined,
        address: data.address || undefined,
        notes: data.notes || undefined,
        paymentTermDays: data.paymentTermDays || 0,
        isActive: data.isActive,
      }),
    onSuccess: () => {
      toast.success("Supplier updated", {
        description: "The supplier has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      router.push("/suppliers");
    },
    onError: (err: unknown) => {
      const message =
        err && typeof err === "object" && "message" in err
          ? String((err as { message: string }).message)
          : "Failed to update supplier. Please try again.";
      toast.error("Update failed", { description: message });
    },
  });

  const onSubmit = (data: EditSupplierForm) => {
    updateMutation.mutate(data);
  };

  if (Number.isNaN(id)) {
    return (
      <div className="space-y-6">
        <PageHeader title="Edit Supplier" description="Invalid supplier ID" />
      </div>
    );
  }

  if (isLoading || !supplier) {
    return (
      <div className="space-y-6">
        <PageHeader title="Edit Supplier" description="Loading..." />
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
      <PageHeader title="Edit Supplier" description={`Editing ${supplier.name}`} />

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="font-display">Supplier details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input id="name" {...register("name")} placeholder="Pharma Corp" />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="contactPerson">Contact Person</Label>
              <Input
                id="contactPerson"
                {...register("contactPerson")}
                placeholder="Ali Hassan"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                {...register("email")}
                placeholder="ali@pharmacorp.com"
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" {...register("phone")} placeholder="+201001234567" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                {...register("address")}
                placeholder="10 Industrial Zone"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                {...register("notes")}
                placeholder="Main distributor"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="paymentTermDays">Payment Term Days</Label>
              <Input
                id="paymentTermDays"
                type="number"
                min="0"
                {...register("paymentTermDays")}
                placeholder="0"
              />
              <p className="text-xs text-muted-foreground">
                Default payment terms in days for POs from this supplier (0 = due on receipt)
              </p>
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
                onClick={() => router.push("/suppliers")}
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
