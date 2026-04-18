-- Create profiles, events, tasks, reports, leads, content_library, roles_capacity tables

-- 1. roles_capacity
CREATE TABLE public.roles_capacity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  team TEXT NOT NULL,
  max_capacity INTEGER NOT NULL,
  current_count INTEGER NOT NULL DEFAULT 0,
  can_add_task BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO public.roles_capacity (role_id, display_name, team, max_capacity, can_add_task) VALUES
  ('events_manager', 'Events Manager', 'management', 2, true),
  ('pic_advertising', 'PIC Advertising', 'advertising', 1, true),
  ('pic_social_media', 'PIC Social Media', 'social_media', 1, true),
  ('pic_marketing', 'PIC Marketing', 'marketing', 1, true),
  ('admin_advertiser', 'Admin Advertiser', 'advertising', 1, false),
  ('web_developer', 'Web Developer', 'advertising', 1, false),
  ('senior_advertiser', 'Senior Advertiser', 'advertising', 2, true),
  ('video_editor', 'Video Editor', 'social_media', 3, false),
  ('graphic_designer', 'Graphic Designer', 'social_media', 1, false),
  ('social_media_handler', 'Social Media Handler', 'social_media', 1, false),
  ('marketing', 'Marketing', 'marketing', 3, false);

-- 2. profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  role_id TEXT REFERENCES public.roles_capacity(role_id),
  team TEXT,
  language TEXT DEFAULT 'id',
  theme TEXT DEFAULT 'dark',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. events
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  start_date DATE,
  end_date DATE,
  status TEXT NOT NULL DEFAULT 'upcoming',
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. tasks
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  assigned_team TEXT,
  assigned_to UUID[],
  priority TEXT NOT NULL DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'todo',
  due_date DATE,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. reports
CREATE TABLE public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  team TEXT,
  report_type TEXT,
  file_name TEXT,
  file_url TEXT,
  storage_path TEXT,
  uploaded_by UUID REFERENCES public.profiles(id),
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  row_count INTEGER,
  notes TEXT
);

-- 6. leads
CREATE TABLE public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID REFERENCES public.reports(id) ON DELETE CASCADE,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  date_received DATE,
  name TEXT,
  domicile TEXT,
  profession TEXT,
  data_status TEXT,
  follow_up_status TEXT,
  payment_amount NUMERIC NOT NULL DEFAULT 0,
  uploaded_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. content_library
CREATE TABLE public.content_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  title TEXT,
  file_url TEXT,
  storage_path TEXT,
  thumbnail_url TEXT,
  file_type TEXT,
  uploaded_by UUID REFERENCES public.profiles(id),
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  tags TEXT[]
);

-- Enable RLS on all
ALTER TABLE public.roles_capacity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_library ENABLE ROW LEVEL SECURITY;

-- Helper functions (security definer to avoid recursion)
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS TEXT
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT role_id FROM public.profiles WHERE id = _user_id $$;

CREATE OR REPLACE FUNCTION public.get_user_team(_user_id UUID)
RETURNS TEXT
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT team FROM public.profiles WHERE id = _user_id $$;

CREATE OR REPLACE FUNCTION public.user_can_add_task(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT COALESCE((
    SELECT rc.can_add_task
    FROM public.profiles p
    JOIN public.roles_capacity rc ON rc.role_id = p.role_id
    WHERE p.id = _user_id
  ), false)
$$;

-- RLS policies

-- roles_capacity: read-only for authenticated
CREATE POLICY "Authenticated read roles" ON public.roles_capacity FOR SELECT TO authenticated USING (true);
-- Allow anonymous read for signup page
CREATE POLICY "Anon read roles for signup" ON public.roles_capacity FOR SELECT TO anon USING (true);

-- profiles
CREATE POLICY "Profiles readable by authenticated" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- events
CREATE POLICY "Events readable by authenticated" ON public.events FOR SELECT TO authenticated USING (true);
CREATE POLICY "Events manager insert" ON public.events FOR INSERT TO authenticated WITH CHECK (public.get_user_role(auth.uid()) = 'events_manager');
CREATE POLICY "Events manager update" ON public.events FOR UPDATE TO authenticated USING (public.get_user_role(auth.uid()) = 'events_manager');
CREATE POLICY "Events manager delete" ON public.events FOR DELETE TO authenticated USING (public.get_user_role(auth.uid()) = 'events_manager');

-- tasks
CREATE POLICY "Tasks readable by authenticated" ON public.tasks FOR SELECT TO authenticated USING (true);
CREATE POLICY "Tasks insert by allowed roles" ON public.tasks FOR INSERT TO authenticated WITH CHECK (public.user_can_add_task(auth.uid()));
CREATE POLICY "Tasks update by allowed roles" ON public.tasks FOR UPDATE TO authenticated USING (public.user_can_add_task(auth.uid()));
CREATE POLICY "Tasks delete by allowed roles" ON public.tasks FOR DELETE TO authenticated USING (public.user_can_add_task(auth.uid()));

-- reports
CREATE POLICY "Reports readable by authenticated" ON public.reports FOR SELECT TO authenticated USING (true);
CREATE POLICY "Reports insert own team" ON public.reports FOR INSERT TO authenticated WITH CHECK (team = public.get_user_team(auth.uid()) AND uploaded_by = auth.uid());
CREATE POLICY "Reports update own" ON public.reports FOR UPDATE TO authenticated USING (uploaded_by = auth.uid());
CREATE POLICY "Reports delete own" ON public.reports FOR DELETE TO authenticated USING (uploaded_by = auth.uid());

-- leads
CREATE POLICY "Leads readable by authenticated" ON public.leads FOR SELECT TO authenticated USING (true);
CREATE POLICY "Leads insert by uploader" ON public.leads FOR INSERT TO authenticated WITH CHECK (uploaded_by = auth.uid());
CREATE POLICY "Leads update by uploader" ON public.leads FOR UPDATE TO authenticated USING (uploaded_by = auth.uid());

-- content_library
CREATE POLICY "Content readable by authenticated" ON public.content_library FOR SELECT TO authenticated USING (true);
CREATE POLICY "Content insert by social media team" ON public.content_library FOR INSERT TO authenticated WITH CHECK (public.get_user_team(auth.uid()) = 'social_media' AND uploaded_by = auth.uid());
CREATE POLICY "Content update by uploader" ON public.content_library FOR UPDATE TO authenticated USING (uploaded_by = auth.uid());
CREATE POLICY "Content delete by uploader" ON public.content_library FOR DELETE TO authenticated USING (uploaded_by = auth.uid());

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER tasks_updated_at BEFORE UPDATE ON public.tasks
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Signup helper: atomically reserve a slot and create the profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_role_id TEXT;
  v_full_name TEXT;
  v_team TEXT;
  v_max INT;
  v_current INT;
BEGIN
  v_role_id := NEW.raw_user_meta_data->>'role_id';
  v_full_name := NEW.raw_user_meta_data->>'full_name';

  IF v_role_id IS NULL THEN
    RAISE EXCEPTION 'role_id is required';
  END IF;

  -- Lock the role row and check capacity
  SELECT team, max_capacity, current_count
    INTO v_team, v_max, v_current
  FROM public.roles_capacity
  WHERE role_id = v_role_id
  FOR UPDATE;

  IF v_team IS NULL THEN
    RAISE EXCEPTION 'invalid role_id: %', v_role_id;
  END IF;

  IF v_current >= v_max THEN
    RAISE EXCEPTION 'role_full';
  END IF;

  -- Increment capacity
  UPDATE public.roles_capacity
  SET current_count = current_count + 1
  WHERE role_id = v_role_id;

  -- Create profile
  INSERT INTO public.profiles (id, email, full_name, role_id, team)
  VALUES (NEW.id, NEW.email, v_full_name, v_role_id, v_team);

  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();