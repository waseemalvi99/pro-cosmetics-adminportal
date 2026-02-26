"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, Download, FileSpreadsheet } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { accountsApi } from "@/lib/api/accounts";
import { formatCurrency } from "@/lib/utils";
import type { AccountStatementLineDto } from "@/types";

function threeMonthsAgo() {
  const d = new Date();
  d.setMonth(d.getMonth() - 3);
  return d.toISOString().split("T")[0];
}

function today() {
  return new Date().toISOString().split("T")[0];
}

const REF_BADGE: Record<string, string> = {
  Sale: "bg-blue-500/15 text-blue-700 dark:text-blue-400",
  Payment: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  CreditNote: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  DebitNote: "bg-orange-500/15 text-orange-700 dark:text-orange-400",
  Manual: "bg-muted text-muted-foreground",
  PurchaseOrder: "bg-violet-500/15 text-violet-700 dark:text-violet-400",
};

export default function SupplierStatementPage() {
  const params = useParams();
  const id = Number(params.id);
  const [fromDate, setFromDate] = useState(threeMonthsAgo);
  const [toDate, setToDate] = useState(today);

  const { data: response, isLoading } = useQuery({
    queryKey: ["supplier-statement", id, fromDate, toDate],
    queryFn: () => accountsApi.supplierStatement(id, { fromDate, toDate }),
    enabled: !Number.isNaN(id),
  });

  const statement = response?.success && response?.data ? response.data : null;

  const handleExportPdf = async () => {
    try {
      await accountsApi.downloadSupplierStatementPdf(id, { fromDate, toDate });
      toast.success("Statement downloaded");
    } catch {
      toast.error("Failed to download statement");
    }
  };

  if (Number.isNaN(id)) {
    return (
      <div className="space-y-6">
        <PageHeader title="Supplier Statement" description="Invalid supplier ID" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Supplier Account Statement"
        description={statement ? statement.accountName : "Loading..."}
        action={
          <div className="flex items-center gap-2">
            {statement && (
              <Button onClick={handleExportPdf} variant="outline">
                <Download className="h-4 w-4" />
                Export PDF
              </Button>
            )}
            <Button variant="outline" asChild>
              <Link href="/suppliers"><ArrowLeft className="h-4 w-4" />Back</Link>
            </Button>
          </div>
        }
      />

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-end gap-4 mb-6">
            <div className="space-y-1">
              <Label className="text-xs">From Date</Label>
              <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="w-[160px]" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">To Date</Label>
              <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="w-[160px]" />
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-4 w-full" />)}
            </div>
          ) : !statement ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <FileSpreadsheet className="h-10 w-10 text-muted-foreground/40" />
              <p className="mt-3 font-display text-lg font-semibold text-muted-foreground">No data available</p>
            </div>
          ) : (
            <>
              <div className="mb-6 grid gap-4 sm:grid-cols-4">
                <div className="rounded-lg border p-4">
                  <p className="text-xs font-medium text-muted-foreground">Opening Balance</p>
                  <p className="mt-1 font-display text-xl font-bold">{formatCurrency(statement.openingBalance)}</p>
                </div>
                <div className="rounded-lg border p-4">
                  <p className="text-xs font-medium text-muted-foreground">Total Debits</p>
                  <p className="mt-1 font-display text-xl font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(statement.totalDebits)}</p>
                </div>
                <div className="rounded-lg border p-4">
                  <p className="text-xs font-medium text-muted-foreground">Total Credits</p>
                  <p className="mt-1 font-display text-xl font-bold text-red-600 dark:text-red-400">{formatCurrency(statement.totalCredits)}</p>
                </div>
                <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
                  <p className="text-xs font-medium text-muted-foreground">Closing Balance</p>
                  <p className="mt-1 font-display text-xl font-bold">{formatCurrency(statement.closingBalance)}</p>
                </div>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Debit</TableHead>
                    <TableHead className="text-right">Credit</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow className="bg-muted/30">
                    <TableCell colSpan={5} className="font-medium">Opening Balance</TableCell>
                    <TableCell className="text-right font-bold">{formatCurrency(statement.openingBalance)}</TableCell>
                  </TableRow>
                  {statement.lines.map((line: AccountStatementLineDto) => (
                    <TableRow key={line.id}>
                      <TableCell className="whitespace-nowrap text-sm">{new Date(line.entryDate).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={`text-xs ${REF_BADGE[line.referenceType] ?? ""}`}>{line.referenceType}</Badge>
                      </TableCell>
                      <TableCell className="max-w-[300px] truncate text-sm text-muted-foreground">{line.description}</TableCell>
                      <TableCell className="text-right font-medium">{line.debitAmount > 0 ? formatCurrency(line.debitAmount) : "—"}</TableCell>
                      <TableCell className="text-right font-medium">{line.creditAmount > 0 ? formatCurrency(line.creditAmount) : "—"}</TableCell>
                      <TableCell className="text-right font-bold">{formatCurrency(line.runningBalance)}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-muted/30 border-t-2">
                    <TableCell colSpan={3} className="font-display font-bold">Closing Balance</TableCell>
                    <TableCell className="text-right font-bold">{formatCurrency(statement.totalDebits)}</TableCell>
                    <TableCell className="text-right font-bold">{formatCurrency(statement.totalCredits)}</TableCell>
                    <TableCell className="text-right font-display text-lg font-bold">{formatCurrency(statement.closingBalance)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
