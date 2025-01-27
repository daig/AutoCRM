--- TICKETS ---

-- create a default namespace for v5 UUIDs
create or replace function gen_namespace_v5()
returns uuid as $$
begin
    -- Using a fixed string to generate a consistent namespace uuid
    return uuid_generate_v5(uuid_nil(), 'autocrm.default.namespace');
end;
$$ language plpgsql immutable;

-- create a function to generate the triage team ID
create or replace function get_triage_team_id()
returns uuid as $$
begin
    -- Using the namespace to generate a consistent uuid for the triage team
    return uuid_generate_v5(gen_namespace_v5(), 'triage.team');
end;
$$ language plpgsql immutable;

-- insert the triage team if it doesn't exist
insert into public.teams (id, name, description)
values (get_triage_team_id(), 'Triage', 'default team for new tickets')
on conflict (id) do nothing;

create table public.tickets (
    id            uuid default uuid_generate_v4() primary key,
    title         text not null,
    description   text,
    team          uuid not null default get_triage_team_id() references public.teams(id) on delete set default,
    creator       uuid not null default auth.uid() references public.users(id),
    created_at    timestamp with time zone default now(),
    updated_at    timestamp with time zone default now()
);

--- TRIGGERS ---
create or replace function trigger.update_ticket_updated_at()
returns trigger as $$
begin
    if TG_TABLE_NAME = 'tickets' then
        NEW.updated_at = now();
        return NEW;
    else
        -- for related tables, update the referenced ticket
        update public.tickets 
        set updated_at = now() 
        where id = NEW.ticket;
        return NEW;
    end if;
end;
$$ language plpgsql;

create trigger update_ticket_timestamp
    before update on public.tickets
    for each row
    execute function trigger.update_ticket_updated_at();