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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { deliveriesApi } from "@/lib/api/deliveries";
import { salesApi } from "@/lib/api/sales";
import { deliveryMenApi } from "@/lib/api/delivery-men";
import type { SaleDto, DeliveryManDto } from "@/types";

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
    queryFn: () => salesApi.list({ pageSize: 100 }),
  });

  const { data: deliveryMenResponse } = useQuery({
    queryKey: ["delivery-men", "create-delivery"],
    queryFn: () => deliveryMenApi.list({ pageSize: 100 }),
  });

  const sales: SaleDto[] =
    salesResponse?.success && salesResponse?.data ? salesResponse.data.items : [];
  const deliveryMen: DeliveryManDto[] =
    deliveryMenResponse?.success && deliveryMenResponse?.data
      ? deliveryMenResponse.data.items
      : [];

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
                <Select value={saleId} onValueChange={(v) => setValue("saleId", v)}>
                  <SelectTrigger id="saleId" className="w-full" aria-invalid={!!errors.saleId}>
                    <SelectValue placeholder="Select sale" />
                  </SelectTrigger>
                  <SelectContent>
                    {sales.map((sale) => (
                      <SelectItem key={sale.id} value={String(sale.id)}>
                        {sale.saleNumber} — {sale.customerName ?? "No customer"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.saleId && (
                  <p className="text-sm text-destructive">{errors.saleId.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="deliveryManId">Delivery Man</Label>
                <Select
                  value={deliveryManId || "none"}
                  onValueChange={(v) => setValue("deliveryManId", v === "none" ? "" : v)}
                >
                  <SelectTrigger id="deliveryManId" className="w-full">
                    <SelectValue placeholder="Select delivery man (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {deliveryMen.map((dm) => (
                      <SelectItem key={dm.id} value={String(dm.id)}>
                        {dm.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
