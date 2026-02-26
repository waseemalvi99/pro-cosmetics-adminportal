"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, ArrowLeft, Send, XCircle, PackageCheck } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { purchaseOrdersApi } from "@/lib/api/purchase-orders";
import type { PurchaseOrderItemDto } from "@/types";
import { formatCurrency } from "@/lib/utils";

const STATUS_BADGE_CLASSES: Record<string, string> = {
  Draft: "bg-muted text-muted-foreground",
  Submitted: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
  PartiallyReceived: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  Received: "bg-green-500/15 text-green-600 dark:text-green-400",
  Cancelled: "bg-red-500/15 text-red-600 dark:text-red-400",
};

const receiveSchema = z
  .object({
    items: z.array(
      z.object({
        productId: z.number(),
        quantityReceived: z.coerce
          .number()
          .min(0, "Quantity cannot be negative"),
      })
    ),
  })
  .refine(
    (data) => data.items.some((i) => i.quantityReceived > 0),
    "Enter at least one quantity to receive"
  );

type ReceiveForm = z.infer<typeof receiveSchema>;

function formatDate(dateStr: string) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString();
}

export default function PurchaseOrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const queryClient = useQueryClient();
  const id = Number(params.id);
  const [showReceiveForm, setShowReceiveForm] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);

  const { data: response, isLoading } = useQuery({
    queryKey: ["purchase-orders", id],
    queryFn: () => purchaseOrdersApi.getById(id),
    enabled: !Number.isNaN(id),
  });

  const order = response?.success && response?.data ? response.data : null;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ReceiveForm>({
    resolver: zodResolver(receiveSchema),
    values: order
      ? {
          items: order.items.map((item) => ({
            productId: item.productId,
            quantityReceived: item.quantity,
          })),
        }
      : undefined,
    defaultValues: {
      items: [],
    },
  });

  const submitMutation = useMutation({
    mutationFn: () => purchaseOrdersApi.submit(id),
    onSuccess: () => {
      toast.success("Order submitted", {
        description: "The purchase order has been submitted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
      queryClient.invalidateQueries({ queryKey: ["purchase-orders", id] });
    },
    onError: (err: unknown) => {
      const message =
        err && typeof err === "object" && "message" in err
          ? String((err as { message: string }).message)
          : "Failed to submit order. Please try again.";
      toast.error("Submit failed", { description: message });
    },
  });

  const receiveMutation = useMutation({
    mutationFn: (data: ReceiveForm) =>
      purchaseOrdersApi.receive(id, {
        items: data.items
          .filter((item) => item.quantityReceived > 0)
          .map((item) => ({
            productId: item.productId,
            quantityReceived: item.quantityReceived,
          })),
      }),
    onSuccess: () => {
      toast.success("Order received", {
        description: "The items have been received and inventory updated.",
      });
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
      queryClient.invalidateQueries({ queryKey: ["purchase-orders", id] });
      setShowReceiveForm(false);
    },
    onError: (err: unknown) => {
      const message =
        err && typeof err === "object" && "message" in err
          ? String((err as { message: string }).message)
          : "Failed to receive order. Please try again.";
      toast.error("Receive failed", { description: message });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: () => purchaseOrdersApi.cancel(id),
    onSuccess: () => {
      toast.success("Order cancelled", {
        description: "The purchase order has been cancelled.",
      });
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
      queryClient.invalidateQueries({ queryKey: ["purchase-orders", id] });
      setCancelDialogOpen(false);
    },
    onError: (err: unknown) => {
      const message =
        err && typeof err === "object" && "message" in err
          ? String((err as { message: string }).message)
          : "Failed to cancel order. Please try again.";
      toast.error("Cancel failed", { description: message });
    },
  });

  const onReceiveSubmit = (data: ReceiveForm) => {
    receiveMutation.mutate(data);
  };

  if (Number.isNaN(id)) {
    return (
      <div className="space-y-6">
        <PageHeader title="Purchase Order Details" description="Invalid order ID" />
      </div>
    );
  }

  if (isLoading || !order) {
    return (
      <div className="space-y-6">
        <PageHeader title="Purchase Order Details" description="Loading..." />
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-32 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Purchase Order Details"
        description={order.orderNumber}
        action={
          <Button variant="outline" size="sm" asChild>
            <Link href="/purchase-orders">
              <ArrowLeft className="h-4 w-4" />
              Back to Purchase Orders
            </Link>
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle className="font-display">Order information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground">Order number</p>
              <p className="font-medium">{order.orderNumber}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Supplier</p>
              <p className="font-medium">{order.supplierName}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Order date</p>
              <p className="font-medium">{formatDate(order.orderDate)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Expected delivery</p>
              <p className="font-medium">
                {formatDate(order.expectedDeliveryDate)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <Badge
                className={
                  STATUS_BADGE_CLASSES[order.status] ?? "bg-muted"
                }
              >
                {order.status}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total amount</p>
              <p className="font-display text-lg font-semibold">
                {formatCurrency(order.totalAmount)}
              </p>
            </div>
          </div>
          {order.notes && (
            <div>
              <p className="text-sm text-muted-foreground">Notes</p>
              <p className="text-sm">{order.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-display">Items</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead className="text-right">Unit Price</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {order.items.map((item: PurchaseOrderItemDto) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.productName}</TableCell>
                  <TableCell className="text-right">{item.quantity}</TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(item.unitPrice)}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(item.totalPrice)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="mt-4 flex justify-end border-t pt-4">
            <p className="font-display text-lg font-semibold">
              Total: {formatCurrency(order.totalAmount)}
            </p>
          </div>
        </CardContent>
      </Card>

      {(order.status === "Draft" || order.status === "Submitted") && (
        <Card>
          <CardHeader>
            <CardTitle className="font-display">Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {order.status === "Draft" && (
              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={() => submitMutation.mutate()}
                  disabled={submitMutation.isPending}
                >
                  {submitMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Submit Order
                    </>
                  )}
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => setCancelDialogOpen(true)}
                  disabled={cancelMutation.isPending}
                >
                  <XCircle className="h-4 w-4" />
                  Cancel Order
                </Button>
              </div>
            )}

            {order.status === "Submitted" && (
              <div className="space-y-4">
                {!showReceiveForm ? (
                  <div className="flex flex-wrap gap-3">
                    <Button
                      onClick={() => setShowReceiveForm(true)}
                    >
                      <PackageCheck className="h-4 w-4" />
                      Receive Order
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => setCancelDialogOpen(true)}
                      disabled={cancelMutation.isPending}
                    >
                      <XCircle className="h-4 w-4" />
                      Cancel Order
                    </Button>
                  </div>
                ) : (
                  <form
                    onSubmit={handleSubmit(onReceiveSubmit)}
                    className="space-y-4"
                  >
                    <p className="text-sm text-muted-foreground">
                      Enter the quantity received for each product:
                    </p>
                    <div className="space-y-3">
                      {order.items.map((item, index) => (
                        <div
                          key={item.id}
                          className="flex items-center gap-4 rounded-lg border p-3"
                        >
                          <div className="flex-1">
                            <p className="font-medium">{item.productName}</p>
                            <p className="text-sm text-muted-foreground">
                              Ordered: {item.quantity}
                            </p>
                          </div>
                          <div className="w-32 space-y-2">
                            <Label htmlFor={`items.${index}.quantityReceived`}>
                              Received
                            </Label>
                            <Input
                              id={`items.${index}.quantityReceived`}
                              type="number"
                              min="1"
                              max={item.quantity}
                              {...register(`items.${index}.quantityReceived`)}
                            />
                            <input
                              type="hidden"
                              {...register(`items.${index}.productId`)}
                              value={item.productId}
                            />
                            {errors.items?.[index]?.quantityReceived && (
                              <p className="text-sm text-destructive">
                                {
                                  errors.items[index]?.quantityReceived
                                    ?.message
                                }
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    {errors.root && (
                      <p className="text-sm text-destructive">
                        {errors.root.message}
                      </p>
                    )}
                    <div className="flex gap-3">
                      <Button
                        type="submit"
                        disabled={receiveMutation.isPending}
                      >
                        {receiveMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Confirming...
                          </>
                        ) : (
                          "Confirm Receipt"
                        )}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowReceiveForm(false)}
                        disabled={receiveMutation.isPending}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display">
              Cancel purchase order
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel order &quot;{order.orderNumber}&quot;?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => cancelMutation.mutate()}
              disabled={cancelMutation.isPending}
            >
              {cancelMutation.isPending ? "Cancelling..." : "Cancel Order"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
