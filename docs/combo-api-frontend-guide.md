# Combo/Lookup Search APIs — Frontend Integration Guide

## Overview

New lightweight search-as-you-type endpoints have been added under `/api/combos`. These return minimal fields (id + display name + contextual fields), limited to top 20 active records by default (max 50). They replace the current pattern of calling full list endpoints with `pageSize: 100` for dropdown/select data.

**All endpoints require JWT authentication (any logged-in user) — no specific permission needed.**

---

## Endpoints & Response Shapes

All responses are wrapped in `ApiResponse<T>`:

```json
{
  "success": true,
  "message": null,
  "data": [ ... ],
  "errors": null
}
```

### Generic Combo (id + name)

| Endpoint | Use For |
|---|---|
| `GET /api/combos/salesmen?search=&limit=20` | Salesman dropdowns |
| `GET /api/combos/categories?search=&limit=20` | Category dropdowns |
| `GET /api/combos/users?search=&limit=20` | User dropdowns |
| `GET /api/combos/roles?search=&limit=20` | Role dropdowns |

```typescript
// Response: ComboItemDto[]
interface ComboItemDto {
  id: number;
  name: string;
}
```

### Customers

```
GET /api/combos/customers?search=&limit=20
```

```typescript
interface CustomerComboDto {
  id: number;
  fullName: string;
  creditLimit: number;
}
```

### Suppliers

```
GET /api/combos/suppliers?search=&limit=20
```

```typescript
interface SupplierComboDto {
  id: number;
  name: string;
  paymentTermDays: number;
}
```

### Products

```
GET /api/combos/products?search=&limit=20
```

```typescript
interface ProductComboDto {
  id: number;
  name: string;
  sku: string;
  salePrice: number;
  quantityOnHand: number;
}
```

### Delivery Men

```
GET /api/combos/delivery-men?search=&limit=20
```

```typescript
interface DeliveryManComboDto {
  id: number;
  name: string;
  isAvailable: boolean;
}
```

### Sales (filtered by customer — for credit notes)

```
GET /api/combos/sales?customerId=123&search=&limit=20
```

`customerId` is **required**. Only returns non-cancelled sales for that customer, ordered by most recent first.

```typescript
interface SaleComboDto {
  id: number;
  saleNumber: string;
  totalAmount: number;
  saleDate: string; // ISO date
}
```

### Purchase Orders (filtered by supplier — for debit notes)

```
GET /api/combos/purchase-orders?supplierId=456&search=&limit=20
```

`supplierId` is **required**. Only returns non-cancelled POs for that supplier, ordered by most recent first.

```typescript
interface PurchaseOrderComboDto {
  id: number;
  orderNumber: string;
  totalAmount: number;
  orderDate: string; // ISO date
}
```

---

## Query Parameters

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `search` | string | No | `null` | Partial match on name/number fields (case-insensitive LIKE) |
| `limit` | number | No | `20` | Max results to return (clamped to 1–50) |
| `customerId` | number | `/sales` only | — | Filter sales by customer |
| `supplierId` | number | `/purchase-orders` only | — | Filter POs by supplier |

When `search` is empty or omitted, returns the top N active records sorted alphabetically (or by date for sales/POs).

---

## What to Change in the Frontend

### 1. Add TypeScript Types

Add these to `types/index.ts`:

```typescript
// Combo DTOs (lightweight for dropdowns)
export interface ComboItemDto {
  id: number;
  name: string;
}

export interface CustomerComboDto {
  id: number;
  fullName: string;
  creditLimit: number;
}

export interface SupplierComboDto {
  id: number;
  name: string;
  paymentTermDays: number;
}

export interface ProductComboDto {
  id: number;
  name: string;
  sku: string;
  salePrice: number;
  quantityOnHand: number;
}

export interface DeliveryManComboDto {
  id: number;
  name: string;
  isAvailable: boolean;
}

export interface SaleComboDto {
  id: number;
  saleNumber: string;
  totalAmount: number;
  saleDate: string;
}

export interface PurchaseOrderComboDto {
  id: number;
  orderNumber: string;
  totalAmount: number;
  orderDate: string;
}
```

### 2. Create API Module

Create `lib/api/combos.ts`:

```typescript
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
```

### 3. Replace Heavy List Calls in Forms

Every form that currently loads full lists for dropdowns should switch to combo endpoints. Here are the specific places to update:

#### `app/(dashboard)/sales/new/page.tsx`

**Before:**
```typescript
const { data: customersResponse } = useQuery({
  queryKey: ["customers", "pos"],
  queryFn: () => customersApi.list({ pageSize: 100 }),
});
const customers = customersResponse?.success && customersResponse?.data
  ? customersResponse.data.items : [];

const { data: salesmenResponse } = useQuery({
  queryKey: ["salesmen", "pos"],
  queryFn: () => salesmenApi.list({ pageSize: 100 }),
});
const salesmen = salesmenResponse?.success && salesmenResponse?.data
  ? salesmenResponse.data.items : [];
```

**After:**
```typescript
const { data: customersResponse } = useQuery({
  queryKey: ["combos", "customers"],
  queryFn: () => combosApi.customers(),
});
const customers = customersResponse?.data ?? [];

const { data: salesmenResponse } = useQuery({
  queryKey: ["combos", "salesmen"],
  queryFn: () => combosApi.salesmen(),
});
const salesmen = salesmenResponse?.data ?? [];
```

Note: combo responses are flat arrays (not `PagedResult`), so access `.data` directly — no `.data.items`.

#### `app/(dashboard)/products/new/page.tsx` and `products/[id]/edit/page.tsx`

Replace `categoriesApi.list()` with `combosApi.categories()`.

#### All forms that load customers, suppliers, salesmen, categories, delivery men, users, or roles for `<Select>` dropdowns

Search all form pages for patterns like:
- `customersApi.list(` → replace with `combosApi.customers()`
- `suppliersApi.list(` → replace with `combosApi.suppliers()`
- `salesmenApi.list(` → replace with `combosApi.salesmen()`
- `categoriesApi.list()` → replace with `combosApi.categories()`
- `deliveryMenApi.list(` → replace with `combosApi.deliveryMen()`
- Any `pageSize: 100` pattern used for dropdown loading

#### Credit/Debit Note forms

If there's a form for creating credit notes that needs a sale selector filtered by customer, use:
```typescript
const { data: salesResponse } = useQuery({
  queryKey: ["combos", "sales", selectedCustomerId],
  queryFn: () => combosApi.sales(selectedCustomerId!),
  enabled: !!selectedCustomerId,
});
```

Similarly for debit notes needing POs by supplier:
```typescript
const { data: posResponse } = useQuery({
  queryKey: ["combos", "purchase-orders", selectedSupplierId],
  queryFn: () => combosApi.purchaseOrders(selectedSupplierId!),
  enabled: !!selectedSupplierId,
});
```

### 4. Field Name Mapping (Watch Out)

The combo DTOs use slightly different field names than the full DTOs:

| Full DTO field | Combo DTO field | Entity |
|---|---|---|
| `customerDto.fullName` | `customerComboDto.fullName` | Same |
| `supplierDto.name` | `supplierComboDto.name` | Same |
| `productDto.name` | `productComboDto.name` | Same |
| `salesmanDto.name` | `comboItemDto.name` | Same |
| `categoryDto.name` | `comboItemDto.name` | Same |
| `deliveryManDto.name` | `deliveryManComboDto.name` | Same |
| `userDto.fullName` | `comboItemDto.name` | **Different** — mapped to `name` |

For users, the full DTO has `fullName` but the combo returns it as `name`. Update any `<SelectItem>` rendering that references `user.fullName` to use `user.name` when using combo data.

### 5. Query Key Convention

Use `["combos", entityName]` as the query key pattern for combo queries to keep them separate from full list caches:

```typescript
queryKey: ["combos", "customers"]
queryKey: ["combos", "products"]
queryKey: ["combos", "salesmen"]
queryKey: ["combos", "sales", customerId]
queryKey: ["combos", "purchase-orders", supplierId]
```

### 6. Optional: Search-as-you-type Enhancement

For large datasets (customers, products), consider adding debounced search:

```typescript
const [search, setSearch] = useState("");
const debouncedSearch = useDebounce(search, 300);

const { data } = useQuery({
  queryKey: ["combos", "customers", debouncedSearch],
  queryFn: () => combosApi.customers(debouncedSearch || undefined),
});
```

This pairs well with the shadcn/ui `Command` component (`cmdk` is already installed) for a searchable combobox pattern instead of plain `<Select>`.
