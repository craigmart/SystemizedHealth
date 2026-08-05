-- ============================================================
-- Systemized Health — Row Level Security (RLS) Hardening
-- Migration: 003_enable_rls_security.sql
-- Safe / Idempotent Execution
-- ============================================================

-- 1. Enable RLS on all existing public tables
ALTER TABLE IF EXISTS public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.client_demographics ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.discovery_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.coaching_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.coaching_notes ENABLE ROW LEVEL SECURITY;

ALTER TABLE IF EXISTS public.videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.video_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.video_keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.video_tasks ENABLE ROW LEVEL SECURITY;

ALTER TABLE IF EXISTS public.channel_monthly_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.eom_reports ENABLE ROW LEVEL SECURITY;

ALTER TABLE IF EXISTS public.holly_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.holly_daily_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.holly_fasting_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.holly_food_entries ENABLE ROW LEVEL SECURITY;

-- 2. Drop legacy / insecure unrestricted policies safely if table and policy exist
DO $$
BEGIN
    IF to_regclass('public.clients') IS NOT NULL THEN
        DROP POLICY IF EXISTS "Service role full access" ON public.clients;
    END IF;
    IF to_regclass('public.client_demographics') IS NOT NULL THEN
        DROP POLICY IF EXISTS "Service role full access" ON public.client_demographics;
    END IF;
    IF to_regclass('public.discovery_calls') IS NOT NULL THEN
        DROP POLICY IF EXISTS "Service role full access" ON public.discovery_calls;
    END IF;
    IF to_regclass('public.coaching_sessions') IS NOT NULL THEN
        DROP POLICY IF EXISTS "Service role full access" ON public.coaching_sessions;
    END IF;
    IF to_regclass('public.coaching_notes') IS NOT NULL THEN
        DROP POLICY IF EXISTS "Service role full access" ON public.coaching_notes;
    END IF;

    IF to_regclass('public.videos') IS NOT NULL THEN
        DROP POLICY IF EXISTS "Service role full access" ON public.videos;
    END IF;
    IF to_regclass('public.video_stats') IS NOT NULL THEN
        DROP POLICY IF EXISTS "Service role full access" ON public.video_stats;
    END IF;
    IF to_regclass('public.video_keywords') IS NOT NULL THEN
        DROP POLICY IF EXISTS "Service role full access" ON public.video_keywords;
    END IF;
    IF to_regclass('public.video_tasks') IS NOT NULL THEN
        DROP POLICY IF EXISTS "Service role full access" ON public.video_tasks;
    END IF;

    IF to_regclass('public.channel_monthly_stats') IS NOT NULL THEN
        DROP POLICY IF EXISTS "Allow service role full access on channel_monthly_stats" ON public.channel_monthly_stats;
    END IF;
    IF to_regclass('public.eom_reports') IS NOT NULL THEN
        DROP POLICY IF EXISTS "Allow service role full access on eom_reports" ON public.eom_reports;
    END IF;
END $$;

-- 3. Create Service Role Policies dynamically for whatever tables currently exist in public
DO $$
DECLARE
    t text;
BEGIN
    FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
        EXECUTE format('DROP POLICY IF EXISTS "service_role_all_%I" ON public.%I;', t, t);
        EXECUTE format('CREATE POLICY "service_role_all_%I" ON public.%I FOR ALL TO service_role USING (true) WITH CHECK (true);', t, t);
    END LOOP;
END $$;

-- 4. Create User-Level RLS Policies for HollyApp Client Tracking (if user_id / id column exists)
DO $$
BEGIN
    -- Holly Profiles
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'holly_profiles' AND column_name = 'user_id'
    ) THEN
        DROP POLICY IF EXISTS "Users can manage own profile" ON public.holly_profiles;
        CREATE POLICY "Users can manage own profile" ON public.holly_profiles FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
    ELSIF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'holly_profiles' AND column_name = 'id' AND data_type = 'uuid'
    ) THEN
        DROP POLICY IF EXISTS "Users can manage own profile" ON public.holly_profiles;
        CREATE POLICY "Users can manage own profile" ON public.holly_profiles FOR ALL TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
    END IF;

    -- Holly Daily Logs
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'holly_daily_logs' AND column_name = 'user_id'
    ) THEN
        DROP POLICY IF EXISTS "Users can manage own daily logs" ON public.holly_daily_logs;
        CREATE POLICY "Users can manage own daily logs" ON public.holly_daily_logs FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
    END IF;

    -- Holly Fasting Logs
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'holly_fasting_logs' AND column_name = 'user_id'
    ) THEN
        DROP POLICY IF EXISTS "Users can manage own fasting logs" ON public.holly_fasting_logs;
        CREATE POLICY "Users can manage own fasting logs" ON public.holly_fasting_logs FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
    END IF;

    -- Holly Food Entries
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'holly_food_entries' AND column_name = 'user_id'
    ) THEN
        DROP POLICY IF EXISTS "Users can manage own food entries" ON public.holly_food_entries;
        CREATE POLICY "Users can manage own food entries" ON public.holly_food_entries FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;
