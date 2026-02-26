"use client";

import { Fragment, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ChevronDown, ChevronUp } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { inventoryApi } from "@/lib/api/inventory";
import type { InventoryDto } from "@/types";

const adjustSchema = z.object({
  quantity: z.coerce
    .number()
    .refine((v) => v !== 0, "Quantity must be positive (add) or negative (subtract)"),
  notes: z.string().optional(),
});

type AdjustFormValues = z.infer<typeof adjustSchema>;

function formatDate(dateStr: string | null) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function InventoryTable({
  items,
  isLoading,
  isLowStockTab,
  expandedProductId,
  onToggleExpand,
  onAdjustSuccess,
}: {
  items: InventoryDto[];
  isLoading: boolean;
  isLowStockTab: boolean;
  expandedProductId: number | null;
  onToggleExpand: (id: number | null) => void;
  onAdjustSuccess: () => void;
}) {
  const queryClient = useQueryClient();

  const adjustMutation = useMutation({
    mutationFn: async ({
      productId,
      data,
    }: {
      productId: number;
      data: AdjustFormValues;
    }) => {
      const res = await inventoryApi.adjust({
        productId,
        quantity: data.quantity,
        notes: data.notes,
      });
      if (!res.success) throw new Error(res.message || "Failed to adjust inventory");
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      queryClient.invalidateQueries({ queryKey: ["inventory", "low-stock"] });
      toast.success("Inventory adjusted successfully");
      onToggleExpand(null);
      onAdjustSuccess();
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to adjust inventory");
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4 p-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex gap-4">
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-20" />
          </div>
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="font-display text-lg font-medium text-muted-foreground">
          {isLowStockTab ? "No low stock items" : "No inventory items found"}
        </p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[40px]" />
          <TableHead>Product</TableHead>
          <TableHead>SKU</TableHead>
          <TableHead className="text-right">On Hand</TableHead>
          <TableHead className="text-right">Reserved</TableHead>
          <TableHead className="text-right">Available</TableHead>
          <TableHead className="text-right">Reorder Level</TableHead>
          <TableHead>Last Restocked</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="w-[100px]">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => (
          <Fragment key={item.productId}>
            <TableRow
              key={item.productId}
              className={isLowStockTab && item.isLowStock ? "bg-amber-50 dark:bg-amber-950/20" : ""}
            >
              <TableCell className="w-[40px] p-1">
                {expandedProductId === item.productId ? (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => onToggleExpand(null)}
                  >
                    <ChevronUp className="h-4 w-4" />
                  </Button>
                ) : null}
              </TableCell>
              <TableCell className="font-medium">{item.productName}</TableCell>
              <TableCell className="text-muted-foreground">{item.sku || "—"}</TableCell>
              <TableCell className="text-right">{item.quantityOnHand}</TableCell>
              <TableCell className="text-right">{item.quantityReserved}</TableCell>
              <TableCell className="text-right">{item.availableQuantity}</TableCell>
              <TableCell className="text-right">{item.reorderLevel}</TableCell>
              <TableCell>{formatDate(item.lastRestockedAt)}</TableCell>
              <TableCell>
                {item.isLowStock ? (
                  <Badge variant="outline" className="border-amber-500/50 bg-amber-500/10 text-amber-700 dark:text-amber-400">
                    Low Stock
                  </Badge>
                ) : (
                  <Badge variant="secondary">OK</Badge>
                )}
              </TableCell>
              <TableCell>
                {expandedProductId === item.productId ? null : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onToggleExpand(item.productId)}
                  >
                    Adjust
                  </Button>
                )}
              </TableCell>
            </TableRow>
            {expandedProductId === item.productId && (
              <TableRow>
                <TableCell colSpan={10} className="bg-muted/30 p-4">
                  <AdjustForm
                    productId={item.productId}
                    onCancel={() => onToggleExpand(null)}
                    onSubmit={(data) =>
                      adjustMutation.mutate({ productId: item.productId, data })
                    }
                    isPending={adjustMutation.isPending}
                  />
                </TableCell>
              </TableRow>
            )}
          </Fragment>
        ))}
      </TableBody>
    </Table>
  );
}

function AdjustForm({
  productId,
  onCancel,
  onSubmit,
  isPending,
}: {
  productId: number;
  onCancel: () => void;
  onSubmit: (data: AdjustFormValues) => void;
  isPending: boolean;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AdjustFormValues>({
    resolver: zodResolver(adjustSchema),
    defaultValues: { quantity: 0, notes: "" },
  });

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-wrap items-end gap-4 rounded-lg border bg-background p-4"
    >
      <div className="min-w-[200px]">
        <label className="mb-1 block text-sm font-medium">Quantity</label>
        <Input
          type="number"
          placeholder="+10 or -5"
          {...register("quantity")}
          className={errors.quantity ? "border-destructive" : ""}
        />
        {errors.quantity && (
          <p className="mt-1 text-xs text-destructive">{errors.quantity.message}</p>
        )}
      </div>
      <div className="min-w-[200px] flex-1">
        <label className="mb-1 block text-sm font-medium">Notes (optional)</label>
        <Input placeholder="Restock reason..." {...register("notes")} />
      </div>
      <div className="flex gap-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Applying…" : "Apply"}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

export default function InventoryPage() {
  const [expandedProductId, setExpandedProductId] = useState<number | null>(null);

  const { data: allResponse, isLoading: allLoading } = useQuery({
    queryKey: ["inventory"],
    queryFn: () => inventoryApi.list(),
  });

  const { data: lowResponse, isLoading: lowLoading } = useQuery({
    queryKey: ["inventory", "low-stock"],
    queryFn: () => inventoryApi.lowStock(),
  });

  const allItems = allResponse?.success && allResponse?.data ? allResponse.data : [];
  const lowItems = lowResponse?.success && lowResponse?.data ? lowResponse.data : [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inventory"
        description="Monitor stock levels and adjust inventory"
      />

      <Card>
        <CardContent className="p-0">
          <Tabs defaultValue="all">
            <TabsList className="m-4 mb-0">
              <TabsTrigger value="all">All Stock</TabsTrigger>
              <TabsTrigger value="low">Low Stock</TabsTrigger>
            </TabsList>
            <TabsContent value="all" className="mt-0">
              <InventoryTable
                items={allItems}
                isLoading={allLoading}
                isLowStockTab={false}
                expandedProductId={expandedProductId}
                onToggleExpand={setExpandedProductId}
                onAdjustSuccess={() => setExpandedProductId(null)}
              />
            </TabsContent>
            <TabsContent value="low" className="mt-0">
              <InventoryTable
                items={lowItems}
                isLoading={lowLoading}
                isLowStockTab={true}
                expandedProductId={expandedProductId}
                onToggleExpand={setExpandedProductId}
                onAdjustSuccess={() => setExpandedProductId(null)}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
