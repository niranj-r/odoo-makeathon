-- ==============================================================================
-- BRIGHTLOOP PHASE 3: SUBSCRIPTION PLANS SCHEMA & SECURITY
-- Run this script in Supabase Dashboard -> SQL Editor
-- ==============================================================================

-- 1. Ensure UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create subscription_plans Table
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

-- 3. Idempotent Column Additions (in case table was previously created with older schema)
ALTER TABLE public.subscription_plans ADD COLUMN IF NOT EXISTS min_quantity INTEGER NOT NULL DEFAULT 1;
ALTER TABLE public.subscription_plans ADD COLUMN IF NOT EXISTS start_date DATE;
ALTER TABLE public.subscription_plans ADD COLUMN IF NOT EXISTS end_date DATE;
ALTER TABLE public.subscription_plans ADD COLUMN IF NOT EXISTS auto_close BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.subscription_plans ADD COLUMN IF NOT EXISTS allow_early_close BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE public.subscription_plans ADD COLUMN IF NOT EXISTS allow_pause BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.subscription_plans ADD COLUMN IF NOT EXISTS allow_renewal BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE public.subscription_plans ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

-- 4. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_subscription_plans_product_id ON public.subscription_plans(product_id);
CREATE INDEX IF NOT EXISTS idx_subscription_plans_is_active ON public.subscription_plans(is_active);
CREATE INDEX IF NOT EXISTS idx_subscription_plans_interval ON public.subscription_plans(billing_interval);

-- 5. Auto-Updating Timestamp Trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_subscription_plans_updated_at ON public.subscription_plans;
CREATE TRIGGER trigger_subscription_plans_updated_at
  BEFORE UPDATE ON public.subscription_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- 6. Enable Row Level Security (RLS)
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

-- 6.1. Public / Customers: Can read active plans
DROP POLICY IF EXISTS "Public read active plans" ON public.subscription_plans;
CREATE POLICY "Public read active plans"
  ON public.subscription_plans
  FOR SELECT
  USING (is_active = true);

-- 6.2. Staff: Can view all subscription plans
DROP POLICY IF EXISTS "Staff read subscription plans" ON public.subscription_plans;
CREATE POLICY "Staff read subscription plans"
  ON public.subscription_plans
  FOR SELECT
  TO authenticated
  USING (public.is_staff_or_admin());

-- 6.3. Admins: Full management privilege
DROP POLICY IF EXISTS "Admins manage subscription plans" ON public.subscription_plans;
CREATE POLICY "Admins manage subscription plans"
  ON public.subscription_plans
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 7. Verification Query (Inspect all active columns)
SELECT 
  column_name, 
  data_type, 
  column_default, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'subscription_plans'
ORDER BY ordinal_position;

