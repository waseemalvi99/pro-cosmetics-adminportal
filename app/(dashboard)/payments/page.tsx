"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Trash2, Download, Receipt } from "lucide-react";
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
import { SearchableCombobox } from "@/components/ui/searchable-combobox";
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
import { paymentsApi } from "@/lib/api/payments";
import { useCustomerCombo, useSupplierCombo } from "@/hooks/use-combo-search";
import { formatCurrency } from "@/lib/utils";
import type { PaymentDto } from "@/types";

const PAGE_SIZE = 20;

export default function PaymentsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [filterCustomerId, setFilterCustomerId] = useState("");
  const [filterSupplierId, setFilterSupplierId] = useState("");
  const [voidTarget, setVoidTarget] = useState<PaymentDto | null>(null);

  const { data: response, isLoading } = useQuery({
    queryKey: ["payments", page, filterCustomerId, filterSupplierId],
    queryFn: () =>
      paymentsApi.list({
        page,
        pageSize: PAGE_SIZE,
        customerId: filterCustomerId ? Number(filterCustomerId) : undefined,
        supplierId: filterSupplierId ? Number(filterSupplierId) : undefined,
      }),
  });

  const customerCombo = useCustomerCombo();
  const supplierCombo = useSupplierCombo();

  const pagedData = response?.success && response?.data ? response.data : null;
  const payments = pagedData?.items ?? [];
  const totalPages = pagedData?.totalPages ?? 0;

  const voidMutation = useMutation({
    mutationFn: (id: number) => paymentsApi.void(id),
    onSuccess: () => {
      toast.success("Payment voided", { description: "The payment and its ledger entries have been reversed." });
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["ledger"] });
      setVoidTarget(null);
    },
    onError: () => {
      toast.error("Failed to void payment");
    },
  });

  const handleDownloadPdf = async (payment: PaymentDto) => {
    try {
      await paymentsApi.downloadPdf(payment.id, payment.receiptNumber);
      toast.success("Receipt downloaded");
    } catch {
      toast.error("Failed to download receipt");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payments"
        description="Customer receipts and supplier payments"
        action={
          <div className="flex items-center gap-2">
            <Button asChild>
              <Link href="/payments/customer">
                <Plus className="h-4 w-4" />
                Customer Payment
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/payments/supplier">
                <Plus className="h-4 w-4" />
                Supplier Payment
              </Link>
            </Button>
          </div>
        }
      />

      <Card>
        <CardContent className="p-4">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <div className="w-[220px]">
              <SearchableCombobox
                options={[{ value: "", label: "All Customers" }, ...customerCombo.options]}
                value={filterCustomerId}
                onValueChange={(v) => { setFilterCustomerId(v); setFilterSupplierId(""); setPage(1); }}
                onSearchChange={customerCombo.setSearch}
                isLoading={customerCombo.isLoading}
                placeholder="Filter by customer"
                searchPlaceholder="Search customers..."
                emptyMessage="No customers found."
              />
            </div>
            <div className="w-[220px]">
              <SearchableCombobox
                options={[{ value: "", label: "All Suppliers" }, ...supplierCombo.options]}
                value={filterSupplierId}
                onValueChange={(v) => { setFilterSupplierId(v); setFilterCustomerId(""); setPage(1); }}
                onSearchChange={supplierCombo.setSearch}
                isLoading={supplierCombo.isLoading}
                placeholder="Filter by supplier"
                searchPlaceholder="Search suppliers..."
                emptyMessage="No suppliers found."
              />
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 flex-1" />
                  <Skeleton className="h-4 w-24" />
                </div>
              ))}
            </div>
          ) : payments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Receipt className="h-10 w-10 text-muted-foreground/40" />
              <p className="mt-3 font-display text-lg font-semibold text-muted-foreground">No payments yet</p>
              <p className="mt-1 text-sm text-muted-foreground">Record customer receipts or supplier payments.</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Receipt #</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Customer / Supplier</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead className="w-[120px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((p: PaymentDto) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.receiptNumber}</TableCell>
                      <TableCell className="whitespace-nowrap text-sm">
                        {new Date(p.paymentDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={
                          p.paymentType === "CustomerReceipt"
                            ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                            : "bg-blue-500/15 text-blue-700 dark:text-blue-400"
                        }>
                          {p.paymentType === "CustomerReceipt" ? "Receipt" : "Payment"}
                        </Badge>
                      </TableCell>
                      <TableCell>{p.customerName || p.supplierName || "—"}</TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(p.amount)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{p.paymentMethod}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon-sm" onClick={() => handleDownloadPdf(p)} title="Download Receipt">
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon-sm" onClick={() => setVoidTarget(p)} title="Void Payment">
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
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
                        <PaginationPrevious href="#" onClick={(e) => { e.preventDefault(); if (page > 1) setPage(page - 1); }} aria-disabled={page <= 1} className={page <= 1 ? "pointer-events-none opacity-50" : ""} />
                      </PaginationItem>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
                        <PaginationItem key={pg}>
                          <PaginationLink href="#" onClick={(e) => { e.preventDefault(); setPage(pg); }} isActive={pg === page}>{pg}</PaginationLink>
                        </PaginationItem>
                      ))}
                      <PaginationItem>
                        <PaginationNext href="#" onClick={(e) => { e.preventDefault(); if (page < totalPages) setPage(page + 1); }} aria-disabled={page >= totalPages} className={page >= totalPages ? "pointer-events-none opacity-50" : ""} />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!voidTarget} onOpenChange={(open) => !open && setVoidTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display">Void payment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to void payment &quot;{voidTarget?.receiptNumber}&quot;?
              This will reverse the associated ledger entries.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={() => voidTarget && voidMutation.mutate(voidTarget.id)} disabled={voidMutation.isPending}>
              {voidMutation.isPending ? "Voiding..." : "Void Payment"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
