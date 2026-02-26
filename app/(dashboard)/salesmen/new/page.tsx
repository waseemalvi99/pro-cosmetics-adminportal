"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { salesmenApi } from "@/lib/api/salesmen";
import type { CreateSalesmanRequest } from "@/types";

const createSalesmanSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().optional(),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  commissionRate: z
    .number({ invalid_type_error: "Commission rate is required" })
    .min(0, "Commission rate must be at least 0")
    .max(100, "Commission rate must be at most 100"),
});

type CreateSalesmanForm = z.infer<typeof createSalesmanSchema>;

export default function NewSalesmanPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateSalesmanForm>({
    resolver: zodResolver(createSalesmanSchema),
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      commissionRate: 0,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: CreateSalesmanRequest) => {
      const res = await salesmenApi.create(data);
      if (!res.success) throw new Error(res.message || "Failed to create salesman");
      return res;
    },
    onSuccess: () => {
      toast.success("Salesman created", {
        description: "The salesman has been added successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["salesmen"] });
      router.push("/salesmen");
    },
    onError: (err: Error) => {
      toast.error("Create failed", { description: err.message });
    },
  });

  const onSubmit = (data: CreateSalesmanForm) => {
    createMutation.mutate({
      name: data.name,
      phone: data.phone || undefined,
      email: data.email || undefined,
      commissionRate: data.commissionRate,
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader title="New Salesman" description="Add a new salesman to your sales team" />

      <div className="max-w-2xl">
        <form onSubmit={handleSubmit(onSubmit)}>
          <Card>
            <CardHeader>
              <CardTitle className="font-display">Salesman details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  placeholder="e.g. Ahmed Salah"
                  {...register("name")}
                  aria-invalid={!!errors.name}
                />
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  placeholder="e.g. +201001234567"
                  {...register("phone")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="e.g. ahmed@company.com"
                  {...register("email")}
                  aria-invalid={!!errors.email}
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="commissionRate">Commission Rate (%)</Label>
                <Input
                  id="commissionRate"
                  type="number"
                  min={0}
                  max={100}
                  step={0.01}
                  placeholder="e.g. 5"
                  {...register("commissionRate", { valueAsNumber: true })}
                  aria-invalid={!!errors.commissionRate}
                />
                {errors.commissionRate && (
                  <p className="text-sm text-destructive">{errors.commissionRate.message}</p>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex gap-3 border-t pt-6">
              <Button type="submit" disabled={isSubmitting || createMutation.isPending}>
                {(isSubmitting || createMutation.isPending) && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Create Salesman
              </Button>
              <Button variant="outline" asChild>
                <Link href="/salesmen">Cancel</Link>
              </Button>
            </CardFooter>
          </Card>
        </form>
      </div>
    </div>
  );
}
