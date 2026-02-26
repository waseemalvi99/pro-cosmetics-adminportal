import { apiClient } from "@/lib/api-client";
import type { PagedResult, SalesmanDto, CreateSalesmanRequest, UpdateSalesmanRequest } from "@/types";

export const salesmenApi = {
  list: (params?: { page?: number; pageSize?: number; search?: string }) =>
    apiClient.get<PagedResult<SalesmanDto>>("/api/salesmen", params as Record<string, string | number>),

  getById: (id: number) =>
    apiClient.get<SalesmanDto>(`/api/salesmen/${id}`),

  create: (data: CreateSalesmanRequest) =>
    apiClient.post<number>("/api/salesmen", data),

  update: (id: number, data: UpdateSalesmanRequest) =>
    apiClient.put<void>(`/api/salesmen/${id}`, data),

  delete: (id: number) =>
    apiClient.delete<void>(`/api/salesmen/${id}`),
};
