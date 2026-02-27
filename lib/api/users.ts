import { apiClient } from "@/lib/api-client";
import type { PagedResult, UserDto, AssignRoleRequest, CreateUserRequest } from "@/types";

export const usersApi = {
  list: (params?: { page?: number; pageSize?: number; search?: string }) =>
    apiClient.get<PagedResult<UserDto>>("/api/users", params as Record<string, string | number>),

  getById: (id: number) =>
    apiClient.get<UserDto>(`/api/users/${id}`),

  register: (data: CreateUserRequest) =>
    apiClient.post<UserDto>("/api/users/register", data),

  assignRole: (id: number, data: AssignRoleRequest) =>
    apiClient.post<void>(`/api/users/${id}/assign-role`, data),

  toggleActive: (id: number) =>
    apiClient.put<void>(`/api/users/${id}/toggle-active`),
};
