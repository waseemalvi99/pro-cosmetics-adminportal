import { apiClient } from "@/lib/api-client";
import type {
  PagedResult,
  ProductDto,
  ProductImageDto,
  ProductBarcodeDto,
  CreateProductRequest,
  UpdateProductRequest,
} from "@/types";

export const productsApi = {
  list: (params?: { page?: number; pageSize?: number; search?: string; categoryId?: number }) =>
    apiClient.get<PagedResult<ProductDto>>("/api/products", params as Record<string, string | number>),

  getById: (id: number) =>
    apiClient.get<ProductDto>(`/api/products/${id}`),

  getByBarcode: (code: string) =>
    apiClient.get<ProductBarcodeDto>(`/api/products/barcode/${code}`),

  create: (data: CreateProductRequest) =>
    apiClient.post<number>("/api/products", data),

  update: (id: number, data: UpdateProductRequest) =>
    apiClient.put<void>(`/api/products/${id}`, data),

  delete: (id: number) =>
    apiClient.delete<void>(`/api/products/${id}`),

  listImages: (productId: number) =>
    apiClient.get<ProductImageDto[]>(`/api/products/${productId}/images`),

  uploadImage: (productId: number, formData: FormData) =>
    apiClient.upload<ProductImageDto>(`/api/products/${productId}/images`, formData),

  uploadImagesBulk: (productId: number, formData: FormData) =>
    apiClient.upload<ProductImageDto[]>(`/api/products/${productId}/images/bulk`, formData),

  deleteImage: (productId: number, imageId: number) =>
    apiClient.delete<void>(`/api/products/${productId}/images/${imageId}`),

  setPrimaryImage: (productId: number, imageId: number) =>
    apiClient.put<void>(`/api/products/${productId}/images/${imageId}/primary`),

  printBarcodeLabels: async (productIds: number[]) => {
    const blob = await apiClient.postBlob("/api/products/barcode-labels", { productIds });
    const url = URL.createObjectURL(new Blob([blob], { type: "application/pdf" }));
    window.open(url, "_blank");
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  },
};
