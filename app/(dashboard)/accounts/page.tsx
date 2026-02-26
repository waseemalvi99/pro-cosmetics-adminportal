"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { FileSpreadsheet } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { customersApi } from "@/lib/api/customers";
import { suppliersApi } from "@/lib/api/suppliers";
import type { CustomerDto, SupplierDto } from "@/types";

export default function AccountsPage() {
  const router = useRouter();
  const [accountType, setAccountType] = useState<"customer" | "supplier">("customer");
  const [selectedId, setSelectedId] = useState("");

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

  const handleViewStatement = () => {
    if (!selectedId) return;
    router.push(`/accounts/${accountType}/${selectedId}`);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Account Statements"
        description="View financial statements for customers and suppliers"
      />

      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle className="font-display">Select an account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Account Type</Label>
            <Select
              value={accountType}
              onValueChange={(v) => {
                setAccountType(v as "customer" | "supplier");
                setSelectedId("");
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="customer">Customer</SelectItem>
                <SelectItem value="supplier">Supplier</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>{accountType === "customer" ? "Customer" : "Supplier"}</Label>
            <Select value={selectedId} onValueChange={setSelectedId}>
              <SelectTrigger>
                <SelectValue placeholder={`Select ${accountType}...`} />
              </SelectTrigger>
              <SelectContent>
                {accountType === "customer"
                  ? customers.map((c: CustomerDto) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.fullName}
                      </SelectItem>
                    ))
                  : suppliers.map((s: SupplierDto) => (
                      <SelectItem key={s.id} value={String(s.id)}>
                        {s.name}
                      </SelectItem>
                    ))}
              </SelectContent>
            </Select>
          </div>

          <Button onClick={handleViewStatement} disabled={!selectedId} className="w-full">
            <FileSpreadsheet className="h-4 w-4" />
            View Statement
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
