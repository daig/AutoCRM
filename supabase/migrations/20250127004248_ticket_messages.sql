--- MESSAGES ---
-- Users can post messages to tickets
create table public.ticket_messages (
    id           uuid default uuid_generate_v4() primary key,
    ticket    uuid not null references public.tickets (id) on delete cascade,
    sender    uuid references public.users (id),
    content      text not null,
    created_at   timestamp with time zone default now()
); 

-- trigger for messages
create trigger trg_update_ticket_updated_at
    AFTER insert or update or delete on public.ticket_messages
    for each row
    execute function trigger.update_ticket_updated_at();