-- Research Repository System - Supabase Schema
-- Run this in Supabase SQL Editor to set up the database

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum for user roles
CREATE TYPE user_role AS ENUM ('admin', 'researcher', 'viewer');

-- Create enum for research status
CREATE TYPE research_status AS ENUM ('pending', 'approved', 'rejected', 'published');

-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    role user_role DEFAULT 'viewer',
    full_name TEXT,
    institution TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Research categories table
CREATE TABLE public.research_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Research projects table
CREATE TABLE public.research_projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    abstract TEXT,
    category_id UUID REFERENCES public.research_categories(id),
    publication_year INTEGER NOT NULL,
    status research_status DEFAULT 'pending',
    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Research authors table (many-to-many)
CREATE TABLE public.research_authors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    research_id UUID REFERENCES public.research_projects(id) ON DELETE CASCADE,
    author_name TEXT NOT NULL,
    author_order INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Research keywords table
CREATE TABLE public.research_keywords (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    research_id UUID REFERENCES public.research_projects(id) ON DELETE CASCADE,
    keyword TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Research files table
CREATE TABLE public.research_files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    research_id UUID REFERENCES public.research_projects(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size BIGINT,
    uploaded_by UUID REFERENCES public.users(id),
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Downloads table
CREATE TABLE public.downloads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    research_id UUID REFERENCES public.research_projects(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id),
    downloaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address TEXT,
    user_agent TEXT
);

-- Reviews table
CREATE TABLE public.reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    research_id UUID REFERENCES public.research_projects(id) ON DELETE CASCADE,
    admin_id UUID REFERENCES public.users(id),
    comment TEXT NOT NULL,
    decision TEXT CHECK (decision IN ('approved', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User bookmarks table
CREATE TABLE IF NOT EXISTS public.bookmarks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    research_id UUID REFERENCES public.research_projects(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (user_id, research_id)
);

-- Saved searches table
CREATE TABLE IF NOT EXISTS public.saved_searches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    filters JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    related_research_id UUID REFERENCES public.research_projects(id) ON DELETE SET NULL,
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Co-author invites table
CREATE TABLE IF NOT EXISTS public.coauthor_invites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    research_id UUID REFERENCES public.research_projects(id) ON DELETE CASCADE,
    invited_by UUID REFERENCES public.users(id) ON DELETE CASCADE,
    invited_email TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    responded_at TIMESTAMP WITH TIME ZONE
);

-- Taxonomy keywords table
CREATE TABLE IF NOT EXISTS public.taxonomy_keywords (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    keyword TEXT UNIQUE NOT NULL,
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Alert subscriptions table
CREATE TABLE IF NOT EXISTS public.alert_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    scope TEXT NOT NULL CHECK (scope IN ('category', 'keyword')),
    value TEXT NOT NULL,
    channel TEXT NOT NULL DEFAULT 'in_app' CHECK (channel IN ('in_app', 'email')),
    enabled BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (user_id, scope, value, channel)
);

-- Security/audit events table
CREATE TABLE IF NOT EXISTS public.audit_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT,
    severity TEXT NOT NULL DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'critical')),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('research-files', 'research-files', true);

-- Storage policies
CREATE POLICY "Public Access for research-files"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'research-files');

CREATE POLICY "Authenticated users can upload to research-files"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'research-files' AND auth.role() IN ('authenticated'));

-- Row Level Security Policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.research_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.research_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.research_authors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.research_keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.research_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.downloads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coauthor_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.taxonomy_keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alert_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_events ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view all users"
    ON public.users FOR SELECT
    USING (true);

CREATE POLICY "Users can update own profile"
    ON public.users FOR UPDATE
    USING (auth.uid() = id);

-- Research projects policies
CREATE POLICY "Anyone can view approved/published research"
    ON public.research_projects FOR SELECT
    USING (status IN ('approved', 'published'));

CREATE POLICY "Researchers can create research"
    ON public.research_projects FOR INSERT
    WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Researchers can update own research"
    ON public.research_projects FOR UPDATE
    USING (auth.uid() = created_by);

CREATE POLICY "Admins can update any research"
    ON public.research_projects FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Research categories policies
CREATE POLICY "Anyone can view categories"
    ON public.research_categories FOR SELECT
    USING (true);

-- Research authors policies
CREATE POLICY "Anyone can view authors"
    ON public.research_authors FOR SELECT
    USING (true);

CREATE POLICY "Researchers can manage authors"
    ON public.research_authors FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.research_projects rp
            JOIN public.users u ON u.id = rp.created_by
            WHERE rp.id = research_id AND u.id = auth.uid()
        ) OR EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Research keywords policies
CREATE POLICY "Anyone can view keywords"
    ON public.research_keywords FOR SELECT
    USING (true);

-- Research files policies
CREATE POLICY "Anyone can view file metadata"
    ON public.research_files FOR SELECT
    USING (true);

CREATE POLICY "Researchers can manage files"
    ON public.research_files FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.research_projects rp
            JOIN public.users u ON u.id = rp.created_by
            WHERE rp.id = research_id AND u.id = auth.uid()
        ) OR EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Downloads policies
CREATE POLICY "Anyone can view downloads"
    ON public.downloads FOR SELECT
    USING (true);

CREATE POLICY "Users can create downloads"
    ON public.downloads FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Reviews policies
CREATE POLICY "Anyone can view reviews"
    ON public.reviews FOR SELECT
    USING (true);

CREATE POLICY "Admins can create reviews"
    ON public.reviews FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, role, full_name)
    VALUES (
        NEW.id,
        NEW.email,
        CASE
            WHEN (NEW.raw_user_meta_data->>'role') IN ('admin', 'researcher', 'viewer')
                THEN (NEW.raw_user_meta_data->>'role')::user_role
            ELSE 'viewer'::user_role
        END,
        NEW.raw_user_meta_data->>'full_name'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Bookmarks policies
CREATE POLICY "Users can view own bookmarks"
    ON public.bookmarks FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create own bookmarks"
    ON public.bookmarks FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own bookmarks"
    ON public.bookmarks FOR DELETE
    USING (auth.uid() = user_id);

-- Saved searches policies
CREATE POLICY "Users can view own saved searches"
    ON public.saved_searches FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create own saved searches"
    ON public.saved_searches FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own saved searches"
    ON public.saved_searches FOR DELETE
    USING (auth.uid() = user_id);

-- Notifications policies
CREATE POLICY "Users can view own notifications"
    ON public.notifications FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
    ON public.notifications FOR UPDATE
    USING (auth.uid() = user_id);

-- Co-author invites policies
CREATE POLICY "Users can view invites by ownership or email"
    ON public.coauthor_invites FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.research_projects rp
            WHERE rp.id = research_id AND (rp.created_by = auth.uid())
        )
        OR EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = auth.uid() AND lower(u.email) = lower(invited_email)
        )
    );

CREATE POLICY "Researchers and admins can create invites for own research"
    ON public.coauthor_invites FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.research_projects rp
            WHERE rp.id = research_id AND rp.created_by = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = auth.uid() AND u.role = 'admin'
        )
    );

CREATE POLICY "Invitees can update own invite status"
    ON public.coauthor_invites FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = auth.uid() AND lower(u.email) = lower(invited_email)
        )
    );

-- Taxonomy keyword policies
CREATE POLICY "Anyone can view taxonomy keywords"
    ON public.taxonomy_keywords FOR SELECT
    USING (true);

CREATE POLICY "Admins can manage taxonomy keywords"
    ON public.taxonomy_keywords FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Alert subscriptions policies
CREATE POLICY "Users can view own alert subscriptions"
    ON public.alert_subscriptions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create own alert subscriptions"
    ON public.alert_subscriptions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own alert subscriptions"
    ON public.alert_subscriptions FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own alert subscriptions"
    ON public.alert_subscriptions FOR DELETE
    USING (auth.uid() = user_id);

-- Audit events policies
CREATE POLICY "Admins can view audit events"
    ON public.audit_events FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update research status
CREATE OR REPLACE FUNCTION public.update_research_status(
    p_research_id UUID,
    p_status research_status,
    p_admin_id UUID,
    p_comment TEXT DEFAULT NULL
)
RETURNS void AS $$
BEGIN
    UPDATE public.research_projects
    SET status = p_status, updated_at = NOW()
    WHERE id = p_research_id;

    IF p_comment IS NOT NULL AND p_admin_id IS NOT NULL THEN
        INSERT INTO public.reviews (research_id, admin_id, comment, decision)
        VALUES (p_research_id, p_admin_id, p_comment, 
            CASE WHEN p_status = 'approved' THEN 'approved' ELSE 'rejected' END);
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get download count for research
CREATE OR REPLACE FUNCTION public.get_research_download_count(p_research_id UUID)
RETURNS BIGINT AS $$
DECLARE
    count_val BIGINT;
BEGIN
    SELECT COUNT(*) INTO count_val
    FROM public.downloads
    WHERE research_id = p_research_id;
    RETURN count_val;
END;
$$ LANGUAGE plpgsql;

-- Insert default categories
INSERT INTO public.research_categories (name, description) VALUES
    ('Computer Science', 'Research related to computer science and IT'),
    ('Engineering', 'Engineering research and technology'),
    ('Education', 'Educational research and pedagogy'),
    ('Agriculture', 'Agricultural science research'),
    ('Business', 'Business and management research'),
    ('Medicine', 'Medical and health research'),
    ('Physics', 'Physics and related sciences'),
    ('Chemistry', 'Chemistry and materials science'),
    ('Mathematics', 'Mathematical research'),
    ('Social Sciences', 'Social science research')
ON CONFLICT (name) DO NOTHING;

-- Avatar profile support (safe to run on existing projects)
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS avatar_url TEXT;

INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Public Access for avatars'
  ) THEN
    CREATE POLICY "Public Access for avatars"
      ON storage.objects FOR SELECT
      USING (bucket_id = 'avatars');
  END IF;
END
$$;

