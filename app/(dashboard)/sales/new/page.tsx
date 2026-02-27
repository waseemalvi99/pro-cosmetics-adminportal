"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Loader2,
  Plus,
  Minus,
  Trash2,
  Search,
  ImageIcon,
  ShoppingCart,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
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
import { SearchableCombobox } from "@/components/ui/searchable-combobox";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BarcodeScanner } from "@/components/shared/barcode-scanner";
import { salesApi } from "@/lib/api/sales";
import { productsApi } from "@/lib/api/products";
import { useBarcodeScanner } from "@/hooks/use-barcode-scanner";
import { useCustomerCombo, useSalesmanCombo } from "@/hooks/use-combo-search";
import { PaymentMethods } from "@/types";
import type { ProductDto, ProductBarcodeDto } from "@/types";
import { formatCurrency, getImageUrl } from "@/lib/utils";

interface CartItem {
  productId: number;
  productName: string;
  imageUrl: string | null;
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
  const [showManualSearch, setShowManualSearch] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);

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

  const addBarcodeProduct = useCallback(
    (product: ProductBarcodeDto) => {
      setScanError(null);
      const primaryImage =
        product.images?.find((img) => img.isPrimary) ?? product.images?.[0];
      setCartItems((prev) => {
        const existing = prev.find((i) => i.productId === product.productId);
        if (existing) {
          toast.info(`${product.productName} — quantity increased`);
          return prev.map((i) =>
            i.productId === product.productId
              ? { ...i, quantity: i.quantity + 1 }
              : i
          );
        }
        toast.success(`${product.productName} added to cart`);
        return [
          ...prev,
          {
            productId: product.productId,
            productName: product.productName,
            imageUrl: primaryImage?.url ?? null,
            quantity: 1,
            unitPrice: product.salePrice,
            discount: 0,
          },
        ];
      });
    },
    []
  );

  const scanner = useBarcodeScanner({
    onProductFound: addBarcodeProduct,
    onError: (msg) => setScanError(msg),
  });

  const { data: productsResponse, isLoading: productsLoading } = useQuery({
    queryKey: ["products", "pos", productSearch],
    queryFn: () =>
      productsApi.list({
        pageSize: 20,
        search: productSearch || undefined,
      }),
    enabled: showManualSearch,
  });

  const customerCombo = useCustomerCombo();
  const salesmanCombo = useSalesmanCombo();

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

  const addToCart = useCallback((product: ProductDto) => {
    const primaryImage =
      product.images?.find((img) => img.isPrimary) ?? product.images?.[0];
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
          imageUrl: primaryImage?.url ?? null,
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

  const updateItemDiscount = useCallback(
    (productId: number, disc: number) => {
      setCartItems((prev) =>
        prev.map((i) =>
          i.productId === productId ? { ...i, discount: disc } : i
        )
      );
    },
    []
  );

  const removeFromCart = useCallback((productId: number) => {
    setCartItems((prev) => prev.filter((i) => i.productId !== productId));
  }, []);

  const subTotal = cartItems.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice - item.discount,
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
    <div className="space-y-4">
      <PageHeader
        title="New Sale"
        description="Point of Sale"
      />

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid gap-4 lg:grid-cols-[1fr_1fr_320px]">

          {/* Column 1: Barcode scanner + Product catalog fallback */}
          <Card className="flex flex-col">
            <CardHeader className="pb-3">
              <CardTitle className="font-display text-base">Add Products</CardTitle>

              <div className="mt-3">
                <BarcodeScanner
                  barcode={scanner.barcode}
                  onBarcodeChange={scanner.setBarcode}
                  onKeyDown={scanner.handleKeyDown}
                  inputRef={scanner.inputRef}
                  isScanning={scanner.isScanning}
                  lastScannedProduct={scanner.lastScannedProduct}
                  error={scanError}
                  priceField="salePrice"
                  autoFocus
                />
              </div>

              <div className="mt-3 border-t pt-3">
                <button
                  type="button"
                  onClick={() => setShowManualSearch((v) => !v)}
                  className="flex w-full items-center justify-between text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  <span className="flex items-center gap-2">
                    <Search className="h-3.5 w-3.5" />
                    Search products manually
                  </span>
                  {showManualSearch ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </button>

                {showManualSearch && (
                  <div className="relative mt-2">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search by name, SKU..."
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="flex-1 p-0">
              {showManualSearch && (
                <ScrollArea className="h-[calc(100vh-440px)]">
                  <div className="space-y-1 px-4 pb-4">
                    {productsLoading ? (
                      <div className="flex items-center justify-center py-16">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      </div>
                    ) : products.length === 0 ? (
                      <p className="py-16 text-center text-sm text-muted-foreground">
                        {productSearch
                          ? "No products match your search."
                          : "Type to search products."}
                      </p>
                    ) : (
                      products.map((product) => {
                        const primaryImage =
                          product.images?.find((img) => img.isPrimary) ??
                          product.images?.[0];
                        const inCart = cartItems.find(
                          (i) => i.productId === product.id
                        );
                        return (
                          <button
                            key={product.id}
                            type="button"
                            onClick={() => addToCart(product)}
                            className="flex w-full items-center gap-3 rounded-lg border p-2.5 text-left transition-colors hover:bg-accent/50 focus:outline-none focus:ring-2 focus:ring-ring"
                          >
                            {primaryImage ? (
                              <img
                                src={getImageUrl(primaryImage.url)}
                                alt={product.name}
                                className="h-10 w-10 shrink-0 rounded-md object-cover"
                              />
                            ) : (
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-muted">
                                <ImageIcon className="h-4 w-4 text-muted-foreground" />
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium">
                                {product.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {formatCurrency(product.salePrice)} · Stock:{" "}
                                {product.quantityOnHand}
                              </p>
                            </div>
                            {inCart ? (
                              <Badge
                                variant="secondary"
                                className="shrink-0 tabular-nums"
                              >
                                {inCart.quantity}
                              </Badge>
                            ) : (
                              <Plus className="h-4 w-4 shrink-0 text-muted-foreground" />
                            )}
                          </button>
                        );
                      })
                    )}
                  </div>
                </ScrollArea>
              )}

              {!showManualSearch && (
                <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
                  <ShoppingCart className="h-8 w-8 text-muted-foreground/20" />
                  <p className="mt-2 text-sm text-muted-foreground">
                    Scan barcodes to add products
                  </p>
                  <p className="text-xs text-muted-foreground">
                    or expand manual search above
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Column 2: Cart */}
          <Card className="flex flex-col">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="font-display text-base">
                  Cart
                </CardTitle>
                <Badge variant="outline" className="tabular-nums">
                  <ShoppingCart className="mr-1 h-3 w-3" />
                  {cartItems.length} item{cartItems.length !== 1 ? "s" : ""}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col gap-4 p-0">
              <ScrollArea className="h-[calc(100vh-380px)] flex-1">
                <div className="space-y-2 px-4">
                  {cartItems.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <ShoppingCart className="h-10 w-10 text-muted-foreground/30" />
                      <p className="mt-3 text-sm text-muted-foreground">
                        Cart is empty
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Scan a barcode or search to add products
                      </p>
                    </div>
                  ) : (
                    cartItems.map((item) => {
                      const lineTotal =
                        item.quantity * item.unitPrice - item.discount;
                      return (
                        <div
                          key={item.productId}
                          className="rounded-lg border p-3"
                        >
                          <div className="flex items-start gap-3">
                            {item.imageUrl ? (
                              <img
                                src={getImageUrl(item.imageUrl)}
                                alt={item.productName}
                                className="h-11 w-11 shrink-0 rounded-md object-cover"
                              />
                            ) : (
                              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-muted">
                                <ImageIcon className="h-4 w-4 text-muted-foreground" />
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <div className="flex items-start justify-between gap-2">
                                <p className="truncate text-sm font-medium">
                                  {item.productName}
                                </p>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 shrink-0"
                                  onClick={() =>
                                    removeFromCart(item.productId)
                                  }
                                >
                                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                                </Button>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {formatCurrency(item.unitPrice)} each
                              </p>
                            </div>
                          </div>

                          <div className="mt-2 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-1">
                              <Button
                                type="button"
                                variant="outline"
                                size="icon-xs"
                                onClick={() =>
                                  updateQuantity(item.productId, -1)
                                }
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="min-w-[2rem] text-center text-sm font-medium tabular-nums">
                                {item.quantity}
                              </span>
                              <Button
                                type="button"
                                variant="outline"
                                size="icon-xs"
                                onClick={() =>
                                  updateQuantity(item.productId, 1)
                                }
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Label className="text-xs text-muted-foreground whitespace-nowrap">
                                Disc.
                              </Label>
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                className="h-7 w-20 text-sm tabular-nums"
                                value={item.discount}
                                onChange={(e) =>
                                  updateItemDiscount(
                                    item.productId,
                                    Math.max(
                                      0,
                                      parseFloat(e.target.value) || 0
                                    )
                                  )
                                }
                              />
                            </div>
                            <p className="text-sm font-semibold tabular-nums whitespace-nowrap">
                              {formatCurrency(lineTotal)}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </ScrollArea>

              {/* Cart totals pinned at bottom */}
              <div className="border-t px-4 pb-4 pt-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium tabular-nums">
                    {formatCurrency(subTotal)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Column 3: Checkout */}
          <div className="lg:sticky lg:top-4 lg:self-start">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="font-display text-base">
                  Checkout
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="discount" className="text-xs">
                      Order Discount
                    </Label>
                    <Input
                      id="discount"
                      type="number"
                      step="0.01"
                      min="0"
                      className="h-8 text-sm"
                      {...register("discount")}
                    />
                    {errors.discount && (
                      <p className="text-xs text-destructive">
                        {errors.discount.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="tax" className="text-xs">
                      Tax
                    </Label>
                    <Input
                      id="tax"
                      type="number"
                      step="0.01"
                      min="0"
                      className="h-8 text-sm"
                      {...register("tax")}
                    />
                    {errors.tax && (
                      <p className="text-xs text-destructive">
                        {errors.tax.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex justify-between rounded-lg bg-muted/50 p-3 font-display text-base font-semibold">
                  <span>Total</span>
                  <span className="tabular-nums">
                    {formatCurrency(totalAmount)}
                  </span>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Customer (optional)</Label>
                  <SearchableCombobox
                    options={customerCombo.options}
                    value={watch("customerId") || ""}
                    onValueChange={(v) => setValue("customerId", v)}
                    onSearchChange={customerCombo.setSearch}
                    isLoading={customerCombo.isLoading}
                    placeholder="Walk-in customer"
                    searchPlaceholder="Search customers..."
                    emptyMessage="No customers found."
                    clearable
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Salesman (optional)</Label>
                  <SearchableCombobox
                    options={salesmanCombo.options}
                    value={watch("salesmanId") || ""}
                    onValueChange={(v) => setValue("salesmanId", v)}
                    onSearchChange={salesmanCombo.setSearch}
                    isLoading={salesmanCombo.isLoading}
                    placeholder="Select salesman"
                    searchPlaceholder="Search salesmen..."
                    emptyMessage="No salesmen found."
                    clearable
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Payment Method *</Label>
                  <Select
                    value={String(paymentMethod)}
                    onValueChange={(v) =>
                      setValue("paymentMethod", Number(v))
                    }
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PaymentMethods.map((pm) => (
                        <SelectItem
                          key={pm.value}
                          value={String(pm.value)}
                        >
                          {pm.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.paymentMethod && (
                    <p className="text-xs text-destructive">
                      {errors.paymentMethod.message}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="notes" className="text-xs">
                    Notes
                  </Label>
                  <Textarea
                    id="notes"
                    {...register("notes")}
                    placeholder="Additional notes..."
                    rows={2}
                    className="resize-none text-sm"
                  />
                </div>

                <div className="flex gap-2 pt-1">
                  <Button
                    type="submit"
                    disabled={
                      createMutation.isPending || cartItems.length === 0
                    }
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
        </div>
      </form>
    </div>
  );
}
