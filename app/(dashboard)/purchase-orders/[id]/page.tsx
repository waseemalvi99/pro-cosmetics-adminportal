"use client";

import { useState, useCallback, useRef } from "react";
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
  ScanBarcode,
  AlertCircle,
  Lock,
  Info,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { productsApi } from "@/lib/api/products";
import type { PurchaseOrderItemDto } from "@/types";
import { formatCurrency } from "@/lib/utils";

const STATUS_BADGE_CLASSES: Record<string, string> = {
  Draft: "bg-muted text-muted-foreground",
  Submitted: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
  PartiallyReceived: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  Received: "bg-green-500/15 text-green-600 dark:text-green-400",
  Cancelled: "bg-red-500/15 text-red-600 dark:text-red-400",
  Closed: "bg-violet-500/15 text-violet-600 dark:text-violet-400",
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
  const [showCloseDialog, setShowCloseDialog] = useState(false);
  const [closeReason, setCloseReason] = useState("");
  const [receiveQuantities, setReceiveQuantities] = useState<Record<number, number>>({});
  const [receiveError, setReceiveError] = useState<string | null>(null);
  const [scanBarcode, setScanBarcode] = useState("");
  const [isScanningReceive, setIsScanningReceive] = useState(false);
  const [scanFeedback, setScanFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [highlightedProductId, setHighlightedProductId] = useState<number | null>(null);
  const receiveScanRef = useRef<HTMLInputElement>(null);
  const itemRefs = useRef<Record<number, HTMLDivElement | null>>({});

  const { data: response, isLoading } = useQuery({
    queryKey: ["purchase-orders", id],
    queryFn: () => purchaseOrdersApi.getById(id),
    enabled: !Number.isNaN(id),
  });

  const order = response?.success && response?.data ? response.data : null;

  const canSubmit = order?.status === "Draft";
  const canReceive = order?.status === "Submitted" || order?.status === "PartiallyReceived";
  const canCancel = order?.status === "Draft" || order?.status === "Submitted";
  const canClose = order?.status === "PartiallyReceived";
  const isTerminal = ["Received", "Cancelled", "Closed"].includes(order?.status ?? "");

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

  const closeMutation = useMutation({
    mutationFn: (data: { id: number; reason?: string }) =>
      purchaseOrdersApi.close(data.id, { reason: data.reason }),
    onSuccess: () => {
      toast.success("Purchase order closed", {
        description: "Ledger updated with received amount.",
      });
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
      queryClient.invalidateQueries({ queryKey: ["purchase-orders", id] });
      setShowCloseDialog(false);
      setCloseReason("");
    },
    onError: (err: unknown) => {
      toast.error("Failed to close order", {
        description: err instanceof Error ? err.message : "Failed to close order.",
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
    setScanFeedback(null);
    setShowReceiveForm(true);
    setTimeout(() => receiveScanRef.current?.focus(), 100);
  };

  const handleReceiveScan = useCallback(
    async (code: string) => {
      const trimmed = code.trim();
      if (!trimmed || !order) return;

      setIsScanningReceive(true);
      setScanFeedback(null);
      setHighlightedProductId(null);

      try {
        const res = await productsApi.getByBarcode(trimmed);

        if (!res.success || !res.data) {
          setScanFeedback({ type: "error", message: res.message || "Product not found for this barcode." });
          setScanBarcode("");
          setIsScanningReceive(false);
          setTimeout(() => receiveScanRef.current?.focus(), 50);
          return;
        }

        const scanned = res.data;
        const orderItem = order.items.find((i) => i.productId === scanned.productId);

        if (!orderItem) {
          setScanFeedback({
            type: "error",
            message: `"${scanned.productName}" is not in this purchase order.`,
          });
          setScanBarcode("");
          setIsScanningReceive(false);
          setTimeout(() => receiveScanRef.current?.focus(), 50);
          return;
        }

        const remaining = orderItem.quantity - (orderItem.quantityReceived ?? 0);
        if (remaining <= 0) {
          setScanFeedback({
            type: "error",
            message: `"${scanned.productName}" has already been fully received.`,
          });
          setScanBarcode("");
          setIsScanningReceive(false);
          setTimeout(() => receiveScanRef.current?.focus(), 50);
          return;
        }

        const currentQty = receiveQuantities[scanned.productId] ?? 0;
        const newQty = Math.min(currentQty + 1, remaining);
        setReceiveQuantities((prev) => ({
          ...prev,
          [scanned.productId]: newQty,
        }));

        setHighlightedProductId(scanned.productId);
        setScanFeedback({
          type: "success",
          message: `${scanned.productName} — ${newQty} of ${remaining} remaining`,
        });

        setTimeout(() => {
          itemRefs.current[scanned.productId]?.scrollIntoView({
            behavior: "smooth",
            block: "nearest",
          });
        }, 50);

        setTimeout(() => setHighlightedProductId(null), 2000);
      } catch {
        setScanFeedback({ type: "error", message: "Failed to look up barcode." });
      } finally {
        setScanBarcode("");
        setIsScanningReceive(false);
        setTimeout(() => receiveScanRef.current?.focus(), 50);
      }
    },
    [order, receiveQuantities]
  );

  const handleReceiveScanKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleReceiveScan(scanBarcode);
      }
    },
    [scanBarcode, handleReceiveScan]
  );

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
            {order.receivedAmount > 0 && (
              <div>
                <p className="text-sm text-muted-foreground">Received Amount</p>
                <p className="font-display text-lg font-semibold">{formatCurrency(order.receivedAmount)}</p>
              </div>
            )}
            {order.status === "Closed" && order.closeReason && (
              <div>
                <p className="text-sm text-muted-foreground">Close Reason</p>
                <p className="font-medium">{order.closeReason}</p>
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
                {canClose && (
                  <Button
                    variant="outline"
                    onClick={() => setShowCloseDialog(true)}
                    disabled={closeMutation.isPending}
                  >
                    <Lock className="h-4 w-4" /> Close Order
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
                    Scan barcodes to increment quantities, or enter them manually below.
                  </p>
                </div>

                {/* Barcode scanner for receiving */}
                <div className="rounded-lg border border-dashed bg-card p-4 space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <ScanBarcode className="h-4 w-4" />
                    Scan to Receive
                  </Label>
                  <div className="relative">
                    <ScanBarcode className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      ref={receiveScanRef}
                      type="text"
                      inputMode="none"
                      value={scanBarcode}
                      onChange={(e) => setScanBarcode(e.target.value)}
                      onKeyDown={handleReceiveScanKeyDown}
                      placeholder="Scan barcode to increment quantity..."
                      className="pl-9 pr-10 font-mono tabular-nums"
                      disabled={isScanningReceive}
                      autoComplete="off"
                    />
                    {isScanningReceive && (
                      <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
                    )}
                  </div>

                  {scanFeedback && (
                    <div
                      className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm ${
                        scanFeedback.type === "success"
                          ? "bg-green-50/50 text-green-700 dark:bg-green-950/30 dark:text-green-400"
                          : "bg-destructive/10 text-destructive"
                      }`}
                    >
                      {scanFeedback.type === "success" ? (
                        <CheckCircle2 className="h-4 w-4 shrink-0" />
                      ) : (
                        <AlertCircle className="h-4 w-4 shrink-0" />
                      )}
                      {scanFeedback.message}
                    </div>
                  )}

                  <p className="text-xs text-muted-foreground">
                    Each scan adds 1 to the item&apos;s receive quantity. Press <kbd className="rounded border bg-muted px-1 py-0.5 font-mono text-[10px]">Enter</kbd> after typing.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-xs text-muted-foreground">or adjust manually</span>
                  <div className="h-px flex-1 bg-border" />
                </div>

                <div className="space-y-3">
                  {order.items.map((item) => {
                    const received = item.quantityReceived ?? 0;
                    const remaining = item.quantity - received;
                    const isFullyReceived = remaining <= 0;
                    const isHighlighted = highlightedProductId === item.productId;

                    return (
                      <div
                        key={item.id}
                        ref={(el) => { itemRefs.current[item.productId] = el; }}
                        className={`flex items-center gap-4 rounded-lg border p-3 transition-all duration-300 ${
                          isFullyReceived
                            ? "bg-muted/50 opacity-60"
                            : isHighlighted
                              ? "border-green-400 bg-green-50/50 ring-2 ring-green-200 dark:border-green-700 dark:bg-green-950/30 dark:ring-green-800"
                              : "bg-card"
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
                      setScanFeedback(null);
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
            {order.status === "Closed" && (
              <>
                <Lock className="h-5 w-5 text-violet-500" />
                <p className="text-sm font-medium text-violet-600 dark:text-violet-400">
                  This order has been closed. No further actions are available.
                </p>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Closed order financial summary */}
      {order.status === "Closed" && order.receivedAmount > 0 && (
        <Card className="border-violet-200 dark:border-violet-800">
          <CardContent className="flex items-start gap-3 py-5">
            <Info className="mt-0.5 h-5 w-5 shrink-0 text-violet-500" />
            <div className="text-sm">
              <p className="font-medium text-violet-700 dark:text-violet-300">
                This order was partially received and closed.
              </p>
              <p className="mt-1 text-muted-foreground">
                Received: {formatCurrency(order.receivedAmount)} of {formatCurrency(order.totalAmount)}
                {" "}({order.totalAmount > 0 ? Math.round((order.receivedAmount / order.totalAmount) * 100) : 0}% fulfilled)
              </p>
            </div>
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

      {/* Close confirmation dialog */}
      <AlertDialog
        open={showCloseDialog}
        onOpenChange={(open) => {
          if (!open) {
            setShowCloseDialog(false);
            setCloseReason("");
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display">
              Close Purchase Order?
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>
                  This will finalize the order with only the received items.
                  A ledger entry of {formatCurrency(order.receivedAmount)} will be created
                  (original total: {formatCurrency(order.totalAmount)}).
                </p>
                <div>
                  <Label htmlFor="close-reason" className="text-sm font-medium">
                    Reason (optional)
                  </Label>
                  <Textarea
                    id="close-reason"
                    placeholder="Reason for closing (optional)"
                    value={closeReason}
                    onChange={(e) => setCloseReason(e.target.value)}
                    className="mt-1.5"
                    rows={3}
                  />
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                closeMutation.mutate({
                  id,
                  reason: closeReason.trim() || undefined,
                })
              }
              disabled={closeMutation.isPending}
            >
              {closeMutation.isPending ? "Closing..." : "Close Order"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
