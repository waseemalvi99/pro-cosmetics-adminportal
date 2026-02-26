import { apiClient } from "@/lib/api-client";
import type { PagedResult, CreditDebitNoteDto, CreateCreditDebitNoteRequest } from "@/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5089";

export const creditDebitNotesApi = {
  list: (params?: { page?: number; pageSize?: number; customerId?: number; supplierId?: number }) =>
    apiClient.get<PagedResult<CreditDebitNoteDto>>("/api/credit-debit-notes", params as Record<string, string | number>),

  getById: (id: number) =>
    apiClient.get<CreditDebitNoteDto>(`/api/credit-debit-notes/${id}`),

  create: (data: CreateCreditDebitNoteRequest) =>
    apiClient.post<number>("/api/credit-debit-notes", data),

  void: (id: number) =>
    apiClient.delete<void>(`/api/credit-debit-notes/${id}`),

  downloadPdf: async (id: number, noteNumber: string) => {
    const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
    const res = await fetch(`${API_BASE_URL}/api/credit-debit-notes/${id}/pdf`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) throw new Error("Failed to download note");
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `note-${noteNumber}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};
