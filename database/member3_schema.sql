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

