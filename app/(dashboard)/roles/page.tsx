"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { rolesApi } from "@/lib/api/roles";
import type { RoleDto } from "@/types";

export default function RolesPage() {
  const queryClient = useQueryClient();
  const [deleteTarget, setDeleteTarget] = useState<RoleDto | null>(null);

  const { data: response, isLoading } = useQuery({
    queryKey: ["roles"],
    queryFn: () => rolesApi.list(),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await rolesApi.delete(id);
      if (!res.success) throw new Error(res.message || "Failed to delete role");
      return res;
    },
    onSuccess: () => {
      toast.success("Role deleted", {
        description: "The role has been removed successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      setDeleteTarget(null);
    },
    onError: (err: unknown) => {
      const message =
        err && typeof err === "object" && "message" in err
          ? String((err as { message: string }).message)
          : "Failed to delete role. Please try again.";
      toast.error("Delete failed", { description: message });
    },
  });

  const roles: RoleDto[] =
    response?.success && response?.data ? response.data : [];

  const handleDeleteConfirm = () => {
    if (deleteTarget) {
      deleteMutation.mutate(deleteTarget.id);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Roles & Permissions"
        description="Manage roles and access control"
        action={
          <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Link href="/roles/new">
              <Plus className="h-4 w-4" />
              Add Role
            </Link>
          </Button>
        }
      />

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="mt-2 h-4 w-full" />
                <Skeleton className="mt-4 h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : roles.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <p className="font-display text-lg font-semibold text-muted-foreground">
              No roles yet
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Get started by creating your first role.
            </p>
            <Button asChild className="mt-4">
              <Link href="/roles/new">
                <Plus className="h-4 w-4" />
                Add Role
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {roles.map((role) => (
            <Card key={role.id}>
              <CardContent className="p-6">
                <h3 className="font-display text-lg font-bold">{role.name}</h3>
                <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                  {role.description || "No description"}
                </p>
                <div className="mt-4 flex items-center justify-between">
                  <Badge variant="secondary">
                    {role.permissions?.length ?? 0} permission
                    {(role.permissions?.length ?? 0) !== 1 ? "s" : ""}
                  </Badge>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon-sm" asChild>
                      <Link href={`/roles/${role.id}/edit`}>
                        <Pencil className="h-4 w-4" />
                        <span className="sr-only">Edit</span>
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => setDeleteTarget(role)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                      <span className="sr-only">Delete</span>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display">
              Delete role
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deleteTarget?.name}&quot;?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={(e) => {
                e.preventDefault();
                handleDeleteConfirm();
              }}
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
