import { apiClient } from "@/lib/api-client";
import type { PagedResult, DeliveryManDto, CreateDeliveryManRequest, UpdateDeliveryManRequest } from "@/types";

export const deliveryMenApi = {
  list: (params?: { page?: number; pageSize?: number; search?: string }) =>
    apiClient.get<PagedResult<DeliveryManDto>>("/api/delivery-men", params as Record<string, string | number>),

  getById: (id: number) =>
    apiClient.get<DeliveryManDto>(`/api/delivery-men/${id}`),

  create: (data: CreateDeliveryManRequest) =>
    apiClient.post<number>("/api/delivery-men", data),

  update: (id: number, data: UpdateDeliveryManRequest) =>
    apiClient.put<void>(`/api/delivery-men/${id}`, data),

  delete: (id: number) =>
    apiClient.delete<void>(`/api/delivery-men/${id}`),
};
