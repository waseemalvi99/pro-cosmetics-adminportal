"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Mail } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usersApi } from "@/lib/api/users";
import { useRoleCombo } from "@/hooks/use-combo-search";
import type { CreateUserRequest } from "@/types";

const createUserSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  email: z.string().min(1, "Email is required").email("Invalid email address"),
  roleName: z.string().optional(),
});

type CreateUserForm = z.infer<typeof createUserSchema>;

export default function NewUserPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const roleCombo = useRoleCombo();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CreateUserForm>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      fullName: "",
      email: "",
      roleName: undefined,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: CreateUserRequest) => {
      const res = await usersApi.register(data);
      if (!res.success) throw new Error(res.message || "Failed to create user");
      return res;
    },
    onSuccess: () => {
      toast.success("User created successfully", {
        description: "Login credentials have been sent to the user's email.",
        icon: <Mail className="h-4 w-4" />,
      });
      queryClient.invalidateQueries({ queryKey: ["users"] });
      router.push("/users");
    },
    onError: (err: Error) => {
      toast.error("Create failed", { description: err.message });
    },
  });

  const onSubmit = (data: CreateUserForm) => {
    createMutation.mutate({
      fullName: data.fullName,
      email: data.email,
      roleName: data.roleName || null,
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="New User"
        description="Create a new user account. A secure password will be generated and emailed automatically."
      />

      <div className="max-w-2xl">
        <form onSubmit={handleSubmit(onSubmit)}>
          <Card>
            <CardHeader>
              <CardTitle className="font-display">User details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  placeholder="e.g. John Doe"
                  {...register("fullName")}
                  aria-invalid={!!errors.fullName}
                />
                {errors.fullName && (
                  <p className="text-sm text-destructive">
                    {errors.fullName.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="e.g. john@example.com"
                  {...register("email")}
                  aria-invalid={!!errors.email}
                />
                {errors.email && (
                  <p className="text-sm text-destructive">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="roleName">Role (optional)</Label>
                <Select
                  onValueChange={(value) => setValue("roleName", value)}
                >
                  <SelectTrigger id="roleName">
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roleCombo.options.map((role) => (
                      <SelectItem key={role.value} value={role.label}>
                        {role.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="rounded-md border border-blue-200 bg-blue-50 p-3 dark:border-blue-900 dark:bg-blue-950">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  A secure password will be auto-generated and sent to the
                  user&apos;s email address. The user can change their password
                  after logging in.
                </p>
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
                Create User
              </Button>
              <Button variant="outline" asChild>
                <Link href="/users">Cancel</Link>
              </Button>
            </CardFooter>
          </Card>
        </form>
      </div>
    </div>
  );
}
