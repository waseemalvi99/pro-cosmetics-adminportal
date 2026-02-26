"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Tags,
  Package,
  Warehouse,
  Users,
  UserCheck,
  ShoppingCart,
  Truck,
  TruckIcon,
  ClipboardList,
  BarChart3,
  Shield,
  UserCog,
  Bell,
  ChevronDown,
  LogOut,
  BookOpen,
  Receipt,
  FileText,
  FileSpreadsheet,
  Clock,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useAuth } from "@/contexts/auth-context";

const navigation = [
  {
    label: "Overview",
    items: [
      { title: "Dashboard", href: "/", icon: LayoutDashboard },
    ],
  },
  {
    label: "Product Management",
    items: [
      { title: "Categories", href: "/categories", icon: Tags },
      { title: "Products", href: "/products", icon: Package },
      { title: "Inventory", href: "/inventory", icon: Warehouse },
    ],
  },
  {
    label: "Sales",
    items: [
      { title: "Salesmen", href: "/salesmen", icon: UserCheck },
      { title: "Sales", href: "/sales", icon: ShoppingCart },
    ],
  },
  {
    label: "Deliveries",
    items: [
      { title: "Deliveries", href: "/deliveries", icon: Truck },
      { title: "Delivery Men", href: "/delivery-men", icon: TruckIcon },
    ],
  },
  {
    label: "Partners",
    items: [
      { title: "Customers", href: "/customers", icon: Users },
      { title: "Suppliers", href: "/suppliers", icon: ClipboardList },
      { title: "Purchase Orders", href: "/purchase-orders", icon: ClipboardList },
    ],
  },
  {
    label: "Finance",
    items: [
      { title: "Ledger", href: "/ledger", icon: BookOpen },
      { title: "Payments", href: "/payments", icon: Receipt },
      { title: "Credit/Debit Notes", href: "/credit-debit-notes", icon: FileText },
      { title: "Account Statements", href: "/accounts", icon: FileSpreadsheet },
      { title: "Aging Reports", href: "/accounts/aging", icon: Clock },
    ],
  },
  {
    label: "Analytics",
    items: [
      { title: "Reports", href: "/reports", icon: BarChart3 },
    ],
  },
  {
    label: "Administration",
    items: [
      { title: "Users", href: "/users", icon: UserCog },
      { title: "Roles & Permissions", href: "/roles", icon: Shield },
      { title: "Notifications", href: "/notifications", icon: Bell },
    ],
  },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <Sidebar collapsible="icon" className="border-sidebar-border">
      <SidebarHeader className="border-b border-sidebar-border px-4 py-5">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-lg bg-white/10 ring-1 ring-white/10">
            <Image
              src="/logo.png"
              alt="Logo"
              width={28}
              height={28}
              className="object-contain"
            />
          </div>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-semibold tracking-wide text-sidebar-foreground">
              Pro Cosmetics
            </span>
            <span className="text-[10px] uppercase tracking-widest text-sidebar-foreground/40">
              Admin Portal
            </span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-2 py-3">
        {navigation.map((group) => (
          <Collapsible key={group.label} defaultOpen className="group/collapsible">
            <SidebarGroup>
              <SidebarGroupLabel asChild>
                <CollapsibleTrigger className="flex w-full items-center justify-between text-[10px] uppercase tracking-[0.12em] text-sidebar-foreground/40 hover:text-sidebar-foreground/60">
                  {group.label}
                  <ChevronDown className="h-3 w-3 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                </CollapsibleTrigger>
              </SidebarGroupLabel>
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {group.items.map((item) => (
                      <SidebarMenuItem key={item.href}>
                        <SidebarMenuButton
                          asChild
                          isActive={isActive(item.href)}
                          tooltip={item.title}
                          className="rounded-lg transition-all duration-200"
                        >
                          <Link href={item.href}>
                            <item.icon className="h-4 w-4" />
                            <span className="text-[13px]">{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </CollapsibleContent>
            </SidebarGroup>
          </Collapsible>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-3">
        <div className="flex items-center gap-3 rounded-lg px-2 py-2 group-data-[collapsible=icon]:justify-center">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sidebar-primary/20 text-xs font-semibold text-sidebar-primary">
            {user?.fullName?.charAt(0) || "A"}
          </div>
          <div className="flex flex-1 flex-col group-data-[collapsible=icon]:hidden">
            <span className="truncate text-xs font-medium text-sidebar-foreground">
              {user?.fullName || "Admin"}
            </span>
            <span className="truncate text-[10px] text-sidebar-foreground/50">
              {user?.email || "admin@example.com"}
            </span>
          </div>
          <button
            onClick={logout}
            className="rounded-md p-1.5 text-sidebar-foreground/40 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground group-data-[collapsible=icon]:hidden"
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
