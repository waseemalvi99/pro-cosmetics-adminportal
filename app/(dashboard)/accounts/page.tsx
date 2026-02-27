"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { SearchableCombobox } from "@/components/ui/searchable-combobox";
import { useCustomerCombo, useSupplierCombo } from "@/hooks/use-combo-search";

export default function AccountsPage() {
  const router = useRouter();
  const [accountType, setAccountType] = useState<"customer" | "supplier">("customer");
  const [selectedId, setSelectedId] = useState("");

  const customerCombo = useCustomerCombo();
  const supplierCombo = useSupplierCombo();

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
            {accountType === "customer" ? (
              <SearchableCombobox
                options={customerCombo.options}
                value={selectedId}
                onValueChange={setSelectedId}
                onSearchChange={customerCombo.setSearch}
                isLoading={customerCombo.isLoading}
                placeholder="Select customer..."
                searchPlaceholder="Search customers..."
                emptyMessage="No customers found."
              />
            ) : (
              <SearchableCombobox
                options={supplierCombo.options}
                value={selectedId}
                onValueChange={setSelectedId}
                onSearchChange={supplierCombo.setSearch}
                isLoading={supplierCombo.isLoading}
                placeholder="Select supplier..."
                searchPlaceholder="Search suppliers..."
                emptyMessage="No suppliers found."
              />
            )}
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
