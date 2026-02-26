import { apiClient } from "@/lib/api-client";
import type { InventoryDto, AdjustInventoryRequest } from "@/types";

export const inventoryApi = {
  list: () =>
    apiClient.get<InventoryDto[]>("/api/inventory"),

  lowStock: () =>
    apiClient.get<InventoryDto[]>("/api/inventory/low-stock"),

  adjust: (data: AdjustInventoryRequest) =>
    apiClient.post<void>("/api/inventory/adjust", data),
};
