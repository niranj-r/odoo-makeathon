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

## 3. How to Execute in Supabase SQL Editor

1. Open your Supabase project dashboard at `https://supabase.com/dashboard`.
2. Select your project and navigate to the **SQL Editor** from the left navigation.
3. Open `database/schema.sql`, copy all contents, paste into the SQL editor, and click **Run**.
4. Check the **Table Editor** to verify that `profiles` and Member 1 tables were created with RLS enabled.
5. Create your initial admin account by registering in the app or Supabase Auth, and run:
   ```sql
   SELECT public.promote_user_to_admin('your-email@example.com');
   ```

