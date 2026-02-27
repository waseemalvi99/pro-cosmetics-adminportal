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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SearchableCombobox } from "@/components/ui/searchable-combobox";
import type { ComboboxOption } from "@/components/ui/searchable-combobox";
import { deliveriesApi } from "@/lib/api/deliveries";
import { salesApi } from "@/lib/api/sales";
import { useDeliveryManCombo } from "@/hooks/use-combo-search";
import type { SaleDto } from "@/types";

const createDeliverySchema = z.object({
  saleId: z.string().min(1, "Sale is required"),
  deliveryManId: z.string().optional(),
  deliveryAddress: z.string().optional(),
  notes: z.string().optional(),
});

type CreateDeliveryForm = z.infer<typeof createDeliverySchema>;

export default function NewDeliveryPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateDeliveryForm>({
    resolver: zodResolver(createDeliverySchema),
    defaultValues: {
      saleId: "",
      deliveryManId: "",
      deliveryAddress: "",
      notes: "",
    },
  });

  const saleId = watch("saleId");
  const deliveryManId = watch("deliveryManId");

  const { data: salesResponse } = useQuery({
    queryKey: ["sales", "create-delivery"],
    queryFn: () => salesApi.list({ pageSize: 50 }),
  });
  const salesOptions: ComboboxOption[] =
    salesResponse?.success && salesResponse?.data
      ? salesResponse.data.items.map((sale: SaleDto) => ({
          value: String(sale.id),
          label: `${sale.saleNumber} — ${sale.customerName ?? "No customer"}`,
        }))
      : [];

  const deliveryManCombo = useDeliveryManCombo();

  const createMutation = useMutation({
    mutationFn: async (data: CreateDeliveryForm) => {
      const res = await deliveriesApi.create({
        saleId: Number(data.saleId),
        deliveryManId: data.deliveryManId ? Number(data.deliveryManId) : undefined,
        deliveryAddress: data.deliveryAddress || undefined,
        notes: data.notes || undefined,
      });
      if (!res.success) throw new Error(res.message || "Failed to create delivery");
      return res;
    },
    onSuccess: () => {
      toast.success("Delivery created", {
        description: "The delivery has been created successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["deliveries"] });
      router.push("/deliveries");
    },
    onError: (err: Error) => {
      toast.error("Create failed", { description: err.message });
    },
  });

  const onSubmit = (data: CreateDeliveryForm) => {
    createMutation.mutate(data);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="New Delivery"
        description="Create a new delivery assignment"
      />

      <div className="max-w-2xl">
        <form onSubmit={handleSubmit(onSubmit)}>
          <Card>
            <CardHeader>
              <CardTitle className="font-display">Delivery details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="saleId">Sale *</Label>
                <SearchableCombobox
                  options={salesOptions}
                  value={saleId}
                  onValueChange={(v) => setValue("saleId", v)}
                  placeholder="Select sale"
                  searchPlaceholder="Search sales..."
                  emptyMessage="No sales found."
                />
                {errors.saleId && (
                  <p className="text-sm text-destructive">{errors.saleId.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="deliveryManId">Delivery Man</Label>
                <SearchableCombobox
                  options={deliveryManCombo.options}
                  value={deliveryManId || ""}
                  onValueChange={(v) => setValue("deliveryManId", v)}
                  onSearchChange={deliveryManCombo.setSearch}
                  isLoading={deliveryManCombo.isLoading}
                  placeholder="Select delivery man (optional)"
                  searchPlaceholder="Search delivery men..."
                  emptyMessage="No delivery men found."
                  clearable
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="deliveryAddress">Delivery Address</Label>
                <Textarea
                  id="deliveryAddress"
                  placeholder="Enter delivery address"
                  rows={3}
                  {...register("deliveryAddress")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Additional notes"
                  rows={3}
                  {...register("notes")}
                />
              </div>
            </CardContent>
            <CardFooter className="flex gap-3 border-t pt-6">
              <Button
                type="submit"
                disabled={createMutation.isPending}
              >
                {createMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Create Delivery
              </Button>
              <Button variant="outline" asChild>
                <Link href="/deliveries">Cancel</Link>
              </Button>
            </CardFooter>
          </Card>
        </form>
      </div>
    </div>
  );
}
