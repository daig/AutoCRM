create table public.teams (
    id          uuid default uuid_generate_v4() primary key,
    name        text not null,
    description text,
    created_at  timestamp with time zone default now(),
    updated_at  timestamp with time zone default now()
); 