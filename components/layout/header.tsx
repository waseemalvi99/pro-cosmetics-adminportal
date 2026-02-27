"use client";

import React from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Bell, ChevronRight, UserCircle, LogOut } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useAuth } from "@/contexts/auth-context";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5089";

function getProfilePictureUrl(profilePicture: string | null | undefined): string | undefined {
  if (!profilePicture) return undefined;
  if (profilePicture.startsWith("http")) return profilePicture;
  if (profilePicture.startsWith("/")) return `${API_BASE_URL}${profilePicture}`;
  return `${API_BASE_URL}/uploads/profiles/${profilePicture}`;
}

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
  ledger: "Ledger",
  payments: "Payments",
  "credit-debit-notes": "Credit/Debit Notes",
  accounts: "Accounts",
  aging: "Aging Reports",
  customer: "Customer",
  supplier: "Supplier",
  new: "New",
  edit: "Edit",
  profile: "My Profile",
  "forgot-password": "Forgot Password",
  "reset-password": "Reset Password",
};

export function Header() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const profilePicUrl = getProfilePictureUrl(user?.profilePicture);
  const initials = user?.fullName
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "?";
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

      <div className="flex items-center gap-1.5">
        <Button variant="ghost" size="icon" asChild className="relative h-9 w-9 text-muted-foreground hover:text-foreground">
          <Link href="/notifications">
            <Bell className="h-4 w-4" />
          </Link>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-accent focus:outline-none">
              <Avatar className="h-7 w-7">
                {profilePicUrl ? <AvatarImage src={profilePicUrl} alt={user?.fullName || "Profile"} /> : null}
                <AvatarFallback className="bg-primary/10 text-[11px] font-semibold text-primary">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <span className="hidden text-sm font-medium md:inline-block">{user?.fullName?.split(" ")[0]}</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel className="pb-0 font-normal">
              <p className="text-sm font-medium">{user?.fullName}</p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/profile" className="flex items-center gap-2">
                <UserCircle className="h-4 w-4" />
                My Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout} className="flex items-center gap-2 text-destructive focus:text-destructive">
              <LogOut className="h-4 w-4" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
