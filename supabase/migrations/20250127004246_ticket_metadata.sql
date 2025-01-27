-- tickets can be assigned key-value metadata fields
create TYPE public.metadata_value_type as ENUM (
    'text',
    'natural number',
    'fractional number',
    'boolean',
    'date',
    'timestamp',
    'user',
    'ticket'
);

create table public.ticket_metadata_field_types (
    id          uuid default uuid_generate_v4() primary key,
    name        text not null unique check (length(name) BETWEEN 1 AND 50),
    value_type  public.metadata_value_type not null,
    description text check (length(description) <= 500)
);

-- Metadata field type indexes
-- Enables quick filtering of field types by their value type (e.g., "show me all date fields")
create index idx_metadata_field_types_value_type on public.ticket_metadata_field_types (value_type);

create table public.ticket_metadata (
    id              uuid default uuid_generate_v4() primary key,
    ticket          uuid not null references public.tickets (id) on delete cascade,
    field_type      uuid not null references public.ticket_metadata_field_types (id) on delete cascade,
    field_value_text text,
    field_value_int integer check (field_value_int >= 0),
    field_value_float double precision,
    field_value_bool boolean,
    field_value_date date,
    field_value_timestamp timestamp with time zone,
    field_value_user uuid references public.users (id),
    field_value_ticket uuid references public.tickets (id),
    created_at      timestamp with time zone default now(),
    updated_at      timestamp with time zone default now(),
    unique (ticket, field_type),
    -- Ensure exactly one value type is set based on the field_type's value_type
    constraint one_value_type_set check (
        (case when field_value_text IS not null then 1 else 0 end +
         case when field_value_int IS not null then 1 else 0 end +
         case when field_value_float IS not null then 1 else 0 end +
         case when field_value_bool IS not null then 1 else 0 end +
         case when field_value_date IS not null then 1 else 0 end +
         case when field_value_timestamp IS not null then 1 else 0 end +
         case when field_value_user IS not null then 1 else 0 end +
         case when field_value_ticket IS not null then 1 else 0 end) = 1
    )
);

-- Core metadata indexes
-- Enables efficient time-based queries (e.g., "find the 30 most recently updated tickets")
create index idx_ticket_metadata_created_at on public.ticket_metadata (created_at);
create index idx_ticket_metadata_updated_at on public.ticket_metadata (updated_at);

-- Type-specific partial indexes
-- These indexes only include rows where the specific value type is not null
-- This makes them smaller and more efficient than full column indexes
-- each index optimizes queries filtering by that specific value type

-- for text search in metadata (e.g., "find tickets where text field contains 'xyz'")
create index idx_ticket_metadata_text on public.ticket_metadata (field_value_text) where field_value_text IS not null;
-- for numeric range queries (e.g., "find tickets where priority > 5")
create index idx_ticket_metadata_int on public.ticket_metadata (field_value_int) where field_value_int IS not null;
-- for decimal number ranges (e.g., "find tickets with score between 0.8 and 1.0")
create index idx_ticket_metadata_float on public.ticket_metadata (field_value_float) where field_value_float IS not null;
-- for boolean filters (e.g., "find all tickets where 'is_resolved' is true")
create index idx_ticket_metadata_bool on public.ticket_metadata (field_value_bool) where field_value_bool IS not null;
-- for date-based filtering (e.g., "find tickets due on specific date")
create index idx_ticket_metadata_date on public.ticket_metadata (field_value_date) where field_value_date IS not null;
-- for timestamp-based queries (e.g., "find tickets with activity in last hour")
create index idx_ticket_metadata_timestamp on public.ticket_metadata (field_value_timestamp) where field_value_timestamp IS not null;
-- for finding tickets linked to specific users (e.g., "show tickets assigned to user X")
create index idx_ticket_metadata_user on public.ticket_metadata (field_value_user) where field_value_user IS not null;
-- for finding tickets with references to other tickets (e.g., "find all blockers of ticket X")
create index idx_ticket_metadata_ticket_ref on public.ticket_metadata (field_value_ticket) where field_value_ticket IS not null;

-- add GIN index for trigram search on text metadata values
create index idx_ticket_metadata_text_trigram on public.ticket_metadata USING GIN (field_value_text gin_trgm_ops) where field_value_text IS not null;

--= Triggers =--

-- validate field value type matches the field type
create or replace function validate_metadata_field_value()
returns trigger as $$
begin
    -- Get the value_type for this field
    DECLARE
        field_value_type text;
    begin
        SELECT value_type into field_value_type
        FROM ticket_metadata_field_types
        where id = NEW.field_type;

        -- Validate that the correct field is set based on value_type
        case field_value_type
            when 'text' then
                if NEW.field_value_text IS null then
                    RAISE EXCEPTION 'field_value_text must be set for text fields';
                end if;
            when 'natural number' then
                if NEW.field_value_int IS null then
                    RAISE EXCEPTION 'field_value_int must be set for natural number fields';
                end if;
            when 'fractional number' then
                if NEW.field_value_float IS null then
                    RAISE EXCEPTION 'field_value_float must be set for fractional number fields';
                end if;
            when 'boolean' then
                if NEW.field_value_bool IS null then
                    RAISE EXCEPTION 'field_value_bool must be set for boolean fields';
                end if;
            when 'date' then
                if NEW.field_value_date IS null then
                    RAISE EXCEPTION 'field_value_date must be set for date fields';
                end if;
            when 'timestamp' then
                if NEW.field_value_timestamp IS null then
                    RAISE EXCEPTION 'field_value_timestamp must be set for timestamp fields';
                end if;
            when 'user' then
                if NEW.field_value_user IS null then
                    RAISE EXCEPTION 'field_value_user must be set for user reference fields';
                end if;
            when 'ticket' then
                if NEW.field_value_ticket IS null then
                    RAISE EXCEPTION 'field_value_ticket must be set for ticket reference fields';
                end if;
        end case;
    end;
    
    return NEW;
end;
$$ language plpgsql;

create trigger validate_metadata_field_value_trigger
    before insert or update on ticket_metadata
    for each row
    execute function validate_metadata_field_value();

create trigger update_ticket_timestamp_metadata
    AFTER insert or update or delete on public.ticket_metadata
    for each row
    execute function update_ticket_updated_at();