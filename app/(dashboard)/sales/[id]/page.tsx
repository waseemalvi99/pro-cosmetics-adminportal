"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, Ban, RotateCcw, Loader2, Info } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { salesApi } from "@/lib/api/sales";
import { SaleItemImage } from "@/components/shared/sale-item-image";
import type { SaleItemDto } from "@/types";
import { formatCurrency } from "@/lib/utils";

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    Completed: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
    Pending: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30",
    Cancelled: "bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30",
    Refunded: "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30",
  };
  return (
    <Badge variant="outline" className={colors[status] ?? ""}>
      {status}
    </Badge>
  );
}

export default function SaleDetailPage() {
  const params = useParams();
  const queryClient = useQueryClient();
  const id = Number(params.id);

  const { data: response, isLoading } = useQuery({
    queryKey: ["sale", id],
    queryFn: () => salesApi.getById(id),
    enabled: !Number.isNaN(id),
  });

  const cancelMutation = useMutation({
    mutationFn: () => salesApi.cancel(id),
    onSuccess: () => {
      toast.success("Sale cancelled", {
        description: "The sale has been cancelled and inventory has been restored.",
      });
      queryClient.invalidateQueries({ queryKey: ["sale", id] });
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      setCancelOpen(false);
    },
    onError: (err: unknown) => {
      const message =
        err && typeof err === "object" && "message" in err
          ? String((err as { message: string }).message)
          : "Failed to cancel sale. Please try again.";
      toast.error("Cancel failed", { description: message });
    },
  });

  const returnMutation = useMutation({
    mutationFn: (data: { items: { productId: number; quantityReturned: number }[]; reason?: string }) =>
      salesApi.returnSale(id, data),
    onSuccess: () => {
      toast.success("Return processed", {
        description: "Sale return processed. Inventory restored.",
      });
      queryClient.invalidateQueries({ queryKey: ["sale", id] });
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      setShowReturnForm(false);
      setReturnQuantities({});
      setReturnReason("");
      setReturnError(null);
    },
    onError: (err: unknown) => {
      const message =
        err && typeof err === "object" && "message" in err
          ? String((err as { message: string }).message)
          : "Failed to process return. Please try again.";
      toast.error("Return failed", { description: message });
    },
  });

  const [cancelOpen, setCancelOpen] = useState(false);
  const [showReturnForm, setShowReturnForm] = useState(false);
  const [returnQuantities, setReturnQuantities] = useState<Record<number, number>>({});
  const [returnReason, setReturnReason] = useState("");
  const [returnError, setReturnError] = useState<string | null>(null);

  const sale = response?.success && response?.data ? response.data : null;
  const canCancel = sale && (sale.status === "Pending" || sale.status === "Completed") && !(sale.returnedAmount > 0);
  const canReturn = sale?.status === "Completed";

  const handleOpenReturnForm = () => {
    if (!sale) return;
    const defaults: Record<number, number> = {};
    sale.items.forEach((item) => {
      const returnable = item.quantity - (item.quantityReturned ?? 0);
      if (returnable > 0) defaults[item.productId] = 0;
    });
    setReturnQuantities(defaults);
    setReturnReason("");
    setReturnError(null);
    setShowReturnForm(true);
  };

  const handleReturnSubmit = () => {
    if (!sale) return;
    const items = sale.items
      .map((item) => ({
        productId: item.productId,
        quantityReturned: returnQuantities[item.productId] ?? 0,
      }))
      .filter((i) => i.quantityReturned > 0);

    if (items.length === 0) {
      setReturnError("Enter at least one return quantity.");
      return;
    }

    for (const item of items) {
      const saleItem = sale.items.find((si) => si.productId === item.productId);
      if (saleItem) {
        const returnable = saleItem.quantity - (saleItem.quantityReturned ?? 0);
        if (item.quantityReturned > returnable) {
          setReturnError(
            `Cannot return more than ${returnable} for ${saleItem.productName}.`
          );
          return;
        }
      }
    }

    setReturnError(null);
    returnMutation.mutate({
      items,
      reason: returnReason.trim() || undefined,
    });
  };

  if (Number.isNaN(id)) {
    return (
      <div className="space-y-6">
        <PageHeader title="Invalid Sale" description="The sale ID is invalid." />
        <Button variant="outline" asChild>
          <Link href="/sales">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Sales
          </Link>
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Sale Details" />
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

  if (!sale) {
    return (
      <div className="space-y-6">
        <PageHeader title="Sale Not Found" description="The requested sale could not be found." />
        <Button variant="outline" asChild>
          <Link href="/sales">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Sales
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sale Details"
        description={`Sale ${sale.saleNumber}`}
        action={
          <div className="flex items-center gap-2">
            {canReturn && (
              <Button
                variant="outline"
                onClick={handleOpenReturnForm}
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Process Return
              </Button>
            )}
            {canCancel && (
              <Button
                variant="destructive"
                onClick={() => setCancelOpen(true)}
                disabled={cancelMutation.isPending}
              >
                <Ban className="mr-2 h-4 w-4" />
                Cancel Sale
              </Button>
            )}
            <Button variant="outline" asChild>
              <Link href="/sales">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Sales
              </Link>
            </Button>
          </div>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle className="font-display">Sale Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <p className="text-sm text-muted-foreground">Sale Number</p>
              <p className="font-medium">{sale.saleNumber}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Date</p>
              <p className="font-medium">
                {new Date(sale.saleDate).toLocaleString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <StatusBadge status={sale.status} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Customer</p>
              <p className="font-medium">{sale.customerName ?? "—"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Salesman</p>
              <p className="font-medium">{sale.salesmanName ?? "—"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Payment Method</p>
              <p className="font-medium">{sale.paymentMethod}</p>
            </div>
            {sale.returnedAmount > 0 && (
              <div>
                <p className="text-sm text-muted-foreground">Returned Amount</p>
                <p className="font-display text-lg font-semibold text-blue-600 dark:text-blue-400">
                  {formatCurrency(sale.returnedAmount)}
                </p>
              </div>
            )}
            {sale.dueDate && (
              <div>
                <p className="text-sm text-muted-foreground">Due Date</p>
                <p className="font-medium">
                  {new Date(sale.dueDate).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </p>
              </div>
            )}
          </div>
          {sale.notes && (
            <div>
              <p className="text-sm text-muted-foreground">Notes</p>
              <p className="text-sm">{sale.notes}</p>
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
                <TableHead className="w-[50px]"></TableHead>
                <TableHead>Product</TableHead>
                <TableHead className="text-center">Sold</TableHead>
                {sale.returnedAmount > 0 && (
                  <TableHead className="text-center">Returned</TableHead>
                )}
                <TableHead className="text-right">Unit Price</TableHead>
                <TableHead className="text-right">Discount</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sale.items.map((item: SaleItemDto) => {
                const returned = item.quantityReturned ?? 0;
                return (
                  <TableRow key={item.id}>
                    <TableCell>
                      <SaleItemImage productId={item.productId} alt={item.productName} />
                    </TableCell>
                    <TableCell className="font-medium">{item.productName}</TableCell>
                    <TableCell className="text-center">{item.quantity}</TableCell>
                    {sale.returnedAmount > 0 && (
                      <TableCell className="text-center">
                        {returned > 0 ? (
                          <span className="text-blue-600 dark:text-blue-400 font-medium">{returned}</span>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                    )}
                    <TableCell className="text-right">
                      {formatCurrency(item.unitPrice)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(item.discount)}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(item.totalPrice)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-display">Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-w-xs ml-auto">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatCurrency(sale.subTotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Discount</span>
              <span>{formatCurrency(sale.discount)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Tax</span>
              <span>{formatCurrency(sale.tax)}</span>
            </div>
            <div className="flex justify-between border-t pt-2 font-display text-lg font-semibold">
              <span>Total Amount</span>
              <span>{formatCurrency(sale.totalAmount)}</span>
            </div>
            {sale.returnedAmount > 0 && (
              <div className="flex justify-between text-sm text-blue-600 dark:text-blue-400">
                <span>Returned</span>
                <span>−{formatCurrency(sale.returnedAmount)}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Return form */}
      {showReturnForm && canReturn && (
        <Card className="border-blue-200 dark:border-blue-800">
          <CardHeader>
            <CardTitle className="font-display flex items-center gap-2">
              <RotateCcw className="h-5 w-5" />
              Process Return
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Enter the quantity to return for each item. Only items with returnable quantity are shown.
            </p>

            <div className="space-y-3">
              {sale.items
                .filter((item) => {
                  const returnable = item.quantity - (item.quantityReturned ?? 0);
                  return returnable > 0;
                })
                .map((item) => {
                  const returned = item.quantityReturned ?? 0;
                  const returnable = item.quantity - returned;
                  return (
                    <div
                      key={item.id}
                      className="flex items-center gap-4 rounded-lg border bg-card p-3"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{item.productName}</p>
                        <p className="text-xs text-muted-foreground">
                          Sold: {item.quantity} &middot; Already returned: {returned} &middot;{" "}
                          <span className="font-semibold">Returnable: {returnable}</span>
                        </p>
                      </div>
                      <div className="w-28 shrink-0">
                        <Label className="text-xs">Qty to return</Label>
                        <Input
                          type="number"
                          min={0}
                          max={returnable}
                          value={returnQuantities[item.productId] ?? 0}
                          onChange={(e) => {
                            const val = Math.max(0, Math.min(returnable, Number(e.target.value) || 0));
                            setReturnQuantities((prev) => ({
                              ...prev,
                              [item.productId]: val,
                            }));
                          }}
                          className="mt-1"
                        />
                      </div>
                    </div>
                  );
                })}
            </div>

            <div>
              <Label htmlFor="return-reason" className="text-sm font-medium">
                Reason (optional)
              </Label>
              <Textarea
                id="return-reason"
                placeholder="Reason for return (optional)"
                value={returnReason}
                onChange={(e) => setReturnReason(e.target.value)}
                className="mt-1.5"
                rows={2}
              />
            </div>

            {returnError && (
              <p className="text-sm font-medium text-destructive">{returnError}</p>
            )}

            <div className="flex gap-3 pt-2">
              <Button
                onClick={handleReturnSubmit}
                disabled={returnMutation.isPending}
              >
                {returnMutation.isPending ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</>
                ) : (
                  <><RotateCcw className="mr-2 h-4 w-4" /> Confirm Return</>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowReturnForm(false);
                  setReturnError(null);
                }}
                disabled={returnMutation.isPending}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Refunded info banner */}
      {sale.status === "Refunded" && sale.returnedAmount > 0 && (
        <Card className="border-blue-200 dark:border-blue-800">
          <CardContent className="flex items-start gap-3 py-5">
            <Info className="mt-0.5 h-5 w-5 shrink-0 text-blue-500" />
            <div className="text-sm">
              <p className="font-medium text-blue-700 dark:text-blue-300">
                All items in this sale have been fully returned.
              </p>
              <p className="mt-1 text-muted-foreground">
                Total returned: {formatCurrency(sale.returnedAmount)} of {formatCurrency(sale.totalAmount)}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <AlertDialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display">Cancel sale</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel sale &quot;{sale.saleNumber}&quot;? Inventory will be
              restored. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => cancelMutation.mutate()}
              disabled={cancelMutation.isPending}
            >
              {cancelMutation.isPending ? "Cancelling..." : "Cancel Sale"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
