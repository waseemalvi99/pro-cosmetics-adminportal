"use client";

import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { rolesApi } from "@/lib/api/roles";
import type { PermissionDto, UpdateRoleRequest } from "@/types";

const updateRoleSchema = z.object({
  description: z.string().optional(),
  permissionIds: z.array(z.number()),
});

type UpdateRoleForm = z.infer<typeof updateRoleSchema>;

function groupByModule(permissions: PermissionDto[]): Record<string, PermissionDto[]> {
  return permissions.reduce<Record<string, PermissionDto[]>>((acc, p) => {
    const module = p.module || "Other";
    if (!acc[module]) acc[module] = [];
    acc[module].push(p);
    return acc;
  }, {});
}

export default function EditRolePage() {
  const router = useRouter();
  const params = useParams();
  const queryClient = useQueryClient();
  const id = params.id ? Number(params.id) : NaN;

  const { data: roleResponse, isLoading: roleLoading } = useQuery({
    queryKey: ["roles", id],
    queryFn: () => rolesApi.getById(id),
    enabled: !isNaN(id),
  });

  const { data: permissionsResponse } = useQuery({
    queryKey: ["permissions"],
    queryFn: () => rolesApi.getPermissions(),
  });

  const role = roleResponse?.success && roleResponse?.data ? roleResponse.data : null;
  const roleError = roleResponse && !roleResponse.success;
  const permissions: PermissionDto[] =
    permissionsResponse?.success && permissionsResponse?.data
      ? permissionsResponse.data
      : [];
  const permissionsByModule = groupByModule(permissions);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UpdateRoleForm>({
    resolver: zodResolver(updateRoleSchema),
    defaultValues: {
      description: "",
      permissionIds: [],
    },
  });

  const permissionIds = watch("permissionIds") ?? [];

  useEffect(() => {
    if (role) {
      reset({
        description: role.description ?? "",
        permissionIds: role.permissions?.map((p) => p.id) ?? [],
      });
    }
  }, [role, reset]);

  const togglePermission = (permId: number) => {
    const current = permissionIds as number[];
    if (current.includes(permId)) {
      setValue(
        "permissionIds",
        current.filter((pid) => pid !== permId)
      );
    } else {
      setValue("permissionIds", [...current, permId]);
    }
  };

  const updateMutation = useMutation({
    mutationFn: async (data: UpdateRoleRequest) => {
      const res = await rolesApi.update(id, data);
      if (!res.success) throw new Error(res.message || "Failed to update role");
      return res;
    },
    onSuccess: () => {
      toast.success("Role updated", {
        description: "The role has been saved successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      queryClient.invalidateQueries({ queryKey: ["roles", id] });
      router.push("/roles");
    },
    onError: (err: Error) => {
      toast.error("Update failed", { description: err.message });
    },
  });

  const onSubmit = (data: UpdateRoleForm) => {
    updateMutation.mutate({
      description: data.description || undefined,
      permissionIds: data.permissionIds,
    });
  };

  if (roleLoading || (!role && !roleError)) {
    return (
      <div className="space-y-6">
        <PageHeader title="Edit Role" description="Update role details" />
        <div className="max-w-2xl">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-40" />
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-9 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-24 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-32 w-full" />
              </div>
            </CardContent>
            <CardFooter>
              <Skeleton className="h-9 w-32" />
            </CardFooter>
          </Card>
        </div>
      </div>
    );
  }

  if (roleError || !role) {
    return (
      <div className="space-y-6">
        <PageHeader title="Edit Role" description="Update role details" />
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <p className="font-display text-lg font-semibold text-muted-foreground">
              Role not found
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              The role you&apos;re looking for doesn&apos;t exist or has been
              removed.
            </p>
            <Button asChild className="mt-4">
              <Link href="/roles">Back to Roles</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Edit Role" description="Update role details and permissions" />

      <div className="max-w-2xl">
        <form onSubmit={handleSubmit(onSubmit)}>
          <Card>
            <CardHeader>
              <CardTitle className="font-display">Role details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={role.name}
                  disabled
                  className="bg-muted"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Optional description for this role"
                  rows={4}
                  className="resize-none"
                  {...register("description")}
                />
              </div>

              <div className="space-y-4">
                <Label>Permissions</Label>
                <div className="space-y-6 rounded-md border p-4">
                  {Object.entries(permissionsByModule).map(([module, perms]) => (
                    <div key={module}>
                      <h4 className="font-display text-sm font-semibold text-foreground">
                        {module}
                      </h4>
                      <div className="mt-2 flex flex-col gap-2">
                        {perms.map((perm) => (
                          <label
                            key={perm.id}
                            className="flex cursor-pointer items-center gap-2"
                          >
                            <Checkbox
                              checked={permissionIds.includes(perm.id)}
                              onCheckedChange={() => togglePermission(perm.id)}
                            />
                            <span className="text-sm">
                              {perm.name}
                              {perm.description && (
                                <span className="ml-1 text-muted-foreground">
                                  — {perm.description}
                                </span>
                              )}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                  {permissions.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      No permissions available.
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex gap-3 border-t pt-6">
              <Button
                type="submit"
                disabled={isSubmitting || updateMutation.isPending}
              >
                {(isSubmitting || updateMutation.isPending) && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Save Changes
              </Button>
              <Button variant="outline" asChild>
                <Link href="/roles">Cancel</Link>
              </Button>
            </CardFooter>
          </Card>
        </form>
      </div>
    </div>
  );
}
