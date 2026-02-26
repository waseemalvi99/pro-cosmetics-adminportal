import { apiClient } from "@/lib/api-client";
import type { RoleDto, PermissionDto, CreateRoleRequest, UpdateRoleRequest } from "@/types";

export const rolesApi = {
  list: () =>
    apiClient.get<RoleDto[]>("/api/roles"),

  getById: (id: number) =>
    apiClient.get<RoleDto>(`/api/roles/${id}`),

  create: (data: CreateRoleRequest) =>
    apiClient.post<RoleDto>("/api/roles", data),

  update: (id: number, data: UpdateRoleRequest) =>
    apiClient.put<void>(`/api/roles/${id}`, data),

  delete: (id: number) =>
    apiClient.delete<void>(`/api/roles/${id}`),

  getPermissions: () =>
    apiClient.get<PermissionDto[]>("/api/roles/permissions"),
};
