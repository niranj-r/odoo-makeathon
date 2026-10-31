-- ==============================================================================
-- BRIGHTLOOP SUBSCRIPTION MANAGEMENT PLATFORM
-- Staff Management & Activity Logging Migration
-- ==============================================================================

-- 1. Ensure 'phone' column exists on profiles table for staff/user directory
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;

-- 2. Staff Activity & Audit Logs Table
CREATE TABLE IF NOT EXISTS public.staff_activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    staff_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL, -- 'customer', 'quotation', 'subscription', 'invoice', 'payment', 'profile'
    entity_id UUID,
    details JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_staff_activity_logs_staff_id ON public.staff_activity_logs(staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_activity_logs_entity ON public.staff_activity_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_staff_activity_logs_created_at ON public.staff_activity_logs(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE public.staff_activity_logs ENABLE ROW LEVEL SECURITY;

-- Staff and Admin can view activity logs
DROP POLICY IF EXISTS "Staff and Admin can view activity logs" ON public.staff_activity_logs;
CREATE POLICY "Staff and Admin can view activity logs"
    ON public.staff_activity_logs
    FOR SELECT TO authenticated
    USING (public.is_staff_or_admin());

-- Staff and Admin can insert activity logs
DROP POLICY IF EXISTS "Staff and Admin can insert activity logs" ON public.staff_activity_logs;
CREATE POLICY "Staff and Admin can insert activity logs"
    ON public.staff_activity_logs
    FOR INSERT TO authenticated
    WITH CHECK (public.is_staff_or_admin());

