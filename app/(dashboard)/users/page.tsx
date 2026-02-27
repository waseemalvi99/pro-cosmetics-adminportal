"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { MoreHorizontal, Search } from "lucide-react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { usersApi } from "@/lib/api/users";
import { useRoleCombo } from "@/hooks/use-combo-search";
import type { UserDto } from "@/types";

const PAGE_SIZE = 10;

export default function UsersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const { data: response, isLoading } = useQuery({
    queryKey: ["users", page, search],
    queryFn: () =>
      usersApi.list({ page, pageSize: PAGE_SIZE, search: search || undefined }),
  });

  const roleCombo = useRoleCombo();

  const toggleActiveMutation = useMutation({
    mutationFn: (id: number) => usersApi.toggleActive(id),
    onSuccess: () => {
      toast.success("User status updated");
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (err: unknown) => {
      const message =
        err && typeof err === "object" && "message" in err
          ? String((err as { message: string }).message)
          : "Failed to update user status.";
      toast.error("Update failed", { description: message });
    },
  });

  const assignRoleMutation = useMutation({
    mutationFn: ({ id, roleName }: { id: number; roleName: string }) =>
      usersApi.assignRole(id, { roleName }),
    onSuccess: () => {
      toast.success("Role assigned successfully");
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (err: unknown) => {
      const message =
        err && typeof err === "object" && "message" in err
          ? String((err as { message: string }).message)
          : "Failed to assign role.";
      toast.error("Assign role failed", { description: message });
    },
  });

  const pagedData = response?.success && response?.data ? response.data : null;
  const users = pagedData?.items ?? [];
  const totalPages = pagedData?.totalPages ?? 0;

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString();
    } catch {
      return "—";
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Users"
        description="Manage user accounts and access"
      />

      <Card>
        <CardContent className="p-4">
          <div className="mb-4 flex items-center gap-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-9"
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
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-8 w-8" />
                </div>
              ))}
            </div>
          ) : users.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <p className="font-display text-lg font-semibold text-muted-foreground">
                No users found
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Try adjusting your search or filters.
              </p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Full Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Roles</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="w-[120px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        {user.fullName}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {user.email}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {user.roles?.length ? (
                            user.roles.map((role) => (
                              <Badge key={role} variant="secondary" className="text-xs">
                                {role}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={user.isActive ? "default" : "secondary"}
                          className={
                            user.isActive
                              ? "bg-green-600 hover:bg-green-600/90"
                              : ""
                          }
                        >
                          {user.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(user.createdAt)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Select
                            onValueChange={(roleName) =>
                              assignRoleMutation.mutate({ id: user.id, roleName })
                            }
                          >
                            <SelectTrigger
                              size="sm"
                              className="h-8 w-[140px]"
                              disabled={assignRoleMutation.isPending}
                            >
                              <SelectValue placeholder="Assign Role" />
                            </SelectTrigger>
                            <SelectContent>
                              {roleCombo.options.map((role) => (
                                <SelectItem key={role.value} value={role.label}>
                                  {role.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                className="h-8 w-8"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Open menu</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() =>
                                  toggleActiveMutation.mutate(user.id)
                                }
                                disabled={toggleActiveMutation.isPending}
                              >
                                {user.isActive ? "Deactivate" : "Activate"}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
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
    </div>
  );
}
