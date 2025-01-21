-- Create new users table
CREATE TABLE public.users (
    id          uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
    full_name   text,
    created_at  timestamp with time zone DEFAULT now(),
    updated_at  timestamp with time zone DEFAULT now()
);

-- Create user_teams junction table
CREATE TABLE public.user_teams (
    id          uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id     uuid REFERENCES public.users (id) ON DELETE CASCADE,
    team_id     uuid REFERENCES public.teams (id) ON DELETE CASCADE,
    created_at  timestamp with time zone DEFAULT now(),
    UNIQUE(user_id, team_id)
); 