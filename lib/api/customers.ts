import { apiClient } from "@/lib/api-client";
import type { PagedResult, CustomerDto, CreateCustomerRequest, UpdateCustomerRequest } from "@/types";

export const customersApi = {
  list: (params?: { page?: number; pageSize?: number; search?: string }) =>
    apiClient.get<PagedResult<CustomerDto>>("/api/customers", params as Record<string, string | number>),

  getById: (id: number) =>
    apiClient.get<CustomerDto>(`/api/customers/${id}`),

  create: (data: CreateCustomerRequest) =>
    apiClient.post<number>("/api/customers", data),

  update: (id: number, data: UpdateCustomerRequest) =>
    apiClient.put<void>(`/api/customers/${id}`, data),

  delete: (id: number) =>
    apiClient.delete<void>(`/api/customers/${id}`),
};
