-- ==============================================================================
-- BRIGHTLOOP SUBSCRIPTION MANAGEMENT PLATFORM
-- Database Schema & Security Definition
-- Member 1: Authentication, User Profiles, Products, Plans, Taxes & Discounts
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- 2. USER PROFILES TABLE (Linked with Supabase auth.users)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL DEFAULT 'CUSTOMER' CHECK (role IN ('ADMIN', 'STAFF', 'CUSTOMER')),
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Index for fast lookup by email and role
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles(status);

-- Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- 3. HELPER FUNCTIONS FOR SECURITY & ROLE VERIFICATION
-- ==============================================================================

-- Function to check if the current requester is an ADMIN
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'ADMIN' AND status = 'ACTIVE'
  );
$$;

-- Function to check if the current requester is STAFF or ADMIN
CREATE OR REPLACE FUNCTION public.is_staff_or_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('ADMIN', 'STAFF') AND status = 'ACTIVE'
  );
$$;

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_profiles_updated_at ON public.profiles;
CREATE TRIGGER trigger_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ==============================================================================
-- 4. ROW LEVEL SECURITY (RLS) POLICIES FOR PROFILES
-- ==============================================================================

-- 4.1. SELECT Policies
-- Any authenticated user can view their own profile
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Admins can view all profiles
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- Staff can view Customer profiles
DROP POLICY IF EXISTS "Staff can view customer profiles" ON public.profiles;
CREATE POLICY "Staff can view customer profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    public.is_staff_or_admin() AND (role = 'CUSTOMER' OR auth.uid() = id)
  );

-- 4.2. INSERT Policies
-- IMPORTANT: Public insert policy is NOT created!
-- All profile insertions occur exclusively via the SECURITY DEFINER trigger
-- attached to auth.users. This ensures self-registered users cannot inject elevated roles.

-- 4.3. UPDATE Policies
-- Regular users can update their own full_name only (role and status changes blocked by trigger below)
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Admins can update any profile (role, status, name)
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
CREATE POLICY "Admins can update all profiles"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 4.4. DELETE Policies
-- Only Admins can delete profiles
DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;
CREATE POLICY "Admins can delete profiles"
  ON public.profiles
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- ==============================================================================
-- 5. TRIGGER: PREVENT UNAUTHORIZED ROLE OR STATUS MODIFICATIONS
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.prevent_unauthorized_role_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Prevent users from changing their email directly on profiles (email is managed via auth.users)
  IF (NEW.email IS DISTINCT FROM OLD.email) THEN
    IF NOT (
      public.is_admin() OR 
      (current_setting('request.jwt.claims', true)::jsonb ->> 'role') = 'service_role'
    ) THEN
      RAISE EXCEPTION 'Unauthorized: Email cannot be modified directly on profiles table.';
    END IF;
  END IF;

  -- If role or status is being changed
  IF (NEW.role IS DISTINCT FROM OLD.role) OR (NEW.status IS DISTINCT FROM OLD.status) THEN
    -- Allow change only if caller is an admin or service_role
    IF NOT (
      public.is_admin() OR 
      (current_setting('request.jwt.claims', true)::jsonb ->> 'role') = 'service_role'
    ) THEN
      RAISE EXCEPTION 'Unauthorized: Only administrators can modify user role or account status.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_prevent_unauthorized_role_change ON public.profiles;
CREATE TRIGGER trigger_prevent_unauthorized_role_change
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_unauthorized_role_change();

-- ==============================================================================
-- 6. TRIGGER: AUTOMATIC CUSTOMER PROFILE CREATION ON USER SIGNUP
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  assigned_role TEXT := 'CUSTOMER';
  user_full_name TEXT;
BEGIN
  -- Extract full_name metadata if provided, otherwise default to email username
  user_full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    split_part(NEW.email, '@', 1)
  );

  -- Only respect role parameter if explicitly provisioned through service_role (Admin API)
  IF (current_setting('request.jwt.claims', true)::jsonb ->> 'role') = 'service_role' THEN
    IF NEW.raw_user_meta_data->>'role' IN ('ADMIN', 'STAFF', 'CUSTOMER') THEN
      assigned_role := NEW.raw_user_meta_data->>'role';
    END IF;
  ELSE
    -- Public sign-up is ALWAYS forced to CUSTOMER role
    assigned_role := 'CUSTOMER';
  END IF;

  INSERT INTO public.profiles (
    id,
    full_name,
    email,
    role,
    status
  )
  VALUES (
    NEW.id,
    user_full_name,
    NEW.email,
    assigned_role,
    'ACTIVE'
  )
  ON CONFLICT (id) DO UPDATE
  SET
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    updated_at = timezone('utc'::text, now());

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- 7. INITIAL ADMIN PROMOTION PROCEDURE
-- ==============================================================================

-- Stored procedure to promote a user to ADMIN safely from Supabase SQL Editor:
-- Usage: SELECT public.promote_user_to_admin('admin@brightloop.com');
CREATE OR REPLACE FUNCTION public.promote_user_to_admin(target_email TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_id UUID;
BEGIN
  SELECT id INTO target_id FROM public.profiles WHERE LOWER(email) = LOWER(target_email);

  IF target_id IS NULL THEN
    RAISE EXCEPTION 'User with email % does not exist in profiles table.', target_email;
  END IF;

  UPDATE public.profiles
  SET role = 'ADMIN', status = 'ACTIVE', updated_at = timezone('utc'::text, now())
  WHERE id = target_id;

  RETURN 'Successfully promoted ' || target_email || ' to ADMIN role.';
END;
$$;

-- Security hardening: Revoke execute from PUBLIC, anon, and authenticated
-- Only service_role or database administrators can invoke admin promotion
REVOKE EXECUTE ON FUNCTION public.promote_user_to_admin(TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.promote_user_to_admin(TEXT) FROM anon;
REVOKE EXECUTE ON FUNCTION public.promote_user_to_admin(TEXT) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.promote_user_to_admin(TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.promote_user_to_admin(TEXT) TO postgres;

-- ==============================================================================
-- 8. MEMBER 1 BUSINESS MODULE TABLES (Pre-configured Foundation)
-- ==============================================================================

-- 8.1. PRODUCTS
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'service' CHECK (type IN ('service', 'goods', 'digital')),
    sales_price NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (sales_price >= 0),
    cost_price NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (cost_price >= 0),
    notes TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read active products" ON public.products;
CREATE POLICY "Public read active products" ON public.products FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Staff read products" ON public.products;
CREATE POLICY "Staff read products" ON public.products FOR SELECT TO authenticated USING (public.is_staff_or_admin());

DROP POLICY IF EXISTS "Admins manage products" ON public.products;
CREATE POLICY "Admins manage products" ON public.products FOR ALL TO authenticated USING (public.is_admin());

DROP TRIGGER IF EXISTS trigger_products_updated_at ON public.products;
CREATE TRIGGER trigger_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- 8.2. PRODUCT VARIANTS
CREATE TABLE IF NOT EXISTS public.product_variants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    variant_name TEXT NOT NULL,
    attribute_name TEXT NOT NULL,
    attribute_value TEXT NOT NULL,
    price_extra NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (price_extra >= 0),
    sku TEXT UNIQUE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Ensure is_active column exists if table was created previously without it
ALTER TABLE public.product_variants ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read product variants" ON public.product_variants;
CREATE POLICY "Public read product variants" ON public.product_variants FOR SELECT USING (true);

DROP POLICY IF EXISTS "Staff read product variants" ON public.product_variants;
CREATE POLICY "Staff read product variants" ON public.product_variants FOR SELECT TO authenticated USING (public.is_staff_or_admin());

DROP POLICY IF EXISTS "Admins manage product variants" ON public.product_variants;
CREATE POLICY "Admins manage product variants" ON public.product_variants FOR ALL TO authenticated USING (public.is_admin());

DROP TRIGGER IF EXISTS trigger_variants_updated_at ON public.product_variants;
CREATE TRIGGER trigger_variants_updated_at
  BEFORE UPDATE ON public.product_variants
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- 8.3. SUBSCRIPTION PLANS
CREATE TABLE IF NOT EXISTS public.subscription_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
    name TEXT NOT NULL,
    billing_interval TEXT NOT NULL CHECK (billing_interval IN ('daily', 'weekly', 'monthly', 'yearly')),
    price NUMERIC(12, 2) NOT NULL CHECK (price >= 0),
    min_quantity INTEGER NOT NULL DEFAULT 1 CHECK (min_quantity >= 1),
    start_date DATE,
    end_date DATE,
    auto_close BOOLEAN NOT NULL DEFAULT false,
    allow_early_close BOOLEAN NOT NULL DEFAULT true,
    allow_pause BOOLEAN NOT NULL DEFAULT false,
    allow_renewal BOOLEAN NOT NULL DEFAULT true,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read active plans" ON public.subscription_plans;
CREATE POLICY "Public read active plans" ON public.subscription_plans FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Staff read subscription plans" ON public.subscription_plans;
CREATE POLICY "Staff read subscription plans" ON public.subscription_plans FOR SELECT TO authenticated USING (public.is_staff_or_admin());

DROP POLICY IF EXISTS "Admins manage subscription plans" ON public.subscription_plans;
CREATE POLICY "Admins manage subscription plans" ON public.subscription_plans FOR ALL TO authenticated USING (public.is_admin());

DROP TRIGGER IF EXISTS trigger_subscription_plans_updated_at ON public.subscription_plans;
CREATE TRIGGER trigger_subscription_plans_updated_at
  BEFORE UPDATE ON public.subscription_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- 8.4. TAXES
CREATE TABLE IF NOT EXISTS public.taxes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    rate_percentage NUMERIC(12, 2) NOT NULL CHECK (rate_percentage >= 0),
    computation_type TEXT NOT NULL DEFAULT 'percentage' CHECK (computation_type IN ('percentage', 'fixed')),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.taxes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read active taxes" ON public.taxes;
CREATE POLICY "Public read active taxes" ON public.taxes FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Staff read taxes" ON public.taxes;
CREATE POLICY "Staff read taxes" ON public.taxes FOR SELECT TO authenticated USING (public.is_staff_or_admin());

DROP POLICY IF EXISTS "Admins manage taxes" ON public.taxes;
CREATE POLICY "Admins manage taxes" ON public.taxes FOR ALL TO authenticated USING (public.is_admin());

DROP TRIGGER IF EXISTS trigger_taxes_updated_at ON public.taxes;
CREATE TRIGGER trigger_taxes_updated_at
  BEFORE UPDATE ON public.taxes
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- 8.4.1. PRODUCT TAXES (Many-to-Many Association)
CREATE TABLE IF NOT EXISTS public.product_taxes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    tax_id UUID NOT NULL REFERENCES public.taxes(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(product_id, tax_id)
);

CREATE INDEX IF NOT EXISTS idx_product_taxes_product_id ON public.product_taxes(product_id);
CREATE INDEX IF NOT EXISTS idx_product_taxes_tax_id ON public.product_taxes(tax_id);

ALTER TABLE public.product_taxes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read product taxes" ON public.product_taxes;
CREATE POLICY "Public read product taxes" ON public.product_taxes FOR SELECT USING (true);

DROP POLICY IF EXISTS "Staff read product taxes" ON public.product_taxes;
CREATE POLICY "Staff read product taxes" ON public.product_taxes FOR SELECT TO authenticated USING (public.is_staff_or_admin());

DROP POLICY IF EXISTS "Admins manage product taxes" ON public.product_taxes;
CREATE POLICY "Admins manage product taxes" ON public.product_taxes FOR ALL TO authenticated USING (public.is_admin());

-- 8.5. DISCOUNTS
CREATE TABLE IF NOT EXISTS public.discounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT NOT NULL UNIQUE,
    type TEXT NOT NULL CHECK (type IN ('percentage', 'fixed')),
    value NUMERIC(12, 2) NOT NULL CHECK (value > 0),
    min_quantity INTEGER DEFAULT 1,
    min_amount NUMERIC(12, 2) DEFAULT 0.00,
    start_date DATE,
    end_date DATE,
    max_usage INTEGER,
    current_usage INTEGER NOT NULL DEFAULT 0,
    applies_to TEXT NOT NULL DEFAULT 'all' CHECK (applies_to IN ('all', 'product', 'plan')),
    target_id UUID,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.discounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read active discounts" ON public.discounts FOR SELECT USING (is_active = true);
CREATE POLICY "Admins manage discounts" ON public.discounts FOR ALL TO authenticated USING (public.is_admin());

