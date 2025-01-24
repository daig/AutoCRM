-- Create user role type
CREATE TYPE public.user_role AS ENUM ('administrator', 'agent', 'customer');

-- Create new users table
CREATE TABLE public.users (
    id          uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name   text,
    role        public.user_role DEFAULT 'customer'::public.user_role NOT NULL,
    created_at  timestamp with time zone DEFAULT now(),
);

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

-- Create user_teams junction table
CREATE TABLE public.user_teams (
    id          uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id     uuid REFERENCES public.users (id) ON DELETE CASCADE,
    team_id     uuid REFERENCES public.teams (id) ON DELETE CASCADE,
    is_team_lead boolean DEFAULT false NOT NULL,
    created_at  timestamp with time zone DEFAULT now(),
    UNIQUE(user_id, team_id),
    UNIQUE(team_id) WHERE (is_team_lead = true)
);

-- Create trigger function to update teams.updated_at
CREATE OR REPLACE FUNCTION public.handle_user_teams_change()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        UPDATE public.teams SET updated_at = now() WHERE id = OLD.team_id;
    ELSE
        UPDATE public.teams SET updated_at = now() WHERE id = NEW.team_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for user_teams changes
CREATE TRIGGER on_user_teams_change
    AFTER INSERT OR UPDATE OR DELETE ON public.user_teams
    FOR EACH ROW EXECUTE FUNCTION public.handle_user_teams_change(); 