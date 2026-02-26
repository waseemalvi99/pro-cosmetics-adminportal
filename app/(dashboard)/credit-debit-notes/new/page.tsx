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
import { creditDebitNotesApi } from "@/lib/api/credit-debit-notes";
import { customersApi } from "@/lib/api/customers";
import { suppliersApi } from "@/lib/api/suppliers";
import type { CustomerDto, SupplierDto } from "@/types";
import { NoteTypes, NoteAccountTypes } from "@/types";

const schema = z.object({
  noteType: z.string().min(1, "Note type is required"),
  accountType: z.string().min(1, "Account type is required"),
  customerId: z.string().optional(),
  supplierId: z.string().optional(),
  amount: z.coerce.number().gt(0, "Amount must be greater than 0"),
  reason: z.string().min(1, "Reason is required"),
  saleId: z.string().optional(),
  purchaseOrderId: z.string().optional(),
}).refine(
  (d) => d.accountType !== "0" || !!d.customerId,
  { message: "Customer is required", path: ["customerId"] }
).refine(
  (d) => d.accountType !== "1" || !!d.supplierId,
  { message: "Supplier is required", path: ["supplierId"] }
);

type FormData = z.infer<typeof schema>;

export default function NewCreditDebitNotePage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      noteType: "", accountType: "", customerId: "", supplierId: "",
      amount: 0, reason: "", saleId: "", purchaseOrderId: "",
    },
  });

  const accountType = watch("accountType");

  const { data: customersResp } = useQuery({
    queryKey: ["customers", "all"],
    queryFn: () => customersApi.list({ page: 1, pageSize: 500 }),
  });
  const { data: suppliersResp } = useQuery({
    queryKey: ["suppliers", "all"],
    queryFn: () => suppliersApi.list({ page: 1, pageSize: 500 }),
  });
  const customers = customersResp?.success && customersResp?.data ? customersResp.data.items : [];
  const suppliers = suppliersResp?.success && suppliersResp?.data ? suppliersResp.data.items : [];

  const mutation = useMutation({
    mutationFn: (data: FormData) =>
      creditDebitNotesApi.create({
        noteType: Number(data.noteType),
        accountType: Number(data.accountType),
        customerId: data.customerId ? Number(data.customerId) : null,
        supplierId: data.supplierId ? Number(data.supplierId) : null,
        amount: data.amount,
        reason: data.reason,
        saleId: data.saleId ? Number(data.saleId) : null,
        purchaseOrderId: data.purchaseOrderId ? Number(data.purchaseOrderId) : null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["credit-debit-notes"] });
      queryClient.invalidateQueries({ queryKey: ["ledger"] });
      toast.success("Note created");
      router.push("/credit-debit-notes");
    },
    onError: () => {
      toast.error("Failed to create note");
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader title="New Credit / Debit Note" description="Create a credit or debit note" />
      <Card className="max-w-2xl">
        <CardHeader><CardTitle className="font-display">Note details</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Note Type *</Label>
                <Select value={watch("noteType")} onValueChange={(v) => setValue("noteType", v)}>
                  <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    {NoteTypes.map((t) => (
                      <SelectItem key={t.value} value={String(t.value)}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.noteType && <p className="text-sm text-destructive">{errors.noteType.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Account Type *</Label>
                <Select value={accountType} onValueChange={(v) => { setValue("accountType", v); setValue("customerId", ""); setValue("supplierId", ""); }}>
                  <SelectTrigger><SelectValue placeholder="Select account" /></SelectTrigger>
                  <SelectContent>
                    {NoteAccountTypes.map((t) => (
                      <SelectItem key={t.value} value={String(t.value)}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.accountType && <p className="text-sm text-destructive">{errors.accountType.message}</p>}
              </div>
            </div>

            {accountType === "0" && (
              <div className="space-y-2">
                <Label>Customer *</Label>
                <Select value={watch("customerId") ?? ""} onValueChange={(v) => setValue("customerId", v)}>
                  <SelectTrigger><SelectValue placeholder="Select customer" /></SelectTrigger>
                  <SelectContent>
                    {customers.map((c: CustomerDto) => (
                      <SelectItem key={c.id} value={String(c.id)}>{c.fullName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.customerId && <p className="text-sm text-destructive">{errors.customerId.message}</p>}
              </div>
            )}

            {accountType === "1" && (
              <div className="space-y-2">
                <Label>Supplier *</Label>
                <Select value={watch("supplierId") ?? ""} onValueChange={(v) => setValue("supplierId", v)}>
                  <SelectTrigger><SelectValue placeholder="Select supplier" /></SelectTrigger>
                  <SelectContent>
                    {suppliers.map((s: SupplierDto) => (
                      <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.supplierId && <p className="text-sm text-destructive">{errors.supplierId.message}</p>}
              </div>
            )}

            <div className="space-y-2">
              <Label>Amount *</Label>
              <Input type="number" min="0.01" step="0.01" {...register("amount")} placeholder="0.00" />
              {errors.amount && <p className="text-sm text-destructive">{errors.amount.message}</p>}
            </div>

            <div className="space-y-2">
              <Label>Reason *</Label>
              <Textarea {...register("reason")} placeholder="Reason for this note..." rows={3} />
              {errors.reason && <p className="text-sm text-destructive">{errors.reason.message}</p>}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Related Sale ID</Label>
                <Input type="number" {...register("saleId")} placeholder="Optional" />
              </div>
              <div className="space-y-2">
                <Label>Related PO ID</Label>
                <Input type="number" {...register("purchaseOrderId")} placeholder="Optional" />
              </div>
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating...</> : "Create Note"}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.push("/credit-debit-notes")} disabled={mutation.isPending}>Cancel</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
