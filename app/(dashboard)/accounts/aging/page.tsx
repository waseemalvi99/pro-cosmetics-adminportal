"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { TrendingDown, TrendingUp } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { accountsApi } from "@/lib/api/accounts";
import { formatCurrency } from "@/lib/utils";
import type { AgingReportDetailDto } from "@/types";

function AgingTable({
  data,
  type,
}: {
  data: { details: AgingReportDetailDto[]; totalCurrent: number; total1To30: number; total31To60: number; total61To90: number; totalOver90: number; grandTotal: number } | null;
  type: "receivables" | "payables";
}) {
  if (!data) return null;
  const linkPrefix = type === "receivables" ? "/accounts/customer" : "/accounts/supplier";

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {[
          { label: "Current", value: data.totalCurrent, color: "text-emerald-600 dark:text-emerald-400" },
          { label: "1-30 Days", value: data.total1To30, color: "text-blue-600 dark:text-blue-400" },
          { label: "31-60 Days", value: data.total31To60, color: "text-amber-600 dark:text-amber-400" },
          { label: "61-90 Days", value: data.total61To90, color: "text-orange-600 dark:text-orange-400" },
          { label: "Over 90 Days", value: data.totalOver90, color: "text-red-600 dark:text-red-400" },
          { label: "Grand Total", value: data.grandTotal, color: "" },
        ].map((bucket) => (
          <div key={bucket.label} className="rounded-lg border p-3">
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{bucket.label}</p>
            <p className={`mt-1 font-display text-lg font-bold ${bucket.color}`}>{formatCurrency(bucket.value)}</p>
          </div>
        ))}
      </div>

      {data.details.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-sm text-muted-foreground">No outstanding balances</p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{type === "receivables" ? "Customer" : "Supplier"}</TableHead>
              <TableHead className="text-right">Current</TableHead>
              <TableHead className="text-right">1-30 Days</TableHead>
              <TableHead className="text-right">31-60 Days</TableHead>
              <TableHead className="text-right">61-90 Days</TableHead>
              <TableHead className="text-right">Over 90</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="w-[80px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.details.map((row: AgingReportDetailDto) => (
              <TableRow key={row.accountId}>
                <TableCell className="font-medium">{row.accountName}</TableCell>
                <TableCell className="text-right">{row.current > 0 ? formatCurrency(row.current) : "—"}</TableCell>
                <TableCell className="text-right">{row.days1To30 > 0 ? formatCurrency(row.days1To30) : "—"}</TableCell>
                <TableCell className="text-right">{row.days31To60 > 0 ? formatCurrency(row.days31To60) : "—"}</TableCell>
                <TableCell className="text-right">{row.days61To90 > 0 ? formatCurrency(row.days61To90) : "—"}</TableCell>
                <TableCell className="text-right font-medium">
                  {row.over90Days > 0 ? <span className="text-red-600 dark:text-red-400">{formatCurrency(row.over90Days)}</span> : "—"}
                </TableCell>
                <TableCell className="text-right font-display font-bold">{formatCurrency(row.total)}</TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`${linkPrefix}/${row.accountId}`}>View</Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            <TableRow className="bg-muted/30 border-t-2">
              <TableCell className="font-display font-bold">Totals</TableCell>
              <TableCell className="text-right font-bold">{formatCurrency(data.totalCurrent)}</TableCell>
              <TableCell className="text-right font-bold">{formatCurrency(data.total1To30)}</TableCell>
              <TableCell className="text-right font-bold">{formatCurrency(data.total31To60)}</TableCell>
              <TableCell className="text-right font-bold">{formatCurrency(data.total61To90)}</TableCell>
              <TableCell className="text-right font-bold">{formatCurrency(data.totalOver90)}</TableCell>
              <TableCell className="text-right font-display text-lg font-bold">{formatCurrency(data.grandTotal)}</TableCell>
              <TableCell />
            </TableRow>
          </TableBody>
        </Table>
      )}
    </div>
  );
}

export default function AgingReportsPage() {
  const [tab, setTab] = useState("receivables");

  const { data: receivablesResp, isLoading: loadingReceivables } = useQuery({
    queryKey: ["aging", "receivables"],
    queryFn: () => accountsApi.receivablesAging(),
  });

  const { data: payablesResp, isLoading: loadingPayables } = useQuery({
    queryKey: ["aging", "payables"],
    queryFn: () => accountsApi.payablesAging(),
  });

  const receivables = receivablesResp?.success && receivablesResp?.data ? receivablesResp.data : null;
  const payables = payablesResp?.success && payablesResp?.data ? payablesResp.data : null;
  const isLoading = tab === "receivables" ? loadingReceivables : loadingPayables;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Aging Reports"
        description="Outstanding receivables and payables by aging bucket"
      />

      <Card>
        <CardContent className="p-4">
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="receivables" className="gap-2">
                <TrendingUp className="h-4 w-4" />
                Receivables
              </TabsTrigger>
              <TabsTrigger value="payables" className="gap-2">
                <TrendingDown className="h-4 w-4" />
                Payables
              </TabsTrigger>
            </TabsList>

            {isLoading ? (
              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-6">
                  {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
                </div>
                {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
              </div>
            ) : (
              <>
                <TabsContent value="receivables">
                  <AgingTable data={receivables} type="receivables" />
                </TabsContent>
                <TabsContent value="payables">
                  <AgingTable data={payables} type="payables" />
                </TabsContent>
              </>
            )}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
