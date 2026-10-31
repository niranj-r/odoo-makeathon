# Brightloop Database Schema Documentation

## 1. Overview
This document specifies the database architecture for **Brightloop – Subscription Management Platform**. The database runs on **Supabase PostgreSQL** and leverages native Supabase Auth with Row Level Security (RLS) policies.

---

## 2. Table Specifications

### 2.1. `profiles` Table
Stores extended user profile information linked to `auth.users`.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `UUID` | Primary Key, `REFERENCES auth.users(id) ON DELETE CASCADE` | Matches the Supabase Auth user ID |
| `full_name` | `TEXT` | `NOT NULL` | User's display name |
| `email` | `TEXT` | `NOT NULL, UNIQUE` | Synchronized user email address |
| `role` | `TEXT` | `NOT NULL, DEFAULT 'CUSTOMER', CHECK (role IN ('ADMIN', 'STAFF', 'CUSTOMER'))` | User role defining platform access |
| `status` | `TEXT` | `NOT NULL, DEFAULT 'ACTIVE', CHECK (status IN ('ACTIVE', 'INACTIVE'))` | Account standing (deactivated users cannot log in) |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL, DEFAULT timezone('utc'::text, now())` | Creation timestamp |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL, DEFAULT timezone('utc'::text, now())` | Last update timestamp |

#### Security & RLS Policies:
- **SELECT**:
  - `auth.uid() = id`: Any authenticated user can read their own profile.
  - `is_admin()`: Admins can view all user profiles.
  - `is_staff_or_admin()`: Staff can view Customer profiles.
- **INSERT**:
  - Direct public inserts are **FORBIDDEN**. Handled strictly by PostgreSQL trigger `handle_new_user()` on `auth.users` insert.
- **UPDATE**:
  - Users can update their own non-role fields (`full_name`).
  - Trigger `prevent_unauthorized_role_change` rejects any changes to `role` or `status` unless requested by an Admin or `service_role`.
- **DELETE**:
  - Only accessible by Admins.

---

### 2.2. Pre-Configured Member 1 Domain Tables

#### `products`
Defines subscription products (services, digital licenses, or goods).
- `id` (UUID, PK)
- `name` (TEXT, NOT NULL)
- `type` (TEXT: `'service'`, `'goods'`, `'digital'`)
- `sales_price` (NUMERIC(12,2))
- `cost_price` (NUMERIC(12,2))
- `notes` (TEXT)
- `is_active` (BOOLEAN)
- `created_at`, `updated_at`

#### `product_variants`
Configurable attributes/variants (e.g. brand, storage size, seats).
- `id` (UUID, PK)
- `product_id` (UUID, FK -> `products.id`)
- `variant_name` (TEXT)
- `attribute_name` (TEXT)
- `attribute_value` (TEXT)
- `price_extra` (NUMERIC(12,2))
- `sku` (TEXT, UNIQUE)

#### `subscription_plans`
Billing cadence and lifecycle rules for products.
- `id` (UUID, PK)
- `product_id` (UUID, FK -> `products.id`)
- `name` (TEXT)
- `billing_interval` (`'daily'`, `'weekly'`, `'monthly'`, `'yearly'`)
- `price` (NUMERIC(12,2))
- `min_quantity` (INTEGER)
- `start_date` / `end_date` (DATE)
- `auto_close` (BOOLEAN)
- `allow_early_close` (BOOLEAN)
- `allow_pause` (BOOLEAN)
- `allow_renewal` (BOOLEAN)
- `is_active` (BOOLEAN)

#### `taxes`
Tax rules configured by administrators.
- `id` (UUID, PK)
- `name` (TEXT)
- `rate_percentage` (NUMERIC(5,2))
- `computation_type` (`'percentage'`, `'fixed'`)
- `is_active` (BOOLEAN)

#### `discounts`
Coupon/discount rules applied to orders or line items.
- `id` (UUID, PK)
- `code` (TEXT, UNIQUE)
- `type` (`'percentage'`, `'fixed'`)
- `value` (NUMERIC(12,2))
- `min_quantity` (INTEGER)
- `min_amount` (NUMERIC(12,2))
- `start_date` / `end_date` (DATE)
- `max_usage` (INTEGER)
- `current_usage` (INTEGER)
- `applies_to` (`'all'`, `'product'`, `'plan'`)
- `target_id` (UUID)

---

### 2.3. Member 2 Domain Tables (Customer, Quotation & Subscription Management)

#### `customers`
Stores customer accounts, contacts, and billing records.
- `id` (UUID, Primary Key, default `uuid_generate_v4()`)
- `customer_number` (TEXT, UNIQUE, formatted as `CUST-XXXX` via sequence `seq_customer_number`)
- `name` (TEXT, NOT NULL)
- `email` (TEXT, NOT NULL, indexed)
- `phone` (TEXT)
- `company_name` (TEXT)
- `tax_id` (TEXT, GST/VAT identifier)
- `billing_address` (TEXT)
- `shipping_address` (TEXT)
- `status` (TEXT, CHECK `IN ('ACTIVE', 'INACTIVE')`, default `'ACTIVE'`)
- `created_at`, `updated_at` (TIMESTAMPTZ)
- **RLS**: Authenticated users can view; staff and admins can insert and update. Foreign keys in quotations and subscriptions enforce `ON DELETE RESTRICT` (VULN-006).

#### `quotation_templates` & `quotation_template_lines`
Defines reusable commercial proposal structures with preset line items and payment terms.
- `quotation_templates`:
  - `id` (UUID, PK)
  - `name` (TEXT, NOT NULL)
  - `description` (TEXT)
  - `validity_days` (INTEGER, CHECK `validity_days >= 1 AND validity_days <= 365`, default 30)
  - `payment_terms` (TEXT, default `'Due on receipt'`)
  - `terms_and_conditions` (TEXT)
  - `is_active` (BOOLEAN, default true for soft-archive)
  - `created_at`, `updated_at` (TIMESTAMPTZ)
- `quotation_template_lines`:
  - `id` (UUID, PK)
  - `template_id` (UUID, FK -> `quotation_templates.id` ON DELETE CASCADE)
  - `product_id` (UUID, FK -> `products.id` ON DELETE RESTRICT)
  - `quantity` (INTEGER, CHECK `quantity >= 1`, default 1)

#### `quotations` & `quotation_lines`
Commercial quotations generated for customers with immutable financial snapshots.
- `quotations`:
  - `id` (UUID, PK)
  - `quotation_number` (TEXT, UNIQUE, default `QT-YYYY-XXXX` via sequence `seq_quotation_number`)
  - `customer_id` (UUID, FK -> `customers.id` ON DELETE RESTRICT)
  - `template_id` (UUID, FK -> `quotation_templates.id` ON DELETE SET NULL)
  - `quotation_date` (DATE, default `CURRENT_DATE`)
  - `validity_date` (DATE, NOT NULL)
  - `status` (TEXT, CHECK `IN ('DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'EXPIRED')`, default `'DRAFT'`)
  - `subtotal` (NUMERIC(12,2), CHECK `>= 0`)
  - `discount_amount` (NUMERIC(12,2), CHECK `>= 0`)
  - `tax_amount` (NUMERIC(12,2), CHECK `>= 0`)
  - `grand_total` (NUMERIC(12,2), CHECK `>= 0`)
  - `payment_terms` (TEXT)
  - `terms_and_conditions` (TEXT)
  - `accepted_at`, `rejected_at` (TIMESTAMPTZ)
  - `created_by` (UUID, FK -> `profiles.id`)
  - `created_at`, `updated_at` (TIMESTAMPTZ)
- `quotation_lines`:
  - `id` (UUID, PK)
  - `quotation_id` (UUID, FK -> `quotations.id` ON DELETE CASCADE)
  - `product_id` (UUID, FK -> `products.id` ON DELETE RESTRICT)
  - `product_name_snapshot` (TEXT, NOT NULL)
  - `quantity` (INTEGER, CHECK `quantity >= 1`)
  - `unit_price` (NUMERIC(12,2), CHECK `>= 0`)
  - `tax_id` (UUID, FK -> `taxes.id` ON DELETE SET NULL)
  - `tax_percentage_snapshot` (NUMERIC(5,2), CHECK `>= 0`)
  - `line_subtotal`, `line_tax`, `line_total` (NUMERIC(12,2), CHECK `>= 0`)

#### `subscriptions` & `subscription_lines`
Recurring customer contracts with lifecycle states and conversion linkages.
- `subscriptions`:
  - `id` (UUID, PK)
  - `subscription_number` (TEXT, UNIQUE, default `SUB-YYYY-XXXX` via sequence `seq_subscription_number`)
  - `customer_id` (UUID, FK -> `customers.id` ON DELETE RESTRICT)
  - `source_quotation_id` (UUID, UNIQUE, FK -> `quotations.id` ON DELETE SET NULL) -- Prevents duplicate conversion (VULN-002)
  - `plan_id` (UUID, FK -> `subscription_plans.id` ON DELETE RESTRICT)
  - `plan_name_snapshot` (TEXT, NOT NULL)
  - `billing_frequency` (TEXT, CHECK `IN ('daily', 'weekly', 'monthly', 'yearly')`)
  - `start_date` (DATE, default `CURRENT_DATE`)
  - `end_date` (DATE, NULL for ongoing contracts)
  - `status` (TEXT, CHECK `IN ('DRAFT', 'CONFIRMED', 'ACTIVE', 'PAUSED', 'CLOSED', 'CANCELLED')`, default `'DRAFT'`)
  - `subtotal`, `tax_amount`, `grand_total` (NUMERIC(12,2), CHECK `>= 0`)
  - `payment_terms` (TEXT)
  - `auto_renew` (BOOLEAN, default true)
  - `pause_reason`, `cancellation_reason` (TEXT)
  - `confirmed_at`, `activated_at`, `paused_at`, `resumed_at`, `closed_at`, `cancelled_at` (TIMESTAMPTZ)
- `subscription_lines`:
  - `id` (UUID, PK)
  - `subscription_id` (UUID, FK -> `subscriptions.id` ON DELETE CASCADE)
  - `product_id` (UUID, FK -> `products.id` ON DELETE RESTRICT)
  - `product_name_snapshot` (TEXT, NOT NULL)
  - `quantity` (INTEGER, CHECK `quantity >= 1`)
  - `unit_price` (NUMERIC(12,2), CHECK `>= 0`)
  - `tax_id` (UUID, FK -> `taxes.id` ON DELETE SET NULL)
  - `tax_percentage_snapshot` (NUMERIC(5,2), CHECK `>= 0`)
  - `line_subtotal`, `tax_amount`, `final_amount` (NUMERIC(12,2), CHECK `>= 0`)

#### `subscription_history`
Immutable audit log recording every lifecycle transition and background automated action (VULN-010).
- `id` (UUID, PK)
- `subscription_id` (UUID, FK -> `subscriptions.id` ON DELETE CASCADE)
- `previous_status` (TEXT)
- `new_status` (TEXT, NOT NULL)
- `operation` (TEXT, NOT NULL: `'CONFIRM'`, `'ACTIVATE'`, `'PAUSE'`, `'RESUME'`, `'RENEW'`, `'CANCEL'`, `'CLOSE'`, `'EXPIRE'`, `'AUTO_RENEW'`, `'CREATE_FROM_QUOTE'`)
- `performed_by` (UUID, FK -> `profiles.id` ON DELETE SET NULL, NULL for automated jobs)
- `timestamp` (TIMESTAMPTZ, default `now()`)
- `remarks` (TEXT)

#### Atomic Stored Procedure: `public.convert_quotation_to_subscription(p_quotation_id, p_staff_id)`
Executes atomic conversion with row-level locking (`SELECT ... FOR UPDATE`):
1. Verifies quotation exists and has `status = 'ACCEPTED'`.
2. Checks whether quotation has already been converted (rejects duplicate conversion, VULN-002).
3. Creates new row in `subscriptions` linking `source_quotation_id`.
4. Copies all quotation line items into `subscription_lines` preserving exact pricing and tax snapshots.
5. Logs initial entry into `subscription_history` with `operation = 'CREATE_FROM_QUOTE'`.

---

## 3. How to Execute in Supabase SQL Editor

1. Open your Supabase project dashboard at `https://supabase.com/dashboard`.
2. Select your project and navigate to the **SQL Editor** from the left navigation.
3. First execute `database/schema.sql` (Foundation by Member 1: auth, profiles, products, plans, taxes).
4. Next execute `database/member2_schema.sql` (Member 2: customers, templates, quotes, subscriptions, lifecycle, and conversion RPC).
5. Verify in **Table Editor** that all 7 Member 2 tables are created with RLS enabled.
6. Create your initial admin account by registering in the app or Supabase Auth, and run:
   ```sql
   SELECT public.promote_user_to_admin('your-email@example.com');
   ```


---

## 4. Member 3 Domain Tables: Invoices, Billing Scheduler & Payment Engine

### 4.1. `invoices` Table
Stores commercial and automated recurring invoices.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `UUID` | Primary Key, `default uuid_generate_v4()` | Unique invoice identifier |
| `invoice_number` | `TEXT` | `NOT NULL, UNIQUE` | Formatted `INV-YYYY-XXXX` via sequence `seq_invoice_number` |
| `subscription_id` | `UUID` | `REFERENCES public.subscriptions(id) ON DELETE SET NULL` | Linked recurring subscription contract |
| `customer_id` | `UUID` | `NOT NULL, REFERENCES public.customers(id) ON DELETE RESTRICT` | Billed customer account |
| `invoice_date` | `DATE` | `NOT NULL, DEFAULT CURRENT_DATE` | Date invoice was issued |
| `due_date` | `DATE` | `NOT NULL` | Payment due date (default: 15 days from issue) |
| `billing_period_start` | `DATE` | Nullable | Start date of recurring billing coverage |
| `billing_period_end` | `DATE` | Nullable | End date of recurring billing coverage |
| `status` | `TEXT` | `CHECK (status IN ('DRAFT', 'CONFIRMED', 'PAID', 'CANCELLED'))` | Invoice lifecycle state |
| `payment_status` | `TEXT` | `CHECK (payment_status IN ('UNPAID', 'PARTIALLY_PAID', 'PAID'))` | Financial payment balance standing |
| `subtotal` | `NUMERIC(12,2)` | `CHECK (subtotal >= 0)` | Net line items total before discounts & taxes |
| `discount_amount` | `NUMERIC(12,2)` | `CHECK (discount_amount >= 0)` | Subtotal deduction |
| `tax_amount` | `NUMERIC(12,2)` | `CHECK (tax_amount >= 0)` | Aggregate calculated taxes |
| `grand_total` | `NUMERIC(12,2)` | `CHECK (grand_total >= 0)` | Final payable invoice balance |
| `amount_paid` | `NUMERIC(12,2)` | `CHECK (amount_paid >= 0)` | Total payments applied so far |
| `outstanding_amount` | `NUMERIC(12,2)` | `CHECK (outstanding_amount >= 0)` | Remaining unpaid balance |
| `currency` | `TEXT` | `NOT NULL, DEFAULT 'USD'` | Base operational currency |
| `payment_terms` | `TEXT` | Default `'Due on receipt'` | Commercial credit payment terms |
| `sent_at` | `TIMESTAMPTZ` | Nullable | Timestamp when email was dispatched |
| `paid_at` | `TIMESTAMPTZ` | Nullable | Timestamp when balance reached zero |

#### Duplicate Prevention Guard:
- `CREATE UNIQUE INDEX idx_invoices_subscription_billing_period_unique ON public.invoices(subscription_id, billing_period_start, billing_period_end) WHERE (status != 'CANCELLED' AND subscription_id IS NOT NULL);`
- Guarantees database-level enforcement against duplicate billing runs for identical billing periods.

### 4.2. `invoice_lines` Table
Itemized product and tax lines for an invoice.
- `id` (UUID, PK)
- `invoice_id` (UUID, FK -> `invoices.id` ON DELETE CASCADE)
- `product_id` (UUID, FK -> `products.id` ON DELETE RESTRICT)
- `product_name_snapshot` (TEXT, NOT NULL)
- `quantity` (INTEGER, CHECK `quantity >= 1`)
- `unit_price` (NUMERIC(12,2), CHECK `>= 0`)
- `tax_id` (UUID, FK -> `taxes.id` ON DELETE SET NULL)
- `tax_percentage_snapshot` (NUMERIC(5,2), CHECK `>= 0`)
- `line_subtotal`, `line_tax`, `line_total` (NUMERIC(12,2))

### 4.3. `payments` Table
Records payment transactions and allocations.
- `id` (UUID, PK)
- `payment_number` (TEXT, UNIQUE, default `PAY-YYYY-XXXX` via sequence `seq_payment_number`)
- `invoice_id` (UUID, FK -> `invoices.id` ON DELETE RESTRICT)
- `customer_id` (UUID, FK -> `customers.id` ON DELETE RESTRICT)
- `amount` (NUMERIC(12,2), CHECK `amount > 0`)
- `payment_method` (TEXT: `'CREDIT_CARD'`, `'BANK_TRANSFER'`, `'CASH'`, `'CHECK'`, `'PAYPAL'`, `'STRIPE'`, `'OTHER'`)
- `payment_date` (DATE, default `CURRENT_DATE`)
- `reference_id` (TEXT)
- `notes` (TEXT)
- `status` (TEXT: `'COMPLETED'`, `'PENDING'`, `'FAILED'`, `'REFUNDED'`)
- `recorded_by` (UUID, FK -> `profiles.id`)

### 4.4. `email_notifications` Table
Stores audit logs and copies of dispatched invoice and payment notifications.
- `id` (UUID, PK)
- `recipient_email` (TEXT, NOT NULL)
- `recipient_name` (TEXT)
- `subject` (TEXT, NOT NULL)
- `type` (TEXT: `'INVOICE_SENT'`, `'PAYMENT_RECEIPT'`, `'BILLING_REMINDER'`, `'OVERDUE_ALERT'`)
- `invoice_id` (UUID, FK -> `invoices.id`)
- `payment_id` (UUID, FK -> `payments.id`)
- `body_html` (TEXT, NOT NULL)
- `status` (TEXT: `'SENT'`, `'FAILED'`, `'QUEUED'`)
- `sent_at` (TIMESTAMPTZ, default `now()`)

### 4.5. Stored Procedures
- `public.record_invoice_payment(p_invoice_id, p_amount, p_payment_method, ...)`:
  Row-locks the invoice (`FOR UPDATE`), validates amount, inserts into `payments`, reallocates balance, updates invoice `amount_paid`, `outstanding_amount`, and statuses (`PAID`/`PARTIALLY_PAID`), and logs email receipt.
- `public.generate_invoice_from_subscription(p_subscription_id, p_billing_period_start, ...)`:
  Locks subscription, enforces duplicate check, copies line items, creates invoice in `CONFIRMED` state, advances `next_billing_date` and `last_billed_date`.
