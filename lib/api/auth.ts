import { apiClient } from "@/lib/api-client";
import type {
  LoginRequest,
  LoginResponse,
  RefreshTokenRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
} from "@/types";

export const authApi = {
  login: (data: LoginRequest) =>
    apiClient.post<LoginResponse>("/api/auth/login", data),

  refreshToken: (data: RefreshTokenRequest) =>
    apiClient.post<LoginResponse>("/api/auth/refresh-token", data),

  forgotPassword: (data: ForgotPasswordRequest) =>
    apiClient.post<null>("/api/auth/forgot-password", data),

  resetPassword: (data: ResetPasswordRequest) =>
    apiClient.post<null>("/api/auth/reset-password", data),
};
