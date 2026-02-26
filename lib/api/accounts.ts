import { apiClient } from "@/lib/api-client";
import type { AccountStatementDto, AgingReportDto } from "@/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5089";

export const accountsApi = {
  customerStatement: (id: number, params?: { fromDate?: string; toDate?: string }) =>
    apiClient.get<AccountStatementDto>(`/api/accounts/customer/${id}/statement`, params as Record<string, string>),

  supplierStatement: (id: number, params?: { fromDate?: string; toDate?: string }) =>
    apiClient.get<AccountStatementDto>(`/api/accounts/supplier/${id}/statement`, params as Record<string, string>),

  receivablesAging: () =>
    apiClient.get<AgingReportDto>("/api/accounts/aging/receivables"),

  payablesAging: () =>
    apiClient.get<AgingReportDto>("/api/accounts/aging/payables"),

  downloadCustomerStatementPdf: async (id: number, params?: { fromDate?: string; toDate?: string }) => {
    const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
    const url = new URL(`${API_BASE_URL}/api/accounts/customer/${id}/statement/pdf`);
    if (params?.fromDate) url.searchParams.set("fromDate", params.fromDate);
    if (params?.toDate) url.searchParams.set("toDate", params.toDate);
    const res = await fetch(url.toString(), {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) throw new Error("Failed to download statement");
    const blob = await res.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = blobUrl;
    link.setAttribute("download", `customer-statement-${id}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(blobUrl);
  },

  downloadSupplierStatementPdf: async (id: number, params?: { fromDate?: string; toDate?: string }) => {
    const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
    const url = new URL(`${API_BASE_URL}/api/accounts/supplier/${id}/statement/pdf`);
    if (params?.fromDate) url.searchParams.set("fromDate", params.fromDate);
    if (params?.toDate) url.searchParams.set("toDate", params.toDate);
    const res = await fetch(url.toString(), {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) throw new Error("Failed to download statement");
    const blob = await res.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = blobUrl;
    link.setAttribute("download", `supplier-statement-${id}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(blobUrl);
  },
};
