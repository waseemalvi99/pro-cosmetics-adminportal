import { apiClient } from "@/lib/api-client";
import type { PagedResult, PurchaseOrderDto, CreatePurchaseOrderRequest, ReceivePurchaseOrderRequest } from "@/types";

export const purchaseOrdersApi = {
  list: (params?: { page?: number; pageSize?: number; supplierId?: number }) =>
    apiClient.get<PagedResult<PurchaseOrderDto>>("/api/purchase-orders", params as Record<string, string | number>),

  getById: (id: number) =>
    apiClient.get<PurchaseOrderDto>(`/api/purchase-orders/${id}`),

  create: (data: CreatePurchaseOrderRequest) =>
    apiClient.post<number>("/api/purchase-orders", data),

  submit: (id: number) =>
    apiClient.put<void>(`/api/purchase-orders/${id}/submit`),

  receive: (id: number, data: ReceivePurchaseOrderRequest) =>
    apiClient.put<void>(`/api/purchase-orders/${id}/receive`, data),

  cancel: (id: number) =>
    apiClient.put<void>(`/api/purchase-orders/${id}/cancel`),
};
