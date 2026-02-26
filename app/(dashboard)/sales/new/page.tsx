"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Plus, Minus, Trash2, Search } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { salesApi } from "@/lib/api/sales";
import { customersApi } from "@/lib/api/customers";
import { salesmenApi } from "@/lib/api/salesmen";
import { productsApi } from "@/lib/api/products";
import { PaymentMethods } from "@/types";
import type { ProductDto } from "@/types";
import { formatCurrency } from "@/lib/utils";

interface CartItem {
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  discount: number;
}

const saleFormSchema = z.object({
  customerId: z.string().optional(),
  salesmanId: z.string().optional(),
  discount: z.coerce.number().min(0, "Discount must be 0 or greater"),
  tax: z.coerce.number().min(0, "Tax must be 0 or greater"),
  paymentMethod: z.coerce.number().min(0, "Payment method is required"),
  notes: z.string().optional(),
});

type SaleFormValues = z.infer<typeof saleFormSchema>;

export default function NewSalePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [productSearch, setProductSearch] = useState("");
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<SaleFormValues>({
    resolver: zodResolver(saleFormSchema),
    defaultValues: {
      customerId: "",
      salesmanId: "",
      discount: 0,
      tax: 0,
      paymentMethod: 0,
      notes: "",
    },
  });

  const discount = watch("discount");
  const tax = watch("tax");
  const paymentMethod = watch("paymentMethod");

  const { data: productsResponse, isLoading: productsLoading } = useQuery({
    queryKey: ["products", "pos", productSearch],
    queryFn: () =>
      productsApi.list({
        pageSize: 20,
        search: productSearch || undefined,
      }),
    enabled: true,
  });

  const { data: customersResponse } = useQuery({
    queryKey: ["customers", "pos"],
    queryFn: () => customersApi.list({ pageSize: 100 }),
  });

  const { data: salesmenResponse } = useQuery({
    queryKey: ["salesmen", "pos"],
    queryFn: () => salesmenApi.list({ pageSize: 100 }),
  });

  const createMutation = useMutation({
    mutationFn: async (data: { form: SaleFormValues; items: CartItem[] }) => {
      const res = await salesApi.create({
        customerId: data.form.customerId ? Number(data.form.customerId) : null,
        salesmanId: data.form.salesmanId ? Number(data.form.salesmanId) : null,
        discount: data.form.discount,
        tax: data.form.tax,
        paymentMethod: data.form.paymentMethod,
        notes: data.form.notes || undefined,
        items: data.items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discount: item.discount,
        })),
      });
      if (!res.success) throw new Error(res.message || "Failed to create sale");
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      toast.success("Sale completed", {
        description: "The sale has been recorded successfully.",
      });
      router.push("/sales");
    },
    onError: (err: unknown) => {
      const message =
        err && typeof err === "object" && "message" in err
          ? String((err as { message: string }).message)
          : "Failed to complete sale. Please try again.";
      toast.error("Sale failed", { description: message });
    },
  });

  const products =
    productsResponse?.success && productsResponse?.data
      ? productsResponse.data.items
      : [];

  const customers =
    customersResponse?.success && customersResponse?.data
      ? customersResponse.data.items
      : [];

  const salesmen =
    salesmenResponse?.success && salesmenResponse?.data
      ? salesmenResponse.data.items
      : [];

  const addToCart = useCallback((product: ProductDto) => {
    setCartItems((prev) => {
      const existing = prev.find((i) => i.productId === product.id);
      if (existing) {
        return prev.map((i) =>
          i.productId === product.id
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          productName: product.name,
          quantity: 1,
          unitPrice: product.salePrice,
          discount: 0,
        },
      ];
    });
  }, []);

  const updateQuantity = useCallback((productId: number, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((i) =>
          i.productId === productId
            ? { ...i, quantity: Math.max(0, i.quantity + delta) }
            : i
        )
        .filter((i) => i.quantity > 0)
    );
  }, []);

  const updateItemDiscount = useCallback((productId: number, discount: number) => {
    setCartItems((prev) =>
      prev.map((i) =>
        i.productId === productId ? { ...i, discount } : i
      )
    );
  }, []);

  const removeFromCart = useCallback((productId: number) => {
    setCartItems((prev) => prev.filter((i) => i.productId !== productId));
  }, []);

  const subTotal = cartItems.reduce(
    (sum, item) =>
      sum + item.quantity * item.unitPrice - item.discount,
    0
  );
  const totalAmount = subTotal - (discount ?? 0) + (tax ?? 0);

  const onSubmit = (formData: SaleFormValues) => {
    if (cartItems.length === 0) {
      toast.error("Cart is empty", {
        description: "Add at least one product to complete the sale.",
      });
      return;
    }
    createMutation.mutate({ form: formData, items: cartItems });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="New Sale"
        description="Point of Sale — add products and complete the transaction"
      />

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Left: Product search */}
          <Card>
            <CardHeader>
              <CardTitle className="font-display">Products</CardTitle>
              <p className="text-sm text-muted-foreground">
                Search and click to add products to the cart
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search products by name..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <ScrollArea className="h-[320px] rounded-md border">
                <div className="p-2 space-y-2">
                  {productsLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : products.length === 0 ? (
                    <p className="py-8 text-center text-sm text-muted-foreground">
                      {productSearch ? "No products match your search." : "Start typing to search products."}
                    </p>
                  ) : (
                    products.map((product) => (
                      <button
                        key={product.id}
                        type="button"
                        onClick={() => addToCart(product)}
                        className="flex w-full items-center justify-between rounded-lg border p-3 text-left transition-colors hover:bg-accent/50 focus:outline-none focus:ring-2 focus:ring-ring"
                      >
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatCurrency(product.salePrice)} · Stock: {product.quantityOnHand}
                          </p>
                        </div>
                        <Plus className="h-4 w-4 shrink-0 text-muted-foreground" />
                      </button>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Right: Cart and order summary */}
          <Card>
            <CardHeader>
              <CardTitle className="font-display">Cart & Order Summary</CardTitle>
              <p className="text-sm text-muted-foreground">
                {cartItems.length} item{cartItems.length !== 1 ? "s" : ""} in cart
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <ScrollArea className="h-[200px] rounded-md border">
                <div className="p-2">
                  {cartItems.length === 0 ? (
                    <p className="py-8 text-center text-sm text-muted-foreground">
                      Cart is empty. Add products from the left panel.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {cartItems.map((item) => {
                        const lineTotal =
                          item.quantity * item.unitPrice - item.discount;
                        return (
                          <div
                            key={item.productId}
                            className="flex items-center gap-2 rounded-lg border p-2"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="truncate font-medium text-sm">{item.productName}</p>
                              <div className="mt-1 flex items-center gap-2">
                                <div className="flex items-center gap-1">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="icon-xs"
                                    onClick={() => updateQuantity(item.productId, -1)}
                                  >
                                    <Minus className="h-3 w-3" />
                                  </Button>
                                  <span className="min-w-[1.5rem] text-center text-sm">
                                    {item.quantity}
                                  </span>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="icon-xs"
                                    onClick={() => updateQuantity(item.productId, 1)}
                                  >
                                    <Plus className="h-3 w-3" />
                                  </Button>
                                </div>
                                <span className="text-muted-foreground">×</span>
                                <span className="text-sm">
                                  {formatCurrency(item.unitPrice)}
                                </span>
                                <span className="text-muted-foreground">−</span>
                                <Input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  className="h-7 w-16 text-sm"
                                  value={item.discount}
                                  onChange={(e) =>
                                    updateItemDiscount(
                                      item.productId,
                                      Math.max(0, parseFloat(e.target.value) || 0)
                                    )
                                  }
                                />
                              </div>
                              <p className="mt-0.5 text-xs font-medium text-muted-foreground">
                                Line total: {formatCurrency(lineTotal)}
                              </p>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-xs"
                              onClick={() => removeFromCart(item.productId)}
                            >
                              <Trash2 className="h-3 w-3 text-destructive" />
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </ScrollArea>

              <div className="space-y-2 rounded-lg border bg-muted/30 p-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">{formatCurrency(subTotal)}</span>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="discount" className="text-sm">Order Discount</Label>
                  <Input
                    id="discount"
                    type="number"
                    step="0.01"
                    min="0"
                    {...register("discount")}
                  />
                  {errors.discount && (
                    <p className="text-xs text-destructive">{errors.discount.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tax" className="text-sm">Tax</Label>
                  <Input
                    id="tax"
                    type="number"
                    step="0.01"
                    min="0"
                    {...register("tax")}
                  />
                  {errors.tax && (
                    <p className="text-xs text-destructive">{errors.tax.message}</p>
                  )}
                </div>
                <div className="flex justify-between border-t pt-2 font-display text-base font-semibold">
                  <span>Total</span>
                  <span>{formatCurrency(totalAmount)}</span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Customer (optional)</Label>
                  <Select
                    value={watch("customerId")}
                    onValueChange={(v) => setValue("customerId", v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Walk-in customer" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Walk-in customer</SelectItem>
                      {customers.map((c) => (
                        <SelectItem key={c.id} value={String(c.id)}>
                          {c.fullName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Salesman (optional)</Label>
                  <Select
                    value={watch("salesmanId")}
                    onValueChange={(v) => setValue("salesmanId", v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select salesman" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      {salesmen.map((s) => (
                        <SelectItem key={s.id} value={String(s.id)}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Payment Method *</Label>
                  <Select
                    value={String(paymentMethod)}
                    onValueChange={(v) => setValue("paymentMethod", Number(v))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PaymentMethods.map((pm) => (
                        <SelectItem key={pm.value} value={String(pm.value)}>
                          {pm.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.paymentMethod && (
                    <p className="text-xs text-destructive">{errors.paymentMethod.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    {...register("notes")}
                    placeholder="Additional notes..."
                    rows={2}
                    className="resize-none"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  type="submit"
                  disabled={createMutation.isPending || cartItems.length === 0}
                  className="flex-1"
                >
                  {createMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Completing...
                    </>
                  ) : (
                    "Complete Sale"
                  )}
                </Button>
                <Button type="button" variant="outline" asChild>
                  <Link href="/sales">Cancel</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  );
}
