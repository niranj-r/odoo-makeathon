-- ==============================================================================
-- BRIGHTLOOP PHASE 4: TAX MANAGEMENT & PRODUCT-TAX MAPPING
-- Run this script in Supabase Dashboard -> SQL Editor
-- ==============================================================================

-- 1. Ensure UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Taxes Table
CREATE TABLE IF NOT EXISTS public.taxes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    rate_percentage NUMERIC(12, 2) NOT NULL CHECK (rate_percentage >= 0),
    computation_type TEXT NOT NULL DEFAULT 'percentage' CHECK (computation_type IN ('percentage', 'fixed')),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Ensure rate_percentage supports up to NUMERIC(12, 2) for higher fixed taxes (e.g. ₹1000+)
ALTER TABLE public.taxes ALTER COLUMN rate_percentage TYPE NUMERIC(12, 2);

-- Performance Indexes on taxes
CREATE INDEX IF NOT EXISTS idx_taxes_is_active ON public.taxes(is_active);
CREATE INDEX IF NOT EXISTS idx_taxes_computation_type ON public.taxes(computation_type);

-- Auto-update timestamp trigger on taxes
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_taxes_updated_at ON public.taxes;
CREATE TRIGGER trigger_taxes_updated_at
  BEFORE UPDATE ON public.taxes
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- 3. Product-Taxes Mapping Table
CREATE TABLE IF NOT EXISTS public.product_taxes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    tax_id UUID NOT NULL REFERENCES public.taxes(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(product_id, tax_id)
);

-- Performance Indexes on product_taxes
CREATE INDEX IF NOT EXISTS idx_product_taxes_product_id ON public.product_taxes(product_id);
CREATE INDEX IF NOT EXISTS idx_product_taxes_tax_id ON public.product_taxes(tax_id);

-- 4. Row Level Security (RLS) Policies
ALTER TABLE public.taxes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_taxes ENABLE ROW LEVEL SECURITY;

-- 4.1. Taxes Policies
DROP POLICY IF EXISTS "Public read active taxes" ON public.taxes;
CREATE POLICY "Public read active taxes"
  ON public.taxes
  FOR SELECT
  USING (is_active = true);

DROP POLICY IF EXISTS "Staff read taxes" ON public.taxes;
CREATE POLICY "Staff read taxes"
  ON public.taxes
  FOR SELECT
  TO authenticated
  USING (public.is_staff_or_admin());

DROP POLICY IF EXISTS "Admins manage taxes" ON public.taxes;
CREATE POLICY "Admins manage taxes"
  ON public.taxes
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 4.2. Product-Taxes Policies
DROP POLICY IF EXISTS "Public read product taxes" ON public.product_taxes;
CREATE POLICY "Public read product taxes"
  ON public.product_taxes
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Staff read product taxes" ON public.product_taxes;
CREATE POLICY "Staff read product taxes"
  ON public.product_taxes
  FOR SELECT
  TO authenticated
  USING (public.is_staff_or_admin());

DROP POLICY IF EXISTS "Admins manage product taxes" ON public.product_taxes;
CREATE POLICY "Admins manage product taxes"
  ON public.product_taxes
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 5. Schema Verification Query
SELECT 
  table_name, 
  column_name, 
  data_type 
FROM information_schema.columns 
WHERE table_name IN ('taxes', 'product_taxes')
ORDER BY table_name, ordinal_position;

