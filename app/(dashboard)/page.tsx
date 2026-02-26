"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Package,
  ShoppingCart,
  Users,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Truck,
  ArrowUpRight,
} from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { reportsApi } from "@/lib/api/reports";
import { inventoryApi } from "@/lib/api/inventory";
import { salesApi } from "@/lib/api/sales";
import { PageHeader } from "@/components/shared/page-header";
import { formatCurrency } from "@/lib/utils";

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  href,
}: {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ElementType;
  trend?: "up" | "down";
  href?: string;
}) {
  const content = (
    <Card className="group relative overflow-hidden transition-all duration-300 hover:shadow-md hover:shadow-primary/5">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.03] to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
      <CardContent className="relative p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {title}
            </p>
            <p className="font-display text-2xl font-bold tracking-tight">{value}</p>
            {subtitle && (
              <p className="flex items-center gap-1 text-xs text-muted-foreground">
                {trend === "up" && <TrendingUp className="h-3 w-3 text-emerald-500" />}
                {subtitle}
              </p>
            )}
          </div>
          <div className="rounded-xl bg-primary/10 p-2.5">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }
  return content;
}

function StatSkeleton() {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-7 w-28" />
            <Skeleton className="h-3 w-32" />
          </div>
          <Skeleton className="h-10 w-10 rounded-xl" />
        </div>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const today = new Date();
  const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const from = firstOfMonth.toISOString().split("T")[0];
  const to = today.toISOString().split("T")[0];

  const { data: financial, isLoading: financialLoading } = useQuery({
    queryKey: ["financial-summary", from, to],
    queryFn: () => reportsApi.financialSummary({ from, to }),
  });

  const { data: lowStock, isLoading: lowStockLoading } = useQuery({
    queryKey: ["low-stock"],
    queryFn: () => inventoryApi.lowStock(),
  });

  const { data: recentSales, isLoading: salesLoading } = useQuery({
    queryKey: ["recent-sales"],
    queryFn: () => salesApi.list({ page: 1, pageSize: 5 }),
  });

  const summary = financial?.data;
  const lowStockItems = lowStock?.data || [];
  const sales = recentSales?.data?.items || [];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Dashboard"
        description="Welcome back. Here's an overview of your business."
      />

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {financialLoading ? (
          <>
            <StatSkeleton />
            <StatSkeleton />
            <StatSkeleton />
            <StatSkeleton />
          </>
        ) : (
          <>
            <StatCard
              title="Total Revenue"
              value={formatCurrency(summary?.totalRevenue || 0)}
              subtitle="This month"
              icon={DollarSign}
              trend="up"
              href="/reports"
            />
            <StatCard
              title="Total Sales"
              value={String(summary?.totalSales || 0)}
              subtitle="Orders this month"
              icon={ShoppingCart}
              href="/sales"
            />
            <StatCard
              title="Gross Profit"
              value={formatCurrency(summary?.grossProfit || 0)}
              subtitle={`${summary?.profitMargin?.toFixed(1) || 0}% margin`}
              icon={TrendingUp}
              trend="up"
              href="/reports"
            />
            <StatCard
              title="Purchases"
              value={String(summary?.totalPurchases || 0)}
              subtitle="This month"
              icon={Package}
              href="/purchase-orders"
            />
          </>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Sales */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="font-display text-base font-semibold">Recent Sales</CardTitle>
            <Button variant="ghost" size="sm" asChild className="text-xs text-primary hover:text-primary">
              <Link href="/sales">
                View all <ArrowUpRight className="ml-1 h-3 w-3" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="px-6 pb-5">
            {salesLoading ? (
              <div className="space-y-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                    <Skeleton className="h-5 w-16" />
                  </div>
                ))}
              </div>
            ) : sales.length > 0 ? (
              <div className="space-y-4">
                {sales.map((sale) => (
                  <Link
                    key={sale.id}
                    href={`/sales/${sale.id}`}
                    className="flex items-center justify-between rounded-lg p-2 -mx-2 transition-colors hover:bg-muted/50"
                  >
                    <div>
                      <p className="text-sm font-medium">{sale.saleNumber}</p>
                      <p className="text-xs text-muted-foreground">
                        {sale.customerName || "Walk-in"} &middot;{" "}
                        {new Date(sale.saleDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">{formatCurrency(sale.totalAmount)}</p>
                      <Badge
                        variant={
                          sale.status === "Completed"
                            ? "default"
                            : sale.status === "Pending"
                            ? "secondary"
                            : "destructive"
                        }
                        className="text-[10px]"
                      >
                        {sale.status}
                      </Badge>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No recent sales
              </p>
            )}
          </CardContent>
        </Card>

        {/* Low Stock Alerts */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="font-display text-base font-semibold">
              <span className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                Low Stock Alerts
              </span>
            </CardTitle>
            <Button variant="ghost" size="sm" asChild className="text-xs text-primary hover:text-primary">
              <Link href="/inventory">
                View all <ArrowUpRight className="ml-1 h-3 w-3" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="px-6 pb-5">
            {lowStockLoading ? (
              <div className="space-y-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-5 w-12" />
                  </div>
                ))}
              </div>
            ) : lowStockItems.length > 0 ? (
              <div className="space-y-3">
                {lowStockItems.slice(0, 6).map((item) => (
                  <div
                    key={item.productId}
                    className="flex items-center justify-between rounded-lg border border-amber-100 bg-amber-50/50 p-3"
                  >
                    <div>
                      <p className="text-sm font-medium">{item.productName}</p>
                      <p className="text-xs text-muted-foreground">{item.sku}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-amber-600">
                        {item.quantityOnHand} left
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        Reorder at {item.reorderLevel}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center py-8">
                <Truck className="mb-2 h-8 w-8 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">All stock levels are healthy</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="font-display text-base font-semibold">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="pb-5">
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
            <Button variant="outline" asChild className="h-auto flex-col gap-2 py-4 hover:border-primary/30 hover:bg-primary/5">
              <Link href="/sales/new">
                <ShoppingCart className="h-5 w-5 text-primary" />
                <span className="text-xs font-medium">New Sale</span>
              </Link>
            </Button>
            <Button variant="outline" asChild className="h-auto flex-col gap-2 py-4 hover:border-primary/30 hover:bg-primary/5">
              <Link href="/products/new">
                <Package className="h-5 w-5 text-primary" />
                <span className="text-xs font-medium">Add Product</span>
              </Link>
            </Button>
            <Button variant="outline" asChild className="h-auto flex-col gap-2 py-4 hover:border-primary/30 hover:bg-primary/5">
              <Link href="/customers/new">
                <Users className="h-5 w-5 text-primary" />
                <span className="text-xs font-medium">Add Customer</span>
              </Link>
            </Button>
            <Button variant="outline" asChild className="h-auto flex-col gap-2 py-4 hover:border-primary/30 hover:bg-primary/5">
              <Link href="/purchase-orders/new">
                <Truck className="h-5 w-5 text-primary" />
                <span className="text-xs font-medium">New Purchase Order</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
