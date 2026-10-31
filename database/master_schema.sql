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
CREATE POLICY "Public read active products" ON public.products FOR SELECT USING (is_active = true);
CREATE POLICY "Admins manage products" ON public.products FOR ALL TO authenticated USING (public.is_admin());

-- 8.2. PRODUCT VARIANTS
CREATE TABLE IF NOT EXISTS public.product_variants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    variant_name TEXT NOT NULL,
    attribute_name TEXT NOT NULL,
    attribute_value TEXT NOT NULL,
    price_extra NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    sku TEXT UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read product variants" ON public.product_variants FOR SELECT USING (true);
CREATE POLICY "Admins manage product variants" ON public.product_variants FOR ALL TO authenticated USING (public.is_admin());

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
CREATE POLICY "Public read active plans" ON public.subscription_plans FOR SELECT USING (is_active = true);
CREATE POLICY "Admins manage subscription plans" ON public.subscription_plans FOR ALL TO authenticated USING (public.is_admin());

-- 8.4. TAXES
CREATE TABLE IF NOT EXISTS public.taxes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    rate_percentage NUMERIC(5, 2) NOT NULL CHECK (rate_percentage >= 0),
    computation_type TEXT NOT NULL DEFAULT 'percentage' CHECK (computation_type IN ('percentage', 'fixed')),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.taxes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read active taxes" ON public.taxes FOR SELECT USING (is_active = true);
CREATE POLICY "Admins manage taxes" ON public.taxes FOR ALL TO authenticated USING (public.is_admin());

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

-- ==============================================================================
-- BRIGHTLOOP SUBSCRIPTION MANAGEMENT PLATFORM
-- Database Schema & Security Definition
-- Member 2: Customer, Quotation & Subscription Management
-- ==============================================================================

-- 1. EXTENSIONS & SEQUENCES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE SEQUENCE IF NOT EXISTS seq_customer_number START WITH 1001;
CREATE SEQUENCE IF NOT EXISTS seq_quotation_number START WITH 1001;
CREATE SEQUENCE IF NOT EXISTS seq_subscription_number START WITH 1001;

-- ==============================================================================
-- 2. CUSTOMER MANAGEMENT (Task 1.2)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_number TEXT UNIQUE NOT NULL DEFAULT ('CUST-' || LPAD(nextval('seq_customer_number')::text, 4, '0')),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    company_name TEXT,
    billing_address TEXT,
    tax_id TEXT, -- GST / VAT identification number
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'ARCHIVED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_customers_email ON public.customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_customer_number ON public.customers(customer_number);
CREATE INDEX IF NOT EXISTS idx_customers_status ON public.customers(status);
CREATE INDEX IF NOT EXISTS idx_customers_profile_id ON public.customers(profile_id);

DROP TRIGGER IF EXISTS trigger_customers_updated_at ON public.customers;
CREATE TRIGGER trigger_customers_updated_at
    BEFORE UPDATE ON public.customers
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- ==============================================================================
-- 3. QUOTATION TEMPLATES (Task 1.5)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.quotation_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    default_validity_days INTEGER NOT NULL DEFAULT 30 CHECK (default_validity_days > 0),
    default_payment_terms TEXT DEFAULT 'Payment due within 30 days',
    default_terms_and_conditions TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_quotation_templates_active ON public.quotation_templates(is_active);

DROP TRIGGER IF EXISTS trigger_quotation_templates_updated_at ON public.quotation_templates;
CREATE TRIGGER trigger_quotation_templates_updated_at
    BEFORE UPDATE ON public.quotation_templates
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Quotation Template Line Items (Preset line items for reusable templates)
CREATE TABLE IF NOT EXISTS public.quotation_template_lines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_id UUID NOT NULL REFERENCES public.quotation_templates(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity >= 1),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_template_lines_template_id ON public.quotation_template_lines(template_id);

-- ==============================================================================
-- 4. QUOTATION MANAGEMENT (Task 1.3 & 1.4)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.quotations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quotation_number TEXT UNIQUE NOT NULL DEFAULT ('QT-' || to_char(CURRENT_DATE, 'YYYY') || '-' || LPAD(nextval('seq_quotation_number')::text, 4, '0')),
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE RESTRICT,
    template_id UUID REFERENCES public.quotation_templates(id) ON DELETE SET NULL,
    quotation_date DATE NOT NULL DEFAULT CURRENT_DATE,
    validity_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'EXPIRED')),
    subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (subtotal >= 0),
    discount_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (discount_amount >= 0),
    tax_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (tax_amount >= 0),
    grand_total NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (grand_total >= 0),
    payment_terms TEXT DEFAULT 'Due on receipt',
    terms_and_conditions TEXT,
    accepted_at TIMESTAMPTZ,
    rejected_at TIMESTAMPTZ,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_quotations_customer_id ON public.quotations(customer_id);
CREATE INDEX IF NOT EXISTS idx_quotations_status ON public.quotations(status);
CREATE INDEX IF NOT EXISTS idx_quotations_validity_date ON public.quotations(validity_date);
CREATE INDEX IF NOT EXISTS idx_quotations_number ON public.quotations(quotation_number);

DROP TRIGGER IF EXISTS trigger_quotations_updated_at ON public.quotations;
CREATE TRIGGER trigger_quotations_updated_at
    BEFORE UPDATE ON public.quotations
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Quotation Line Items
CREATE TABLE IF NOT EXISTS public.quotation_lines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quotation_id UUID NOT NULL REFERENCES public.quotations(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
    product_name_snapshot TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity >= 1),
    unit_price NUMERIC(12, 2) NOT NULL CHECK (unit_price >= 0),
    tax_id UUID REFERENCES public.taxes(id) ON DELETE SET NULL,
    tax_percentage_snapshot NUMERIC(5, 2) NOT NULL DEFAULT 0.00 CHECK (tax_percentage_snapshot >= 0),
    line_subtotal NUMERIC(12, 2) NOT NULL CHECK (line_subtotal >= 0),
    line_tax NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (line_tax >= 0),
    line_total NUMERIC(12, 2) NOT NULL CHECK (line_total >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_quotation_lines_quote_id ON public.quotation_lines(quotation_id);
CREATE INDEX IF NOT EXISTS idx_quotation_lines_product_id ON public.quotation_lines(product_id);

-- ==============================================================================
-- 5. SUBSCRIPTION MANAGEMENT (Task 1.6 & 1.7)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subscription_number TEXT UNIQUE NOT NULL DEFAULT ('SUB-' || to_char(CURRENT_DATE, 'YYYY') || '-' || LPAD(nextval('seq_subscription_number')::text, 4, '0')),
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE RESTRICT,
    source_quotation_id UUID UNIQUE REFERENCES public.quotations(id) ON DELETE SET NULL, -- Prevents duplicate conversion
    plan_id UUID REFERENCES public.subscription_plans(id) ON DELETE RESTRICT,
    plan_name_snapshot TEXT NOT NULL,
    billing_frequency TEXT NOT NULL CHECK (billing_frequency IN ('daily', 'weekly', 'monthly', 'yearly')),
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    end_date DATE,
    status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'CONFIRMED', 'ACTIVE', 'PAUSED', 'CLOSED', 'CANCELLED')),
    subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (subtotal >= 0),
    tax_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (tax_amount >= 0),
    grand_total NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (grand_total >= 0),
    payment_terms TEXT DEFAULT 'Due on receipt',
    auto_renew BOOLEAN NOT NULL DEFAULT true,
    pause_reason TEXT,
    cancellation_reason TEXT,
    confirmed_at TIMESTAMPTZ,
    activated_at TIMESTAMPTZ,
    paused_at TIMESTAMPTZ,
    resumed_at TIMESTAMPTZ,
    closed_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_customer_id ON public.subscriptions(customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_end_date ON public.subscriptions(end_date);
CREATE INDEX IF NOT EXISTS idx_subscriptions_source_quote ON public.subscriptions(source_quotation_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_number ON public.subscriptions(subscription_number);

DROP TRIGGER IF EXISTS trigger_subscriptions_updated_at ON public.subscriptions;
CREATE TRIGGER trigger_subscriptions_updated_at
    BEFORE UPDATE ON public.subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Subscription Line Items
CREATE TABLE IF NOT EXISTS public.subscription_lines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subscription_id UUID NOT NULL REFERENCES public.subscriptions(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
    product_name_snapshot TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity >= 1),
    unit_price NUMERIC(12, 2) NOT NULL CHECK (unit_price >= 0),
    tax_percentage_snapshot NUMERIC(5, 2) NOT NULL DEFAULT 0.00 CHECK (tax_percentage_snapshot >= 0),
    line_subtotal NUMERIC(12, 2) NOT NULL CHECK (line_subtotal >= 0),
    line_tax NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (line_tax >= 0),
    line_total NUMERIC(12, 2) NOT NULL CHECK (line_total >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_subscription_lines_sub_id ON public.subscription_lines(subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscription_lines_product_id ON public.subscription_lines(product_id);

-- ==============================================================================
-- 6. SUBSCRIPTION LIFECYCLE HISTORY (Task 1.8)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.subscription_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subscription_id UUID NOT NULL REFERENCES public.subscriptions(id) ON DELETE CASCADE,
    previous_status TEXT,
    new_status TEXT NOT NULL,
    operation TEXT NOT NULL, -- CREATE, CONFIRM, ACTIVATE, PAUSE, RESUME, RENEW, CANCEL, CLOSE, EXPIRE
    performed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    remarks TEXT,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_subscription_history_sub_id ON public.subscription_history(subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscription_history_timestamp ON public.subscription_history(timestamp);

-- ==============================================================================
-- 7. ATOMIC QUOTATION-TO-SUBSCRIPTION CONVERSION PROCEDURE
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.convert_quotation_to_subscription(
    p_quotation_id UUID,
    p_user_id UUID,
    p_plan_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_quote RECORD;
    v_new_sub_id UUID;
    v_plan_name TEXT := 'Standard Plan';
    v_plan_freq TEXT := 'monthly';
    v_line RECORD;
BEGIN
    -- 1. Row-level lock on quotation to prevent race conditions (VULN-002)
    SELECT * INTO v_quote
    FROM public.quotations
    WHERE id = p_quotation_id
    FOR UPDATE;

    IF v_quote.id IS NULL THEN
        RAISE EXCEPTION 'Quotation % not found.', p_quotation_id;
    END IF;

    -- 2. Validate quotation status
    IF v_quote.status <> 'ACCEPTED' THEN
        RAISE EXCEPTION 'Only ACCEPTED quotations can be converted to subscriptions. Current status: %', v_quote.status;
    END IF;

    -- 3. Validate validity date (VULN-004)
    IF v_quote.validity_date < CURRENT_DATE THEN
        RAISE EXCEPTION 'Quotation expired on % and cannot be converted.', v_quote.validity_date;
    END IF;

    -- 4. Check for duplicate conversion (VULN-002)
    IF EXISTS (SELECT 1 FROM public.subscriptions WHERE source_quotation_id = p_quotation_id) THEN
        RAISE EXCEPTION 'A subscription has already been created from this quotation.';
    END IF;

    -- 5. Plan details resolution if provided
    IF p_plan_id IS NOT NULL THEN
        SELECT name, billing_interval INTO v_plan_name, v_plan_freq
        FROM public.subscription_plans WHERE id = p_plan_id;
    END IF;

    -- 6. Insert new subscription
    INSERT INTO public.subscriptions (
        customer_id,
        source_quotation_id,
        plan_id,
        plan_name_snapshot,
        billing_frequency,
        start_date,
        status,
        subtotal,
        tax_amount,
        grand_total,
        payment_terms
    ) VALUES (
        v_quote.customer_id,
        v_quote.id,
        p_plan_id,
        COALESCE(v_plan_name, 'Standard Plan'),
        COALESCE(v_plan_freq, 'monthly'),
        CURRENT_DATE,
        'DRAFT',
        v_quote.subtotal,
        v_quote.tax_amount,
        v_quote.grand_total,
        v_quote.payment_terms
    ) RETURNING id INTO v_new_sub_id;

    -- 7. Snapshot quotation lines into subscription lines
    FOR v_line IN (SELECT * FROM public.quotation_lines WHERE quotation_id = p_quotation_id) LOOP
        INSERT INTO public.subscription_lines (
            subscription_id,
            product_id,
            product_name_snapshot,
            quantity,
            unit_price,
            tax_percentage_snapshot,
            line_subtotal,
            line_tax,
            line_total
        ) VALUES (
            v_new_sub_id,
            v_line.product_id,
            v_line.product_name_snapshot,
            v_line.quantity,
            v_line.unit_price,
            v_line.tax_percentage_snapshot,
            v_line.line_subtotal,
            v_line.line_tax,
            v_line.line_total
        );
    END LOOP;

    -- 8. Record initial lifecycle history entry (VULN-010)
    INSERT INTO public.subscription_history (
        subscription_id,
        previous_status,
        new_status,
        operation,
        performed_by,
        remarks
    ) VALUES (
        v_new_sub_id,
        NULL,
        'DRAFT',
        'CREATE_FROM_QUOTATION',
        p_user_id,
        'Generated from Quotation ' || v_quote.quotation_number
    );

    RETURN jsonb_build_object(
        'success', true,
        'subscription_id', v_new_sub_id,
        'quotation_id', p_quotation_id
    );
END;
$$;

-- ==============================================================================
-- 8. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotation_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotation_template_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotation_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_history ENABLE ROW LEVEL SECURITY;

-- 8.1. CUSTOMERS RLS
DROP POLICY IF EXISTS "Staff and Admins manage customers" ON public.customers;
CREATE POLICY "Staff and Admins manage customers"
    ON public.customers
    FOR ALL
    TO authenticated
    USING (public.is_staff_or_admin())
    WITH CHECK (public.is_staff_or_admin());

DROP POLICY IF EXISTS "Customers view own customer record" ON public.customers;
CREATE POLICY "Customers view own customer record"
    ON public.customers
    FOR SELECT
    TO authenticated
    USING (profile_id = auth.uid());

-- 8.2. QUOTATION TEMPLATES RLS
DROP POLICY IF EXISTS "Staff and Admins manage quotation templates" ON public.quotation_templates;
CREATE POLICY "Staff and Admins manage quotation templates"
    ON public.quotation_templates
    FOR ALL
    TO authenticated
    USING (public.is_staff_or_admin())
    WITH CHECK (public.is_staff_or_admin());

DROP POLICY IF EXISTS "Staff and Admins manage quotation template lines" ON public.quotation_template_lines;
CREATE POLICY "Staff and Admins manage quotation template lines"
    ON public.quotation_template_lines
    FOR ALL
    TO authenticated
    USING (public.is_staff_or_admin())
    WITH CHECK (public.is_staff_or_admin());

-- 8.3. QUOTATIONS RLS
DROP POLICY IF EXISTS "Staff and Admins manage quotations" ON public.quotations;
CREATE POLICY "Staff and Admins manage quotations"
    ON public.quotations
    FOR ALL
    TO authenticated
    USING (public.is_staff_or_admin())
    WITH CHECK (public.is_staff_or_admin());

DROP POLICY IF EXISTS "Customers view own quotations" ON public.quotations;
CREATE POLICY "Customers view own quotations"
    ON public.quotations
    FOR SELECT
    TO authenticated
    USING (
        customer_id IN (
            SELECT id FROM public.customers WHERE profile_id = auth.uid()
        )
    );

-- 8.4. QUOTATION LINES RLS
DROP POLICY IF EXISTS "Staff and Admins manage quotation lines" ON public.quotation_lines;
CREATE POLICY "Staff and Admins manage quotation lines"
    ON public.quotation_lines
    FOR ALL
    TO authenticated
    USING (public.is_staff_or_admin())
    WITH CHECK (public.is_staff_or_admin());

DROP POLICY IF EXISTS "Customers view own quotation lines" ON public.quotation_lines;
CREATE POLICY "Customers view own quotation lines"
    ON public.quotation_lines
    FOR SELECT
    TO authenticated
    USING (
        quotation_id IN (
            SELECT q.id FROM public.quotations q
            JOIN public.customers c ON q.customer_id = c.id
            WHERE c.profile_id = auth.uid()
        )
    );

-- 8.5. SUBSCRIPTIONS RLS
DROP POLICY IF EXISTS "Staff and Admins manage subscriptions" ON public.subscriptions;
CREATE POLICY "Staff and Admins manage subscriptions"
    ON public.subscriptions
    FOR ALL
    TO authenticated
    USING (public.is_staff_or_admin())
    WITH CHECK (public.is_staff_or_admin());

DROP POLICY IF EXISTS "Customers view own subscriptions" ON public.subscriptions;
CREATE POLICY "Customers view own subscriptions"
    ON public.subscriptions
    FOR SELECT
    TO authenticated
    USING (
        customer_id IN (
            SELECT id FROM public.customers WHERE profile_id = auth.uid()
        )
    );

-- 8.6. SUBSCRIPTION LINES RLS
DROP POLICY IF EXISTS "Staff and Admins manage subscription lines" ON public.subscription_lines;
CREATE POLICY "Staff and Admins manage subscription lines"
    ON public.subscription_lines
    FOR ALL
    TO authenticated
    USING (public.is_staff_or_admin())
    WITH CHECK (public.is_staff_or_admin());

DROP POLICY IF EXISTS "Customers view own subscription lines" ON public.subscription_lines;
CREATE POLICY "Customers view own subscription lines"
    ON public.subscription_lines
    FOR SELECT
    TO authenticated
    USING (
        subscription_id IN (
            SELECT s.id FROM public.subscriptions s
            JOIN public.customers c ON s.customer_id = c.id
            WHERE c.profile_id = auth.uid()
        )
    );

-- 8.7. SUBSCRIPTION HISTORY RLS
DROP POLICY IF EXISTS "Staff and Admins view subscription history" ON public.subscription_history;
CREATE POLICY "Staff and Admins view subscription history"
    ON public.subscription_history
    FOR SELECT
    TO authenticated
    USING (public.is_staff_or_admin());

DROP POLICY IF EXISTS "Staff and Admins insert subscription history" ON public.subscription_history;
CREATE POLICY "Staff and Admins insert subscription history"
    ON public.subscription_history
    FOR INSERT
    TO authenticated
    WITH CHECK (public.is_staff_or_admin());

-- ==============================================================================
-- BRIGHTLOOP SUBSCRIPTION MANAGEMENT PLATFORM
-- Database Schema & Security Definition
-- Member 3: Invoices, Billing Scheduler & Payment Engine
-- ==============================================================================

-- 1. EXTENSIONS & SEQUENCES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE SEQUENCE IF NOT EXISTS seq_invoice_number START WITH 1001;
CREATE SEQUENCE IF NOT EXISTS seq_payment_number START WITH 1001;

-- ==============================================================================
-- 2. SUBSCRIPTION BILLING EXTENSIONS (Aligning with Member 2 Subscriptions)
-- ==============================================================================

-- Add billing tracking columns to subscriptions table if they do not exist
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS next_billing_date DATE;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS last_billed_date DATE;

-- Index for scheduler performance: quickly locate subscriptions due for billing
CREATE INDEX IF NOT EXISTS idx_subscriptions_billing_due 
    ON public.subscriptions(status, next_billing_date) 
    WHERE (status = 'ACTIVE');

-- ==============================================================================
-- 3. INVOICE MANAGEMENT
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_number TEXT UNIQUE NOT NULL DEFAULT ('INV-' || to_char(CURRENT_DATE, 'YYYY') || '-' || LPAD(nextval('seq_invoice_number')::text, 4, '0')),
    subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL,
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE RESTRICT,
    invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '15 days'),
    billing_period_start DATE,
    billing_period_end DATE,
    status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'CONFIRMED', 'PAID', 'CANCELLED')),
    payment_status TEXT NOT NULL DEFAULT 'UNPAID' CHECK (payment_status IN ('UNPAID', 'PARTIALLY_PAID', 'PAID')),
    subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (subtotal >= 0),
    discount_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (discount_amount >= 0),
    tax_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (tax_amount >= 0),
    grand_total NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (grand_total >= 0),
    amount_paid NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (amount_paid >= 0),
    outstanding_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (outstanding_amount >= 0),
    currency TEXT NOT NULL DEFAULT 'USD',
    payment_terms TEXT DEFAULT 'Due on receipt',
    notes TEXT,
    sent_at TIMESTAMPTZ,
    confirmed_at TIMESTAMPTZ,
    paid_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Indexes for invoice query optimization
CREATE INDEX IF NOT EXISTS idx_invoices_customer_id ON public.invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_subscription_id ON public.invoices(subscription_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_payment_status ON public.invoices(payment_status);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON public.invoices(due_date);
CREATE INDEX IF NOT EXISTS idx_invoices_number ON public.invoices(invoice_number);

-- DUPLICATE PREVENTION: Strict partial unique constraint
-- Prevents creating two non-cancelled invoices for the same subscription and billing period
CREATE UNIQUE INDEX IF NOT EXISTS idx_invoices_subscription_billing_period_unique
    ON public.invoices(subscription_id, billing_period_start, billing_period_end)
    WHERE (status != 'CANCELLED' AND subscription_id IS NOT NULL);

-- Timestamp update trigger
DROP TRIGGER IF EXISTS trigger_invoices_updated_at ON public.invoices;
CREATE TRIGGER trigger_invoices_updated_at
    BEFORE UPDATE ON public.invoices
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- ==============================================================================
-- 4. INVOICE LINE ITEMS
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.invoice_lines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE RESTRICT,
    product_name_snapshot TEXT NOT NULL,
    description TEXT,
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity >= 1),
    unit_price NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (unit_price >= 0),
    tax_id UUID REFERENCES public.taxes(id) ON DELETE SET NULL,
    tax_percentage_snapshot NUMERIC(5, 2) NOT NULL DEFAULT 0.00 CHECK (tax_percentage_snapshot >= 0),
    line_subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (line_subtotal >= 0),
    line_tax NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (line_tax >= 0),
    line_total NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (line_total >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_invoice_lines_invoice_id ON public.invoice_lines(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_lines_product_id ON public.invoice_lines(product_id);

-- ==============================================================================
-- 5. PAYMENT RECORDING & MAPPING
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_number TEXT UNIQUE NOT NULL DEFAULT ('PAY-' || to_char(CURRENT_DATE, 'YYYY') || '-' || LPAD(nextval('seq_payment_number')::text, 4, '0')),
    invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE RESTRICT,
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE RESTRICT,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    payment_method TEXT NOT NULL CHECK (payment_method IN ('CREDIT_CARD', 'BANK_TRANSFER', 'CASH', 'CHECK', 'PAYPAL', 'STRIPE', 'OTHER')),
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    reference_id TEXT, -- e.g. transaction ID, cheque number, bank ref
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'COMPLETED' CHECK (status IN ('COMPLETED', 'PENDING', 'FAILED', 'REFUNDED')),
    recorded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_payments_invoice_id ON public.payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_customer_id ON public.payments(customer_id);
CREATE INDEX IF NOT EXISTS idx_payments_payment_date ON public.payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_payments_payment_number ON public.payments(payment_number);

-- Timestamp update trigger
DROP TRIGGER IF EXISTS trigger_payments_updated_at ON public.payments;
CREATE TRIGGER trigger_payments_updated_at
    BEFORE UPDATE ON public.payments
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- ==============================================================================
-- 6. EMAIL NOTIFICATIONS AUDIT LOG
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.email_notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipient_email TEXT NOT NULL,
    recipient_name TEXT,
    subject TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('INVOICE_SENT', 'PAYMENT_RECEIPT', 'BILLING_REMINDER', 'OVERDUE_ALERT')),
    invoice_id UUID REFERENCES public.invoices(id) ON DELETE SET NULL,
    payment_id UUID REFERENCES public.payments(id) ON DELETE SET NULL,
    body_html TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'SENT' CHECK (status IN ('SENT', 'FAILED', 'QUEUED')),
    metadata JSONB DEFAULT '{}'::jsonb,
    sent_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_email_notifications_invoice_id ON public.email_notifications(invoice_id);
CREATE INDEX IF NOT EXISTS idx_email_notifications_recipient ON public.email_notifications(recipient_email);
CREATE INDEX IF NOT EXISTS idx_email_notifications_type ON public.email_notifications(type);

-- ==============================================================================
-- 7. ATOMIC STORED PROCEDURES
-- ==============================================================================

-- 7.1. Atomic Payment Recording & Invoice Balance Allocation
CREATE OR REPLACE FUNCTION public.record_invoice_payment(
    p_invoice_id UUID,
    p_amount NUMERIC(12, 2),
    p_payment_method TEXT,
    p_payment_date DATE DEFAULT CURRENT_DATE,
    p_reference_id TEXT DEFAULT NULL,
    p_notes TEXT DEFAULT NULL,
    p_recorded_by UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_invoice RECORD;
    v_payment_id UUID;
    v_payment_number TEXT;
    v_new_amount_paid NUMERIC(12, 2);
    v_new_outstanding NUMERIC(12, 2);
    v_new_payment_status TEXT;
    v_new_invoice_status TEXT;
    v_customer_email TEXT;
    v_customer_name TEXT;
BEGIN
    -- 1. Validate payment amount
    IF p_amount <= 0 THEN
        RAISE EXCEPTION 'Payment amount must be greater than zero.';
    END IF;

    -- 2. Lock invoice row for update to prevent concurrent race conditions
    SELECT * INTO v_invoice
    FROM public.invoices
    WHERE id = p_invoice_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Invoice with ID % does not exist.', p_invoice_id;
    END IF;

    IF v_invoice.status = 'CANCELLED' THEN
        RAISE EXCEPTION 'Cannot record payment for a cancelled invoice.';
    END IF;

    -- Verify amount does not exceed outstanding balance
    IF p_amount > v_invoice.outstanding_amount THEN
        RAISE EXCEPTION 'Payment amount (%s) exceeds invoice outstanding balance (%s).', p_amount, v_invoice.outstanding_amount;
    END IF;

    -- 3. Calculate new financial balances
    v_new_amount_paid := v_invoice.amount_paid + p_amount;
    v_new_outstanding := v_invoice.grand_total - v_new_amount_paid;

    IF v_new_outstanding <= 0.001 THEN
        v_new_payment_status := 'PAID';
        v_new_invoice_status := 'PAID';
    ELSE
        v_new_payment_status := 'PARTIALLY_PAID';
        v_new_invoice_status := v_invoice.status; -- Remains CONFIRMED
    END IF;

    -- 4. Insert Payment record
    v_payment_number := 'PAY-' || to_char(CURRENT_DATE, 'YYYY') || '-' || LPAD(nextval('seq_payment_number')::text, 4, '0');
    INSERT INTO public.payments (
        payment_number,
        invoice_id,
        customer_id,
        amount,
        payment_method,
        payment_date,
        reference_id,
        notes,
        status,
        recorded_by
    ) VALUES (
        v_payment_number,
        p_invoice_id,
        v_invoice.customer_id,
        p_amount,
        p_payment_method,
        COALESCE(p_payment_date, CURRENT_DATE),
        p_reference_id,
        p_notes,
        'COMPLETED',
        p_recorded_by
    ) RETURNING id INTO v_payment_id;

    -- 5. Update Invoice status & balance
    UPDATE public.invoices
    SET
        amount_paid = v_new_amount_paid,
        outstanding_amount = v_new_outstanding,
        payment_status = v_new_payment_status,
        status = v_new_invoice_status,
        paid_at = CASE WHEN v_new_payment_status = 'PAID' THEN now() ELSE paid_at END,
        updated_at = now()
    WHERE id = p_invoice_id;

    -- 6. Log email notification for payment receipt
    SELECT name, email INTO v_customer_name, v_customer_email
    FROM public.customers
    WHERE id = v_invoice.customer_id;

    IF FOUND AND v_customer_email IS NOT NULL THEN
        INSERT INTO public.email_notifications (
            recipient_email,
            recipient_name,
            subject,
            type,
            invoice_id,
            payment_id,
            body_html,
            status,
            metadata
        ) VALUES (
            v_customer_email,
            v_customer_name,
            'Payment Receipt: ' || v_payment_number || ' for ' || v_invoice.invoice_number,
            'PAYMENT_RECEIPT',
            p_invoice_id,
            v_payment_id,
            '<p>Thank you for your payment of $' || p_amount || ' for Invoice ' || v_invoice.invoice_number || '. Remaining balance: $' || v_new_outstanding || '.</p>',
            'SENT',
            jsonb_build_object(
                'payment_number', v_payment_number,
                'invoice_number', v_invoice.invoice_number,
                'amount', p_amount,
                'outstanding', v_new_outstanding
            )
        );
    END IF;

    -- Return comprehensive result
    RETURN jsonb_build_object(
        'success', true,
        'payment_id', v_payment_id,
        'payment_number', v_payment_number,
        'amount', p_amount,
        'new_amount_paid', v_new_amount_paid,
        'new_outstanding', v_new_outstanding,
        'payment_status', v_new_payment_status,
        'invoice_status', v_new_invoice_status
    );
END;
$$;

-- 7.2. Atomic Invoice Generation From Subscription
CREATE OR REPLACE FUNCTION public.generate_invoice_from_subscription(
    p_subscription_id UUID,
    p_billing_period_start DATE,
    p_billing_period_end DATE,
    p_created_by UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_sub RECORD;
    v_existing_invoice RECORD;
    v_invoice_id UUID;
    v_invoice_number TEXT;
    v_line RECORD;
    v_due_date DATE;
    v_next_billing DATE;
BEGIN
    -- 1. Lock subscription row
    SELECT * INTO v_sub
    FROM public.subscriptions
    WHERE id = p_subscription_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Subscription % not found.', p_subscription_id;
    END IF;

    IF v_sub.status NOT IN ('ACTIVE', 'CONFIRMED') THEN
        RAISE EXCEPTION 'Subscription % is not active (status: %).', p_subscription_id, v_sub.status;
    END IF;

    -- 2. DUPLICATE BILLING CHECK
    SELECT * INTO v_existing_invoice
    FROM public.invoices
    WHERE subscription_id = p_subscription_id
      AND billing_period_start = p_billing_period_start
      AND billing_period_end = p_billing_period_end
      AND status != 'CANCELLED';

    IF FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'is_duplicate', true,
            'message', 'Invoice already exists for this subscription and billing period.',
            'invoice_id', v_existing_invoice.id,
            'invoice_number', v_existing_invoice.invoice_number
        );
    END IF;

    -- 3. Calculate due date (default: 15 days from billing date)
    v_due_date := CURRENT_DATE + INTERVAL '15 days';

    -- 4. Generate new invoice number
    v_invoice_number := 'INV-' || to_char(CURRENT_DATE, 'YYYY') || '-' || LPAD(nextval('seq_invoice_number')::text, 4, '0');

    -- 5. Insert invoice header
    INSERT INTO public.invoices (
        invoice_number,
        subscription_id,
        customer_id,
        invoice_date,
        due_date,
        billing_period_start,
        billing_period_end,
        status,
        payment_status,
        subtotal,
        discount_amount,
        tax_amount,
        grand_total,
        amount_paid,
        outstanding_amount,
        payment_terms,
        notes,
        confirmed_at,
        created_by
    ) VALUES (
        v_invoice_number,
        p_subscription_id,
        v_sub.customer_id,
        CURRENT_DATE,
        v_due_date,
        p_billing_period_start,
        p_billing_period_end,
        'CONFIRMED',
        'UNPAID',
        v_sub.subtotal,
        0.00,
        v_sub.tax_amount,
        v_sub.grand_total,
        0.00,
        v_sub.grand_total,
        v_sub.payment_terms,
        'Automatically generated from Subscription ' || v_sub.subscription_number,
        now(),
        p_created_by
    ) RETURNING id INTO v_invoice_id;

    -- 6. Copy line items from subscription_lines
    FOR v_line IN
        SELECT * FROM public.subscription_lines WHERE subscription_id = p_subscription_id
    LOOP
        INSERT INTO public.invoice_lines (
            invoice_id,
            product_id,
            product_name_snapshot,
            quantity,
            unit_price,
            tax_id,
            tax_percentage_snapshot,
            line_subtotal,
            line_tax,
            line_total
        ) VALUES (
            v_invoice_id,
            v_line.product_id,
            v_line.product_name_snapshot,
            v_line.quantity,
            v_line.unit_price,
            v_line.tax_id,
            v_line.tax_percentage_snapshot,
            v_line.line_subtotal,
            v_line.tax_amount,
            v_line.final_amount
        );
    END LOOP;

    -- 7. Compute next billing date based on frequency
    CASE v_sub.billing_frequency
        WHEN 'daily' THEN
            v_next_billing := p_billing_period_end + INTERVAL '1 day';
        WHEN 'weekly' THEN
            v_next_billing := p_billing_period_end + INTERVAL '1 day';
        WHEN 'monthly' THEN
            v_next_billing := p_billing_period_end + INTERVAL '1 day';
        WHEN 'yearly' THEN
            v_next_billing := p_billing_period_end + INTERVAL '1 day';
        ELSE
            v_next_billing := p_billing_period_end + INTERVAL '1 month';
    END CASE;

    -- Update subscription billing cadence tracking
    UPDATE public.subscriptions
    SET
        last_billed_date = p_billing_period_end,
        next_billing_date = v_next_billing,
        updated_at = now()
    WHERE id = p_subscription_id;

    RETURN jsonb_build_object(
        'success', true,
        'is_duplicate', false,
        'invoice_id', v_invoice_id,
        'invoice_number', v_invoice_number,
        'grand_total', v_sub.grand_total,
        'billing_period_start', p_billing_period_start,
        'billing_period_end', p_billing_period_end,
        'next_billing_date', v_next_billing
    );
END;
$$;

-- ==============================================================================
-- 8. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_notifications ENABLE ROW LEVEL SECURITY;

-- 8.1. INVOICES RLS
DROP POLICY IF EXISTS "Staff and Admins manage invoices" ON public.invoices;
CREATE POLICY "Staff and Admins manage invoices"
    ON public.invoices
    FOR ALL
    TO authenticated
    USING (public.is_staff_or_admin())
    WITH CHECK (public.is_staff_or_admin());

DROP POLICY IF EXISTS "Customers view own invoices" ON public.invoices;
CREATE POLICY "Customers view own invoices"
    ON public.invoices
    FOR SELECT
    TO authenticated
    USING (
        customer_id IN (
            SELECT id FROM public.customers WHERE profile_id = auth.uid()
        )
    );

-- 8.2. INVOICE LINES RLS
DROP POLICY IF EXISTS "Staff and Admins manage invoice lines" ON public.invoice_lines;
CREATE POLICY "Staff and Admins manage invoice lines"
    ON public.invoice_lines
    FOR ALL
    TO authenticated
    USING (public.is_staff_or_admin())
    WITH CHECK (public.is_staff_or_admin());

DROP POLICY IF EXISTS "Customers view own invoice lines" ON public.invoice_lines;
CREATE POLICY "Customers view own invoice lines"
    ON public.invoice_lines
    FOR SELECT
    TO authenticated
    USING (
        invoice_id IN (
            SELECT i.id FROM public.invoices i
            JOIN public.customers c ON i.customer_id = c.id
            WHERE c.profile_id = auth.uid()
        )
    );

-- 8.3. PAYMENTS RLS
DROP POLICY IF EXISTS "Staff and Admins manage payments" ON public.payments;
CREATE POLICY "Staff and Admins manage payments"
    ON public.payments
    FOR ALL
    TO authenticated
    USING (public.is_staff_or_admin())
    WITH CHECK (public.is_staff_or_admin());

DROP POLICY IF EXISTS "Customers view own payments" ON public.payments;
CREATE POLICY "Customers view own payments"
    ON public.payments
    FOR SELECT
    TO authenticated
    USING (
        customer_id IN (
            SELECT id FROM public.customers WHERE profile_id = auth.uid()
        )
    );

-- 8.4. EMAIL NOTIFICATIONS RLS
DROP POLICY IF EXISTS "Staff and Admins view email notifications" ON public.email_notifications;
CREATE POLICY "Staff and Admins view email notifications"
    ON public.email_notifications
    FOR ALL
    TO authenticated
    USING (public.is_staff_or_admin())
    WITH CHECK (public.is_staff_or_admin());

