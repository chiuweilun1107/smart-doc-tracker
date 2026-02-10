-- Enable RLS for all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deadline_events ENABLE ROW LEVEL SECURITY;

-- 1. Profiles Policy
-- Trigger to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if trigger exists before creating to avoid errors
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created') THEN
        CREATE TRIGGER on_auth_user_created
        AFTER INSERT ON auth.users
        FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
    END IF;
END $$;

-- Policies for Profiles
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own profile." ON public.profiles;
CREATE POLICY "Users can insert their own profile." ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile." ON public.profiles;
CREATE POLICY "Users can update own profile." ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- 2. Projects Policy
DROP POLICY IF EXISTS "Users can view own projects." ON public.projects;
CREATE POLICY "Users can view own projects." ON public.projects FOR SELECT USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Users can insert own projects." ON public.projects;
CREATE POLICY "Users can insert own projects." ON public.projects FOR INSERT WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Users can update own projects." ON public.projects;
CREATE POLICY "Users can update own projects." ON public.projects FOR UPDATE USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Users can delete own projects." ON public.projects;
CREATE POLICY "Users can delete own projects." ON public.projects FOR DELETE USING (auth.uid() = owner_id);

-- 3. Documents Policy (Linked via Project)
DROP POLICY IF EXISTS "Users can view documents of own projects." ON public.documents;
CREATE POLICY "Users can view documents of own projects." ON public.documents FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.projects WHERE id = public.documents.project_id AND owner_id = auth.uid())
);

DROP POLICY IF EXISTS "Users can insert documents to own projects." ON public.documents;
CREATE POLICY "Users can insert documents to own projects." ON public.documents FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.projects WHERE id = project_id AND owner_id = auth.uid())
);

DROP POLICY IF EXISTS "Users can delete documents of own projects." ON public.documents;
CREATE POLICY "Users can delete documents of own projects." ON public.documents FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.projects WHERE id = project_id AND owner_id = auth.uid())
);

-- 4. Deadline Events Policy (Linked via Document -> Project)
DROP POLICY IF EXISTS "Users can view events of own docs." ON public.deadline_events;
CREATE POLICY "Users can view events of own docs." ON public.deadline_events FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.documents d
    JOIN public.projects p ON d.project_id = p.id
    WHERE d.id = public.deadline_events.document_id AND p.owner_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can manage events of own docs." ON public.deadline_events;
CREATE POLICY "Users can manage events of own docs." ON public.deadline_events FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.documents d
    JOIN public.projects p ON d.project_id = p.id
    WHERE d.id = public.deadline_events.document_id AND p.owner_id = auth.uid()
  )
);
