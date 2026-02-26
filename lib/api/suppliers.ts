import { apiClient } from "@/lib/api-client";
import type { PagedResult, SupplierDto, CreateSupplierRequest, UpdateSupplierRequest } from "@/types";

export const suppliersApi = {
  list: (params?: { page?: number; pageSize?: number; search?: string }) =>
    apiClient.get<PagedResult<SupplierDto>>("/api/suppliers", params as Record<string, string | number>),

  getById: (id: number) =>
    apiClient.get<SupplierDto>(`/api/suppliers/${id}`),

  create: (data: CreateSupplierRequest) =>
    apiClient.post<number>("/api/suppliers", data),

  update: (id: number, data: UpdateSupplierRequest) =>
    apiClient.put<void>(`/api/suppliers/${id}`, data),

  delete: (id: number) =>
    apiClient.delete<void>(`/api/suppliers/${id}`),
};
