import { apiClient } from "@/lib/api-client";
import type { PagedResult, LedgerEntryDto, CreateManualLedgerEntryRequest } from "@/types";

export const ledgerApi = {
  list: (params?: { page?: number; pageSize?: number; customerId?: number; supplierId?: number }) =>
    apiClient.get<PagedResult<LedgerEntryDto>>("/api/ledger", params as Record<string, string | number>),

  getById: (id: number) =>
    apiClient.get<LedgerEntryDto>(`/api/ledger/${id}`),

  createManual: (data: CreateManualLedgerEntryRequest) =>
    apiClient.post<number>("/api/ledger/manual", data),
};
