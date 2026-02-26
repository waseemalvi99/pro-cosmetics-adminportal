"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { paymentsApi } from "@/lib/api/payments";
import { suppliersApi } from "@/lib/api/suppliers";
import type { SupplierDto } from "@/types";
import { LedgerPaymentMethods } from "@/types";

const schema = z.object({
  supplierId: z.string().min(1, "Supplier is required"),
  amount: z.coerce.number().gt(0, "Amount must be greater than 0"),
  paymentMethod: z.string().min(1, "Payment method is required"),
  chequeNumber: z.string().optional(),
  bankName: z.string().optional(),
  chequeDate: z.string().optional(),
  bankAccountReference: z.string().optional(),
  notes: z.string().optional(),
}).refine(
  (d) => d.paymentMethod !== "1" || (!!d.chequeNumber && !!d.bankName && !!d.chequeDate),
  { message: "Cheque number, bank name, and cheque date are required for cheque payments", path: ["chequeNumber"] }
).refine(
  (d) => d.paymentMethod !== "2" || !!d.bankAccountReference,
  { message: "Bank account reference is required for bank transfers", path: ["bankAccountReference"] }
);

type FormData = z.infer<typeof schema>;

export default function SupplierPaymentPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { supplierId: "", amount: 0, paymentMethod: "", chequeNumber: "", bankName: "", chequeDate: "", bankAccountReference: "", notes: "" },
  });

  const paymentMethod = watch("paymentMethod");

  const { data: suppliersResp } = useQuery({
    queryKey: ["suppliers", "all"],
    queryFn: () => suppliersApi.list({ page: 1, pageSize: 500 }),
  });
  const suppliers = suppliersResp?.success && suppliersResp?.data ? suppliersResp.data.items : [];

  const mutation = useMutation({
    mutationFn: (data: FormData) =>
      paymentsApi.createSupplierPayment({
        supplierId: Number(data.supplierId),
        amount: data.amount,
        paymentMethod: Number(data.paymentMethod),
        chequeNumber: data.chequeNumber || null,
        bankName: data.bankName || null,
        chequeDate: data.chequeDate || null,
        bankAccountReference: data.bankAccountReference || null,
        notes: data.notes || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["ledger"] });
      toast.success("Supplier payment recorded");
      router.push("/payments");
    },
    onError: () => {
      toast.error("Failed to record payment");
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Record Supplier Payment" description="Record a payment made to a supplier" />
      <Card className="max-w-2xl">
        <CardHeader><CardTitle className="font-display">Payment details</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-6">
            <div className="space-y-2">
              <Label>Supplier *</Label>
              <Select value={watch("supplierId")} onValueChange={(v) => setValue("supplierId", v)}>
                <SelectTrigger><SelectValue placeholder="Select supplier" /></SelectTrigger>
                <SelectContent>
                  {suppliers.map((s: SupplierDto) => (
                    <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.supplierId && <p className="text-sm text-destructive">{errors.supplierId.message}</p>}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Amount *</Label>
                <Input type="number" min="0.01" step="0.01" {...register("amount")} placeholder="0.00" />
                {errors.amount && <p className="text-sm text-destructive">{errors.amount.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Payment Method *</Label>
                <Select value={paymentMethod} onValueChange={(v) => setValue("paymentMethod", v)}>
                  <SelectTrigger><SelectValue placeholder="Select method" /></SelectTrigger>
                  <SelectContent>
                    {LedgerPaymentMethods.map((m) => (
                      <SelectItem key={m.value} value={String(m.value)}>{m.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.paymentMethod && <p className="text-sm text-destructive">{errors.paymentMethod.message}</p>}
              </div>
            </div>

            {paymentMethod === "1" && (
              <div className="space-y-4 rounded-lg border p-4">
                <p className="text-sm font-medium">Cheque Details</p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Cheque Number *</Label>
                    <Input {...register("chequeNumber")} placeholder="CHQ-001" />
                  </div>
                  <div className="space-y-2">
                    <Label>Bank Name *</Label>
                    <Input {...register("bankName")} placeholder="National Bank" />
                  </div>
                  <div className="space-y-2">
                    <Label>Cheque Date *</Label>
                    <Input type="date" {...register("chequeDate")} />
                  </div>
                </div>
                {errors.chequeNumber && <p className="text-sm text-destructive">{errors.chequeNumber.message}</p>}
              </div>
            )}

            {paymentMethod === "2" && (
              <div className="space-y-4 rounded-lg border p-4">
                <p className="text-sm font-medium">Bank Transfer Details</p>
                <div className="space-y-2">
                  <Label>Bank Account Reference *</Label>
                  <Input {...register("bankAccountReference")} placeholder="TRX-123456" />
                </div>
                {errors.bankAccountReference && <p className="text-sm text-destructive">{errors.bankAccountReference.message}</p>}
              </div>
            )}

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea {...register("notes")} placeholder="Payment notes..." rows={3} />
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Recording...</> : "Record Payment"}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.push("/payments")} disabled={mutation.isPending}>Cancel</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
