# Frontend Spec: Purchase Order Close (Partial Receipt)

## Summary

A new "Close" action has been added to the backend for purchase orders that are `PartiallyReceived`. This allows finalizing a PO when the supplier can't deliver the remaining items. Closing creates a ledger entry for only the **received amount** (not the full PO total). The frontend needs updates across 4 files.

---

## Backend API Changes

### New Endpoint
```
PUT /api/purchase-orders/{id}/close
Permission: Purchases:Close
Body: { "reason": "string | null" }
Response: { "success": true, "message": "Purchase order closed. Ledger updated with received amount." }
```

### Updated Response — `PurchaseOrderDto`
Two new fields returned by `GET /api/purchase-orders` and `GET /api/purchase-orders/{id}`:
```json
{
  "receivedAmount": 1500.00,
  "closeReason": "Supplier discontinued remaining items"
}
```

### New Status Value
`"Closed"` — added after `"Cancelled"`. A closed PO is a terminal state (like Received or Cancelled).

### Updated Cancel Behavior
Cancel is now **blocked** for `PartiallyReceived` orders. The API returns an error: `"Cannot cancel a partially received order. Use Close instead to finalize it."`. Cancel still works for `Draft` and `Submitted` only.

---

## File Changes Required

### 1. `types/index.ts`

**Add new interface:**
```typescript
export interface ClosePurchaseOrderRequest {
  reason?: string;
}
```

**Update `PurchaseOrderDto`** — add two fields:
```typescript
export interface PurchaseOrderDto {
  // ... existing fields ...
  receivedAmount: number;    // ADD
  closeReason: string | null; // ADD
  // ... rest ...
}
```

**Update `PurchaseOrderStatuses`** — add `"Closed"`:
```typescript
export const PurchaseOrderStatuses = ["Draft", "Submitted", "PartiallyReceived", "Received", "Cancelled", "Closed"] as const;
```

---

### 2. `lib/api/purchase-orders.ts`

**Add import** for the new request type:
```typescript
import type { ..., ClosePurchaseOrderRequest } from "@/types";
```

**Add `close` method** to `purchaseOrdersApi`:
```typescript
close: (id: number, data: ClosePurchaseOrderRequest) =>
  apiClient.put<void>(`/api/purchase-orders/${id}/close`, data),
```

---

### 3. `app/(dashboard)/purchase-orders/page.tsx` (List Page)

**Status badge** — add `Closed` color to `STATUS_BADGE_CLASSES`:
```typescript
Closed: "bg-violet-500/15 text-violet-600 dark:text-violet-400",
```

**Cancel button visibility** — update the condition that controls when Cancel is shown. Cancel should only be available for `Draft` and `Submitted`:
```typescript
// BEFORE: canCancel was allowed for Draft, Submitted, PartiallyReceived
// AFTER:
const canCancel = order.status === "Draft" || order.status === "Submitted";
```

No close button on the list page — close requires a reason, so it's only on the detail page.

---

### 4. `app/(dashboard)/purchase-orders/[id]/page.tsx` (Detail Page)

This is the main file with the most changes.

#### A. Status badge — add `Closed` to the CASE map (same violet color as list page)

#### B. Close action conditions
```typescript
const canClose = order?.status === "PartiallyReceived";
const canCancel = order?.status === "Draft" || order?.status === "Submitted";
const isTerminal = ["Received", "Cancelled", "Closed"].includes(order?.status);
```

#### C. Close mutation
```typescript
const closeMutation = useMutation({
  mutationFn: (data: { id: number; reason?: string }) =>
    purchaseOrdersApi.close(data.id, { reason: data.reason }),
  onSuccess: () => {
    toast.success("Purchase order closed", {
      description: "Ledger updated with received amount.",
    });
    queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
    queryClient.invalidateQueries({ queryKey: ["purchase-order", id] });
  },
  onError: (err: Error) => {
    toast.error("Failed to close order", { description: err.message });
  },
});
```

#### D. Close reason state
```typescript
const [showCloseDialog, setShowCloseDialog] = useState(false);
const [closeReason, setCloseReason] = useState("");
```

#### E. Close UI — add after the cancel button section

When `canClose` is true, show a "Close Order" button that opens a confirmation dialog:

```
Button: "Close Order" (variant: outline, icon: Lock or CheckCircle2)
  → Opens AlertDialog with:
    - Title: "Close Purchase Order?"
    - Description: "This will finalize the order with only the received items.
      A ledger entry of {formatCurrency(receivedAmount)} will be created
      (original total: {formatCurrency(totalAmount)})."
    - Textarea: optional reason (placeholder: "Reason for closing (optional)")
    - Cancel button
    - Confirm button: "Close Order" → calls closeMutation.mutate({ id, reason: closeReason })
```

#### F. Order info section — show ReceivedAmount and CloseReason

When the order has a `receivedAmount > 0`, show it in the order info grid:
```
Label: "Received Amount"
Value: formatCurrency(order.receivedAmount)
```

When the order status is `Closed` and `closeReason` exists:
```
Label: "Close Reason"
Value: order.closeReason
```

#### G. Financial summary enhancement (optional but recommended)

For closed orders, show a small info banner:
```
Info card (blue/violet tint):
"This order was partially received and closed.
 Received: {formatCurrency(receivedAmount)} of {formatCurrency(totalAmount)}
 ({percentage}% fulfilled)"
```

---

## Status Flow Diagram
```
Draft → Submitted → PartiallyReceived → Closed (NEW - with ledger)
                  → Received (fully - with ledger)
Draft → Cancelled
Submitted → Cancelled
```

## Status Badge Colors (complete set)
| Status | Color |
|--------|-------|
| Draft | `bg-muted text-muted-foreground` |
| Submitted | `bg-blue-500/15 text-blue-600 dark:text-blue-400` |
| PartiallyReceived | `bg-amber-500/15 text-amber-600 dark:text-amber-400` |
| Received | `bg-green-500/15 text-green-600 dark:text-green-400` |
| Cancelled | `bg-red-500/15 text-red-600 dark:text-red-400` |
| Closed | `bg-violet-500/15 text-violet-600 dark:text-violet-400` |

---

## Edge Cases to Handle

1. **Cancel button on PartiallyReceived** — must be hidden/removed. If user somehow triggers it, the API returns an error. Show the error toast gracefully.
2. **Close on non-PartiallyReceived** — the Close button should only render when `status === "PartiallyReceived"`. API also validates this server-side.
3. **Empty reason** — reason is optional. Send `{ reason: undefined }` or `{}` if blank.
4. **After close** — the detail page should show the order as terminal (no more action buttons), display the close reason if provided, and show the received amount.
