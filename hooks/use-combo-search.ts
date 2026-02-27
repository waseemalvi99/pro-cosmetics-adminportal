import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useDebounce } from "@/hooks/use-debounce";
import { combosApi } from "@/lib/api/combos";
import { getImageUrl } from "@/lib/utils";
import type {
  ComboItemDto,
  CustomerComboDto,
  SupplierComboDto,
  ProductComboDto,
  DeliveryManComboDto,
  SaleComboDto,
  PurchaseOrderComboDto,
} from "@/types";
import type { ComboboxOption } from "@/components/ui/searchable-combobox";

type ComboEntity = keyof typeof combosApi;

function useBaseComboSearch<T>(
  entity: ComboEntity,
  queryFn: (search?: string) => Promise<{ data: T[] | null }>,
  mapFn: (item: T) => ComboboxOption,
  enabled = true,
) {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);

  const { data: response, isLoading } = useQuery({
    queryKey: ["combos", entity, debouncedSearch],
    queryFn: () => queryFn(debouncedSearch || undefined),
    enabled,
  });

  const items = response?.data ?? [];
  const options: ComboboxOption[] = items.map(mapFn);

  return { options, isLoading, search, setSearch };
}

export function useCustomerCombo(enabled = true) {
  return useBaseComboSearch<CustomerComboDto>(
    "customers",
    (s) => combosApi.customers(s),
    (c) => ({ value: String(c.id), label: c.fullName }),
    enabled,
  );
}

export function useSupplierCombo(enabled = true) {
  return useBaseComboSearch<SupplierComboDto>(
    "suppliers",
    (s) => combosApi.suppliers(s),
    (sup) => ({
      value: String(sup.id),
      label: sup.name,
      sublabel: `${sup.paymentTermDays}d terms`,
    }),
    enabled,
  );
}

export function useProductCombo(enabled = true) {
  return useBaseComboSearch<ProductComboDto>(
    "products",
    (s) => combosApi.products(s),
    (p) => ({
      value: String(p.id),
      label: p.name,
      sublabel: p.sku || undefined,
      imageUrl: p.imagePath ? getImageUrl(p.imagePath) : null,
    }),
    enabled,
  );
}

export function useSalesmanCombo(enabled = true) {
  return useBaseComboSearch<ComboItemDto>(
    "salesmen",
    (s) => combosApi.salesmen(s),
    (sm) => ({ value: String(sm.id), label: sm.name }),
    enabled,
  );
}

export function useCategoryCombo(enabled = true) {
  return useBaseComboSearch<ComboItemDto>(
    "categories",
    (s) => combosApi.categories(s),
    (cat) => ({ value: String(cat.id), label: cat.name }),
    enabled,
  );
}

export function useDeliveryManCombo(enabled = true) {
  return useBaseComboSearch<DeliveryManComboDto>(
    "deliveryMen",
    (s) => combosApi.deliveryMen(s),
    (dm) => ({
      value: String(dm.id),
      label: dm.name,
      sublabel: dm.isAvailable ? "Available" : "Busy",
    }),
    enabled,
  );
}

export function useUserCombo(enabled = true) {
  return useBaseComboSearch<ComboItemDto>(
    "users",
    (s) => combosApi.users(s),
    (u) => ({ value: String(u.id), label: u.name }),
    enabled,
  );
}

export function useRoleCombo(enabled = true) {
  return useBaseComboSearch<ComboItemDto>(
    "roles",
    (s) => combosApi.roles(s),
    (r) => ({ value: String(r.id), label: r.name }),
    enabled,
  );
}

export function useSaleCombo(customerId: number | null, enabled = true) {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);

  const { data: response, isLoading } = useQuery({
    queryKey: ["combos", "sales", customerId, debouncedSearch],
    queryFn: () => combosApi.sales(customerId!, debouncedSearch || undefined),
    enabled: enabled && !!customerId,
  });

  const items = response?.data ?? [];
  const options: ComboboxOption[] = items.map((s: SaleComboDto) => ({
    value: String(s.id),
    label: s.saleNumber,
    sublabel: `QAR ${s.totalAmount.toFixed(2)}`,
  }));

  return { options, isLoading, search, setSearch };
}

export function usePurchaseOrderCombo(supplierId: number | null, enabled = true) {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);

  const { data: response, isLoading } = useQuery({
    queryKey: ["combos", "purchase-orders", supplierId, debouncedSearch],
    queryFn: () => combosApi.purchaseOrders(supplierId!, debouncedSearch || undefined),
    enabled: enabled && !!supplierId,
  });

  const items = response?.data ?? [];
  const options: ComboboxOption[] = items.map((po: PurchaseOrderComboDto) => ({
    value: String(po.id),
    label: po.orderNumber,
    sublabel: `QAR ${po.totalAmount.toFixed(2)}`,
  }));

  return { options, isLoading, search, setSearch };
}
