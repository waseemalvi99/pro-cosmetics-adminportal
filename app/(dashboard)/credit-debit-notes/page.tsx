"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Trash2, Download, FileText } from "lucide-react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { creditDebitNotesApi } from "@/lib/api/credit-debit-notes";
import { customersApi } from "@/lib/api/customers";
import { suppliersApi } from "@/lib/api/suppliers";
import { formatCurrency } from "@/lib/utils";
import type { CreditDebitNoteDto, CustomerDto, SupplierDto } from "@/types";

const PAGE_SIZE = 20;

export default function CreditDebitNotesPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [filterCustomerId, setFilterCustomerId] = useState("");
  const [filterSupplierId, setFilterSupplierId] = useState("");
  const [voidTarget, setVoidTarget] = useState<CreditDebitNoteDto | null>(null);

  const { data: response, isLoading } = useQuery({
    queryKey: ["credit-debit-notes", page, filterCustomerId, filterSupplierId],
    queryFn: () =>
      creditDebitNotesApi.list({
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
  const notes = pagedData?.items ?? [];
  const totalPages = pagedData?.totalPages ?? 0;

  const voidMutation = useMutation({
    mutationFn: (id: number) => creditDebitNotesApi.void(id),
    onSuccess: () => {
      toast.success("Note voided", { description: "The note and its ledger entries have been reversed." });
      queryClient.invalidateQueries({ queryKey: ["credit-debit-notes"] });
      queryClient.invalidateQueries({ queryKey: ["ledger"] });
      setVoidTarget(null);
    },
    onError: () => {
      toast.error("Failed to void note");
    },
  });

  const handleDownloadPdf = async (note: CreditDebitNoteDto) => {
    try {
      await creditDebitNotesApi.downloadPdf(note.id, note.noteNumber);
      toast.success("Note downloaded");
    } catch {
      toast.error("Failed to download note");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Credit / Debit Notes"
        description="Manage credit and debit notes"
        action={
          <Button asChild>
            <Link href="/credit-debit-notes/new">
              <Plus className="h-4 w-4" />
              New Note
            </Link>
          </Button>
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
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 flex-1" />
                  <Skeleton className="h-4 w-24" />
                </div>
              ))}
            </div>
          ) : notes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <FileText className="h-10 w-10 text-muted-foreground/40" />
              <p className="mt-3 font-display text-lg font-semibold text-muted-foreground">No notes yet</p>
              <p className="mt-1 text-sm text-muted-foreground">Create credit or debit notes for customers and suppliers.</p>
              <Button asChild className="mt-4">
                <Link href="/credit-debit-notes/new"><Plus className="h-4 w-4" />New Note</Link>
              </Button>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Note #</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Account</TableHead>
                    <TableHead>Customer / Supplier</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {notes.map((note: CreditDebitNoteDto) => (
                    <TableRow key={note.id}>
                      <TableCell className="font-medium">{note.noteNumber}</TableCell>
                      <TableCell className="whitespace-nowrap text-sm">{new Date(note.noteDate).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={
                          note.noteType === "CreditNote"
                            ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                            : "bg-orange-500/15 text-orange-700 dark:text-orange-400"
                        }>
                          {note.noteType === "CreditNote" ? "Credit" : "Debit"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{note.accountType}</TableCell>
                      <TableCell>{note.customerName || note.supplierName || "—"}</TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(note.amount)}</TableCell>
                      <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">{note.reason}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon-sm" onClick={() => handleDownloadPdf(note)} title="Download PDF">
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon-sm" onClick={() => setVoidTarget(note)} title="Void Note">
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
            <AlertDialogTitle className="font-display">Void note</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to void note &quot;{voidTarget?.noteNumber}&quot;?
              This will reverse the associated ledger entries.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={() => voidTarget && voidMutation.mutate(voidTarget.id)} disabled={voidMutation.isPending}>
              {voidMutation.isPending ? "Voiding..." : "Void Note"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
