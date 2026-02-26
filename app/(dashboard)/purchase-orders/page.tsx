"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Eye, Send, XCircle } from "lucide-react";
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
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { purchaseOrdersApi } from "@/lib/api/purchase-orders";
import { suppliersApi } from "@/lib/api/suppliers";
import type { PurchaseOrderDto, SupplierDto } from "@/types";
import { formatCurrency } from "@/lib/utils";

const PAGE_SIZE = 10;

const STATUS_BADGE_VARIANTS: Record<string, string> = {
  Draft: "secondary",
  Submitted: "default",
  PartiallyReceived: "outline",
  Received: "default",
  Cancelled: "destructive",
};

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

export default function PurchaseOrdersPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [supplierId, setSupplierId] = useState<number | undefined>(undefined);
  const [cancelTarget, setCancelTarget] = useState<PurchaseOrderDto | null>(null);

  const { data: suppliersResponse } = useQuery({
    queryKey: ["suppliers", "all"],
    queryFn: () => suppliersApi.list({ page: 1, pageSize: 500 }),
  });

  const { data: response, isLoading } = useQuery({
    queryKey: ["purchase-orders", page, supplierId],
    queryFn: () =>
      purchaseOrdersApi.list({
        page,
        pageSize: PAGE_SIZE,
        supplierId: supplierId,
      }),
  });

  const submitMutation = useMutation({
    mutationFn: (id: number) => purchaseOrdersApi.submit(id),
    onSuccess: () => {
      toast.success("Order submitted", {
        description: "The purchase order has been submitted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
    },
    onError: (err: unknown) => {
      const message =
        err && typeof err === "object" && "message" in err
          ? String((err as { message: string }).message)
          : "Failed to submit order. Please try again.";
      toast.error("Submit failed", { description: message });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (id: number) => purchaseOrdersApi.cancel(id),
    onSuccess: () => {
      toast.success("Order cancelled", {
        description: "The purchase order has been cancelled.",
      });
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
      setCancelTarget(null);
    },
    onError: (err: unknown) => {
      const message =
        err && typeof err === "object" && "message" in err
          ? String((err as { message: string }).message)
          : "Failed to cancel order. Please try again.";
      toast.error("Cancel failed", { description: message });
    },
  });

  const pagedData = response?.success && response?.data ? response.data : null;
  const orders = pagedData?.items ?? [];
  const totalPages = pagedData?.totalPages ?? 0;
  const suppliers =
    suppliersResponse?.success && suppliersResponse?.data
      ? suppliersResponse.data.items
      : [];

  const handleCancelConfirm = () => {
    if (cancelTarget) {
      cancelMutation.mutate(cancelTarget.id);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Purchase Orders"
        description="Manage supplier orders"
        action={
          <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Link href="/purchase-orders/new">
              <Plus className="h-4 w-4" />
              New Order
            </Link>
          </Button>
        }
      />

      <Card>
        <CardContent className="p-4">
          <div className="mb-4 flex items-center gap-2">
            <Select
              value={supplierId !== undefined ? String(supplierId) : "all"}
              onValueChange={(v) => {
                setSupplierId(v === "all" ? undefined : Number(v));
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="All suppliers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All suppliers</SelectItem>
                {suppliers.map((s: SupplierDto) => (
                  <SelectItem key={s.id} value={String(s.id)}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 flex-1" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-8 w-8" />
                </div>
              ))}
            </div>
          ) : orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <p className="font-display text-lg font-semibold text-muted-foreground">
                No purchase orders yet
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Create your first purchase order to get started.
              </p>
              <Button asChild className="mt-4">
                <Link href="/purchase-orders/new">
                  <Plus className="h-4 w-4" />
                  New Order
                </Link>
              </Button>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order #</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Expected Delivery</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="w-[140px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">
                        {order.orderNumber}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {order.supplierName}
                      </TableCell>
                      <TableCell>{formatDate(order.orderDate)}</TableCell>
                      <TableCell>
                        {formatDate(order.expectedDeliveryDate)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            (STATUS_BADGE_VARIANTS[order.status] as "secondary" | "default" | "outline" | "destructive") ?? "secondary"
                          }
                          className={
                            STATUS_BADGE_CLASSES[order.status] ?? "bg-muted"
                          }
                        >
                          {order.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(order.totalAmount)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="icon-sm" asChild>
                            <Link href={`/purchase-orders/${order.id}`}>
                              <Eye className="h-4 w-4" />
                              <span className="sr-only">View</span>
                            </Link>
                          </Button>
                          {order.status === "Draft" && (
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => submitMutation.mutate(order.id)}
                              disabled={submitMutation.isPending}
                            >
                              <Send className="h-4 w-4" />
                              <span className="sr-only">Submit</span>
                            </Button>
                          )}
                          {(order.status === "Draft" ||
                            order.status === "Submitted" ||
                            order.status === "PartiallyReceived") && (
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => setCancelTarget(order)}
                            >
                              <XCircle className="h-4 w-4 text-destructive" />
                              <span className="sr-only">Cancel</span>
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {totalPages > 1 && (
                <div className="mt-4 flex justify-center">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            if (page > 1) setPage(page - 1);
                          }}
                          aria-disabled={page <= 1}
                          className={
                            page <= 1 ? "pointer-events-none opacity-50" : ""
                          }
                        />
                      </PaginationItem>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                        (p) => (
                          <PaginationItem key={p}>
                            <PaginationLink
                              href="#"
                              onClick={(e) => {
                                e.preventDefault();
                                setPage(p);
                              }}
                              isActive={p === page}
                            >
                              {p}
                            </PaginationLink>
                          </PaginationItem>
                        )
                      )}
                      <PaginationItem>
                        <PaginationNext
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            if (page < totalPages) setPage(page + 1);
                          }}
                          aria-disabled={page >= totalPages}
                          className={
                            page >= totalPages
                              ? "pointer-events-none opacity-50"
                              : ""
                          }
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <AlertDialog
        open={!!cancelTarget}
        onOpenChange={(open) => !open && setCancelTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display">
              Cancel purchase order
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel order &quot;{cancelTarget?.orderNumber}&quot;?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={handleCancelConfirm}
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
