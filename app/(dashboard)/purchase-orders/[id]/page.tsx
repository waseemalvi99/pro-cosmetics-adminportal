"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Loader2,
  ArrowLeft,
  Send,
  XCircle,
  PackageCheck,
  CheckCircle2,
  Clock,
  AlertTriangle,
} from "lucide-react";
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

function formatDate(dateStr: string) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString();
}

function getItemStatus(item: PurchaseOrderItemDto) {
  const received = item.quantityReceived ?? 0;
  if (received >= item.quantity) return "complete";
  if (received > 0) return "partial";
  return "pending";
}

export default function PurchaseOrderDetailPage() {
  const params = useParams();
  const queryClient = useQueryClient();
  const id = Number(params.id);
  const [showReceiveForm, setShowReceiveForm] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [receiveQuantities, setReceiveQuantities] = useState<Record<number, number>>({});
  const [receiveError, setReceiveError] = useState<string | null>(null);

  const { data: response, isLoading } = useQuery({
    queryKey: ["purchase-orders", id],
    queryFn: () => purchaseOrdersApi.getById(id),
    enabled: !Number.isNaN(id),
  });

  const order = response?.success && response?.data ? response.data : null;

  const canSubmit = order?.status === "Draft";
  const canReceive = order?.status === "Submitted" || order?.status === "PartiallyReceived";
  const canCancel = order?.status === "Draft" || order?.status === "Submitted" || order?.status === "PartiallyReceived";
  const isTerminal = order?.status === "Received" || order?.status === "Cancelled";

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
    queryClient.invalidateQueries({ queryKey: ["purchase-orders", id] });
  };

  const submitMutation = useMutation({
    mutationFn: () => purchaseOrdersApi.submit(id),
    onSuccess: (res) => {
      toast.success("Order submitted", {
        description: res.message || "The purchase order has been submitted to the supplier.",
      });
      invalidateAll();
    },
    onError: (err: unknown) => {
      toast.error("Submit failed", {
        description: err instanceof Error ? err.message : "Failed to submit order.",
      });
    },
  });

  const receiveMutation = useMutation({
    mutationFn: (items: { productId: number; quantityReceived: number }[]) =>
      purchaseOrdersApi.receive(id, { items }),
    onSuccess: (res) => {
      toast.success("Items received", {
        description: res.message || "Inventory has been updated.",
      });
      invalidateAll();
      setShowReceiveForm(false);
      setReceiveQuantities({});
      setReceiveError(null);
    },
    onError: (err: unknown) => {
      toast.error("Receive failed", {
        description: err instanceof Error ? err.message : "Failed to receive items.",
      });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: () => purchaseOrdersApi.cancel(id),
    onSuccess: (res) => {
      toast.success("Order cancelled", {
        description: res.message || "The purchase order has been cancelled.",
      });
      invalidateAll();
      setCancelDialogOpen(false);
    },
    onError: (err: unknown) => {
      toast.error("Cancel failed", {
        description: err instanceof Error ? err.message : "Failed to cancel order.",
      });
    },
  });

  const handleOpenReceiveForm = () => {
    if (!order) return;
    const defaults: Record<number, number> = {};
    order.items.forEach((item) => {
      const remaining = item.quantity - (item.quantityReceived ?? 0);
      defaults[item.productId] = remaining > 0 ? remaining : 0;
    });
    setReceiveQuantities(defaults);
    setReceiveError(null);
    setShowReceiveForm(true);
  };

  const handleReceiveSubmit = () => {
    if (!order) return;
    const items = order.items
      .map((item) => ({
        productId: item.productId,
        quantityReceived: receiveQuantities[item.productId] ?? 0,
      }))
      .filter((i) => i.quantityReceived > 0);

    if (items.length === 0) {
      setReceiveError("Enter at least one quantity to receive.");
      return;
    }

    for (const item of items) {
      const orderItem = order.items.find((oi) => oi.productId === item.productId);
      if (orderItem) {
        const remaining = orderItem.quantity - (orderItem.quantityReceived ?? 0);
        if (item.quantityReceived > remaining) {
          setReceiveError(
            `Cannot receive more than remaining for ${orderItem.productName}. Remaining: ${remaining}`
          );
          return;
        }
      }
    }

    setReceiveError(null);
    receiveMutation.mutate(items);
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

  const totalOrdered = order.items.reduce((s, i) => s + i.quantity, 0);
  const totalReceived = order.items.reduce((s, i) => s + (i.quantityReceived ?? 0), 0);
  const overallProgress = totalOrdered > 0 ? Math.round((totalReceived / totalOrdered) * 100) : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Purchase Order Details"
        description={order.orderNumber}
        action={
          <Button variant="outline" size="sm" asChild>
            <Link href="/purchase-orders">
              <ArrowLeft className="h-4 w-4" />
              Back to Orders
            </Link>
          </Button>
        }
      />

      {/* Order Info */}
      <Card>
        <CardHeader>
          <CardTitle className="font-display">Order Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <p className="text-sm text-muted-foreground">Order Number</p>
              <p className="font-medium">{order.orderNumber}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Supplier</p>
              <p className="font-medium">{order.supplierName}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Order Date</p>
              <p className="font-medium">{formatDate(order.orderDate)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Expected Delivery</p>
              <p className="font-medium">{formatDate(order.expectedDeliveryDate)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <Badge className={STATUS_BADGE_CLASSES[order.status] ?? "bg-muted"}>
                {order.status === "PartiallyReceived" ? "Partially Received" : order.status}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Amount</p>
              <p className="font-display text-lg font-semibold">{formatCurrency(order.totalAmount)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Payment Terms</p>
              <p className="font-medium">{order.paymentTermDays} days</p>
            </div>
            {order.dueDate && (
              <div>
                <p className="text-sm text-muted-foreground">Due Date</p>
                <p className="font-medium">{formatDate(order.dueDate)}</p>
              </div>
            )}
          </div>
          {order.notes && (
            <div className="mt-4 rounded-lg bg-muted/50 p-3">
              <p className="text-xs font-medium text-muted-foreground">Notes</p>
              <p className="mt-1 text-sm">{order.notes}</p>
            </div>
          )}

          {/* Receiving progress bar */}
          {order.status !== "Draft" && order.status !== "Cancelled" && (
            <div className="mt-5 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Receiving Progress</span>
                <span className="text-muted-foreground">
                  {totalReceived} / {totalOrdered} items ({overallProgress}%)
                </span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-500"
                  style={{ width: `${overallProgress}%` }}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Items Table */}
      <Card>
        <CardHeader>
          <CardTitle className="font-display">Order Items</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead className="text-right">Ordered</TableHead>
                {order.status !== "Draft" && (
                  <TableHead className="text-right">Received</TableHead>
                )}
                {order.status !== "Draft" && (
                  <TableHead className="text-right">Remaining</TableHead>
                )}
                <TableHead className="text-right">Unit Price</TableHead>
                <TableHead className="text-right">Total</TableHead>
                {order.status !== "Draft" && (
                  <TableHead className="w-[100px] text-center">Status</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {order.items.map((item: PurchaseOrderItemDto) => {
                const received = item.quantityReceived ?? 0;
                const remaining = item.quantity - received;
                const status = getItemStatus(item);
                return (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.productName}</TableCell>
                    <TableCell className="text-right">{item.quantity}</TableCell>
                    {order.status !== "Draft" && (
                      <TableCell className="text-right font-medium">
                        {received}
                      </TableCell>
                    )}
                    {order.status !== "Draft" && (
                      <TableCell className="text-right">
                        {remaining > 0 ? remaining : "—"}
                      </TableCell>
                    )}
                    <TableCell className="text-right">{formatCurrency(item.unitPrice)}</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(item.totalPrice)}
                    </TableCell>
                    {order.status !== "Draft" && (
                      <TableCell className="text-center">
                        {status === "complete" && (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600 dark:text-green-400">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Done
                          </span>
                        )}
                        {status === "partial" && (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 dark:text-amber-400">
                            <Clock className="h-3.5 w-3.5" /> {received}/{item.quantity}
                          </span>
                        )}
                        {status === "pending" && (
                          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                            <AlertTriangle className="h-3.5 w-3.5" /> Pending
                          </span>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          <div className="mt-4 flex justify-end border-t pt-4">
            <p className="font-display text-lg font-semibold">
              Total: {formatCurrency(order.totalAmount)}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Actions Card */}
      {!isTerminal && (
        <Card>
          <CardHeader>
            <CardTitle className="font-display">Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Action buttons */}
            {!showReceiveForm && (
              <div className="flex flex-wrap gap-3">
                {canSubmit && (
                  <Button
                    onClick={() => submitMutation.mutate()}
                    disabled={submitMutation.isPending}
                  >
                    {submitMutation.isPending ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...</>
                    ) : (
                      <><Send className="h-4 w-4" /> Submit Order</>
                    )}
                  </Button>
                )}
                {canReceive && (
                  <Button onClick={handleOpenReceiveForm}>
                    <PackageCheck className="h-4 w-4" /> Receive Items
                  </Button>
                )}
                {canCancel && (
                  <Button
                    variant="destructive"
                    onClick={() => setCancelDialogOpen(true)}
                    disabled={cancelMutation.isPending}
                  >
                    <XCircle className="h-4 w-4" /> Cancel Order
                  </Button>
                )}
              </div>
            )}

            {/* Receive form */}
            {showReceiveForm && canReceive && (
              <div className="space-y-4 rounded-lg border border-primary/20 bg-primary/[0.03] p-5">
                <div>
                  <h3 className="font-display text-base font-semibold">Receive Items</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Enter the quantity received for each item in this batch.
                    Only items with quantity &gt; 0 will be processed.
                  </p>
                </div>

                <div className="space-y-3">
                  {order.items.map((item) => {
                    const received = item.quantityReceived ?? 0;
                    const remaining = item.quantity - received;
                    const isFullyReceived = remaining <= 0;

                    return (
                      <div
                        key={item.id}
                        className={`flex items-center gap-4 rounded-lg border p-3 ${
                          isFullyReceived ? "bg-muted/50 opacity-60" : "bg-card"
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{item.productName}</p>
                          <p className="text-xs text-muted-foreground">
                            Ordered: {item.quantity} &middot; Already received: {received} &middot;{" "}
                            <span className="font-semibold">Remaining: {remaining}</span>
                          </p>
                        </div>
                        <div className="w-28 shrink-0">
                          <Label className="text-xs">Qty to receive</Label>
                          <Input
                            type="number"
                            min={0}
                            max={remaining}
                            disabled={isFullyReceived}
                            value={receiveQuantities[item.productId] ?? 0}
                            onChange={(e) => {
                              const val = Math.max(0, Math.min(remaining, Number(e.target.value) || 0));
                              setReceiveQuantities((prev) => ({
                                ...prev,
                                [item.productId]: val,
                              }));
                            }}
                            className="mt-1"
                          />
                        </div>
                        {isFullyReceived && (
                          <CheckCircle2 className="h-5 w-5 shrink-0 text-green-500" />
                        )}
                      </div>
                    );
                  })}
                </div>

                {receiveError && (
                  <p className="text-sm font-medium text-destructive">{receiveError}</p>
                )}

                <div className="flex gap-3 pt-2">
                  <Button
                    onClick={handleReceiveSubmit}
                    disabled={receiveMutation.isPending}
                  >
                    {receiveMutation.isPending ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</>
                    ) : (
                      <><PackageCheck className="h-4 w-4" /> Confirm Receipt</>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowReceiveForm(false);
                      setReceiveError(null);
                    }}
                    disabled={receiveMutation.isPending}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Terminal status info */}
      {isTerminal && (
        <Card>
          <CardContent className="flex items-center gap-3 py-5">
            {order.status === "Received" && (
              <>
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <p className="text-sm font-medium text-green-600 dark:text-green-400">
                  This order has been fully received. All inventory has been updated.
                </p>
              </>
            )}
            {order.status === "Cancelled" && (
              <>
                <XCircle className="h-5 w-5 text-red-500" />
                <p className="text-sm font-medium text-red-600 dark:text-red-400">
                  This order has been cancelled. No further actions are available.
                </p>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Cancel confirmation dialog */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display">
              Cancel purchase order
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel order &quot;{order.orderNumber}&quot;?
              {order.status === "PartiallyReceived" && (
                <span className="mt-2 block font-medium text-amber-600">
                  Warning: Some items have already been received. Cancelling will not reverse the inventory updates for received items.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Go Back</AlertDialogCancel>
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
