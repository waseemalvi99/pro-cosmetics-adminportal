"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Eye, Ban } from "lucide-react";
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
import { SearchableCombobox } from "@/components/ui/searchable-combobox";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { salesApi } from "@/lib/api/sales";
import { useCustomerCombo, useSalesmanCombo } from "@/hooks/use-combo-search";
import type { SaleDto } from "@/types";
import { formatCurrency } from "@/lib/utils";

const PAGE_SIZE = 10;

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    Completed: "default",
    Pending: "secondary",
    Cancelled: "destructive",
    Refunded: "outline",
  };
  const colors: Record<string, string> = {
    Completed: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
    Pending: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30",
    Cancelled: "bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30",
    Refunded: "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30",
  };
  return (
    <Badge variant={variants[status] ?? "secondary"} className={colors[status] ?? ""}>
      {status}
    </Badge>
  );
}

export default function SalesPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [customerId, setCustomerId] = useState<string>("all");
  const [salesmanId, setSalesmanId] = useState<string>("all");
  const [cancelTarget, setCancelTarget] = useState<SaleDto | null>(null);

  const { data: response, isLoading } = useQuery({
    queryKey: ["sales", page, customerId, salesmanId],
    queryFn: () =>
      salesApi.list({
        page,
        pageSize: PAGE_SIZE,
        customerId: customerId !== "all" ? Number(customerId) : undefined,
        salesmanId: salesmanId !== "all" ? Number(salesmanId) : undefined,
      }),
  });

  const customerCombo = useCustomerCombo();
  const salesmanCombo = useSalesmanCombo();

  const cancelMutation = useMutation({
    mutationFn: (id: number) => salesApi.cancel(id),
    onSuccess: () => {
      toast.success("Sale cancelled", {
        description: "The sale has been cancelled and inventory has been restored.",
      });
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      setCancelTarget(null);
    },
    onError: (err: unknown) => {
      const message =
        err && typeof err === "object" && "message" in err
          ? String((err as { message: string }).message)
          : "Failed to cancel sale. Please try again.";
      toast.error("Cancel failed", { description: message });
    },
  });

  const pagedData = response?.success && response?.data ? response.data : null;
  const sales = pagedData?.items ?? [];
  const totalPages = pagedData?.totalPages ?? 0;

  const handleCancelConfirm = () => {
    if (cancelTarget) {
      cancelMutation.mutate(cancelTarget.id);
    }
  };

  const canCancel = (sale: SaleDto) =>
    (sale.status === "Pending" || sale.status === "Completed") && !(sale.returnedAmount > 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sales"
        description="View and manage sales transactions"
        action={
          <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Link href="/sales/new">
              <Plus className="h-4 w-4" />
              New Sale
            </Link>
          </Button>
        }
      />

      <Card>
        <CardContent className="p-4">
          <div className="mb-4 flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Customer:</span>
              <div className="w-[220px]">
                <SearchableCombobox
                  options={[{ value: "all", label: "All customers" }, ...customerCombo.options]}
                  value={customerId}
                  onValueChange={(v) => { setCustomerId(v || "all"); setPage(1); }}
                  onSearchChange={customerCombo.setSearch}
                  isLoading={customerCombo.isLoading}
                  placeholder="All customers"
                  searchPlaceholder="Search customers..."
                  emptyMessage="No customers found."
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Salesman:</span>
              <div className="w-[220px]">
                <SearchableCombobox
                  options={[{ value: "all", label: "All salesmen" }, ...salesmanCombo.options]}
                  value={salesmanId}
                  onValueChange={(v) => { setSalesmanId(v || "all"); setPage(1); }}
                  onSearchChange={salesmanCombo.setSearch}
                  isLoading={salesmanCombo.isLoading}
                  placeholder="All salesmen"
                  searchPlaceholder="Search salesmen..."
                  emptyMessage="No salesmen found."
                />
              </div>
            </div>
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
          ) : sales.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <p className="font-display text-lg font-semibold text-muted-foreground">
                No sales yet
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Create your first sale to get started.
              </p>
              <Button asChild className="mt-4">
                <Link href="/sales/new">
                  <Plus className="h-4 w-4" />
                  New Sale
                </Link>
              </Button>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sale #</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Salesman</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Payment Method</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[120px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sales.map((sale) => (
                    <TableRow key={sale.id}>
                      <TableCell className="font-medium">{sale.saleNumber}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {sale.customerName ?? "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {sale.salesmanName ?? "—"}
                      </TableCell>
                      <TableCell>
                        {new Date(sale.saleDate).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="font-medium">{formatCurrency(sale.totalAmount)}</span>
                        {sale.returnedAmount > 0 && (
                          <span className="block text-xs text-blue-600 dark:text-blue-400">
                            Returned: {formatCurrency(sale.returnedAmount)}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>{sale.paymentMethod}</TableCell>
                      <TableCell>
                        <StatusBadge status={sale.status} />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="icon-sm" asChild>
                            <Link href={`/sales/${sale.id}`}>
                              <Eye className="h-4 w-4" />
                              <span className="sr-only">View Details</span>
                            </Link>
                          </Button>
                          {canCancel(sale) && (
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => setCancelTarget(sale)}
                            >
                              <Ban className="h-4 w-4 text-destructive" />
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
                          className={page <= 1 ? "pointer-events-none opacity-50" : ""}
                        />
                      </PaginationItem>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
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
                      ))}
                      <PaginationItem>
                        <PaginationNext
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            if (page < totalPages) setPage(page + 1);
                          }}
                          aria-disabled={page >= totalPages}
                          className={page >= totalPages ? "pointer-events-none opacity-50" : ""}
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

      <AlertDialog open={!!cancelTarget} onOpenChange={(open) => !open && setCancelTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display">Cancel sale</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel sale &quot;{cancelTarget?.saleNumber}&quot;? Inventory
              will be restored. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={handleCancelConfirm}
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
