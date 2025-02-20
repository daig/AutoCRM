-- create user role type
create TYPE user_role as ENUM ('administrator', 'agent', 'customer');

-- create new users table
create table users (
    id          uuid primary key references auth.users(id) on delete cascade,
    full_name   text,
    role        user_role default 'customer'::user_role not null,
    team_id     uuid references teams(id),
    is_team_lead boolean default false not null,
    created_at  timestamp with time zone default now()
);

-- create unique index for team lead constraint
create unique index idx_unique_team_lead on users (team_id) where is_team_lead = true;

-- create a trigger to automatically create a public.users record when auth.users is created
create or replace function public.handle_new_user()
returns trigger as $$
begin
    insert into users (id, full_name)
    values (NEW.id, NEW.raw_user_meta_data->>'full_name');
    return NEW;
end;
$$ language plpgsql SECURITY DEFINER;

create trigger trg_handle_new_user
    after insert on auth.users
    for each row
    execute function public.handle_new_user();
