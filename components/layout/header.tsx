"use client";

import React from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Bell, ChevronRight } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

const routeLabels: Record<string, string> = {
  "": "Dashboard",
  categories: "Categories",
  products: "Products",
  inventory: "Inventory",
  customers: "Customers",
  suppliers: "Suppliers",
  "purchase-orders": "Purchase Orders",
  salesmen: "Salesmen",
  sales: "Sales",
  deliveries: "Deliveries",
  "delivery-men": "Delivery Men",
  reports: "Reports",
  users: "Users",
  roles: "Roles & Permissions",
  notifications: "Notifications",
  new: "New",
  edit: "Edit",
};

export function Header() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  const breadcrumbs = segments.map((segment, index) => {
    const href = "/" + segments.slice(0, index + 1).join("/");
    const isId = /^\d+$/.test(segment);
    const label = isId ? `#${segment}` : routeLabels[segment] || segment;
    return { href, label, isLast: index === segments.length - 1 };
  });

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border/60 bg-card/50 px-4 backdrop-blur-sm">
      <div className="flex items-center gap-3">
        <SidebarTrigger className="-ml-1 text-muted-foreground hover:text-foreground" />
        <Separator orientation="vertical" className="mr-1 h-5" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              {segments.length === 0 ? (
                <BreadcrumbPage className="text-sm font-medium">Dashboard</BreadcrumbPage>
              ) : (
                <BreadcrumbLink asChild>
                  <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
                    Dashboard
                  </Link>
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
            {breadcrumbs.map((crumb) => (
              <React.Fragment key={crumb.href}>
                <BreadcrumbSeparator>
                  <ChevronRight className="h-3.5 w-3.5" />
                </BreadcrumbSeparator>
                <BreadcrumbItem>
                  {crumb.isLast ? (
                    <BreadcrumbPage className="text-sm font-medium">{crumb.label}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink asChild>
                      <Link href={crumb.href} className="text-sm text-muted-foreground hover:text-foreground">
                        {crumb.label}
                      </Link>
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
              </React.Fragment>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" asChild className="relative h-9 w-9 text-muted-foreground hover:text-foreground">
          <Link href="/notifications">
            <Bell className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </header>
  );
}
