"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Search, Plus, Loader2, BookOpen } from "lucide-react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { ledgerApi } from "@/lib/api/ledger";
import { customersApi } from "@/lib/api/customers";
import { suppliersApi } from "@/lib/api/suppliers";
import { formatCurrency } from "@/lib/utils";
import type { CustomerDto, SupplierDto, LedgerEntryDto } from "@/types";
import { LedgerAccountTypes } from "@/types";

const PAGE_SIZE = 20;

const manualEntrySchema = z.object({
  accountType: z.string().min(1, "Account type is required"),
  customerId: z.string().optional(),
  supplierId: z.string().optional(),
  description: z.string().min(1, "Description is required"),
  debitAmount: z.coerce.number().min(0),
  creditAmount: z.coerce.number().min(0),
}).refine(
  (d) => d.debitAmount > 0 || d.creditAmount > 0,
  { message: "At least one of debit or credit must be greater than 0", path: ["debitAmount"] }
).refine(
  (d) => {
    if (d.accountType === "0") return !!d.customerId;
    return true;
  },
  { message: "Customer is required for Customer Receivable", path: ["customerId"] }
).refine(
  (d) => {
    if (d.accountType === "1") return !!d.supplierId;
    return true;
  },
  { message: "Supplier is required for Supplier Payable", path: ["supplierId"] }
);

type ManualEntryForm = z.infer<typeof manualEntrySchema>;

const REF_TYPE_COLORS: Record<string, string> = {
  Sale: "bg-blue-500/15 text-blue-700 dark:text-blue-400",
  PurchaseOrder: "bg-violet-500/15 text-violet-700 dark:text-violet-400",
  Payment: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  CreditNote: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  DebitNote: "bg-orange-500/15 text-orange-700 dark:text-orange-400",
  Manual: "bg-muted text-muted-foreground",
};

export default function LedgerPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [filterCustomerId, setFilterCustomerId] = useState<string>("");
  const [filterSupplierId, setFilterSupplierId] = useState<string>("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: response, isLoading } = useQuery({
    queryKey: ["ledger", page, filterCustomerId, filterSupplierId],
    queryFn: () =>
      ledgerApi.list({
        page,
        pageSize: PAGE_SIZE,
        customerId: filterCustomerId ? Number(filterCustomerId) : undefined,
        supplierId: filterSupplierId ? Number(filterSupplierId) : undefined,
      }),
  });

  const { data: customersResp } = useQuery({
    queryKey: ["customers", "all"],
    queryFn: () => customersApi.list({ page: 1, pageSize: 500 }),
  });

  const { data: suppliersResp } = useQuery({
    queryKey: ["suppliers", "all"],
    queryFn: () => suppliersApi.list({ page: 1, pageSize: 500 }),
  });

  const customers = customersResp?.success && customersResp?.data ? customersResp.data.items : [];
  const suppliers = suppliersResp?.success && suppliersResp?.data ? suppliersResp.data.items : [];

  const pagedData = response?.success && response?.data ? response.data : null;
  const entries = pagedData?.items ?? [];
  const totalPages = pagedData?.totalPages ?? 0;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<ManualEntryForm>({
    resolver: zodResolver(manualEntrySchema),
    defaultValues: {
      accountType: "",
      customerId: "",
      supplierId: "",
      description: "",
      debitAmount: 0,
      creditAmount: 0,
    },
  });

  const accountType = watch("accountType");

  const createMutation = useMutation({
    mutationFn: (data: ManualEntryForm) =>
      ledgerApi.createManual({
        accountType: Number(data.accountType),
        customerId: data.customerId ? Number(data.customerId) : null,
        supplierId: data.supplierId ? Number(data.supplierId) : null,
        description: data.description,
        debitAmount: data.debitAmount,
        creditAmount: data.creditAmount,
      }),
    onSuccess: () => {
      toast.success("Ledger entry created");
      queryClient.invalidateQueries({ queryKey: ["ledger"] });
      setDialogOpen(false);
      reset();
    },
    onError: () => {
      toast.error("Failed to create entry");
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ledger"
        description="Financial ledger entries"
        action={
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4" />
                Manual Entry
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle className="font-display">New Manual Ledger Entry</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit((d) => createMutation.mutate(d))} className="space-y-4">
                <div className="space-y-2">
                  <Label>Account Type *</Label>
                  <Select value={accountType} onValueChange={(v) => setValue("accountType", v)}>
                    <SelectTrigger><SelectValue placeholder="Select account type" /></SelectTrigger>
                    <SelectContent>
                      {LedgerAccountTypes.map((t) => (
                        <SelectItem key={t.value} value={String(t.value)}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {accountType === "0" && (
                  <div className="space-y-2">
                    <Label>Customer *</Label>
                    <Select value={watch("customerId") ?? ""} onValueChange={(v) => setValue("customerId", v)}>
                      <SelectTrigger><SelectValue placeholder="Select customer" /></SelectTrigger>
                      <SelectContent>
                        {customers.map((c: CustomerDto) => (
                          <SelectItem key={c.id} value={String(c.id)}>{c.fullName}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {accountType === "1" && (
                  <div className="space-y-2">
                    <Label>Supplier *</Label>
                    <Select value={watch("supplierId") ?? ""} onValueChange={(v) => setValue("supplierId", v)}>
                      <SelectTrigger><SelectValue placeholder="Select supplier" /></SelectTrigger>
                      <SelectContent>
                        {suppliers.map((s: SupplierDto) => (
                          <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Description *</Label>
                  <Textarea {...register("description")} placeholder="Reason for this entry..." rows={2} />
                  {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Debit Amount</Label>
                    <Input type="number" min="0" step="0.01" {...register("debitAmount")} />
                  </div>
                  <div className="space-y-2">
                    <Label>Credit Amount</Label>
                    <Input type="number" min="0" step="0.01" {...register("creditAmount")} />
                  </div>
                </div>
                {errors.debitAmount && <p className="text-sm text-destructive">{errors.debitAmount.message}</p>}

                <div className="flex gap-3 pt-2">
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating...</> : "Create Entry"}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      <Card>
        <CardContent className="p-4">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <Select value={filterCustomerId} onValueChange={(v) => { setFilterCustomerId(v === "all" ? "" : v); setFilterSupplierId(""); setPage(1); }}>
              <SelectTrigger className="w-[200px]"><SelectValue placeholder="Filter by customer" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Customers</SelectItem>
                {customers.map((c: CustomerDto) => (
                  <SelectItem key={c.id} value={String(c.id)}>{c.fullName}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterSupplierId} onValueChange={(v) => { setFilterSupplierId(v === "all" ? "" : v); setFilterCustomerId(""); setPage(1); }}>
              <SelectTrigger className="w-[200px]"><SelectValue placeholder="Filter by supplier" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Suppliers</SelectItem>
                {suppliers.map((s: SupplierDto) => (
                  <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 flex-1" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-20" />
                </div>
              ))}
            </div>
          ) : entries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <BookOpen className="h-10 w-10 text-muted-foreground/40" />
              <p className="mt-3 font-display text-lg font-semibold text-muted-foreground">No ledger entries</p>
              <p className="mt-1 text-sm text-muted-foreground">Entries are auto-created from sales, purchases, and payments.</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Account</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Debit</TableHead>
                    <TableHead className="text-right">Credit</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.map((entry: LedgerEntryDto) => (
                    <TableRow key={entry.id} className={entry.isReversed ? "opacity-50" : ""}>
                      <TableCell className="whitespace-nowrap text-sm">
                        {new Date(entry.entryDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {entry.accountType === "CustomerReceivable" ? "Receivable" : "Payable"}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        {entry.customerName || entry.supplierName || "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={`text-xs ${REF_TYPE_COLORS[entry.referenceType] ?? ""}`}>
                          {entry.referenceType}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[250px] truncate text-sm text-muted-foreground">
                        {entry.description}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {entry.debitAmount > 0 ? formatCurrency(entry.debitAmount) : "—"}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {entry.creditAmount > 0 ? formatCurrency(entry.creditAmount) : "—"}
                      </TableCell>
                      <TableCell>
                        {entry.isReversed && (
                          <Badge variant="outline" className="bg-red-500/10 text-red-600 text-xs">Reversed</Badge>
                        )}
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
                          onClick={(e) => { e.preventDefault(); if (page > 1) setPage(page - 1); }}
                          aria-disabled={page <= 1}
                          className={page <= 1 ? "pointer-events-none opacity-50" : ""}
                        />
                      </PaginationItem>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                        <PaginationItem key={p}>
                          <PaginationLink href="#" onClick={(e) => { e.preventDefault(); setPage(p); }} isActive={p === page}>
                            {p}
                          </PaginationLink>
                        </PaginationItem>
                      ))}
                      <PaginationItem>
                        <PaginationNext
                          href="#"
                          onClick={(e) => { e.preventDefault(); if (page < totalPages) setPage(page + 1); }}
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
    </div>
  );
}
