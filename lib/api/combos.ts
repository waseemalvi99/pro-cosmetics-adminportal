import { apiClient } from "@/lib/api-client";
import type {
  ComboItemDto,
  CustomerComboDto,
  SupplierComboDto,
  ProductComboDto,
  DeliveryManComboDto,
  SaleComboDto,
  PurchaseOrderComboDto,
} from "@/types";

export const combosApi = {
  customers: (search?: string, limit?: number) =>
    apiClient.get<CustomerComboDto[]>("/api/combos/customers", { search, limit }),

  suppliers: (search?: string, limit?: number) =>
    apiClient.get<SupplierComboDto[]>("/api/combos/suppliers", { search, limit }),

  products: (search?: string, limit?: number) =>
    apiClient.get<ProductComboDto[]>("/api/combos/products", { search, limit }),

  salesmen: (search?: string, limit?: number) =>
    apiClient.get<ComboItemDto[]>("/api/combos/salesmen", { search, limit }),

  categories: (search?: string, limit?: number) =>
    apiClient.get<ComboItemDto[]>("/api/combos/categories", { search, limit }),

  deliveryMen: (search?: string, limit?: number) =>
    apiClient.get<DeliveryManComboDto[]>("/api/combos/delivery-men", { search, limit }),

  users: (search?: string, limit?: number) =>
    apiClient.get<ComboItemDto[]>("/api/combos/users", { search, limit }),

  roles: (search?: string, limit?: number) =>
    apiClient.get<ComboItemDto[]>("/api/combos/roles", { search, limit }),

  sales: (customerId: number, search?: string, limit?: number) =>
    apiClient.get<SaleComboDto[]>("/api/combos/sales", { customerId, search, limit }),

  purchaseOrders: (supplierId: number, search?: string, limit?: number) =>
    apiClient.get<PurchaseOrderComboDto[]>("/api/combos/purchase-orders", { supplierId, search, limit }),
};
