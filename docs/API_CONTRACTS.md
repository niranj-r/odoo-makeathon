# Brightloop API Contracts

## 1. Overview
The Brightloop backend is built on **Node.js + Express** (ES Modules) and operates in tandem with **Supabase Auth** and **PostgreSQL**.
All protected backend endpoints authenticate requests using Supabase JWT Bearer tokens and verify user permissions against `public.profiles`.

---

## 2. Authentication Standard
- Protected API calls MUST send the access token received upon Supabase Auth login in the `Authorization` header:
  ```http
  Authorization: Bearer <supabase_access_token>
  ```
- Unauthenticated or expired tokens return `401 Unauthorized`.
- Authenticated users lacking required privileges return `403 Forbidden`.

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

### 3.3. Create Staff Account (Admin Only)
- **Endpoint**: `POST /api/users/staff`
- **Access**: ADMIN only
- **Headers**: `Authorization: Bearer <admin_token>`
- **Request Body**:
  ```json
  {
    "email": "staff.member@brightloop.com",
    "password": "Password123!",
    "full_name": "Staff Member Name"
  }
  ```
- **Description**: Creates a staff user account securely via Supabase Admin SDK and assigns `STAFF` role.

---

### 3.4. List Users (Admin Only)
- **Endpoint**: `GET /api/users`
- **Access**: ADMIN only
- **Headers**: `Authorization: Bearer <admin_token>`

---

### 3.5. Update User Status (Admin Only)
- **Endpoint**: `PATCH /api/users/:id/status`
- **Access**: ADMIN only
- **Headers**: `Authorization: Bearer <admin_token>`

---

## 4. Member 2 Endpoints: Customer, Quotation & Subscription Management

### 4.1. Customer Management

#### `POST /api/customers`
- **Access**: STAFF, ADMIN
- **Description**: Register a new customer with sanitized contact and billing data.
- **Request Body**:
  ```json
  {
    "name": "Acme Innovations Ltd",
    "email": "procurement@acme.com",
    "phone": "+1 555-0199",
    "company_name": "Acme Inc.",
    "tax_id": "GSTIN9876543",
    "billing_address": "123 Market St, Suite 400, San Francisco, CA 94105",
    "shipping_address": "123 Market St, Suite 400, San Francisco, CA 94105"
  }
  ```
- **Success Response (201 Created)**:
  ```json
  {
    "success": true,
    "message": "Customer created successfully.",
    "data": {
      "id": "c1f2e3d4-...",
      "customer_number": "CUST-0001",
      "name": "Acme Innovations Ltd",
      "email": "procurement@acme.com",
      "status": "ACTIVE",
      "created_at": "2026-10-31T10:00:00Z"
    }
  }
  ```

#### `GET /api/customers`
- **Access**: STAFF, ADMIN
- **Query Parameters**:
  - `page` (default: 1)
  - `limit` (default: 10, max: 100)
  - `search` (searches name, email, company, customer_number)
  - `status` (`ACTIVE`, `INACTIVE`)
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "pagination": { "page": 1, "limit": 10, "total": 25, "totalPages": 3 },
    "data": [ ... ]
  }
  ```

#### `GET /api/customers/:id`
- **Access**: STAFF, ADMIN
- **Description**: Retrieves customer details along with their associated quotations and subscriptions.

#### `PUT /api/customers/:id`
- **Access**: STAFF, ADMIN
- **Description**: Updates customer profile information.

#### `PATCH /api/customers/:id/status`
- **Access**: STAFF, ADMIN
- **Description**: Toggles status between `ACTIVE` and `INACTIVE`. Blocks deactivation if active subscriptions exist (VULN-006).

---

### 4.2. Quotation Templates

#### `POST /api/quotation-templates`
- **Access**: STAFF, ADMIN
- **Request Body**:
  ```json
  {
    "name": "Annual Enterprise SaaS",
    "description": "Standard terms for yearly enterprise clients",
    "validity_days": 30,
    "payment_terms": "Net 30",
    "terms_and_conditions": "Enterprise SLA applies.",
    "lines": [
      { "product_id": "b3e2d1c0-...", "quantity": 1 }
    ]
  }
  ```

#### `GET /api/quotation-templates`
- **Access**: STAFF, ADMIN
- **Description**: Lists active reusable templates.

#### `GET /api/quotation-templates/:id`
- **Access**: STAFF, ADMIN
- **Description**: Retrieves template by ID with preset line items.

#### `PUT /api/quotation-templates/:id`
- **Access**: STAFF, ADMIN
- **Description**: Updates template parameters and preset lines.

#### `DELETE /api/quotation-templates/:id`
- **Access**: STAFF, ADMIN
- **Description**: Soft-archives template (`is_active = false`).

---

### 4.3. Quotation Management

#### `POST /api/quotations`
- **Access**: STAFF, ADMIN
- **Description**: Generates commercial quotation with server-calculated totals (VULN-001).
- **Request Body**:
  ```json
  {
    "customer_id": "c1f2e3d4-...",
    "template_id": "optional-uuid",
    "quotation_date": "2026-10-31",
    "validity_date": "2026-11-30",
    "payment_terms": "Due on receipt",
    "terms_and_conditions": "Terms...",
    "discount_amount": 50.00,
    "lines": [
      {
        "product_id": "b3e2d1c0-...",
        "quantity": 2,
        "tax_id": "t1a2b3c4-..."
      }
    ]
  }
  ```
- **Success Response (201 Created)**:
  ```json
  {
    "success": true,
    "message": "Quotation created successfully.",
    "data": {
      "id": "q9f8e7d6-...",
      "quotation_number": "QT-2026-0001",
      "status": "DRAFT",
      "subtotal": 200.00,
      "discount_amount": 50.00,
      "tax_amount": 27.00,
      "grand_total": 177.00,
      "lines": [ ... ]
    }
  }
  ```

#### `GET /api/quotations`
- **Access**: STAFF, ADMIN
- **Query Parameters**: `page`, `limit`, `status`, `customer_id`, `search`

#### `GET /api/quotations/:id`
- **Access**: STAFF, ADMIN, CUSTOMER (own quotation)

#### `PUT /api/quotations/:id`
- **Access**: STAFF, ADMIN
- **Description**: Edits quotation parameters. Blocked once status moves beyond `DRAFT` (VULN-005).

#### `POST /api/quotations/:id/send`
- **Access**: STAFF, ADMIN
- **Description**: Transitions status from `DRAFT` to `SENT`.

#### `POST /api/quotations/:id/accept`
- **Access**: STAFF, ADMIN, CUSTOMER
- **Description**: Accepts quotation. Rejects if `validity_date < CURRENT_DATE` (VULN-004).

#### `POST /api/quotations/:id/reject`
- **Access**: STAFF, ADMIN, CUSTOMER
- **Description**: Rejects quotation.

---

### 4.4. Subscription Creation & Conversion

#### `POST /api/subscriptions/from-quotation/:quotationId`
- **Access**: STAFF, ADMIN
- **Description**: Converts an accepted quotation into an active recurring subscription.
- **Idempotence & Duplicate Guard**: Rejects duplicate conversion if quotation was already converted (VULN-002).
- **Success Response (201 Created)**:
  ```json
  {
    "success": true,
    "message": "Quotation successfully converted to Subscription.",
    "data": {
      "id": "s1a2b3c4-...",
      "subscription_number": "SUB-2026-0001",
      "source_quotation_id": "q9f8e7d6-...",
      "status": "DRAFT",
      "grand_total": 177.00
    }
  }
  ```

#### `POST /api/subscriptions`
- **Access**: STAFF, ADMIN
- **Description**: Creates a standalone subscription directly without a prior quotation.

#### `GET /api/subscriptions`
- **Access**: STAFF, ADMIN
- **Query Parameters**: `page`, `limit`, `status`, `customer_id`, `search`

#### `GET /api/subscriptions/:id`
- **Access**: STAFF, ADMIN, CUSTOMER (own subscription)

---

### 4.5. Subscription Lifecycle Management

| Method | Endpoint | Permitted From | Target Status | Description |
|---|---|---|---|---|
| `POST` | `/api/subscriptions/:id/confirm` | `DRAFT` | `CONFIRMED` | Confirms subscription terms |
| `POST` | `/api/subscriptions/:id/activate` | `CONFIRMED` | `ACTIVE` | Activates contract and services |
| `POST` | `/api/subscriptions/:id/pause` | `ACTIVE` | `PAUSED` | Temporarily suspends contract |
| `POST` | `/api/subscriptions/:id/resume` | `PAUSED` | `ACTIVE` | Resumes active status |
| `POST` | `/api/subscriptions/:id/renew` | `ACTIVE`, `CONFIRMED` | `ACTIVE` | Extends end date by billing interval |
| `POST` | `/api/subscriptions/:id/cancel` | Non-terminal | `CANCELLED` | Terminates contract with reason |
| `POST` | `/api/subscriptions/:id/close` | `ACTIVE`, `PAUSED` | `CLOSED` | Finalizes contract permanently |
| `GET` | `/api/subscriptions/:id/history` | Any | — | Retrieves immutable audit timeline (VULN-010) |

---

### 4.6. Automated Expiry & Background Processing

#### `POST /api/admin/jobs/run-expiry`
- **Access**: STAFF, ADMIN
- **Description**: On-demand manual trigger for background automated expiry check.
- **Request Body (Optional)**:
  ```json
  {
    "referenceDate": "2026-11-01",
    "daysQuotation": 3,
    "daysSubscription": 7
  }
  ```
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Background expiry job executed successfully.",
    "data": {
      "quotationsExpired": 2,
      "subscriptionsClosed": 1,
      "subscriptionsAutoRenewed": 1,
      "notificationsGenerated": 4,
      "timestamp": "2026-10-31T12:00:00Z"
    }
  }
  ```

#### `GET /api/admin/jobs/expiry-status`
- **Access**: STAFF, ADMIN
- **Description**: Returns worker state, running mutex indicator, and last execution summary.

#### `GET /api/admin/jobs/approaching-expiries`
- **Access**: STAFF, ADMIN
- **Description**: Returns approaching expiration items and notification alert records.

#### `POST /api/admin/jobs/worker/start` & `POST /api/admin/jobs/worker/stop`
- **Access**: STAFF, ADMIN
- **Description**: Administrative background worker interval timer controls.

---

## 5. Standard Error Format
All failure responses follow this consistent structure:
```json
{
  "success": false,
  "message": "Human-readable description of error",
  "error": "Optional technical error details in development"
}
```
