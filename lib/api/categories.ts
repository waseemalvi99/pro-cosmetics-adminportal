import { apiClient } from "@/lib/api-client";
import type { CategoryDto, CreateCategoryRequest, UpdateCategoryRequest } from "@/types";

export const categoriesApi = {
  list: () =>
    apiClient.get<CategoryDto[]>("/api/categories"),

  getById: (id: number) =>
    apiClient.get<CategoryDto>(`/api/categories/${id}`),

  create: (data: CreateCategoryRequest) =>
    apiClient.post<number>("/api/categories", data),

  update: (id: number, data: UpdateCategoryRequest) =>
    apiClient.put<void>(`/api/categories/${id}`, data),

  delete: (id: number) =>
    apiClient.delete<void>(`/api/categories/${id}`),
};
