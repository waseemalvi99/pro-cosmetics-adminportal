"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
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
import { rolesApi } from "@/lib/api/roles";
import type { CreateRoleRequest, PermissionDto } from "@/types";

const createRoleSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  permissionIds: z.array(z.number()).optional(),
});

type CreateRoleForm = z.infer<typeof createRoleSchema>;

function groupByModule(permissions: PermissionDto[]): Record<string, PermissionDto[]> {
  return permissions.reduce<Record<string, PermissionDto[]>>((acc, p) => {
    const module = p.module || "Other";
    if (!acc[module]) acc[module] = [];
    acc[module].push(p);
    return acc;
  }, {});
}

export default function NewRolePage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: permissionsResponse } = useQuery({
    queryKey: ["permissions"],
    queryFn: () => rolesApi.getPermissions(),
  });

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
    formState: { errors, isSubmitting },
  } = useForm<CreateRoleForm>({
    resolver: zodResolver(createRoleSchema),
    defaultValues: {
      name: "",
      description: "",
      permissionIds: [],
    },
  });

  const permissionIds = watch("permissionIds") ?? [];

  const togglePermission = (id: number) => {
    const current = permissionIds as number[];
    if (current.includes(id)) {
      setValue(
        "permissionIds",
        current.filter((pid) => pid !== id)
      );
    } else {
      setValue("permissionIds", [...current, id]);
    }
  };

  const createMutation = useMutation({
    mutationFn: async (data: CreateRoleRequest) => {
      const res = await rolesApi.create(data);
      if (!res.success) throw new Error(res.message || "Failed to create role");
      return res;
    },
    onSuccess: () => {
      toast.success("Role created", {
        description: "The role has been added successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      router.push("/roles");
    },
    onError: (err: Error) => {
      toast.error("Create failed", { description: err.message });
    },
  });

  const onSubmit = (data: CreateRoleForm) => {
    createMutation.mutate({
      name: data.name,
      description: data.description || undefined,
      permissionIds: data.permissionIds?.length ? data.permissionIds : undefined,
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader title="New Role" description="Create a new role with permissions" />

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
                  placeholder="e.g. Manager"
                  {...register("name")}
                  aria-invalid={!!errors.name}
                />
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name.message}</p>
                )}
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
                disabled={isSubmitting || createMutation.isPending}
              >
                {(isSubmitting || createMutation.isPending) && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Create Role
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
