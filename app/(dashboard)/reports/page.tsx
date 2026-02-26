"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { reportsApi } from "@/lib/api/reports";
import { formatCurrency } from "@/lib/utils";

function formatPercent(value: number | null | undefined) {
  const v = value ?? 0;
  return `${(v <= 1 ? v * 100 : v).toFixed(1)}%`;
}

function getDefaultDateRange() {
  const to = new Date();
  const from = new Date();
  from.setMonth(from.getMonth() - 1);
  return {
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
  };
}

export default function ReportsPage() {
  const [dateRange, setDateRange] = useState(getDefaultDateRange);
  const [activeFrom, setActiveFrom] = useState(dateRange.from);
  const [activeTo, setActiveTo] = useState(dateRange.to);

  const params = { from: activeFrom, to: activeTo };

  const { data: financialRes, isLoading: financialLoading } = useQuery({
    queryKey: ["reports", "financial", params],
    queryFn: () => reportsApi.financialSummary(params),
  });

  const { data: salesRes, isLoading: salesLoading } = useQuery({
    queryKey: ["reports", "sales", params],
    queryFn: () => reportsApi.sales(params),
  });

  const { data: topProductsRes, isLoading: topProductsLoading } = useQuery({
    queryKey: ["reports", "top-products", params],
    queryFn: () => reportsApi.topProducts(params),
  });

  const { data: salesmenRes, isLoading: salesmenLoading } = useQuery({
    queryKey: ["reports", "salesmen", params],
    queryFn: () => reportsApi.salesmanPerformance(params),
  });

  const { data: inventoryRes, isLoading: inventoryLoading } = useQuery({
    queryKey: ["reports", "inventory"],
    queryFn: () => reportsApi.inventory(),
  });

  const { data: purchasesRes, isLoading: purchasesLoading } = useQuery({
    queryKey: ["reports", "purchases", params],
    queryFn: () => reportsApi.purchases(params),
  });

  const { data: deliveriesRes, isLoading: deliveriesLoading } = useQuery({
    queryKey: ["reports", "deliveries", params],
    queryFn: () => reportsApi.deliveries(params),
  });

  const financial = financialRes?.success && financialRes?.data ? financialRes.data : null;
  const sales = salesRes?.success && salesRes?.data ? salesRes.data : null;
  const topProducts = topProductsRes?.success && topProductsRes?.data ? topProductsRes.data : [];
  const salesmen = salesmenRes?.success && salesmenRes?.data ? salesmenRes.data : [];
  const inventory = inventoryRes?.success && inventoryRes?.data ? inventoryRes.data : null;
  const purchases = purchasesRes?.success && purchasesRes?.data ? purchasesRes.data : null;
  const deliveries = deliveriesRes?.success && deliveriesRes?.data ? deliveriesRes.data : null;

  const handleGenerate = () => {
    setActiveFrom(dateRange.from);
    setActiveTo(dateRange.to);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        description="Business analytics and insights"
      />

      <div className="flex flex-wrap items-end gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium">From</label>
          <Input
            type="date"
            value={dateRange.from}
            onChange={(e) => setDateRange((r) => ({ ...r, from: e.target.value }))}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">To</label>
          <Input
            type="date"
            value={dateRange.to}
            onChange={(e) => setDateRange((r) => ({ ...r, to: e.target.value }))}
          />
        </div>
        <Button onClick={handleGenerate}>Generate</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Tabs defaultValue="financial">
            <TabsList className="m-4 mb-0 flex-wrap">
              <TabsTrigger value="financial">Financial</TabsTrigger>
              <TabsTrigger value="sales">Sales</TabsTrigger>
              <TabsTrigger value="products">Products</TabsTrigger>
              <TabsTrigger value="salesmen">Salesmen</TabsTrigger>
              <TabsTrigger value="inventory">Inventory</TabsTrigger>
              <TabsTrigger value="purchases">Purchases</TabsTrigger>
              <TabsTrigger value="deliveries">Deliveries</TabsTrigger>
            </TabsList>

            <TabsContent value="financial" className="mt-4 p-4">
              {financialLoading ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {[...Array(6)].map((_, i) => (
                    <Skeleton key={i} className="h-24" />
                  ))}
                </div>
              ) : financial ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <Card>
                    <CardContent className="pt-4">
                      <p className="text-sm text-muted-foreground">Revenue</p>
                      <p className="font-display text-2xl font-bold">{formatCurrency(financial.totalRevenue)}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4">
                      <p className="text-sm text-muted-foreground">Costs</p>
                      <p className="font-display text-2xl font-bold">{formatCurrency(financial.totalCosts)}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4">
                      <p className="text-sm text-muted-foreground">Gross Profit</p>
                      <p className="font-display text-2xl font-bold">{formatCurrency(financial.grossProfit)}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4">
                      <p className="text-sm text-muted-foreground">Profit Margin</p>
                      <p className="font-display text-2xl font-bold">{formatPercent(financial.profitMargin)}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4">
                      <p className="text-sm text-muted-foreground">Total Sales</p>
                      <p className="font-display text-2xl font-bold">{formatCurrency(financial.totalSales)}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4">
                      <p className="text-sm text-muted-foreground">Total Purchases</p>
                      <p className="font-display text-2xl font-bold">{formatCurrency(financial.totalPurchases)}</p>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <p className="text-muted-foreground">No financial data available.</p>
              )}
            </TabsContent>

            <TabsContent value="sales" className="mt-4 p-4">
              {salesLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-20" />
                  <Skeleton className="h-48" />
                </div>
              ) : sales ? (
                <div className="space-y-6">
                  <div className="grid gap-4 sm:grid-cols-3">
                    <Card>
                      <CardContent className="pt-4">
                        <p className="text-sm text-muted-foreground">Total Revenue</p>
                        <p className="font-display text-xl font-bold">{formatCurrency(sales.totalRevenue)}</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4">
                        <p className="text-sm text-muted-foreground">Total Orders</p>
                        <p className="font-display text-xl font-bold">{sales.totalOrders}</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4">
                        <p className="text-sm text-muted-foreground">Avg Order Value</p>
                        <p className="font-display text-xl font-bold">{formatCurrency(sales.averageOrderValue)}</p>
                      </CardContent>
                    </Card>
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Period</TableHead>
                        <TableHead className="text-right">Orders</TableHead>
                        <TableHead className="text-right">Revenue</TableHead>
                        <TableHead className="text-right">Discount</TableHead>
                        <TableHead className="text-right">Net Revenue</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sales.items.map((item) => (
                        <TableRow key={item.period}>
                          <TableCell className="font-medium">{item.period}</TableCell>
                          <TableCell className="text-right">{item.orderCount}</TableCell>
                          <TableCell className="text-right">{formatCurrency(item.revenue)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(item.discount)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(item.netRevenue)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <p className="text-muted-foreground">No sales data available.</p>
              )}
            </TabsContent>

            <TabsContent value="products" className="mt-4 p-4">
              {topProductsLoading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-12" />
                  ))}
                </div>
              ) : topProducts.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead className="text-right">Quantity Sold</TableHead>
                      <TableHead className="text-right">Revenue</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topProducts.map((p) => (
                      <TableRow key={p.productId}>
                        <TableCell className="font-medium">{p.productName}</TableCell>
                        <TableCell className="text-right">{p.quantitySold}</TableCell>
                        <TableCell className="text-right">{formatCurrency(p.revenue)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-muted-foreground">No product data available.</p>
              )}
            </TabsContent>

            <TabsContent value="salesmen" className="mt-4 p-4">
              {salesmenLoading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-12" />
                  ))}
                </div>
              ) : salesmen.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Salesman</TableHead>
                      <TableHead className="text-right">Sales</TableHead>
                      <TableHead className="text-right">Revenue</TableHead>
                      <TableHead className="text-right">Commission Rate</TableHead>
                      <TableHead className="text-right">Commission Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {salesmen.map((s) => (
                      <TableRow key={s.salesmanId}>
                        <TableCell className="font-medium">{s.salesmanName}</TableCell>
                        <TableCell className="text-right">{s.totalSales}</TableCell>
                        <TableCell className="text-right">{formatCurrency(s.totalRevenue)}</TableCell>
                        <TableCell className="text-right">{formatPercent(s.commissionRate)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(s.commissionAmount)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-muted-foreground">No salesman data available.</p>
              )}
            </TabsContent>

            <TabsContent value="inventory" className="mt-4 p-4">
              {inventoryLoading ? (
                <div className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-4">
                    {[...Array(4)].map((_, i) => (
                      <Skeleton key={i} className="h-20" />
                    ))}
                  </div>
                  <Skeleton className="h-48" />
                </div>
              ) : inventory ? (
                <div className="space-y-6">
                  <div className="grid gap-4 sm:grid-cols-4">
                    <Card>
                      <CardContent className="pt-4">
                        <p className="text-sm text-muted-foreground">Total Products</p>
                        <p className="font-display text-xl font-bold">{inventory.totalProducts}</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4">
                        <p className="text-sm text-muted-foreground">Low Stock</p>
                        <p className="font-display text-xl font-bold">{inventory.lowStockCount}</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4">
                        <p className="text-sm text-muted-foreground">Out of Stock</p>
                        <p className="font-display text-xl font-bold">{inventory.outOfStockCount}</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4">
                        <p className="text-sm text-muted-foreground">Stock Value</p>
                        <p className="font-display text-xl font-bold">{formatCurrency(inventory.totalStockValue)}</p>
                      </CardContent>
                    </Card>
                  </div>
                  {inventory.items.length > 0 && (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Product</TableHead>
                          <TableHead>SKU</TableHead>
                          <TableHead className="text-right">On Hand</TableHead>
                          <TableHead className="text-right">Cost Price</TableHead>
                          <TableHead className="text-right">Stock Value</TableHead>
                          <TableHead className="text-right">Reorder Level</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {inventory.items.map((item) => (
                          <TableRow key={item.productId}>
                            <TableCell className="font-medium">{item.productName}</TableCell>
                            <TableCell>{item.sku || "—"}</TableCell>
                            <TableCell className="text-right">{item.quantityOnHand}</TableCell>
                            <TableCell className="text-right">{formatCurrency(item.costPrice)}</TableCell>
                            <TableCell className="text-right">{formatCurrency(item.stockValue)}</TableCell>
                            <TableCell className="text-right">{item.reorderLevel}</TableCell>
                            <TableCell>
                              {item.isLowStock ? (
                                <span className="text-amber-600 dark:text-amber-400">Low Stock</span>
                              ) : (
                                <span className="text-muted-foreground">OK</span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground">No inventory data available.</p>
              )}
            </TabsContent>

            <TabsContent value="purchases" className="mt-4 p-4">
              {purchasesLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-20" />
                  <Skeleton className="h-48" />
                </div>
              ) : purchases ? (
                <div className="space-y-6">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Card>
                      <CardContent className="pt-4">
                        <p className="text-sm text-muted-foreground">Total Orders</p>
                        <p className="font-display text-xl font-bold">{purchases.totalOrders}</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4">
                        <p className="text-sm text-muted-foreground">Total Spent</p>
                        <p className="font-display text-xl font-bold">{formatCurrency(purchases.totalSpent)}</p>
                      </CardContent>
                    </Card>
                  </div>
                  {purchases.items.length > 0 && (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Supplier</TableHead>
                          <TableHead className="text-right">Order Count</TableHead>
                          <TableHead className="text-right">Total Spent</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {purchases.items.map((item) => (
                          <TableRow key={item.supplierId}>
                            <TableCell className="font-medium">{item.supplierName}</TableCell>
                            <TableCell className="text-right">{item.orderCount}</TableCell>
                            <TableCell className="text-right">{formatCurrency(item.totalSpent)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground">No purchase data available.</p>
              )}
            </TabsContent>

            <TabsContent value="deliveries" className="mt-4 p-4">
              {deliveriesLoading ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {[...Array(6)].map((_, i) => (
                    <Skeleton key={i} className="h-24" />
                  ))}
                </div>
              ) : deliveries ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <Card>
                    <CardContent className="pt-4">
                      <p className="text-sm text-muted-foreground">Total Deliveries</p>
                      <p className="font-display text-xl font-bold">{deliveries.totalDeliveries ?? 0}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4">
                      <p className="text-sm text-muted-foreground">Delivered</p>
                      <p className="font-display text-xl font-bold">{deliveries.deliveredCount ?? 0}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4">
                      <p className="text-sm text-muted-foreground">Failed</p>
                      <p className="font-display text-xl font-bold">{deliveries.failedCount ?? 0}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4">
                      <p className="text-sm text-muted-foreground">Pending</p>
                      <p className="font-display text-xl font-bold">{deliveries.pendingCount ?? 0}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4">
                      <p className="text-sm text-muted-foreground">Success Rate</p>
                      <p className="font-display text-xl font-bold">{formatPercent(deliveries.successRate ?? 0)}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4">
                      <p className="text-sm text-muted-foreground">Avg Delivery Time</p>
                      <p className="font-display text-xl font-bold">{(deliveries.averageDeliveryTimeHours ?? 0).toFixed(1)}h</p>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <p className="text-muted-foreground">No delivery data available.</p>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
