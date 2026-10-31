# Brightloop API Contracts
## Phase 1: Authentication, User & Staff Management

## 1. Overview
The Brightloop backend is built on **Node.js + Express** and operates in tandem with **Supabase Auth**.
All protected backend endpoints authenticate requests using Supabase JWT Bearer tokens and verify user permissions against `public.profiles`.

---

## 2. Authentication Standard
- Protected API calls MUST send the access token received upon Supabase Auth login in the `Authorization` header:
  ```http
  Authorization: Bearer <supabase_access_token>
  ```
- Unauthenticated or expired tokens return `401 Unauthorized`.
- Authenticated users lacking required privileges return `403 Forbidden`.
- Accounts with `status === 'INACTIVE'` are immediately rejected with `403 Forbidden`.

---

## 3. Endpoints

### 3.1. Health Check
- **Endpoint**: `GET /api/health`
- **Access**: Public
- **Description**: Probes the status of the server and Supabase connectivity.
- **Success Response (200 OK)**:
  ```json
  {
    "status": "ok",
    "service": "Brightloop API",
    "timestamp": "2026-10-31T09:30:00.000Z",
    "supabaseConnected": true
  }
  ```

---

### 3.2. Current User Profile
- **Endpoint**: `GET /api/auth/me`
- **Access**: Authenticated (ADMIN, STAFF, or CUSTOMER)
- **Headers**: `Authorization: Bearer <token>`
- **Description**: Returns the verified user profile from the database.
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "user": {
      "id": "7d9b97b1-...",
      "email": "customer@example.com",
      "full_name": "Jane Doe",
      "role": "CUSTOMER",
      "status": "ACTIVE",
      "created_at": "2026-10-31T09:00:00Z"
    }
  }
  ```

---

### 3.3. List Users
- **Endpoint**: `GET /api/users`
- **Access**: ADMIN only
- **Headers**: `Authorization: Bearer <admin_token>`
- **Query Parameters**:
  - `search` (optional): Filter by name or email substring
  - `role` (optional): `ALL`, `ADMIN`, `STAFF`, `CUSTOMER`
  - `status` (optional): `ALL`, `ACTIVE`, `INACTIVE`
  - `page` (optional): Page number (default: 1)
  - `limit` (optional): Items per page (default: 10, max: 100)
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "users": [
      {
        "id": "7d9b97b1-...",
        "full_name": "Jane Doe",
        "email": "jane@example.com",
        "role": "CUSTOMER",
        "status": "ACTIVE",
        "created_at": "2026-10-31T09:00:00Z",
        "updated_at": "2026-10-31T09:00:00Z"
      }
    ],
    "total": 42,
    "page": 1,
    "limit": 10,
    "totalPages": 5
  }
  ```

---

### 3.4. List Staff Members
- **Endpoint**: `GET /api/users/staff`
- **Access**: ADMIN only
- **Headers**: `Authorization: Bearer <admin_token>`
- **Query Parameters**:
  - `search` (optional): Filter staff by name or email
  - `status` (optional): `ALL`, `ACTIVE`, `INACTIVE`
  - `page` (optional): Page number (default: 1)
  - `limit` (optional): Items per page (default: 10)
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "staff": [
      {
        "id": "f5e4c3b2-...",
        "full_name": "Alex Morgan",
        "email": "alex@brightloop.com",
        "role": "STAFF",
        "status": "ACTIVE",
        "created_at": "2026-10-31T09:15:00Z",
        "updated_at": "2026-10-31T09:15:00Z"
      }
    ],
    "total": 3,
    "page": 1,
    "limit": 10,
    "totalPages": 1
  }
  ```

---

### 3.5. Get User Profile by ID
- **Endpoint**: `GET /api/users/:id`
- **Access**: ADMIN only
- **Headers**: `Authorization: Bearer <admin_token>`
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "user": {
      "id": "f5e4c3b2-...",
      "full_name": "Alex Morgan",
      "email": "alex@brightloop.com",
      "role": "STAFF",
      "status": "ACTIVE",
      "created_at": "2026-10-31T09:15:00Z",
      "updated_at": "2026-10-31T09:15:00Z"
    }
  }
  ```

---

### 3.6. Update User Profile (Permitted Fields)
- **Endpoint**: `PATCH /api/users/:id`
- **Access**: ADMIN only
- **Headers**: `Authorization: Bearer <admin_token>`
- **Request Body**:
  ```json
  {
    "full_name": "Updated Name"
  }
  ```
- **Description**: Updates non-security profile information. Role and email cannot be altered via this endpoint.
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "User profile updated successfully.",
    "user": {
      "id": "f5e4c3b2-...",
      "full_name": "Updated Name",
      "email": "alex@brightloop.com",
      "role": "STAFF",
      "status": "ACTIVE",
      "updated_at": "2026-10-31T10:00:00Z"
    }
  }
  ```

---

### 3.7. Create / Invite Staff Member
- **Endpoint**: `POST /api/users/staff`
- **Access**: ADMIN only
- **Headers**: `Authorization: Bearer <admin_token>`
- **Request Body (Temporary Password Method)**:
  ```json
  {
    "full_name": "Alex Morgan",
    "email": "alex@brightloop.com",
    "method": "password",
    "password": "Brightloop123!"
  }
  ```
- **Request Body (Invitation Link Method)**:
  ```json
  {
    "full_name": "Alex Morgan",
    "email": "alex@brightloop.com",
    "method": "invite"
  }
  ```
- **Description**: Creates or invites a staff user using Supabase Admin Auth and sets `role = 'STAFF'`.
- **Success Response (201 Created)**:
  ```json
  {
    "success": true,
    "message": "Staff account created successfully for Alex Morgan.",
    "user": {
      "id": "f5e4c3b2-...",
      "email": "alex@brightloop.com",
      "full_name": "Alex Morgan",
      "role": "STAFF",
      "status": "ACTIVE"
    }
  }
  ```

---

### 3.8. Update Account Status (Activate / Deactivate)
- **Endpoint**: `PATCH /api/users/:id/status`
- **Access**: ADMIN only
- **Headers**: `Authorization: Bearer <admin_token>`
- **Request Body**:
  ```json
  {
    "status": "INACTIVE"
  }
  ```
- **Description**: Toggles active standing. Deactivating an account revokes access on protected endpoints while preserving audit history. Administrators cannot deactivate their own account.
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "User status successfully updated to INACTIVE.",
    "user": {
      "id": "f5e4c3b2-...",
      "email": "user@example.com",
      "role": "CUSTOMER",
      "status": "INACTIVE",
      "updated_at": "2026-10-31T10:15:00Z"
    }
  }
  ```

---

## 4. Phase 2 Stage 1: Product Management Endpoints

### 4.1. List Products
- **Endpoint**: `GET /api/products`
- **Access**: ADMIN and STAFF (cost_price strictly redacted for STAFF)
- **Headers**: `Authorization: Bearer <token>`
- **Query Parameters**:
  - `search` (optional): Filter by name substring
  - `type` (optional): `ALL`, `service`, `goods`, `digital`
  - `status` (optional): `ALL`, `active`, `archived`
  - `page` (optional): Page number (default: 1)
  - `limit` (optional): Items per page (default: 10, max: 100)
  - `sortBy` (optional): `created_at`, `name`, `sales_price`
  - `sortOrder` (optional): `asc`, `desc`
- **Success Response (200 OK - Admin View)**:
  ```json
  {
    "success": true,
    "products": [
      {
        "id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
        "name": "Cloud Compute Instance",
        "type": "service",
        "sales_price": 99.00,
        "cost_price": 45.00,
        "notes": "Dedicated virtual machine hosting",
        "is_active": true,
        "variant_count": 3,
        "created_at": "2026-10-31T11:00:00Z",
        "updated_at": "2026-10-31T11:00:00Z"
      }
    ],
    "pagination": {
      "total": 1,
      "page": 1,
      "limit": 10,
      "totalPages": 1
    }
  }
  ```
- **Security Check (Staff View)**: `cost_price` is omitted entirely from all product records returned to STAFF users.

---

### 4.2. Create Product (with Optional Initial Variants)
- **Endpoint**: `POST /api/products`
- **Access**: ADMIN only
- **Headers**: `Authorization: Bearer <admin_token>`
- **Request Body**:
  ```json
  {
    "name": "Enterprise Analytics Suite",
    "type": "digital",
    "sales_price": 299.00,
    "cost_price": 80.00,
    "notes": "Annual enterprise license with API access",
    "variants": [
      {
        "variant_name": "Standard Tier",
        "attribute_name": "Tier",
        "attribute_value": "Standard",
        "price_extra": 0.00,
        "sku": "EAS-STD",
        "is_active": true
      },
      {
        "variant_name": "Premium Tier",
        "attribute_name": "Tier",
        "attribute_value": "Premium",
        "price_extra": 150.00,
        "sku": "EAS-PREM",
        "is_active": true
      }
    ]
  }
  ```
- **Validation**:
  - `name`: required string, 1-255 characters
  - `type`: must be one of `['service', 'goods', 'digital']` (default `'service'`)
  - `sales_price`: required, numeric, >= 0
  - `cost_price`: required, numeric, >= 0
  - `notes`: optional string
  - `variants`: optional array of variant objects:
    - `variant_name`: required non-empty string
    - `attribute_name`: required non-empty string
    - `attribute_value`: required non-empty string
    - `price_extra`: numeric >= 0 (default 0)
    - `sku`: optional string, unique across batch and database
    - `is_active`: boolean (default true)
- **Success Response (201 Created)**:
  ```json
  {
    "success": true,
    "message": "Product \"Enterprise Analytics Suite\" and 2 variant(s) created successfully.",
    "product": {
      "id": "b1ffbc00-...",
      "name": "Enterprise Analytics Suite",
      "type": "digital",
      "sales_price": 299.00,
      "cost_price": 80.00,
      "notes": "Annual enterprise license with API access",
      "is_active": true,
      "created_at": "2026-10-31T11:15:00Z",
      "updated_at": "2026-10-31T11:15:00Z",
      "variants": [
        {
          "id": "c2aab11-...",
          "variant_name": "Standard Tier",
          "price_extra": 0.00,
          "final_price": 299.00,
          "sku": "EAS-STD"
        },
        {
          "id": "d3bbc22-...",
          "variant_name": "Premium Tier",
          "price_extra": 150.00,
          "final_price": 449.00,
          "sku": "EAS-PREM"
        }
      ],
      "variant_count": 2
    }
  }
  ```

---

### 4.3. Get Product Details
- **Endpoint**: `GET /api/products/:id`
- **Access**: ADMIN and STAFF (cost_price strictly redacted for STAFF)
- **Headers**: `Authorization: Bearer <token>`
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "product": {
      "id": "b1ffbc00-...",
      "name": "Enterprise Analytics Suite",
      "type": "digital",
      "sales_price": 299.00,
      "cost_price": 80.00,
      "notes": "Annual enterprise license with API access",
      "is_active": true,
      "variant_count": 0,
      "variants": [],
      "created_at": "2026-10-31T11:15:00Z",
      "updated_at": "2026-10-31T11:15:00Z"
    }
  }
  ```

---

### 4.4. Update Product
- **Endpoint**: `PUT /api/products/:id`
- **Access**: ADMIN only
- **Headers**: `Authorization: Bearer <admin_token>`
- **Request Body**:
  ```json
  {
    "name": "Enterprise Analytics Suite v2",
    "type": "digital",
    "sales_price": 349.00,
    "cost_price": 90.00,
    "notes": "Updated pricing tier for v2 release"
  }
  ```
- **Description**: Updates product metadata and pricing. Preserves product `id`, `created_at`, and `is_active` status.
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Product updated successfully.",
    "product": {
      "id": "b1ffbc00-...",
      "name": "Enterprise Analytics Suite v2",
      "type": "digital",
      "sales_price": 349.00,
      "cost_price": 90.00,
      "notes": "Updated pricing tier for v2 release",
      "is_active": true,
      "updated_at": "2026-10-31T11:30:00Z"
    }
  }
  ```

---

### 4.5. Archive / Activate Product
- **Endpoint**: `PATCH /api/products/:id/status`
- **Access**: ADMIN only
- **Headers**: `Authorization: Bearer <admin_token>`
- **Request Body**:
  ```json
  {
    "is_active": false
  }
  ```
- **Description**: Performs soft archival by updating `is_active`. Archived products are hidden from public sales and new subscriptions but safely preserved for existing subscription renewals and historical records.
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Product \"Enterprise Analytics Suite v2\" has been archived successfully.",
    "product": {
      "id": "b1ffbc00-...",
      "name": "Enterprise Analytics Suite v2",
      "is_active": false,
      "updated_at": "2026-10-31T11:35:00Z"
    }
  }
  ```

---

## 5. Phase 2 Stage 3: Product Variant Management Endpoints

### Price Calculation Standard
$$\text{Final Price} = \text{Product Sales Price} + \text{Variant Additional Price}$$
Implemented via backend utility: `calculateVariantPrice(productId, variantId, db, options)`
- Bases calculations strictly on verified database records.
- Rejects negative additional prices.
- Rejects cross-product variant queries.
- Rejects inactive parent products or inactive variants during quotation selection.

---

### 5.1. List Product Variants
- **Endpoint**: `GET /api/products/:id/variants`
- **Access**: ADMIN and STAFF
- **Headers**: `Authorization: Bearer <token>`
- **Query Parameters**:
  - `status` (optional): `ALL`, `active`, `inactive`
  - `search` (optional): Filter by variant name, attribute name, attribute value, or SKU
  - `sortBy` (optional): `variant_name`, `price_extra`, `created_at`
  - `sortOrder` (optional): `asc`, `desc`
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "product": {
      "id": "a0eebc99-...",
      "name": "Business ERP",
      "sales_price": 500.00,
      "is_active": true
    },
    "variants": [
      {
        "id": "11111111-...",
        "product_id": "a0eebc99-...",
        "variant_name": "Standard Edition",
        "attribute_name": "Brand",
        "attribute_value": "Standard",
        "price_extra": 0.00,
        "base_price": 500.00,
        "final_price": 500.00,
        "sku": "ERP-STD",
        "is_active": true,
        "created_at": "2026-10-31T11:45:00Z"
      },
      {
        "id": "22222222-...",
        "product_id": "a0eebc99-...",
        "variant_name": "Odoo Edition",
        "attribute_name": "Brand",
        "attribute_value": "Odoo",
        "price_extra": 560.00,
        "base_price": 500.00,
        "final_price": 1060.00,
        "sku": "ERP-ODOO",
        "is_active": true,
        "created_at": "2026-10-31T11:46:00Z"
      }
    ],
    "total": 2
  }
  ```

---

### 5.2. Create Product Variant
- **Endpoint**: `POST /api/products/:id/variants`
- **Access**: ADMIN only
- **Headers**: `Authorization: Bearer <admin_token>`
- **Request Body**:
  ```json
  {
    "variant_name": "SAP Edition",
    "attribute_name": "Brand",
    "attribute_value": "SAP",
    "price_extra": 1000.00,
    "sku": "ERP-SAP",
    "is_active": true
  }
  ```
- **Validation**:
  - `variant_name`: required non-empty string
  - `attribute_name`: required non-empty string
  - `attribute_value`: required non-empty string
  - `price_extra`: non-negative number (`>= 0.00`)
  - `sku`: optional string; if provided, must be globally unique across all variants (409 Conflict if duplicate)
  - Parent product must be active (400 Bad Request if parent product is archived)
- **Success Response (201 Created)**:
  ```json
  {
    "success": true,
    "message": "Variant \"SAP Edition\" created successfully.",
    "variant": {
      "id": "33333333-...",
      "product_id": "a0eebc99-...",
      "variant_name": "SAP Edition",
      "attribute_name": "Brand",
      "attribute_value": "SAP",
      "price_extra": 1000.00,
      "base_price": 500.00,
      "final_price": 1500.00,
      "sku": "ERP-SAP",
      "is_active": true,
      "created_at": "2026-10-31T11:47:00Z"
    }
  }
  ```

---

### 5.3. Get Variant by ID
- **Endpoint**: `GET /api/products/:id/variants/:variantId`
- **Access**: ADMIN and STAFF
- **Headers**: `Authorization: Bearer <token>`
- **Description**: Verifies that `variantId` belongs to `productId`. Computes final price.
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "variant": {
      "id": "33333333-...",
      "product_id": "a0eebc99-...",
      "variant_name": "SAP Edition",
      "attribute_name": "Brand",
      "attribute_value": "SAP",
      "price_extra": 1000.00,
      "base_price": 500.00,
      "final_price": 1500.00,
      "sku": "ERP-SAP",
      "is_active": true
    }
  }
  ```

---

### 5.4. Update Variant
- **Endpoint**: `PUT /api/products/:id/variants/:variantId`
- **Access**: ADMIN only
- **Headers**: `Authorization: Bearer <admin_token>`
- **Request Body**:
  ```json
  {
    "variant_name": "SAP Enterprise Edition",
    "attribute_name": "Brand",
    "attribute_value": "SAP",
    "price_extra": 1200.00,
    "sku": "ERP-SAP-ENT",
    "is_active": true
  }
  ```
- **Description**: Updates variant attributes, pricing modifier, and SKU. Protects `id` and `product_id`. Rejects cross-product tampering with 400 Bad Request.
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Variant \"SAP Enterprise Edition\" updated successfully.",
    "variant": {
      "id": "33333333-...",
      "variant_name": "SAP Enterprise Edition",
      "price_extra": 1200.00,
      "base_price": 500.00,
      "final_price": 1700.00,
      "sku": "ERP-SAP-ENT",
      "is_active": true
    }
  }
  ```

---

### 5.5. Activate / Deactivate Variant
- **Endpoint**: `PATCH /api/products/:id/variants/:variantId/status`
- **Access**: ADMIN only
- **Headers**: `Authorization: Bearer <admin_token>`
- **Request Body**:
  ```json
  {
    "is_active": false
  }
  ```
- **Description**: Sets or toggles `is_active`. Deactivating a variant preserves existing customer contracts while preventing new selections.
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Variant \"SAP Enterprise Edition\" has been deactivated successfully.",
    "variant": {
      "id": "33333333-...",
      "is_active": false
    }
  }
  ```

---

## 6. Phase 3: Subscription Plan Management Endpoints (For Member 2 Quotations & Subscriptions)

### 6.1. List Subscription Plans
- **Endpoint**: `GET /api/subscription-plans`
- **Access**: ADMIN, STAFF, and CUSTOMER
- **Headers**: `Authorization: Bearer <token>`
- **Query Parameters**:
  - `search` (optional): Case-insensitive match on plan `name`
  - `product_id` (optional): Filter plans attached to a specific product UUID
  - `billing_interval` (optional): Filter by `daily`, `weekly`, `monthly`, or `yearly`
  - `status` (optional): `ACTIVE`, `INACTIVE`, or omitted for all (CUSTOMERS automatically restricted to `is_active = true`)
  - `page` (optional): Page number (default: 1)
  - `limit` (optional): Items per page (default: 10, max: 100)
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "plans": [
      {
        "id": "e4f5a6b7-...",
        "product_id": "a0eebc99-...",
        "name": "Business ERP Monthly",
        "billing_interval": "monthly",
        "price": 4999.00,
        "min_quantity": 1,
        "start_date": "2026-11-01",
        "end_date": null,
        "auto_close": false,
        "allow_early_close": true,
        "allow_pause": false,
        "allow_renewal": true,
        "is_active": true,
        "created_at": "2026-10-31T12:30:00Z",
        "updated_at": "2026-10-31T12:30:00Z",
        "product": {
          "id": "a0eebc99-...",
          "name": "Business ERP",
          "type": "service",
          "sales_price": 50000.00,
          "is_active": true
        }
      }
    ],
    "pagination": {
      "total": 1,
      "page": 1,
      "limit": 10,
      "totalPages": 1
    }
  }
  ```

---

### 6.2. Get Subscription Plan by ID
- **Endpoint**: `GET /api/subscription-plans/:id`
- **Access**: ADMIN, STAFF, and CUSTOMER
- **Headers**: `Authorization: Bearer <token>`
- **Description**: Returns plan specifications, lifecycle policies, and linked product summary.
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "plan": {
      "id": "e4f5a6b7-...",
      "product_id": "a0eebc99-...",
      "name": "Business ERP Monthly",
      "billing_interval": "monthly",
      "price": 4999.00,
      "min_quantity": 1,
      "start_date": "2026-11-01",
      "end_date": null,
      "auto_close": false,
      "allow_early_close": true,
      "allow_pause": false,
      "allow_renewal": true,
      "is_active": true,
      "created_at": "2026-10-31T12:30:00Z",
      "updated_at": "2026-10-31T12:30:00Z",
      "product": {
        "id": "a0eebc99-...",
        "name": "Business ERP",
        "type": "service",
        "sales_price": 50000.00,
        "is_active": true
      }
    }
  }
  ```

---

### 6.3. Create Subscription Plan
- **Endpoint**: `POST /api/subscription-plans`
- **Access**: ADMIN only
- **Headers**: `Authorization: Bearer <admin_token>`
- **Request Body**:
  ```json
  {
    "name": "Business ERP Annual",
    "product_id": "a0eebc99-...",
    "billing_interval": "yearly",
    "price": 49999.00,
    "min_quantity": 1,
    "start_date": "2026-11-01",
    "end_date": "2027-11-01",
    "auto_close": false,
    "allow_early_close": true,
    "allow_pause": false,
    "allow_renewal": true,
    "is_active": true
  }
  ```
- **Validation**:
  - `name`: required string, 1-255 characters
  - `product_id`: required UUID, must reference an existing and **active** product (`is_active = true`)
  - `billing_interval`: required, must be one of `['daily', 'weekly', 'monthly', 'yearly']`
  - `price`: required numeric $\ge 0$
  - `min_quantity`: required integer $\ge 1$
  - `start_date` / `end_date`: optional valid dates (`end_date >= start_date`)
  - `auto_close`, `allow_early_close`, `allow_pause`, `allow_renewal`: booleans
- **Success Response (201 Created)**:
  ```json
  {
    "success": true,
    "message": "Subscription plan \"Business ERP Annual\" created successfully.",
    "plan": {
      "id": "f5a6b7c8-...",
      "name": "Business ERP Annual",
      "billing_interval": "yearly",
      "price": 49999.00,
      "min_quantity": 1,
      "is_active": true
    }
  }
  ```

---

### 6.4. Update Subscription Plan
- **Endpoint**: `PUT /api/subscription-plans/:id`
- **Access**: ADMIN only
- **Headers**: `Authorization: Bearer <admin_token>`
- **Request Body**: Accepts any mutable fields (`name`, `product_id`, `billing_interval`, `price`, `min_quantity`, `start_date`, `end_date`, `auto_close`, `allow_early_close`, `allow_pause`, `allow_renewal`, `is_active`).
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Subscription plan \"Business ERP Annual\" updated successfully.",
    "plan": {
      "id": "f5a6b7c8-...",
      "name": "Business ERP Annual",
      "price": 48000.00,
      "updated_at": "2026-10-31T12:45:00Z"
    }
  }
  ```

---

### 6.5. Activate / Deactivate Subscription Plan
- **Endpoint**: `PATCH /api/subscription-plans/:id/status`
- **Access**: ADMIN only
- **Headers**: `Authorization: Bearer <admin_token>`
- **Request Body**:
  ```json
  {
    "is_active": false
  }
  ```
- **Description**: Soft deactivates or reactivates the plan. Deactivating prevents new quotation selections while preserving audit history and active subscriptions.
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Subscription plan \"Business ERP Annual\" was deactivated successfully.",
    "plan": {
      "id": "f5a6b7c8-...",
      "is_active": false
    }
  }
  ```

---

## 7. Tax Management & Fiscal Calculation API (Phase 4)

### 7.1. List Taxes
- **Endpoint**: `GET /api/taxes`
- **Access**: ADMIN, STAFF, and CUSTOMER
- **Headers**: `Authorization: Bearer <token>`
- **Query Parameters**:
  - `page` (optional): Page number (default: 1)
  - `limit` (optional): Items per page (default: 10, max: 100)
  - `search` (optional): Tax name substring search
  - `computation_type` (optional): `percentage` or `fixed`
  - `status` (optional): `active` or `inactive` (Admins/Staff only; Customers receive active taxes only)
  - `sortBy` (optional): `name`, `rate_percentage`, `computation_type`, `created_at` (default: `created_at`)
  - `sortOrder` (optional): `asc` or `desc` (default: `desc`)
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "taxes": [
      {
        "id": "e6a7b8c9-...",
        "name": "GST 18%",
        "computation_type": "percentage",
        "rate_percentage": 18.0,
        "is_active": true,
        "created_at": "2026-10-31T13:00:00Z",
        "updated_at": "2026-10-31T13:00:00Z",
        "display_rate": "18.00%"
      }
    ],
    "pagination": {
      "total": 3,
      "page": 1,
      "limit": 10,
      "totalPages": 1
    }
  }
  ```

---

### 7.2. Get Tax Details
- **Endpoint**: `GET /api/taxes/:id`
- **Access**: ADMIN and STAFF
- **Headers**: `Authorization: Bearer <token>`
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "tax": {
      "id": "e6a7b8c9-...",
      "name": "GST 18%",
      "computation_type": "percentage",
      "rate_percentage": 18.0,
      "is_active": true,
      "created_at": "2026-10-31T13:00:00Z",
      "updated_at": "2026-10-31T13:00:00Z",
      "display_rate": "18.00%",
      "associated_product_count": 5
    }
  }
  ```

---

### 7.3. Create Tax Record
- **Endpoint**: `POST /api/taxes`
- **Access**: ADMIN only
- **Headers**: `Authorization: Bearer <admin_token>`
- **Request Body**:
  ```json
  {
    "name": "GST 18%",
    "computation_type": "percentage",
    "rate_percentage": 18.0,
    "is_active": true
  }
  ```
- **Validation**:
  - `name`: Required string, 1 to 255 characters
  - `computation_type`: Required, must be either `'percentage'` or `'fixed'`
  - `rate_percentage`: Required non-negative number $\ge 0$. For `'percentage'`, must be $\le 100$. For `'fixed'`, represents the Indian Rupee amount per item.
  - `is_active`: Optional boolean (default: `true`)
- **Success Response (201 Created)**:
  ```json
  {
    "success": true,
    "message": "Tax \"GST 18%\" created successfully.",
    "tax": {
      "id": "e6a7b8c9-...",
      "name": "GST 18%",
      "computation_type": "percentage",
      "rate_percentage": 18.0,
      "is_active": true,
      "display_rate": "18.00%"
    }
  }
  ```

---

### 7.4. Update Tax Record
- **Endpoint**: `PUT /api/taxes/:id`
- **Access**: ADMIN only
- **Headers**: `Authorization: Bearer <admin_token>`
- **Request Body**: Accepts mutable fields (`name`, `computation_type`, `rate_percentage`, `is_active`).
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Tax \"GST 18%\" updated successfully.",
    "tax": {
      "id": "e6a7b8c9-...",
      "name": "GST 18%",
      "rate_percentage": 18.0,
      "updated_at": "2026-10-31T13:05:00Z"
    }
  }
  ```

---

### 7.5. Activate / Deactivate Tax Status
- **Endpoint**: `PATCH /api/taxes/:id/status`
- **Access**: ADMIN only
- **Headers**: `Authorization: Bearer <admin_token>`
- **Request Body**:
  ```json
  {
    "is_active": false
  }
  ```
- **Description**: Soft deactivates or reactivates the tax. Deactivating prevents new quotation/subscription assignment without breaking past invoices or active subscriptions.
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Tax \"GST 18%\" was deactivated successfully.",
    "tax": {
      "id": "e6a7b8c9-...",
      "is_active": false
    }
  }
  ```

---

### 7.6. Get Product Assigned Taxes
- **Endpoint**: `GET /api/products/:productId/taxes`
- **Access**: ADMIN, STAFF, and CUSTOMER
- **Headers**: `Authorization: Bearer <token>`
- **Description**: Returns all taxes currently associated with a specific product.
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "product_id": "a0eebc99-...",
    "product_name": "Cloud Storage Pro",
    "sales_price": 5000.0,
    "taxes": [
      {
        "id": "e6a7b8c9-...",
        "name": "GST 18%",
        "computation_type": "percentage",
        "rate_percentage": 18.0,
        "is_active": true
      }
    ],
    "count": 1
  }
  ```

---

### 7.7. Assign Taxes to Product
- **Endpoint**: `PUT /api/products/:productId/taxes`
- **Access**: ADMIN only
- **Headers**: `Authorization: Bearer <admin_token>`
- **Request Body**:
  ```json
  {
    "tax_ids": [
      "e6a7b8c9-...",
      "b2c3d4e5-..."
    ]
  }
  ```
- **Validation**:
  - Validates that the target product exists and is active.
  - Validates that all supplied `tax_ids` exist, are distinct, and are active.
  - Atomically replaces product-to-tax mappings in `public.product_taxes`.
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Assigned 2 taxes to product \"Cloud Storage Pro\" successfully.",
    "product_id": "a0eebc99-...",
    "assigned_count": 2,
    "taxes": [...]
  }
  ```

---

### 7.8. Calculation Service Specifications (Contract for Members 2 & 3)

Backend calculation engine available at: `backend/src/services/taxService.js`.

#### Epsilon-Safe Rounding Rule:
All currency operations MUST round to two decimal places using:
$$\text{round}(v) = \frac{\lfloor (v + \epsilon) \times 100 + 0.5 \rfloor}{100}$$

#### Exclusive Tax Mode (Default standard):
In exclusive mode, line item sales price is the untaxed subtotal. Taxes are added on top:
$$\text{Tax Amount (Percentage)} = \text{round}\left(\frac{\text{Base Subtotal} \times \text{Rate}}{100}\right)$$
$$\text{Tax Amount (Fixed)} = \text{Fixed Fee} \times \text{Quantity}$$
$$\text{Total Invoice Amount} = \text{Base Subtotal} + \sum \text{Tax Amounts}$$

#### Snapshot Immutability Requirement:
When Member 2 generates quotations and Member 3 generates finalized invoices, taxes MUST be snapshotted as static JSON objects on each line item (including `tax_id`, `tax_name`, `rate_percentage`, `computation_type`, `calculated_amount`). Future rate changes in `taxes` must never alter finalized invoice lines.

---

## 8. Discount Management & Promotional Calculation API (Phase 5)

### 8.1. List Discounts
- **Endpoint**: `GET /api/discounts`
- **Access**: ADMIN, STAFF, and CUSTOMER
- **Headers**: `Authorization: Bearer <token>`
- **Query Parameters**:
  - `page` (optional): Page number (default: 1)
  - `limit` (optional): Items per page (default: 10, max: 100)
  - `search` (optional): Discount code substring search
  - `type` (optional): `percentage` or `fixed`
  - `applies_to` (optional): `all`, `product`, `plan`
  - `status` (optional): `active` or `inactive` (Customers receive active discounts only)
  - `sortBy` (optional): `code`, `type`, `value`, `current_usage`, `created_at` (default: `created_at`)
  - `sortOrder` (optional): `asc` or `desc` (default: `desc`)
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "discounts": [
      {
        "id": "7f8a9b0c-...",
        "code": "SUMMER2026",
        "type": "percentage",
        "value": 15.0,
        "display_value": "15%",
        "min_quantity": 1,
        "min_amount": 0.0,
        "start_date": "2026-06-01",
        "end_date": "2026-08-31",
        "max_usage": 500,
        "current_usage": 42,
        "applies_to": "all",
        "is_active": true,
        "created_at": "2026-10-31T13:20:00Z"
      }
    ],
    "pagination": {
      "total": 1,
      "page": 1,
      "limit": 10,
      "totalPages": 1
    }
  }
  ```

---

### 8.2. Get Discount Details
- **Endpoint**: `GET /api/discounts/:id`
- **Access**: ADMIN and STAFF
- **Headers**: `Authorization: Bearer <token>`
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "discount": {
      "id": "7f8a9b0c-...",
      "code": "SUMMER2026",
      "type": "percentage",
      "value": 15.0,
      "display_value": "15%",
      "min_quantity": 1,
      "min_amount": 0.0,
      "start_date": "2026-06-01",
      "end_date": "2026-08-31",
      "max_usage": 500,
      "current_usage": 42,
      "applies_to": "product",
      "is_active": true,
      "associated_products": [
        {
          "product_id": "a0eebc99-...",
          "product_name": "Enterprise Cloud Storage",
          "sales_price": 5000.0,
          "is_active": true
        }
      ]
    }
  }
  ```

---

### 8.3. Create Discount
- **Endpoint**: `POST /api/discounts`
- **Access**: ADMIN only
- **Headers**: `Authorization: Bearer <admin_token>`
- **Request Body**:
  ```json
  {
    "code": "DIWALI500",
    "type": "fixed",
    "value": 500.00,
    "min_quantity": 1,
    "min_amount": 2000.00,
    "start_date": "2026-11-01",
    "end_date": "2026-11-15",
    "max_usage": 1000,
    "applies_to": "all",
    "is_active": true
  }
  ```
- **Validation**:
  - `code`: Required, 2-50 alphanumeric characters (hyphen/underscore permitted), automatically normalized to uppercase, unique in DB.
  - `type`: Required, `'percentage'` or `'fixed'`.
  - `value`: Required positive number $> 0$. For percentage: $\le 100$. For fixed: represents Rupee amount in ₹.
  - `min_quantity`: Integer $\ge 1$.
  - `min_amount`: Numeric $\ge 0$.
  - `start_date` / `end_date`: Optional valid dates (`end_date >= start_date`).
  - `max_usage`: Optional positive integer $> 0$ (or null for unlimited).
  - `applies_to`: `'all'`, `'product'`, or `'plan'`.
  - `product_ids`: Optional array of product UUIDs when `applies_to = 'product'`.
- **Success Response (201 Created)**:
  ```json
  {
    "success": true,
    "message": "Discount \"DIWALI500\" created successfully.",
    "discount": {
      "id": "7f8a9b0c-...",
      "code": "DIWALI500",
      "type": "fixed",
      "value": 500.0
    }
  }
  ```

---

### 8.4. Update Discount
- **Endpoint**: `PUT /api/discounts/:id`
- **Access**: ADMIN only
- **Headers**: `Authorization: Bearer <admin_token>`
- **Request Body**: Accepts mutable fields (`code`, `type`, `value`, `min_quantity`, `min_amount`, `start_date`, `end_date`, `max_usage`, `applies_to`, `target_id`, `product_ids`, `is_active`). Preserves system ID and historical `current_usage`.
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Discount \"DIWALI500\" updated successfully.",
    "discount": { ... }
  }
  ```

---

### 8.5. Activate / Deactivate Discount
- **Endpoint**: `PATCH /api/discounts/:id/status`
- **Access**: ADMIN only
- **Headers**: `Authorization: Bearer <admin_token>`
- **Request Body**:
  ```json
  {
    "is_active": false
  }
  ```
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Discount \"DIWALI500\" was deactivated successfully.",
    "discount": {
      "id": "7f8a9b0c-...",
      "is_active": false
    }
  }
  ```

---

### 8.6. Validate & Compute Discount Code
- **Endpoint**: `POST /api/discounts/validate`
- **Access**: Public / Authenticated (used during checkout, quotation generation, and cart review)
- **Description**: Evaluates eligibility and computes discount deduction on the server without modifying the database usage counter.
- **Request Body**:
  ```json
  {
    "code": "FESTIVE15",
    "totalAmount": 5000.00,
    "totalQuantity": 2,
    "items": [
      {
        "product_id": "a0eebc99-...",
        "price": 2500.00,
        "quantity": 2
      }
    ]
  }
  ```
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "isValid": true,
    "message": "Discount \"FESTIVE15\" applied successfully!",
    "originalAmount": 5000.00,
    "eligibleAmount": 5000.00,
    "discountAmount": 750.00,
    "finalAmount": 4250.00,
    "discount": {
      "id": "7f8a9b0c-...",
      "code": "FESTIVE15",
      "type": "percentage",
      "value": 15.0,
      "display_value": "15%"
    }
  }
  ```
- **Error Response on Ineligibility / Expiry / Exhaustion (422 Unprocessable Entity)**:
  ```json
  {
    "success": false,
    "isValid": false,
    "message": "Discount usage limit has been exhausted.",
    "originalAmount": 5000.00,
    "eligibleAmount": 0,
    "discountAmount": 0,
    "finalAmount": 5000.00
  }
  ```

---

### 8.7. Calculation & Usage Specifications (Contract for Members 2 & 3)

The shared discount calculation and atomic usage engine is available at:
`backend/src/services/discountService.js`.

#### Calculation Rules:
1. **Applicability Scope**:
   - `all`: Applies to total transaction.
   - `product`: Evaluates line items matching assigned product IDs in `discount_products` or `target_id`. Calculates deduction solely on eligible items.
   - `plan`: Evaluates line items matching the `target_id` subscription plan.
2. **Cap on Fixed Deductions**:
   - Fixed discounts in ₹ are capped at the eligible subtotal:
     $$\text{Discount Amount} = \min(\text{Eligible Amount}, \text{Fixed Value})$$
     $$\text{Final Net Amount} = \max(0, \text{Original Amount} - \text{Discount Amount})$$
   - Negative invoice balances are strictly prohibited.
3. **Usage Increment Timing**:
   - **Quotation Drafting**: Call `POST /api/discounts/validate` (or `calculateDiscount`). Usage counter is **NOT** incremented.
   - **Order / Subscription Confirmation**: Call `applyDiscountUsage(discountId)` inside the final transaction confirmation.
   - **Cancellation / Voided Quotes**: Do not touch usage if order was never confirmed.

---

## 9. Standard Error Format
```json
{
  "success": false,
  "message": "Human-readable description of error",
  "error": "Optional technical error details in development"
}
```
