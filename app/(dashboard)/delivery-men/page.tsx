"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { MoreHorizontal, Pencil, Trash2, Plus, Search } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { deliveryMenApi } from "@/lib/api/delivery-men";
import type { DeliveryManDto } from "@/types";

export default function DeliveryMenPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<DeliveryManDto | null>(null);

  const { data: response, isLoading } = useQuery({
    queryKey: ["delivery-men", page, search],
    queryFn: () =>
      deliveryMenApi.list({ page, pageSize: 10, search: search || undefined }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await deliveryMenApi.delete(id);
      if (!res.success) throw new Error(res.message || "Failed to delete delivery man");
      return res;
    },
    onSuccess: () => {
      toast.success("Delivery man deleted", {
        description: "The delivery man has been removed successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["delivery-men"] });
      setDeleteTarget(null);
    },
    onError: (err: Error) => {
      toast.error("Delete failed", { description: err.message });
    },
  });

  const pagedData = response?.success && response?.data ? response.data : null;
  const deliveryMen: DeliveryManDto[] = pagedData?.items ?? [];
  const totalPages = pagedData?.totalPages ?? 0;
  const hasNextPage = pagedData?.hasNextPage ?? false;
  const hasPreviousPage = pagedData?.hasPreviousPage ?? false;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const handleDeleteConfirm = () => {
    if (deleteTarget) {
      deleteMutation.mutate(deleteTarget.id);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Delivery Men"
        description="Manage your delivery team"
        action={
          <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Link href="/delivery-men/new">
              <Plus className="h-4 w-4" />
              Add Delivery Man
            </Link>
          </Button>
        }
      />

      <Card>
        <CardContent className="p-0">
          <div className="flex items-center gap-4 border-b p-4">
            <form onSubmit={handleSearch} className="flex flex-1 gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by name, phone, or email..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button type="submit" variant="secondary">
                Search
              </Button>
            </form>
          </div>

          {isLoading ? (
            <div className="space-y-4 p-6">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 flex-1" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-8" />
                </div>
              ))}
            </div>
          ) : deliveryMen.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <p className="font-display text-lg font-semibold text-muted-foreground">
                No delivery men yet
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Get started by adding your first delivery man.
              </p>
              <Button asChild className="mt-4">
                <Link href="/delivery-men/new">
                  <Plus className="h-4 w-4" />
                  Add Delivery Man
                </Link>
              </Button>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Available</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[70px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deliveryMen.map((dm) => (
                    <TableRow key={dm.id}>
                      <TableCell className="font-medium">{dm.name}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {dm.phone || "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {dm.email || "—"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={dm.isAvailable ? "default" : "secondary"}
                          className={
                            dm.isAvailable
                              ? "bg-green-600 hover:bg-green-600/90"
                              : "bg-muted text-muted-foreground"
                          }
                        >
                          {dm.isAvailable ? "Available" : "Unavailable"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={dm.isActive ? "default" : "secondary"}>
                          {dm.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon-sm" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Open menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/delivery-men/${dm.id}/edit`}>
                                <Pencil className="h-4 w-4" />
                                Edit
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              variant="destructive"
                              onClick={() => setDeleteTarget(dm)}
                            >
                              <Trash2 className="h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {totalPages > 1 && (
                <div className="border-t p-4">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            if (hasPreviousPage) setPage((p) => p - 1);
                          }}
                          aria-disabled={!hasPreviousPage}
                          className={!hasPreviousPage ? "pointer-events-none opacity-50" : ""}
                        />
                      </PaginationItem>
                      {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                        .map((p, i, arr) => (
                          <PaginationItem key={p}>
                            {i > 0 && arr[i - 1] !== p - 1 && (
                              <span className="px-2 text-muted-foreground">…</span>
                            )}
                            <PaginationLink
                              href="#"
                              onClick={(e) => {
                                e.preventDefault();
                                setPage(p);
                              }}
                              isActive={page === p}
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
                            if (hasNextPage) setPage((p) => p + 1);
                          }}
                          aria-disabled={!hasNextPage}
                          className={!hasNextPage ? "pointer-events-none opacity-50" : ""}
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

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display">
              Delete delivery man
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deleteTarget?.name}&quot;? This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
