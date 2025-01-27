-- tickets can be assigned tags grouped by exclusive types
create table public.tag_types (
    id          uuid default uuid_generate_v4() primary key,
    name        text not null unique check (length(name) BETWEEN 1 AND 50),
    description text check (length(description) <= 500)
);

create table public.tags (
    id          uuid default uuid_generate_v4() primary key,
    type_id     uuid not null references public.tag_types (id) on delete cascade,
    name        text not null check (length(name) BETWEEN 1 AND 50),
    description text check (length(description) <= 500),
    unique (type_id, name)
);

create table public.ticket_tags (
    ticket     uuid not null references public.tickets (id) on delete cascade,
    tag   uuid not null references public.tags (id) on delete cascade,
    created_at    timestamp with time zone default now(),
    primary key (ticket, tag)
);

-- create a function to validate one tag per type per ticket
create or replace function trigger.validate_one_tag_per_type()
returns trigger as $$
begin
    -- check if ticket already has a tag of the same type
    if EXISTS (
        SELECT 1
        FROM public.ticket_tags tt
        JOIN public.tags t1 on tt.tag = t1.id
        JOIN public.tags t2 on t2.id = NEW.tag
        where tt.ticket = NEW.ticket
        AND t1.type_id = t2.type_id
        AND tt.tag != NEW.tag
    ) then
        RAISE EXCEPTION 'Ticket already has a tag of this type';
    end if;
    return NEW;
end;
$$ language plpgsql;

-- create trigger to enforce one tag per type per ticket
create trigger enforce_one_tag_per_type
    before insert or update on public.ticket_tags
    for each row
    execute function trigger.validate_one_tag_per_type();

-- Tag-related indexes
-- Speeds up finding all tags of a specific type (e.g., "show me all priority tags")
create index idx_tags_type_id     on public.tags (type_id);
-- Enables fast tag search by name across all types (e.g., "find tags containing 'urgent'")
create index idx_tags_name        on public.tags (name);
-- Complements the primary key (ticket, tag) to quickly find all tickets with a specific tag
create index idx_ticket_tags_tag  on public.ticket_tags (tag);

-- trigger for tags
create trigger update_ticket_timestamp_tags
    AFTER insert or update or delete on public.ticket_tags
    for each row
    execute function trigger.update_ticket_updated_at();