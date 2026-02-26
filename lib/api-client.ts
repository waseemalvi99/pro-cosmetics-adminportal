import type { ApiResponse } from "@/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5089";

type RequestConfig = {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
  params?: Record<string, string | number | boolean | undefined>;
};

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("access_token");
}

function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("refresh_token");
}

function setTokens(token: string, refreshToken: string) {
  localStorage.setItem("access_token", token);
  localStorage.setItem("refresh_token", refreshToken);
}

export function clearTokens() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("user");
}

function buildUrl(path: string, params?: Record<string, string | number | boolean | undefined>): string {
  const url = new URL(`${API_BASE_URL}${path}`);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, String(value));
      }
    });
  }
  return url.toString();
}

async function refreshAccessToken(): Promise<boolean> {
  const token = getToken();
  const refreshToken = getRefreshToken();
  if (!token || !refreshToken) return false;

  try {
    const res = await fetch(`${API_BASE_URL}/api/auth/refresh-token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, refreshToken }),
    });

    if (!res.ok) return false;

    const data: ApiResponse<{ token: string; refreshToken: string }> = await res.json();
    if (data.success && data.data) {
      setTokens(data.data.token, data.data.refreshToken);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

async function request<T>(path: string, config: RequestConfig = {}): Promise<ApiResponse<T>> {
  const { method = "GET", body, headers = {}, params } = config;
  const url = buildUrl(path, params);
  const token = getToken();

  const requestHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    ...headers,
  };

  if (token) {
    requestHeaders["Authorization"] = `Bearer ${token}`;
  }

  let res = await fetch(url, {
    method,
    headers: requestHeaders,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401 && token) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      requestHeaders["Authorization"] = `Bearer ${getToken()}`;
      res = await fetch(url, {
        method,
        headers: requestHeaders,
        body: body ? JSON.stringify(body) : undefined,
      });
    } else {
      clearTokens();
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
      return { success: false, message: "Session expired", data: null, errors: null };
    }
  }

  const data: ApiResponse<T> = await res.json();
  return data;
}

async function uploadFile<T>(path: string, formData: FormData): Promise<ApiResponse<T>> {
  const url = buildUrl(path);
  const token = getToken();
  const headers: Record<string, string> = {};

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    method: "POST",
    headers,
    body: formData,
  });

  const data: ApiResponse<T> = await res.json();
  return data;
}

export const apiClient = {
  get: <T>(path: string, params?: Record<string, string | number | boolean | undefined>) =>
    request<T>(path, { params }),

  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "POST", body }),

  put: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "PUT", body }),

  delete: <T>(path: string) =>
    request<T>(path, { method: "DELETE" }),

  upload: <T>(path: string, formData: FormData) =>
    uploadFile<T>(path, formData),
};
