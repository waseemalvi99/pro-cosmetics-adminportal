"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Eye } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SearchableCombobox } from "@/components/ui/searchable-combobox";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { deliveriesApi } from "@/lib/api/deliveries";
import { useDeliveryManCombo } from "@/hooks/use-combo-search";
import type { DeliveryDto } from "@/types";

const PAGE_SIZE = 10;
const DELIVERY_STATUSES = [
  "Pending",
  "Assigned",
  "PickedUp",
  "InTransit",
  "Delivered",
  "Failed",
] as const;

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    Pending: "bg-gray-500/15 text-gray-700 dark:text-gray-400 border-gray-500/30",
    Assigned: "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30",
    PickedUp: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30",
    InTransit: "bg-indigo-500/15 text-indigo-700 dark:text-indigo-400 border-indigo-500/30",
    Delivered: "bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30",
    Failed: "bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30",
  };
  return (
    <Badge variant="outline" className={colors[status] ?? ""}>
      {status}
    </Badge>
  );
}

export default function DeliveriesPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<string>("all");
  const [deliveryManId, setDeliveryManId] = useState<string>("all");

  const { data: response, isLoading } = useQuery({
    queryKey: ["deliveries", page, status, deliveryManId],
    queryFn: () =>
      deliveriesApi.list({
        page,
        pageSize: PAGE_SIZE,
        status: status !== "all" ? status : undefined,
        deliveryManId: deliveryManId !== "all" ? Number(deliveryManId) : undefined,
      }),
  });

  const deliveryManCombo = useDeliveryManCombo();

  const pagedData = response?.success && response?.data ? response.data : null;
  const deliveries: DeliveryDto[] = pagedData?.items ?? [];
  const totalPages = pagedData?.totalPages ?? 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Deliveries"
        description="Track and manage deliveries"
        action={
          <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Link href="/deliveries/new">New Delivery</Link>
          </Button>
        }
      />

      <Card>
        <CardContent className="p-4">
          <div className="mb-4 flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Status:</span>
              <Select
                value={status}
                onValueChange={(v) => {
                  setStatus(v);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  {DELIVERY_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Delivery Man:</span>
              <div className="w-[220px]">
                <SearchableCombobox
                  options={[{ value: "all", label: "All delivery men" }, ...deliveryManCombo.options]}
                  value={deliveryManId}
                  onValueChange={(v) => {
                    setDeliveryManId(v || "all");
                    setPage(1);
                  }}
                  onSearchChange={deliveryManCombo.setSearch}
                  isLoading={deliveryManCombo.isLoading}
                  placeholder="All delivery men"
                  searchPlaceholder="Search delivery men..."
                  emptyMessage="No delivery men found."
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
          ) : deliveries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <p className="font-display text-lg font-semibold text-muted-foreground">
                No deliveries yet
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Create your first delivery to get started.
              </p>
              <Button asChild className="mt-4">
                <Link href="/deliveries/new">New Delivery</Link>
              </Button>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sale #</TableHead>
                    <TableHead>Delivery Man</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Delivered At</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deliveries.map((d) => (
                    <TableRow key={d.id}>
                      <TableCell className="font-medium">{d.saleNumber}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {d.deliveryManName ?? "—"}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate text-muted-foreground">
                        {d.deliveryAddress || "—"}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={d.status} />
                      </TableCell>
                      <TableCell>
                        {new Date(d.createdAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </TableCell>
                      <TableCell>
                        {d.deliveredAt
                          ? new Date(d.deliveredAt).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "—"}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon-sm" asChild>
                          <Link href={`/deliveries/${d.id}`}>
                            <Eye className="h-4 w-4" />
                            <span className="sr-only">View</span>
                          </Link>
                        </Button>
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
    </div>
  );
}
