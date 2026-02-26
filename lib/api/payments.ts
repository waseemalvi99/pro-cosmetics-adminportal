import { apiClient } from "@/lib/api-client";
import type {
  PagedResult,
  PaymentDto,
  CreateCustomerPaymentRequest,
  CreateSupplierPaymentRequest,
} from "@/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5089";

export const paymentsApi = {
  list: (params?: { page?: number; pageSize?: number; customerId?: number; supplierId?: number }) =>
    apiClient.get<PagedResult<PaymentDto>>("/api/payments", params as Record<string, string | number>),

  getById: (id: number) =>
    apiClient.get<PaymentDto>(`/api/payments/${id}`),

  createCustomerPayment: (data: CreateCustomerPaymentRequest) =>
    apiClient.post<number>("/api/payments/customer", data),

  createSupplierPayment: (data: CreateSupplierPaymentRequest) =>
    apiClient.post<number>("/api/payments/supplier", data),

  void: (id: number) =>
    apiClient.delete<void>(`/api/payments/${id}`),

  downloadPdf: async (id: number, receiptNumber: string) => {
    const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
    const res = await fetch(`${API_BASE_URL}/api/payments/${id}/pdf`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) throw new Error("Failed to download receipt");
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `receipt-${receiptNumber}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};
