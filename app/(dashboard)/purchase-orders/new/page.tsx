"use client";

import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { purchaseOrdersApi } from "@/lib/api/purchase-orders";
import { suppliersApi } from "@/lib/api/suppliers";
import { productsApi } from "@/lib/api/products";
import type { SupplierDto, ProductDto } from "@/types";
import { formatCurrency } from "@/lib/utils";

const itemSchema = z.object({
  productId: z.string().min(1, "Product is required"),
  quantity: z.coerce.number().min(1, "Quantity must be at least 1"),
  unitPrice: z.coerce.number().min(0, "Unit price must be 0 or greater"),
});

const createOrderSchema = z.object({
  supplierId: z.string().min(1, "Supplier is required"),
  expectedDeliveryDate: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(itemSchema).min(1, "Add at least one item"),
});

type CreateOrderForm = z.infer<typeof createOrderSchema>;

export default function NewPurchaseOrderPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateOrderForm>({
    resolver: zodResolver(createOrderSchema),
    defaultValues: {
      supplierId: "",
      expectedDeliveryDate: "",
      notes: "",
      items: [{ productId: "", quantity: 1, unitPrice: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  const items = watch("items");
  const totalAmount = items.reduce(
    (sum, item) => sum + (item.quantity || 0) * (item.unitPrice || 0),
    0
  );

  const { data: suppliersResponse } = useQuery({
    queryKey: ["suppliers", "all"],
    queryFn: () => suppliersApi.list({ page: 1, pageSize: 500 }),
  });

  const { data: productsResponse } = useQuery({
    queryKey: ["products", "all"],
    queryFn: () => productsApi.list({ page: 1, pageSize: 500 }),
  });

  const suppliers =
    suppliersResponse?.success && suppliersResponse?.data
      ? suppliersResponse.data.items
      : [];
  const products =
    productsResponse?.success && productsResponse?.data
      ? productsResponse.data.items
      : [];

  const createMutation = useMutation({
    mutationFn: (data: CreateOrderForm) =>
      purchaseOrdersApi.create({
        supplierId: Number(data.supplierId),
        expectedDeliveryDate: data.expectedDeliveryDate || undefined,
        notes: data.notes || undefined,
        items: data.items.map((item) => ({
          productId: Number(item.productId),
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
      toast.success("Purchase order created", {
        description: "The order has been created as Draft.",
      });
      router.push("/purchase-orders");
    },
    onError: (err: unknown) => {
      const message =
        err && typeof err === "object" && "message" in err
          ? String((err as { message: string }).message)
          : "Failed to create order. Please try again.";
      toast.error("Create failed", { description: message });
    },
  });

  const onSubmit = (data: CreateOrderForm) => {
    createMutation.mutate(data);
  };

  return (
    <div className="space-y-6">
      <PageHeader title="New Purchase Order" description="Create a new purchase order" />

      <Card className="max-w-3xl">
        <CardHeader>
          <CardTitle className="font-display">Order details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="supplierId">Supplier *</Label>
              <Select
                value={watch("supplierId")}
                onValueChange={(v) => setValue("supplierId", v)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select supplier" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map((s: SupplierDto) => (
                    <SelectItem key={s.id} value={String(s.id)}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.supplierId && (
                <p className="text-sm text-destructive">
                  {errors.supplierId.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="expectedDeliveryDate">Expected delivery date</Label>
              <Input
                id="expectedDeliveryDate"
                type="date"
                {...register("expectedDeliveryDate")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                {...register("notes")}
                placeholder="Order notes..."
                rows={3}
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="font-display">Items</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => append({ productId: "", quantity: 1, unitPrice: 0 })}
                >
                  <Plus className="h-4 w-4" />
                  Add Item
                </Button>
              </div>

              <div className="space-y-3">
                {fields.map((field, index) => (
                  <div
                    key={field.id}
                    className="flex flex-wrap items-end gap-3 rounded-lg border p-3"
                  >
                    <div className="flex-1 min-w-[180px] space-y-2">
                      <Label>Product</Label>
                      <Select
                        value={watch(`items.${index}.productId`)}
                        onValueChange={(v) =>
                          setValue(`items.${index}.productId`, v)
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select product" />
                        </SelectTrigger>
                        <SelectContent>
                          {products.map((p: ProductDto) => (
                            <SelectItem key={p.id} value={String(p.id)}>
                              {p.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.items?.[index]?.productId && (
                        <p className="text-sm text-destructive">
                          {errors.items[index]?.productId?.message}
                        </p>
                      )}
                    </div>
                    <div className="w-24 space-y-2">
                      <Label>Qty</Label>
                      <Input
                        type="number"
                        min="1"
                        {...register(`items.${index}.quantity`)}
                      />
                      {errors.items?.[index]?.quantity && (
                        <p className="text-sm text-destructive">
                          {errors.items[index]?.quantity?.message}
                        </p>
                      )}
                    </div>
                    <div className="w-28 space-y-2">
                      <Label>Unit Price</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        {...register(`items.${index}.unitPrice`)}
                      />
                      {errors.items?.[index]?.unitPrice && (
                        <p className="text-sm text-destructive">
                          {errors.items[index]?.unitPrice?.message}
                        </p>
                      )}
                    </div>
                    <div className="w-24 text-right">
                      <Label className="text-muted-foreground">Total</Label>
                      <p className="font-medium">
                        {formatCurrency(
                          (items[index]?.quantity || 0) *
                            (items[index]?.unitPrice || 0)
                        )}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => remove(index)}
                      disabled={fields.length === 1}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                      <span className="sr-only">Remove</span>
                    </Button>
                  </div>
                ))}
              </div>

              {errors.items?.root && (
                <p className="text-sm text-destructive">
                  {errors.items.root.message}
                </p>
              )}

              <div className="flex justify-end border-t pt-4">
                <p className="font-display text-lg font-semibold">
                  Total: {formatCurrency(totalAmount)}
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Order"
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/purchase-orders")}
                disabled={createMutation.isPending}
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
