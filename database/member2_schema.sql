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

