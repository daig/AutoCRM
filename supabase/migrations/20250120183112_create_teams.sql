CREATE TABLE public.teams (
    id          uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    name        text NOT NULL,
    description text,
    created_at  timestamp with time zone DEFAULT now(),
    updated_at  timestamp with time zone DEFAULT now()
);

-- Create user_teams junction table
CREATE TABLE public.user_teams (
    id          uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id     uuid REFERENCES public.users (id) ON DELETE CASCADE,
    team_id     uuid REFERENCES public.teams (id) ON DELETE CASCADE,
    is_team_lead boolean DEFAULT false NOT NULL,
    created_at  timestamp with time zone DEFAULT now(),
    UNIQUE(user_id, team_id)
);

-- Create unique index for team lead constraint
CREATE UNIQUE INDEX idx_unique_team_lead ON public.user_teams (team_id) WHERE is_team_lead = true;

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