export interface ApiResponse<T> {
  success: boolean;
  message: string | null;
  data: T | null;
  errors: Record<string, string[]> | null;
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
  search?: string;
}

// Auth
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  refreshToken: string;
  expiration: string;
  user: UserDto;
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
  roleName?: string;
}

export interface RefreshTokenRequest {
  token: string;
  refreshToken: string;
}

// Users
export interface UserDto {
  id: number;
  fullName: string;
  email: string;
  isActive: boolean;
  roles: string[];
  permissions: string[];
  createdAt: string;
}

export interface AssignRoleRequest {
  roleName: string;
}

// Roles & Permissions
export interface RoleDto {
  id: number;
  name: string;
  description: string;
  permissions: PermissionDto[];
}

export interface PermissionDto {
  id: number;
  name: string;
  module: string;
  description: string | null;
}

export interface CreateRoleRequest {
  name: string;
  description?: string;
  permissionIds?: number[];
}

export interface UpdateRoleRequest {
  description?: string;
  permissionIds: number[];
}

// Categories
export interface CategoryDto {
  id: number;
  name: string;
  description: string | null;
  parentCategoryId: number | null;
  parentCategoryName: string | null;
}

export interface CreateCategoryRequest {
  name: string;
  description?: string;
  parentCategoryId?: number | null;
}

export interface UpdateCategoryRequest {
  name: string;
  description?: string;
  parentCategoryId?: number | null;
}

// Products
export interface ProductDto {
  id: number;
  name: string;
  sku: string;
  barcode: string;
  description: string;
  categoryId: number;
  categoryName: string;
  costPrice: number;
  salePrice: number;
  reorderLevel: number;
  isActive: boolean;
  quantityOnHand: number;
  createdAt: string;
  images: ProductImageDto[];
}

export interface ProductImageDto {
  id: number;
  productId: number;
  fileName: string;
  url: string;
  isPrimary: boolean;
  sortOrder: number;
}

export interface CreateProductRequest {
  name: string;
  sku?: string;
  barcode?: string;
  description?: string;
  categoryId?: number;
  costPrice: number;
  salePrice: number;
  reorderLevel: number;
}

export interface UpdateProductRequest {
  name: string;
  sku?: string;
  barcode?: string;
  description?: string;
  categoryId?: number;
  costPrice: number;
  salePrice: number;
  reorderLevel: number;
  isActive: boolean;
}

export interface ProductBarcodeDto {
  productId: number;
  productName: string;
  sku: string;
  barcode: string;
  costPrice: number;
  salePrice: number;
  quantityOnHand: number;
  images: ProductImageDto[];
}

// Inventory
export interface InventoryDto {
  productId: number;
  productName: string;
  sku: string;
  quantityOnHand: number;
  quantityReserved: number;
  availableQuantity: number;
  reorderLevel: number;
  isLowStock: boolean;
  lastRestockedAt: string;
}

export interface AdjustInventoryRequest {
  productId: number;
  quantity: number;
  notes?: string;
}

// Customers
export interface CustomerDto {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  notes: string;
  creditDays: number;
  creditLimit: number;
  isActive: boolean;
  createdAt: string;
}

export interface CreateCustomerRequest {
  fullName: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  notes?: string;
  creditDays?: number;
  creditLimit?: number;
}

export interface UpdateCustomerRequest {
  fullName: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  notes?: string;
  creditDays?: number;
  creditLimit?: number;
  isActive: boolean;
}

// Suppliers
export interface SupplierDto {
  id: number;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  notes: string | null;
  paymentTermDays: number;
  isActive: boolean;
  createdAt: string;
}

export interface CreateSupplierRequest {
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
  paymentTermDays?: number;
}

export interface UpdateSupplierRequest {
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
  paymentTermDays?: number;
  isActive: boolean;
}

// Purchase Orders
export interface PurchaseOrderDto {
  id: number;
  supplierId: number;
  supplierName: string;
  orderNumber: string;
  orderDate: string;
  expectedDeliveryDate: string;
  paymentTermDays: number;
  dueDate: string | null;
  status: string;
  totalAmount: number;
  receivedAmount: number;
  closeReason: string | null;
  notes: string | null;
  createdAt: string;
  items: PurchaseOrderItemDto[];
}

export interface PurchaseOrderItemDto {
  id: number;
  productId: number;
  productName: string;
  quantity: number;
  quantityReceived: number;
  unitPrice: number;
  totalPrice: number;
}

export interface CreatePurchaseOrderRequest {
  supplierId: number;
  expectedDeliveryDate?: string;
  paymentTermDays?: number | null;
  notes?: string;
  items: CreatePurchaseOrderItemRequest[];
}

export interface CreatePurchaseOrderItemRequest {
  productId: number;
  quantity: number;
  unitPrice: number;
}

export interface ReceivePurchaseOrderRequest {
  items: ReceivePurchaseOrderItemRequest[];
}

export interface ReceivePurchaseOrderItemRequest {
  productId: number;
  quantityReceived: number;
}

export interface ClosePurchaseOrderRequest {
  reason?: string;
}

// Salesmen
export interface SalesmanDto {
  id: number;
  name: string;
  phone: string;
  email: string;
  commissionRate: number;
  isActive: boolean;
  createdAt: string;
}

export interface CreateSalesmanRequest {
  name: string;
  phone?: string;
  email?: string;
  commissionRate: number;
}

export interface UpdateSalesmanRequest {
  name: string;
  phone?: string;
  email?: string;
  commissionRate: number;
  isActive: boolean;
}

// Sales
export interface SaleDto {
  id: number;
  saleNumber: string;
  customerId: number | null;
  customerName: string | null;
  salesmanId: number | null;
  salesmanName: string | null;
  saleDate: string;
  dueDate: string | null;
  subTotal: number;
  discount: number;
  tax: number;
  totalAmount: number;
  returnedAmount: number;
  paymentMethod: string;
  status: string;
  notes: string | null;
  createdAt: string;
  items: SaleItemDto[];
}

export interface SaleItemDto {
  id: number;
  productId: number;
  productName: string;
  quantity: number;
  quantityReturned: number;
  unitPrice: number;
  discount: number;
  totalPrice: number;
}

export interface CreateSaleRequest {
  customerId?: number | null;
  salesmanId?: number | null;
  discount: number;
  tax: number;
  paymentMethod: number;
  notes?: string;
  items: CreateSaleItemRequest[];
}

export interface CreateSaleItemRequest {
  productId: number;
  quantity: number;
  unitPrice: number;
  discount: number;
}

export interface SalesReturnRequest {
  reason?: string;
  items: SalesReturnItemRequest[];
}

export interface SalesReturnItemRequest {
  productId: number;
  quantityReturned: number;
}

// Deliveries
export interface DeliveryDto {
  id: number;
  saleId: number;
  saleNumber: string;
  deliveryManId: number | null;
  deliveryManName: string | null;
  status: string;
  assignedAt: string | null;
  pickedUpAt: string | null;
  deliveredAt: string | null;
  deliveryAddress: string;
  notes: string | null;
  createdAt: string;
}

export interface CreateDeliveryRequest {
  saleId: number;
  deliveryManId?: number | null;
  deliveryAddress?: string;
  notes?: string;
}

export interface UpdateDeliveryStatusRequest {
  notes?: string;
}

// Delivery Men
export interface DeliveryManDto {
  id: number;
  name: string;
  phone: string;
  email: string;
  isAvailable: boolean;
  isActive: boolean;
  createdAt: string;
}

export interface CreateDeliveryManRequest {
  name: string;
  phone?: string;
  email?: string;
}

export interface UpdateDeliveryManRequest {
  name: string;
  phone?: string;
  email?: string;
  isAvailable: boolean;
  isActive: boolean;
}

// Notifications
export interface NotificationDto {
  id: number;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

// Reports
export interface SalesReportDto {
  items: SalesReportItemDto[];
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
}

export interface SalesReportItemDto {
  period: string;
  orderCount: number;
  revenue: number;
  discount: number;
  netRevenue: number;
}

export interface TopProductDto {
  productId: number;
  productName: string;
  quantitySold: number;
  revenue: number;
}

export interface SalesmanPerformanceDto {
  salesmanId: number;
  salesmanName: string;
  totalSales: number;
  totalRevenue: number;
  commissionRate: number;
  commissionAmount: number;
}

export interface InventoryReportDto {
  totalProducts: number;
  lowStockCount: number;
  outOfStockCount: number;
  totalStockValue: number;
  items: InventoryReportItemDto[];
}

export interface InventoryReportItemDto {
  productId: number;
  productName: string;
  sku: string;
  quantityOnHand: number;
  costPrice: number;
  stockValue: number;
  reorderLevel: number;
  isLowStock: boolean;
}

export interface PurchaseReportDto {
  totalOrders: number;
  totalSpent: number;
  items: PurchaseReportItemDto[];
}

export interface PurchaseReportItemDto {
  supplierId: number;
  supplierName: string;
  orderCount: number;
  totalSpent: number;
}

export interface DeliveryReportDto {
  totalDeliveries: number;
  deliveredCount: number;
  failedCount: number;
  pendingCount: number;
  successRate: number;
  averageDeliveryTimeHours: number;
}

export interface FinancialSummaryDto {
  totalRevenue: number;
  totalCosts: number;
  grossProfit: number;
  profitMargin: number;
  totalSales: number;
  totalPurchases: number;
}

// Ledger
export interface LedgerEntryDto {
  id: number;
  entryDate: string;
  accountType: string;
  customerId: number | null;
  customerName: string | null;
  supplierId: number | null;
  supplierName: string | null;
  referenceType: string;
  referenceId: number;
  description: string;
  debitAmount: number;
  creditAmount: number;
  isReversed: boolean;
  createdAt: string;
}

export interface CreateManualLedgerEntryRequest {
  accountType: number;
  customerId?: number | null;
  supplierId?: number | null;
  description: string;
  debitAmount: number;
  creditAmount: number;
}

// Payments
export interface PaymentDto {
  id: number;
  receiptNumber: string;
  paymentType: string;
  customerId: number | null;
  customerName: string | null;
  supplierId: number | null;
  supplierName: string | null;
  paymentDate: string;
  amount: number;
  paymentMethod: string;
  chequeNumber: string | null;
  bankName: string | null;
  chequeDate: string | null;
  bankAccountReference: string | null;
  notes: string | null;
  createdAt: string;
}

export interface CreateCustomerPaymentRequest {
  customerId: number;
  amount: number;
  paymentMethod: number;
  chequeNumber?: string | null;
  bankName?: string | null;
  chequeDate?: string | null;
  bankAccountReference?: string | null;
  notes?: string;
}

export interface CreateSupplierPaymentRequest {
  supplierId: number;
  amount: number;
  paymentMethod: number;
  chequeNumber?: string | null;
  bankName?: string | null;
  chequeDate?: string | null;
  bankAccountReference?: string | null;
  notes?: string;
}

// Credit/Debit Notes
export interface CreditDebitNoteDto {
  id: number;
  noteNumber: string;
  noteType: string;
  accountType: string;
  customerId: number | null;
  customerName: string | null;
  supplierId: number | null;
  supplierName: string | null;
  noteDate: string;
  amount: number;
  reason: string;
  saleId: number | null;
  saleNumber: string | null;
  purchaseOrderId: number | null;
  purchaseOrderNumber: string | null;
  createdAt: string;
}

export interface CreateCreditDebitNoteRequest {
  noteType: number;
  accountType: number;
  customerId?: number | null;
  supplierId?: number | null;
  amount: number;
  reason: string;
  saleId?: number | null;
  purchaseOrderId?: number | null;
}

// Account Statements
export interface AccountStatementDto {
  accountId: number;
  accountName: string;
  accountType: string;
  fromDate: string;
  toDate: string;
  openingBalance: number;
  totalDebits: number;
  totalCredits: number;
  closingBalance: number;
  lines: AccountStatementLineDto[];
}

export interface AccountStatementLineDto {
  id: number;
  entryDate: string;
  referenceType: string;
  referenceId: number;
  description: string;
  debitAmount: number;
  creditAmount: number;
  runningBalance: number;
}

// Aging Reports
export interface AgingReportDto {
  reportType: string;
  asOfDate: string;
  totalCurrent: number;
  total1To30: number;
  total31To60: number;
  total61To90: number;
  totalOver90: number;
  grandTotal: number;
  details: AgingReportDetailDto[];
}

export interface AgingReportDetailDto {
  accountId: number;
  accountName: string;
  current: number;
  days1To30: number;
  days31To60: number;
  days61To90: number;
  over90Days: number;
  total: number;
}

// Enums
export const PaymentMethods = [
  { value: 0, label: "Cash" },
  { value: 1, label: "Card" },
  { value: 2, label: "Bank Transfer" },
  { value: 3, label: "Credit" },
] as const;

export const LedgerPaymentMethods = [
  { value: 0, label: "Cash" },
  { value: 1, label: "Cheque" },
  { value: 2, label: "Bank Transfer" },
] as const;

export const LedgerAccountTypes = [
  { value: 0, label: "Customer Receivable" },
  { value: 1, label: "Supplier Payable" },
] as const;

export const PaymentTypes = [
  { value: 0, label: "Customer Receipt" },
  { value: 1, label: "Supplier Payment" },
] as const;

export const NoteTypes = [
  { value: 0, label: "Credit Note" },
  { value: 1, label: "Debit Note" },
] as const;

export const NoteAccountTypes = [
  { value: 0, label: "Customer" },
  { value: 1, label: "Supplier" },
] as const;

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
  imagePath: string | null;
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

export const SaleStatuses = ["Completed", "Pending", "Cancelled", "Refunded"] as const;
export const PurchaseOrderStatuses = ["Draft", "Submitted", "PartiallyReceived", "Received", "Cancelled", "Closed"] as const;
export const DeliveryStatuses = ["Pending", "Assigned", "PickedUp", "InTransit", "Delivered", "Failed"] as const;
