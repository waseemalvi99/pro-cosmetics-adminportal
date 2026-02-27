# Product Images API — Frontend Integration Guide

## Overview

Product images are managed via dedicated endpoints, separate from the main product CRUD.
All images are **automatically optimized on upload**: resized (max 1200x1200), converted to **WebP**, EXIF stripped, and auto-oriented. The frontend sends the original file — the backend handles all optimization.

---

## Base URL

```
/api/products/{productId}/images
```

All endpoints require **JWT Bearer token** in the `Authorization` header.

---

## Endpoints

### 1. Upload Single Image

```
POST /api/products/{productId}/images
```

**Permission:** `Products:Edit`

**Content-Type:** `multipart/form-data`

| Field  | Type   | Description              |
|--------|--------|--------------------------|
| `file` | File   | Image file (required)    |

**Accepted formats:** `.jpg`, `.jpeg`, `.png`, `.gif`, `.webp`, `.bmp`, `.tiff`
**Max file size:** 10 MB
**Max images per product:** 10

**Response (200):**
```json
{
  "success": true,
  "message": "Image uploaded and optimized successfully.",
  "data": {
    "id": 1,
    "productId": 5,
    "fileName": "a1b2c3d4-e5f6-7890.webp",
    "url": "/uploads/products/a1b2c3d4-e5f6-7890.webp",
    "isPrimary": true,
    "sortOrder": 1
  }
}
```

> The first image uploaded for a product is automatically set as primary.

**Example (fetch):**
```js
const formData = new FormData();
formData.append('file', fileInput.files[0]);

const res = await fetch(`/api/products/${productId}/images`, {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: formData,
});
```

---

### 2. Upload Multiple Images (Bulk)

```
POST /api/products/{productId}/images/bulk
```

**Permission:** `Products:Edit`

**Content-Type:** `multipart/form-data`

| Field   | Type     | Description                        |
|---------|----------|------------------------------------|
| `files` | File[]   | Multiple image files (required)    |

> **Important:** The form field name MUST be `files` (not `file`).

**Response (200):**
```json
{
  "success": true,
  "message": "3 image(s) uploaded and optimized successfully.",
  "data": [
    {
      "id": 1,
      "productId": 5,
      "fileName": "abc123.webp",
      "url": "/uploads/products/abc123.webp",
      "isPrimary": true,
      "sortOrder": 1
    },
    {
      "id": 2,
      "productId": 5,
      "fileName": "def456.webp",
      "url": "/uploads/products/def456.webp",
      "isPrimary": false,
      "sortOrder": 2
    }
  ]
}
```

**Example (fetch):**
```js
const formData = new FormData();
for (const file of fileInput.files) {
  formData.append('files', file);
}

const res = await fetch(`/api/products/${productId}/images/bulk`, {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: formData,
});
```

---

### 3. Get All Images for a Product

```
GET /api/products/{productId}/images
```

**Permission:** `Products:View`

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "productId": 5,
      "fileName": "abc123.webp",
      "url": "/uploads/products/abc123.webp",
      "isPrimary": true,
      "sortOrder": 1
    },
    {
      "id": 2,
      "productId": 5,
      "fileName": "def456.webp",
      "url": "/uploads/products/def456.webp",
      "isPrimary": false,
      "sortOrder": 2
    }
  ]
}
```

> Images are returned ordered by `sortOrder`.

---

### 4. Delete an Image

```
DELETE /api/products/{productId}/images/{imageId}
```

**Permission:** `Products:Edit`

**Response (200):**
```json
{
  "success": true,
  "message": "Image deleted successfully."
}
```

---

### 5. Set Primary Image

```
PUT /api/products/{productId}/images/{imageId}/primary
```

**Permission:** `Products:Edit`

**Response (200):**
```json
{
  "success": true,
  "message": "Primary image updated successfully."
}
```

> Only one image can be primary at a time. Setting a new primary automatically clears the previous one.

---

## Displaying Images

Image URLs are relative to the backend base URL. To display:

```jsx
// If backend is at http://localhost:5089
const imageUrl = `${API_BASE_URL}${image.url}`;
// Result: http://localhost:5089/uploads/products/abc123.webp
```

Images are served as static files via the `/uploads/` path — no auth required to fetch them.

---

## Error Responses

All errors follow the standard API error format:

**Validation Error (400):**
```json
{
  "success": false,
  "message": "One or more validation errors occurred.",
  "errors": {
    "file": ["Invalid image file type '.pdf'. Allowed: .jpg, .jpeg, .png, .gif, .webp, .bmp, .tiff"]
  }
}
```

**Common errors:**
| Scenario | Error |
|----------|-------|
| Wrong file type | `Invalid image file type '.pdf'. Allowed: ...` |
| File too large (>10MB) | `File size 12.5 MB exceeds the maximum of 10 MB.` |
| Empty file | `File is empty.` |
| Too many images (>10) | `A product can have a maximum of 10 images.` |
| Product not found | `Product with ID 999 was not found.` (404) |
| Image not found | `ProductImage with ID 999 was not found.` (404) |
| No files in bulk upload | `No files provided. Use form field name 'files'.` |

---

## Frontend Implementation Notes

### Recommended UI Features

1. **Drag & drop zone** — Accept multiple files via drag-and-drop or file picker
2. **Preview before upload** — Show thumbnails using `URL.createObjectURL(file)` before uploading
3. **Upload progress** — Use `XMLHttpRequest` or `axios` with `onUploadProgress` for progress bars
4. **Primary image indicator** — Show a star/badge on the primary image with click-to-set
5. **Delete confirmation** — Confirm before deleting images
6. **Image limit display** — Show "3/10 images" counter
7. **File validation (client-side)** — Validate type and size before upload to avoid unnecessary requests

### Client-Side Validation (pre-upload)

```js
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp', 'image/tiff'];
const MAX_SIZE = 10 * 1024 * 1024; // 10 MB
const MAX_IMAGES = 10;

function validateFile(file) {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return `${file.name}: Invalid file type. Accepted: JPG, PNG, GIF, WebP, BMP, TIFF`;
  }
  if (file.size > MAX_SIZE) {
    return `${file.name}: File too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Max: 10 MB`;
  }
  return null; // valid
}
```

### Image Optimization Details (handled by backend)

- All uploaded images are **converted to WebP** format regardless of input format
- Images larger than **1200x1200** are resized proportionally (aspect ratio preserved)
- EXIF metadata is **stripped** (privacy + smaller files)
- Images are **auto-oriented** based on EXIF rotation data before stripping
- Typical compression: a 5MB JPEG becomes ~200-500KB WebP
