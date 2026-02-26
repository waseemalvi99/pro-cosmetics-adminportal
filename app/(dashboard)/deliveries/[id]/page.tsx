"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Package, Truck, CheckCircle, Clock } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { deliveriesApi } from "@/lib/api/deliveries";
import type { DeliveryDto } from "@/types";

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

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function DeliveryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const id = params.id ? Number(params.id) : NaN;

  const [pickupNotes, setPickupNotes] = useState("");
  const [deliverNotes, setDeliverNotes] = useState("");

  const { data: response, isLoading } = useQuery({
    queryKey: ["deliveries", id],
    queryFn: () => deliveriesApi.getById(id),
    enabled: !isNaN(id),
  });

  const markPickedUpMutation = useMutation({
    mutationFn: () =>
      deliveriesApi.markPickedUp(id, pickupNotes ? { notes: pickupNotes } : undefined),
    onSuccess: () => {
      toast.success("Marked as picked up", {
        description: "The delivery has been updated.",
      });
      queryClient.invalidateQueries({ queryKey: ["deliveries"] });
      queryClient.invalidateQueries({ queryKey: ["deliveries", id] });
      setPickupNotes("");
    },
    onError: (err: Error) => {
      toast.error("Update failed", { description: err.message });
    },
  });

  const markDeliveredMutation = useMutation({
    mutationFn: () =>
      deliveriesApi.markDelivered(id, deliverNotes ? { notes: deliverNotes } : undefined),
    onSuccess: () => {
      toast.success("Marked as delivered", {
        description: "The delivery has been completed.",
      });
      queryClient.invalidateQueries({ queryKey: ["deliveries"] });
      queryClient.invalidateQueries({ queryKey: ["deliveries", id] });
      setDeliverNotes("");
    },
    onError: (err: Error) => {
      toast.error("Update failed", { description: err.message });
    },
  });

  const delivery: DeliveryDto | null =
    response?.success && response?.data ? response.data : null;
  const error = response && !response.success;

  const canMarkPickedUp =
    delivery &&
    (delivery.status === "Pending" || delivery.status === "Assigned");
  const canMarkDelivered =
    delivery &&
    (delivery.status === "PickedUp" || delivery.status === "InTransit");

  if (isLoading || (!delivery && !error)) {
    return (
      <div className="space-y-6">
        <PageHeader title="Delivery Details" description="View delivery information" />
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !delivery) {
    return (
      <div className="space-y-6">
        <PageHeader title="Delivery Details" description="View delivery information" />
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <p className="font-display text-lg font-semibold text-muted-foreground">
              Delivery not found
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              The delivery you&apos;re looking for doesn&apos;t exist or has been removed.
            </p>
            <Button asChild className="mt-4">
              <Link href="/deliveries">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Deliveries
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const timelineSteps = [
    {
      label: "Created",
      icon: Clock,
      date: delivery.createdAt,
      completed: true,
    },
    {
      label: "Assigned",
      icon: Package,
      date: delivery.assignedAt,
      completed: !!delivery.assignedAt || !!delivery.deliveryManId,
    },
    {
      label: "Picked Up",
      icon: Truck,
      date: delivery.pickedUpAt,
      completed: !!delivery.pickedUpAt,
    },
    {
      label: "Delivered",
      icon: CheckCircle,
      date: delivery.deliveredAt,
      completed: !!delivery.deliveredAt,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Delivery Details"
        description="View and update delivery status"
        action={
          <Button variant="outline" asChild>
            <Link href="/deliveries">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Deliveries
            </Link>
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="font-display">Delivery information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Sale</p>
              <Link
                href={`/sales/${delivery.saleId}`}
                className="font-display font-medium text-primary hover:underline"
              >
                {delivery.saleNumber}
              </Link>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Delivery Man</p>
              <p className="font-medium">{delivery.deliveryManName ?? "—"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <StatusBadge status={delivery.status} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Delivery Address</p>
              <p className="font-medium">{delivery.deliveryAddress || "—"}</p>
            </div>
            {delivery.notes && (
              <div>
                <p className="text-sm text-muted-foreground">Notes</p>
                <p className="font-medium">{delivery.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-display">Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative space-y-6">
              {timelineSteps.map((step, i) => {
                const Icon = step.icon;
                return (
                  <div key={step.label} className="relative flex gap-4">
                    <div className="flex flex-col items-center">
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                          step.completed
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      {i < timelineSteps.length - 1 && (
                        <div className="mt-2 h-6 w-px bg-border" />
                      )}
                    </div>
                    <div className="flex-1 pb-6">
                      <p className="font-display font-medium">{step.label}</p>
                      <p className="text-sm text-muted-foreground">
                        {step.completed && step.date
                          ? formatDate(step.date)
                          : step.completed
                            ? "—"
                            : "Pending"}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {(canMarkPickedUp || canMarkDelivered) && (
        <Card>
          <CardHeader>
            <CardTitle className="font-display">Update status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {canMarkPickedUp && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="pickupNotes">Notes (optional)</Label>
                  <Textarea
                    id="pickupNotes"
                    placeholder="Add notes for pickup..."
                    rows={2}
                    value={pickupNotes}
                    onChange={(e) => setPickupNotes(e.target.value)}
                  />
                </div>
                <Button
                  onClick={() => markPickedUpMutation.mutate()}
                  disabled={markPickedUpMutation.isPending}
                >
                  {markPickedUpMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Mark as Picked Up
                </Button>
              </div>
            )}
            {canMarkDelivered && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="deliverNotes">Notes (optional)</Label>
                  <Textarea
                    id="deliverNotes"
                    placeholder="Add notes for delivery..."
                    rows={2}
                    value={deliverNotes}
                    onChange={(e) => setDeliverNotes(e.target.value)}
                  />
                </div>
                <Button
                  onClick={() => markDeliveredMutation.mutate()}
                  disabled={markDeliveredMutation.isPending}
                >
                  {markDeliveredMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Mark as Delivered
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
