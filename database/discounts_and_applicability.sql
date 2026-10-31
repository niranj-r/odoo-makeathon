-- ==============================================================================
-- BRIGHTLOOP PHASE 5: DISCOUNT MANAGEMENT & APPLICABILITY MAPPING
-- Propose/Review before execution in Supabase Dashboard -> SQL Editor
-- ==============================================================================

-- 1. Ensure UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Discounts Table (Idempotent Definition)
CREATE TABLE IF NOT EXISTS public.discounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT NOT NULL UNIQUE,
    type TEXT NOT NULL CHECK (type IN ('percentage', 'fixed')),
    value NUMERIC(12, 2) NOT NULL CHECK (value > 0),
    min_quantity INTEGER DEFAULT 1 CHECK (min_quantity >= 1 OR min_quantity IS NULL),
    min_amount NUMERIC(12, 2) DEFAULT 0.00 CHECK (min_amount >= 0 OR min_amount IS NULL),
    start_date DATE,
    end_date DATE,
    max_usage INTEGER CHECK (max_usage > 0 OR max_usage IS NULL),
    current_usage INTEGER NOT NULL DEFAULT 0 CHECK (current_usage >= 0),
    applies_to TEXT NOT NULL DEFAULT 'all' CHECK (applies_to IN ('all', 'product', 'products', 'plan', 'plans', 'subscription')),
    target_id UUID,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Ensure check constraint supports both singular and plural forms for applicability
ALTER TABLE public.discounts DROP CONSTRAINT IF EXISTS discounts_applies_to_check;
ALTER TABLE public.discounts ADD CONSTRAINT discounts_applies_to_check 
  CHECK (applies_to IN ('all', 'product', 'products', 'plan', 'plans', 'subscription'));

-- Ensure min_quantity check
ALTER TABLE public.discounts DROP CONSTRAINT IF EXISTS discounts_min_quantity_check;
ALTER TABLE public.discounts ADD CONSTRAINT discounts_min_quantity_check 
  CHECK (min_quantity >= 1 OR min_quantity IS NULL);

-- Performance Indexes on discounts
CREATE INDEX IF NOT EXISTS idx_discounts_code ON public.discounts(code);
CREATE INDEX IF NOT EXISTS idx_discounts_is_active ON public.discounts(is_active);
CREATE INDEX IF NOT EXISTS idx_discounts_applies_to ON public.discounts(applies_to);
CREATE INDEX IF NOT EXISTS idx_discounts_dates ON public.discounts(start_date, end_date);

-- Auto-update updated_at timestamp trigger on discounts
DROP TRIGGER IF EXISTS trigger_discounts_updated_at ON public.discounts;
CREATE TRIGGER trigger_discounts_updated_at
  BEFORE UPDATE ON public.discounts
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- 3. Discount-Products Mapping Table (Many-to-Many Association)
CREATE TABLE IF NOT EXISTS public.discount_products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    discount_id UUID NOT NULL REFERENCES public.discounts(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(discount_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_discount_products_discount_id ON public.discount_products(discount_id);
CREATE INDEX IF NOT EXISTS idx_discount_products_product_id ON public.discount_products(product_id);

-- 4. Discount-Plans Mapping Table (Many-to-Many Association for Subscription Plans)
CREATE TABLE IF NOT EXISTS public.discount_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    discount_id UUID NOT NULL REFERENCES public.discounts(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES public.subscription_plans(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(discount_id, plan_id)
);

CREATE INDEX IF NOT EXISTS idx_discount_plans_discount_id ON public.discount_plans(discount_id);
CREATE INDEX IF NOT EXISTS idx_discount_plans_plan_id ON public.discount_plans(plan_id);

-- 5. Atomic Usage Increment Function (Safe under high concurrency)
CREATE OR REPLACE FUNCTION public.increment_discount_usage(target_discount_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rows_updated INTEGER;
BEGIN
  UPDATE public.discounts
  SET 
    current_usage = current_usage + 1,
    updated_at = timezone('utc'::text, now())
  WHERE id = target_discount_id
    AND is_active = true
    AND (max_usage IS NULL OR current_usage < max_usage)
    AND (start_date IS NULL OR start_date <= CURRENT_DATE)
    AND (end_date IS NULL OR end_date >= CURRENT_DATE);

  GET DIAGNOSTICS rows_updated = ROW_COUNT;
  RETURN rows_updated > 0;
END;
$$;

-- 6. Row Level Security (RLS) Policies
ALTER TABLE public.discounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discount_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discount_plans ENABLE ROW LEVEL SECURITY;

-- 6.1. Discounts Policies
DROP POLICY IF EXISTS "Public read active discounts" ON public.discounts;
CREATE POLICY "Public read active discounts"
  ON public.discounts
  FOR SELECT
  USING (is_active = true);

DROP POLICY IF EXISTS "Staff read discounts" ON public.discounts;
CREATE POLICY "Staff read discounts"
  ON public.discounts
  FOR SELECT
  TO authenticated
  USING (public.is_staff_or_admin());

DROP POLICY IF EXISTS "Admins manage discounts" ON public.discounts;
CREATE POLICY "Admins manage discounts"
  ON public.discounts
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 6.2. Discount-Products Policies
DROP POLICY IF EXISTS "Public read discount products" ON public.discount_products;
CREATE POLICY "Public read discount products"
  ON public.discount_products
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Staff read discount products" ON public.discount_products;
CREATE POLICY "Staff read discount products"
  ON public.discount_products
  FOR SELECT
  TO authenticated
  USING (public.is_staff_or_admin());

DROP POLICY IF EXISTS "Admins manage discount products" ON public.discount_products;
CREATE POLICY "Admins manage discount products"
  ON public.discount_products
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 6.3. Discount-Plans Policies
DROP POLICY IF EXISTS "Public read discount plans" ON public.discount_plans;
CREATE POLICY "Public read discount plans"
  ON public.discount_plans
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Staff read discount plans" ON public.discount_plans;
CREATE POLICY "Staff read discount plans"
  ON public.discount_plans
  FOR SELECT
  TO authenticated
  USING (public.is_staff_or_admin());

DROP POLICY IF EXISTS "Admins manage discount plans" ON public.discount_plans;
CREATE POLICY "Admins manage discount plans"
  ON public.discount_plans
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 7. Verification Query
SELECT 
  table_name, 
  column_name, 
  data_type 
FROM information_schema.columns 
WHERE table_name IN ('discounts', 'discount_products', 'discount_plans')
ORDER BY table_name, ordinal_position;

