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
import { deliveryMenApi } from "@/lib/api/delivery-men";
import type { CreateDeliveryManRequest } from "@/types";

const createDeliveryManSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().optional(),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
});

type CreateDeliveryManForm = z.infer<typeof createDeliveryManSchema>;

export default function NewDeliveryManPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateDeliveryManForm>({
    resolver: zodResolver(createDeliveryManSchema),
    defaultValues: {
      name: "",
      phone: "",
      email: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: CreateDeliveryManRequest) => {
      const res = await deliveryMenApi.create(data);
      if (!res.success) throw new Error(res.message || "Failed to create delivery man");
      return res;
    },
    onSuccess: () => {
      toast.success("Delivery man created", {
        description: "The delivery man has been added successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["delivery-men"] });
      router.push("/delivery-men");
    },
    onError: (err: Error) => {
      toast.error("Create failed", { description: err.message });
    },
  });

  const onSubmit = (data: CreateDeliveryManForm) => {
    createMutation.mutate({
      name: data.name,
      phone: data.phone || undefined,
      email: data.email || undefined,
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="New Delivery Man"
        description="Add a new delivery man to your delivery team"
      />

      <div className="max-w-2xl">
        <form onSubmit={handleSubmit(onSubmit)}>
          <Card>
            <CardHeader>
              <CardTitle className="font-display">Delivery man details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  placeholder="e.g. Omar Khaled"
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
                  placeholder="e.g. omar@company.com"
                  {...register("email")}
                  aria-invalid={!!errors.email}
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email.message}</p>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex gap-3 border-t pt-6">
              <Button type="submit" disabled={isSubmitting || createMutation.isPending}>
                {(isSubmitting || createMutation.isPending) && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Create Delivery Man
              </Button>
              <Button variant="outline" asChild>
                <Link href="/delivery-men">Cancel</Link>
              </Button>
            </CardFooter>
          </Card>
        </form>
      </div>
    </div>
  );
}
