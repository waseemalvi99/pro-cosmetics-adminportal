import { apiClient } from "@/lib/api-client";
import type { PagedResult, SaleDto, CreateSaleRequest, SalesReturnRequest } from "@/types";

export const salesApi = {
  list: (params?: { page?: number; pageSize?: number; customerId?: number; salesmanId?: number }) =>
    apiClient.get<PagedResult<SaleDto>>("/api/sales", params as Record<string, string | number>),

  getById: (id: number) =>
    apiClient.get<SaleDto>(`/api/sales/${id}`),

  create: (data: CreateSaleRequest) =>
    apiClient.post<number>("/api/sales", data),

  cancel: (id: number) =>
    apiClient.put<void>(`/api/sales/${id}/cancel`),

  returnSale: (id: number, data: SalesReturnRequest) =>
    apiClient.put<void>(`/api/sales/${id}/return`, data),
};
