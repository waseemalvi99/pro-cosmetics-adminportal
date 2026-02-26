import { apiClient } from "@/lib/api-client";
import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RefreshTokenRequest,
  UserDto,
} from "@/types";

export const authApi = {
  login: (data: LoginRequest) =>
    apiClient.post<LoginResponse>("/api/auth/login", data),

  register: (data: RegisterRequest) =>
    apiClient.post<UserDto>("/api/auth/register", data),

  refreshToken: (data: RefreshTokenRequest) =>
    apiClient.post<LoginResponse>("/api/auth/refresh-token", data),
};
