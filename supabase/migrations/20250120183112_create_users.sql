-- Create user role type
CREATE TYPE public.user_role AS ENUM ('administrator', 'agent', 'customer');

-- Create new users table
CREATE TABLE public.users (
    id          uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name   text,
    role        public.user_role DEFAULT 'customer'::public.user_role NOT NULL,
    team_id     uuid REFERENCES public.teams(id),
    is_team_lead boolean DEFAULT false NOT NULL,
    created_at  timestamp with time zone DEFAULT now()
);

-- Create unique index for team lead constraint
CREATE UNIQUE INDEX idx_unique_team_lead ON public.users (team_id) WHERE is_team_lead = true;

-- Create a trigger to automatically create a public.users record when auth.users is created
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, full_name)
    VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
