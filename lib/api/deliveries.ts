import { apiClient } from "@/lib/api-client";
import type { PagedResult, DeliveryDto, CreateDeliveryRequest, UpdateDeliveryStatusRequest } from "@/types";

export const deliveriesApi = {
  list: (params?: { page?: number; pageSize?: number; deliveryManId?: number; status?: string }) =>
    apiClient.get<PagedResult<DeliveryDto>>("/api/deliveries", params as Record<string, string | number>),

  getById: (id: number) =>
    apiClient.get<DeliveryDto>(`/api/deliveries/${id}`),

  create: (data: CreateDeliveryRequest) =>
    apiClient.post<number>("/api/deliveries", data),

  markPickedUp: (id: number, data?: UpdateDeliveryStatusRequest) =>
    apiClient.put<void>(`/api/deliveries/${id}/pickup`, data),

  markDelivered: (id: number, data?: UpdateDeliveryStatusRequest) =>
    apiClient.put<void>(`/api/deliveries/${id}/deliver`, data),
};
