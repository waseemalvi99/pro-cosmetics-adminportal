"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Loader2,
  Plus,
  Trash2,
  ImageIcon,
  Package,
  Search,
  ChevronDown,
  ChevronUp,
  Building2,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  CalendarDays,
  FileText,
  X,
  User,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SearchableCombobox } from "@/components/ui/searchable-combobox";
import { BarcodeScanner } from "@/components/shared/barcode-scanner";
import { purchaseOrdersApi } from "@/lib/api/purchase-orders";
import { suppliersApi } from "@/lib/api/suppliers";
import { useBarcodeScanner } from "@/hooks/use-barcode-scanner";
import { useSupplierCombo, useProductCombo } from "@/hooks/use-combo-search";
import { formatCurrency, getImageUrl } from "@/lib/utils";
import type { ProductBarcodeDto } from "@/types";

const itemSchema = z.object({
  productId: z.string().min(1, "Product is required"),
  productName: z.string().optional(),
  imageUrl: z.string().nullable().optional(),
  quantity: z.coerce.number().min(1, "Min 1"),
  unitPrice: z.coerce.number().min(0, "Min 0"),
});

const createOrderSchema = z.object({
  supplierId: z.string().min(1, "Supplier is required"),
  expectedDeliveryDate: z.string().optional(),
  paymentTermDays: z.string().optional(),
  notes: z.string().optional(),
  items: z
    .array(itemSchema)
    .min(1, "Add at least one item")
    .refine(
      (items) => {
        const ids = items.map((i) => i.productId).filter(Boolean);
        return new Set(ids).size === ids.length;
      },
      { message: "Duplicate products found." }
    ),
});

type CreateOrderForm = z.infer<typeof createOrderSchema>;

export default function NewPurchaseOrderPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [scanError, setScanError] = useState<string | null>(null);
  const [showManualAdd, setShowManualAdd] = useState(false);
  const [manualProductId, setManualProductId] = useState("");
  const [manualQty, setManualQty] = useState(1);
  const [manualPrice, setManualPrice] = useState(0);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<CreateOrderForm>({
    resolver: zodResolver(createOrderSchema),
    defaultValues: {
      supplierId: "",
      expectedDeliveryDate: "",
      paymentTermDays: "",
      notes: "",
      items: [],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "items" });

  const items = watch("items");
  const supplierId = watch("supplierId");
  const totalAmount = items.reduce(
    (sum, item) => sum + (item.quantity || 0) * (item.unitPrice || 0),
    0
  );
  const totalUnits = items.reduce((sum, item) => sum + (item.quantity || 0), 0);

  const selectedProductIds = items.map((i) => i.productId).filter(Boolean);
  const supplierCombo = useSupplierCombo();
  const productCombo = useProductCombo();

  // Fetch full supplier details when selected
  const { data: supplierResponse, isLoading: supplierLoading } = useQuery({
    queryKey: ["suppliers", Number(supplierId)],
    queryFn: () => suppliersApi.getById(Number(supplierId)),
    enabled: !!supplierId,
  });
  const supplier =
    supplierResponse?.success && supplierResponse?.data
      ? supplierResponse.data
      : null;

  // Auto-fill payment terms from supplier
  useEffect(() => {
    if (supplier && !getValues("paymentTermDays")) {
      setValue("paymentTermDays", String(supplier.paymentTermDays));
    }
  }, [supplier, getValues, setValue]);

  const addBarcodeProduct = useCallback(
    (product: ProductBarcodeDto) => {
      setScanError(null);
      const pid = String(product.productId);
      const currentItems = getValues("items");
      const existingIndex = currentItems.findIndex(
        (item) => item.productId === pid
      );

      if (existingIndex !== -1) {
        const existingQty = currentItems[existingIndex].quantity || 1;
        setValue(`items.${existingIndex}.quantity`, existingQty + 1);
        toast.info(`${product.productName} — quantity increased`);
        return;
      }

      const primaryImage =
        product.images?.find((img) => img.isPrimary) ?? product.images?.[0];
      append({
        productId: pid,
        productName: product.productName,
        imageUrl: primaryImage?.url ?? null,
        quantity: 1,
        unitPrice: product.costPrice,
      });
      toast.success(`${product.productName} added`);
    },
    [getValues, setValue, append]
  );

  const scanner = useBarcodeScanner({
    onProductFound: addBarcodeProduct,
    onError: (msg) => setScanError(msg),
  });

  const handleManualAdd = useCallback(() => {
    if (!manualProductId) return;
    const currentItems = getValues("items");
    const existingIndex = currentItems.findIndex(
      (item) => item.productId === manualProductId
    );
    if (existingIndex !== -1) {
      const existingQty = currentItems[existingIndex].quantity || 1;
      setValue(`items.${existingIndex}.quantity`, existingQty + manualQty);
      toast.info("Product already exists — quantity increased");
    } else {
      const opt = productCombo.options.find(
        (o) => o.value === manualProductId
      );
      append({
        productId: manualProductId,
        productName: opt?.label || "Unknown Product",
        imageUrl: opt?.imageUrl ?? null,
        quantity: manualQty,
        unitPrice: manualPrice,
      });
      toast.success(`${opt?.label || "Product"} added`);
    }
    setManualProductId("");
    setManualQty(1);
    setManualPrice(0);
  }, [
    manualProductId,
    manualQty,
    manualPrice,
    getValues,
    setValue,
    append,
    productCombo.options,
  ]);

  const updateQuantity = useCallback(
    (index: number, delta: number) => {
      const current = getValues(`items.${index}.quantity`) || 1;
      setValue(`items.${index}.quantity`, Math.max(1, current + delta));
    },
    [getValues, setValue]
  );

  const createMutation = useMutation({
    mutationFn: (data: CreateOrderForm) =>
      purchaseOrdersApi.create({
        supplierId: Number(data.supplierId),
        expectedDeliveryDate: data.expectedDeliveryDate || undefined,
        paymentTermDays: data.paymentTermDays
          ? Number(data.paymentTermDays)
          : undefined,
        notes: data.notes || undefined,
        items: data.items.map((item) => ({
          productId: Number(item.productId),
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
      toast.success("Purchase order created", {
        description: "The order has been created as Draft.",
      });
      router.push("/purchase-orders");
    },
    onError: (err: unknown) => {
      const message =
        err && typeof err === "object" && "message" in err
          ? String((err as { message: string }).message)
          : "Failed to create order.";
      toast.error("Create failed", { description: message });
    },
  });

  const onSubmit = (data: CreateOrderForm) => {
    if (data.items.length === 0) {
      toast.error("Add at least one item to create the order.");
      return;
    }
    createMutation.mutate(data);
  };

  const availableManualOptions = productCombo.options.filter(
    (opt) => !selectedProductIds.includes(opt.value)
  );

  return (
    <div className="space-y-4">
      <PageHeader
        title="New Purchase Order"
        description="Create a new purchase order"
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Row 1: Supplier card (full width) */}
        <Card>
          <CardContent className="p-4">
            {!supplierId ? (
              <div className="flex flex-col items-center gap-3 sm:flex-row">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-muted">
                  <Building2 className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="flex-1 text-center sm:text-left">
                  <p className="text-sm font-medium">Select a Supplier</p>
                  <p className="text-xs text-muted-foreground">
                    Choose a supplier to start creating the purchase order
                  </p>
                </div>
                <div className="w-full sm:w-72">
                  <SearchableCombobox
                    options={supplierCombo.options}
                    value={supplierId}
                    onValueChange={(v) => setValue("supplierId", v)}
                    onSearchChange={supplierCombo.setSearch}
                    isLoading={supplierCombo.isLoading}
                    placeholder="Search suppliers..."
                    searchPlaceholder="Search suppliers..."
                    emptyMessage="No suppliers found."
                  />
                  {errors.supplierId && (
                    <p className="mt-1 text-xs text-destructive">
                      {errors.supplierId.message}
                    </p>
                  )}
                </div>
              </div>
            ) : supplierLoading ? (
              <div className="flex items-center gap-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-4 w-72" />
                </div>
              </div>
            ) : supplier ? (
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-display text-lg font-semibold truncate">
                      {supplier.name}
                    </h3>
                    <Badge
                      variant={supplier.isActive ? "default" : "secondary"}
                      className={
                        supplier.isActive
                          ? "bg-emerald-600 hover:bg-emerald-600"
                          : ""
                      }
                    >
                      {supplier.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <div className="mt-2 grid gap-x-6 gap-y-1.5 text-sm sm:grid-cols-2 lg:grid-cols-4">
                    {supplier.contactPerson && (
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                        <User className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{supplier.contactPerson}</span>
                      </span>
                    )}
                    {supplier.phone && (
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                        <Phone className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{supplier.phone}</span>
                      </span>
                    )}
                    {supplier.email && (
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                        <Mail className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{supplier.email}</span>
                      </span>
                    )}
                    {supplier.address && (
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{supplier.address}</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Supplier KPI pills */}
                <div className="flex shrink-0 flex-wrap items-start gap-2 sm:flex-nowrap">
                  <div className="rounded-lg border bg-muted/30 px-3 py-2 text-center">
                    <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                      Payment Terms
                    </p>
                    <p className="font-display text-lg font-bold leading-tight">
                      {supplier.paymentTermDays}
                      <span className="text-xs font-normal text-muted-foreground">
                        {" "}
                        days
                      </span>
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    onClick={() => {
                      setValue("supplierId", "");
                      setValue("paymentTermDays", "");
                    }}
                  >
                    <X className="h-4 w-4" />
                    <span className="sr-only">Change supplier</span>
                  </Button>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>

        {/* Row 2: Main content (only show after supplier selected) */}
        {supplierId && (
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_420px]">
            {/* Left: Add items + line items */}
            <div className="space-y-4">
              {/* Add item section */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="font-display text-base">
                    Add Items
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <BarcodeScanner
                    barcode={scanner.barcode}
                    onBarcodeChange={scanner.setBarcode}
                    onKeyDown={scanner.handleKeyDown}
                    inputRef={scanner.inputRef}
                    isScanning={scanner.isScanning}
                    lastScannedProduct={scanner.lastScannedProduct}
                    error={scanError}
                    priceField="costPrice"
                    autoFocus
                    placeholder="Scan barcode to add item..."
                  />
                  <div className="border-t pt-3">
                    <button
                      type="button"
                      onClick={() => setShowManualAdd((v) => !v)}
                      className="flex w-full items-center justify-between text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      <span className="flex items-center gap-2">
                        <Search className="h-3.5 w-3.5" />
                        Search &amp; add manually
                      </span>
                      {showManualAdd ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </button>
                    {showManualAdd && (
                      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end">
                        <div className="min-w-0 flex-1 space-y-1.5">
                          <Label className="text-xs">Product</Label>
                          <SearchableCombobox
                            options={availableManualOptions}
                            value={manualProductId}
                            onValueChange={setManualProductId}
                            onSearchChange={productCombo.setSearch}
                            isLoading={productCombo.isLoading}
                            placeholder="Select product"
                            searchPlaceholder="Search products..."
                            emptyMessage="No products found."
                          />
                        </div>
                        <div className="w-20 space-y-1.5">
                          <Label className="text-xs">Qty</Label>
                          <Input
                            type="number"
                            min="1"
                            value={manualQty}
                            onChange={(e) =>
                              setManualQty(
                                Math.max(1, parseInt(e.target.value) || 1)
                              )
                            }
                          />
                        </div>
                        <div className="w-28 space-y-1.5">
                          <Label className="text-xs">Unit Price</Label>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={manualPrice}
                            onChange={(e) =>
                              setManualPrice(
                                Math.max(0, parseFloat(e.target.value) || 0)
                              )
                            }
                          />
                        </div>
                        <Button
                          type="button"
                          size="default"
                          onClick={handleManualAdd}
                          disabled={!manualProductId}
                        >
                          <Plus className="h-4 w-4" />
                          Add
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Line items list */}
              <Card className="flex flex-col">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="font-display text-base">
                      Line Items
                    </CardTitle>
                    <Badge variant="outline" className="tabular-nums">
                      <Package className="mr-1 h-3 w-3" />
                      {fields.length} item{fields.length !== 1 ? "s" : ""}
                      {totalUnits > 0 && ` · ${totalUnits} units`}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {fields.length === 0 ? (
                    <div className="flex flex-col items-center justify-center px-4 pb-6 pt-2 text-center">
                      <Package className="h-10 w-10 text-muted-foreground/20" />
                      <p className="mt-3 text-sm text-muted-foreground">
                        No items yet
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Scan a barcode or search to add products
                      </p>
                    </div>
                  ) : (
                    <>
                      <ScrollArea className="max-h-[calc(100vh-520px)]">
                        <div className="space-y-2 px-4 pb-4">
                          {fields.map((field, index) => {
                            const item = items[index];
                            const lineTotal =
                              (item?.quantity || 0) * (item?.unitPrice || 0);
                            return (
                              <div
                                key={field.id}
                                className="rounded-lg border p-3"
                              >
                                <div className="flex items-start gap-3">
                                  {item?.imageUrl ? (
                                    <img
                                      src={getImageUrl(item.imageUrl)}
                                      alt={item.productName || ""}
                                      className="h-10 w-10 shrink-0 rounded-md object-cover"
                                    />
                                  ) : (
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-muted">
                                      <ImageIcon className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                  )}
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-start justify-between gap-2">
                                      <p className="truncate text-sm font-medium">
                                        {item?.productName ||
                                          `Product #${item?.productId}`}
                                      </p>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 shrink-0"
                                        onClick={() => remove(index)}
                                      >
                                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                                      </Button>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                      {formatCurrency(item?.unitPrice || 0)}{" "}
                                      each
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
                                        updateQuantity(index, -1)
                                      }
                                    >
                                      <span className="text-sm font-bold">
                                        −
                                      </span>
                                    </Button>
                                    <Input
                                      type="number"
                                      min="1"
                                      className="h-7 w-14 text-center text-sm tabular-nums"
                                      value={item?.quantity || 1}
                                      onChange={(e) => {
                                        const v = parseInt(e.target.value, 10);
                                        setValue(
                                          `items.${index}.quantity`,
                                          isNaN(v) || v < 1 ? 1 : v
                                        );
                                      }}
                                    />
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="icon-xs"
                                      onClick={() =>
                                        updateQuantity(index, 1)
                                      }
                                    >
                                      <Plus className="h-3 w-3" />
                                    </Button>
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <Label className="text-xs text-muted-foreground whitespace-nowrap">
                                      Price
                                    </Label>
                                    <Input
                                      type="number"
                                      step="0.01"
                                      min="0"
                                      className="h-7 w-24 text-sm tabular-nums"
                                      {...register(
                                        `items.${index}.unitPrice`
                                      )}
                                    />
                                  </div>
                                  <p className="text-sm font-semibold tabular-nums whitespace-nowrap">
                                    {formatCurrency(lineTotal)}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </ScrollArea>

                      <div className="border-t px-4 py-3">
                        <div className="flex justify-between font-display">
                          <span className="text-sm text-muted-foreground">
                            Subtotal
                          </span>
                          <span className="text-base font-semibold tabular-nums">
                            {formatCurrency(totalAmount)}
                          </span>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right: Order details sidebar */}
            <div className="lg:sticky lg:top-4 lg:self-start">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="font-display text-base">
                    Order Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="expectedDeliveryDate"
                      className="flex items-center gap-1.5 text-xs"
                    >
                      <CalendarDays className="h-3 w-3" />
                      Expected Delivery
                    </Label>
                    <Input
                      id="expectedDeliveryDate"
                      type="date"
                      className="h-9"
                      {...register("expectedDeliveryDate")}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label
                      htmlFor="paymentTermDays"
                      className="flex items-center gap-1.5 text-xs"
                    >
                      <CreditCard className="h-3 w-3" />
                      Payment Term Days
                    </Label>
                    <Input
                      id="paymentTermDays"
                      type="number"
                      min="0"
                      className="h-9"
                      {...register("paymentTermDays")}
                    />
                    <p className="text-[11px] text-muted-foreground">
                      Auto-filled from supplier. Override if needed.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <Label
                      htmlFor="notes"
                      className="flex items-center gap-1.5 text-xs"
                    >
                      <FileText className="h-3 w-3" />
                      Notes
                    </Label>
                    <Textarea
                      id="notes"
                      {...register("notes")}
                      placeholder="Order notes..."
                      rows={3}
                      className="resize-none text-sm"
                    />
                  </div>

                  <div className="space-y-2 rounded-lg bg-muted/50 p-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Items</span>
                      <span className="tabular-nums">
                        {fields.length} ({totalUnits} units)
                      </span>
                    </div>
                    <div className="flex justify-between font-display text-base font-semibold">
                      <span>Total</span>
                      <span className="tabular-nums">
                        {formatCurrency(totalAmount)}
                      </span>
                    </div>
                  </div>

                  {errors.items?.root && (
                    <p className="text-xs text-destructive">
                      {errors.items.root.message}
                    </p>
                  )}

                  <div className="flex gap-2 pt-1">
                    <Button
                      type="submit"
                      disabled={
                        createMutation.isPending || fields.length === 0
                      }
                      className="flex-1"
                    >
                      {createMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        "Create Order"
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => router.push("/purchase-orders")}
                      disabled={createMutation.isPending}
                    >
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
