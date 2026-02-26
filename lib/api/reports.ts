import { apiClient } from "@/lib/api-client";
import type {
  SalesReportDto,
  TopProductDto,
  SalesmanPerformanceDto,
  InventoryReportDto,
  PurchaseReportDto,
  DeliveryReportDto,
  FinancialSummaryDto,
} from "@/types";

export const reportsApi = {
  sales: (params: { from: string; to: string; groupBy?: string }) =>
    apiClient.get<SalesReportDto>("/api/reports/sales", params),

  topProducts: (params: { from: string; to: string; top?: number }) =>
    apiClient.get<TopProductDto[]>("/api/reports/top-products", params),

  salesmanPerformance: (params: { from: string; to: string }) =>
    apiClient.get<SalesmanPerformanceDto[]>("/api/reports/salesman-performance", params),

  inventory: () =>
    apiClient.get<InventoryReportDto>("/api/reports/inventory"),

  purchases: (params: { from: string; to: string }) =>
    apiClient.get<PurchaseReportDto>("/api/reports/purchases", params),

  deliveries: (params: { from: string; to: string }) =>
    apiClient.get<DeliveryReportDto>("/api/reports/deliveries", params),

  financialSummary: (params: { from: string; to: string }) =>
    apiClient.get<FinancialSummaryDto>("/api/reports/financial-summary", params),
};
