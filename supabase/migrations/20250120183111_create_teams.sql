CREATE TABLE public.teams (
    id          uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    name        text NOT NULL,
    description text,
    created_at  timestamp with time zone DEFAULT now(),
    updated_at  timestamp with time zone DEFAULT now()
); 