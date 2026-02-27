# Email Notification System - Frontend Implementation Handoff

## What Changed on the Backend

We added a complete email notification system. The backend now:
1. Sends automated email notifications on all key business events (PO lifecycle, sales, deliveries, payments, credit/debit notes)
2. Exposes a new **ad-hoc email sending endpoint** for the admin portal

The frontend needs **one new feature**: a "Send Email" page/dialog so admins can compose and send emails from the portal.

---

## New API Endpoint

### `POST /api/emails/send`

**Auth**: Requires JWT + `Email:Send` permission (Admin role has it by default)

**Request Body**:
```json
{
  "to": ["recipient1@example.com", "recipient2@example.com"],
  "subject": "Monthly Statement",
  "body": "Hello, please find your statement attached..."
}
```

- `to` — array of email addresses (at least 1 required)
- `subject` — string (required, non-empty)
- `body` — string (required, non-empty). Supports HTML. The backend wraps this in a branded email template automatically.

**Success Response** (`200 OK`):
```json
{
  "success": true,
  "message": "Email sent successfully.",
  "data": "sent",
  "errors": null
}
```

**Validation Error Responses** (`400 Bad Request`):
```json
{
  "success": false,
  "message": "At least one recipient is required.",
  "data": null,
  "errors": null
}
```
Other possible validation messages:
- `"Subject is required."`
- `"Body is required."`
- `"Invalid email address: {email}"`

---

## Frontend Implementation Tasks

### 1. Add TypeScript Type

**File**: `admin-portal/types/index.ts`

Add this type alongside the existing DTOs:

```typescript
// Email
export interface SendEmailRequest {
  to: string[];
  subject: string;
  body: string;
}
```

### 2. Add API Module

**File**: `admin-portal/lib/api/emails.ts` (new file)

Follow the existing pattern from `lib/api/payments.ts`:

```typescript
import { apiClient } from "@/lib/api-client";
import type { SendEmailRequest } from "@/types";

export const emailsApi = {
  send: (data: SendEmailRequest) =>
    apiClient.post<string>("/api/emails/send", data),
};
```

### 3. Add "Send Email" Page

**File**: `admin-portal/app/(dashboard)/emails/page.tsx` (new file)

This should be a form page where admins can compose and send ad-hoc emails.

**Form Fields**:

| Field | Type | Validation | Notes |
|-------|------|------------|-------|
| To | Multi-input / tag input | At least 1 valid email | Allow typing multiple email addresses. Could be a comma-separated input or tag-style input |
| Subject | Text input | Required, non-empty | Single line |
| Body | Textarea or rich text | Required, non-empty | Multi-line. The backend wraps the content in a branded HTML template, so plain text or basic HTML works |

**Behavior**:
- Use `useMutation` with `emailsApi.send()`
- On success: show `toast.success("Email sent successfully")`
- On error: show `toast.error(response.message)`
- Clear form after successful send OR keep form and show success
- Submit button should show loading state while sending
- Disable submit when form is invalid

**Form Validation with Zod** (following project pattern):
```typescript
const sendEmailSchema = z.object({
  to: z.array(z.string().email("Invalid email address")).min(1, "At least one recipient is required"),
  subject: z.string().min(1, "Subject is required"),
  body: z.string().min(1, "Body is required"),
});
```

### 4. Add Sidebar Navigation Entry

**File**: `admin-portal/components/layout/app-sidebar.tsx`

Add to the **Administration** group (alongside Users, Roles, Notifications):

```typescript
import { Mail } from "lucide-react"; // Add to imports

// In the navigation array, Administration group:
{
  label: "Administration",
  items: [
    { title: "Users", href: "/users", icon: UserCog },
    { title: "Roles & Permissions", href: "/roles", icon: Shield },
    { title: "Notifications", href: "/notifications", icon: Bell },
    { title: "Send Email", href: "/emails", icon: Mail },       // ADD THIS
  ],
},
```

---

## UI Reference

Follow the existing page patterns. Here's the structure from other pages:

```tsx
"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Send } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { emailsApi } from "@/lib/api/emails";

// Page component with form, mutation, toast feedback
```

### Component Patterns to Follow
- **Page layout**: `<div className="space-y-6">` with `<PageHeader>` at the top
- **Form container**: `<Card>` with `<CardContent>` wrapping form fields
- **Form fields**: `<Label>` + `<Input>` or `<Textarea>` with error messages below
- **Submit button**: `<Button disabled={mutation.isPending}>` with loading text
- **Toasts**: `toast.success()` / `toast.error()` from Sonner

---

## No Other Frontend Changes Needed

All other email notifications (PO created, sale completed, delivery status changes, payments, etc.) are **fully backend-driven**. They fire automatically when business operations occur via the existing API endpoints. The frontend does NOT need to:
- Call any new endpoints for automated notifications
- Show email status or delivery tracking
- Modify existing pages for sales, purchases, deliveries, payments, or credit/debit notes

The only frontend change is adding the **Send Email** page described above.

---

## Permission Note

The `Email:Send` permission is automatically assigned to the Admin role. If the frontend eventually adds permission-based UI gating, this page should check for `Email:Send` permission via `useAuth().hasPermission("Email:Send")`.

---

## Summary of Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `types/index.ts` | **Modify** | Add `SendEmailRequest` interface |
| `lib/api/emails.ts` | **Create** | Email API module with `send()` method |
| `app/(dashboard)/emails/page.tsx` | **Create** | Send Email form page |
| `components/layout/app-sidebar.tsx` | **Modify** | Add "Send Email" nav item to Administration group |
