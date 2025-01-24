--- TICKETS ---

CREATE TABLE public.tickets (
    id            uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    title         text NOT NULL,
    description   text,
    team          uuid REFERENCES public.teams(id),
    creator       uuid NOT NULL DEFAULT auth.uid() REFERENCES public.users(id),
    created_at    timestamp with time zone DEFAULT now(),
    updated_at    timestamp with time zone DEFAULT now()
);




--- TAGS ---

-- tickets can be assigned tags grouped by exclusive types
CREATE TABLE public.tag_types (
    id          uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    name        text NOT NULL UNIQUE CHECK (length(name) BETWEEN 1 AND 50),
    description text CHECK (length(description) <= 500)
);

CREATE TABLE public.tags (
    id          uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    type_id     uuid NOT NULL REFERENCES public.tag_types (id),
    name        text NOT NULL CHECK (length(name) BETWEEN 1 AND 50),
    description text CHECK (length(description) <= 500),
    UNIQUE (type_id, name)
);

CREATE TABLE public.ticket_tags (
    ticket     uuid NOT NULL REFERENCES public.tickets (id) ON DELETE CASCADE,
    tag   uuid NOT NULL REFERENCES public.tags (id) ON DELETE CASCADE,
    created_at    timestamp with time zone DEFAULT now(),
    PRIMARY KEY (ticket, tag)
);

-- Create a function to validate one tag per type per ticket
CREATE OR REPLACE FUNCTION validate_one_tag_per_type()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if ticket already has a tag of the same type
    IF EXISTS (
        SELECT 1
        FROM public.ticket_tags tt
        JOIN public.tags t1 ON tt.tag = t1.id
        JOIN public.tags t2 ON t2.id = NEW.tag
        WHERE tt.ticket = NEW.ticket
        AND t1.type_id = t2.type_id
        AND tt.tag != NEW.tag
    ) THEN
        RAISE EXCEPTION 'Ticket already has a tag of this type';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to enforce one tag per type per ticket
CREATE TRIGGER enforce_one_tag_per_type
    BEFORE INSERT OR UPDATE ON public.ticket_tags
    FOR EACH ROW
    EXECUTE FUNCTION validate_one_tag_per_type();

-- Tag-related indexes
-- Speeds up finding all tags of a specific type (e.g., "show me all priority tags")
CREATE INDEX idx_tags_type_id     ON public.tags (type_id);
-- Enables fast tag search by name across all types (e.g., "find tags containing 'urgent'")
CREATE INDEX idx_tags_name        ON public.tags (name);
-- Complements the primary key (ticket, tag) to quickly find all tickets with a specific tag
CREATE INDEX idx_ticket_tags_tag  ON public.ticket_tags (tag);

--- METADATA ---
-- tickets can be assigned key-value metadata fields
CREATE TYPE public.metadata_value_type AS ENUM (
    'text',
    'natural number',
    'fractional number',
    'boolean',
    'date',
    'timestamp',
    'user',
    'ticket'
);

-- Enable pg_trgm extension for trigram search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE public.ticket_metadata_field_types (
    id          uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    name        text NOT NULL UNIQUE CHECK (length(name) BETWEEN 1 AND 50),
    value_type  public.metadata_value_type NOT NULL,
    description text CHECK (length(description) <= 500)
);

-- Metadata field type indexes
-- Enables quick filtering of field types by their value type (e.g., "show me all date fields")
CREATE INDEX idx_metadata_field_types_value_type ON public.ticket_metadata_field_types (value_type);

CREATE TABLE public.ticket_metadata (
    id              uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    ticket          uuid NOT NULL REFERENCES public.tickets (id) ON DELETE CASCADE,
    field_type      uuid NOT NULL REFERENCES public.ticket_metadata_field_types (id),
    field_value_text text,
    field_value_int integer CHECK (field_value_int >= 0),
    field_value_float double precision,
    field_value_bool boolean,
    field_value_date date,
    field_value_timestamp timestamp with time zone,
    field_value_user uuid REFERENCES public.users (id),
    field_value_ticket uuid REFERENCES public.tickets (id),
    created_at      timestamp with time zone DEFAULT now(),
    updated_at      timestamp with time zone DEFAULT now(),
    UNIQUE (ticket, field_type),
    -- Ensure exactly one value type is set based on the field_type's value_type
    CONSTRAINT one_value_type_set CHECK (
        (CASE WHEN field_value_text IS NOT NULL THEN 1 ELSE 0 END +
         CASE WHEN field_value_int IS NOT NULL THEN 1 ELSE 0 END +
         CASE WHEN field_value_float IS NOT NULL THEN 1 ELSE 0 END +
         CASE WHEN field_value_bool IS NOT NULL THEN 1 ELSE 0 END +
         CASE WHEN field_value_date IS NOT NULL THEN 1 ELSE 0 END +
         CASE WHEN field_value_timestamp IS NOT NULL THEN 1 ELSE 0 END +
         CASE WHEN field_value_user IS NOT NULL THEN 1 ELSE 0 END +
         CASE WHEN field_value_ticket IS NOT NULL THEN 1 ELSE 0 END) = 1
    )
);

-- Core metadata indexes
-- Enables efficient time-based queries (e.g., "find the 30 most recently updated tickets")
CREATE INDEX idx_ticket_metadata_created_at ON public.ticket_metadata (created_at);
CREATE INDEX idx_ticket_metadata_updated_at ON public.ticket_metadata (updated_at);

-- Type-specific partial indexes
-- These indexes only include rows where the specific value type is not null
-- This makes them smaller and more efficient than full column indexes
-- Each index optimizes queries filtering by that specific value type

-- For text search in metadata (e.g., "find tickets where text field contains 'xyz'")
CREATE INDEX idx_ticket_metadata_text ON public.ticket_metadata (field_value_text) WHERE field_value_text IS NOT NULL;
-- For numeric range queries (e.g., "find tickets where priority > 5")
CREATE INDEX idx_ticket_metadata_int ON public.ticket_metadata (field_value_int) WHERE field_value_int IS NOT NULL;
-- For decimal number ranges (e.g., "find tickets with score between 0.8 and 1.0")
CREATE INDEX idx_ticket_metadata_float ON public.ticket_metadata (field_value_float) WHERE field_value_float IS NOT NULL;
-- For boolean filters (e.g., "find all tickets where 'is_resolved' is true")
CREATE INDEX idx_ticket_metadata_bool ON public.ticket_metadata (field_value_bool) WHERE field_value_bool IS NOT NULL;
-- For date-based filtering (e.g., "find tickets due on specific date")
CREATE INDEX idx_ticket_metadata_date ON public.ticket_metadata (field_value_date) WHERE field_value_date IS NOT NULL;
-- For timestamp-based queries (e.g., "find tickets with activity in last hour")
CREATE INDEX idx_ticket_metadata_timestamp ON public.ticket_metadata (field_value_timestamp) WHERE field_value_timestamp IS NOT NULL;
-- For finding tickets linked to specific users (e.g., "show tickets assigned to user X")
CREATE INDEX idx_ticket_metadata_user ON public.ticket_metadata (field_value_user) WHERE field_value_user IS NOT NULL;
-- For finding tickets with references to other tickets (e.g., "find all blockers of ticket X")
CREATE INDEX idx_ticket_metadata_ticket_ref ON public.ticket_metadata (field_value_ticket) WHERE field_value_ticket IS NOT NULL;

-- Add GIN index for trigram search on text metadata values
CREATE INDEX idx_ticket_metadata_text_trigram ON public.ticket_metadata USING GIN (field_value_text gin_trgm_ops) WHERE field_value_text IS NOT NULL;

-- validate field value type matches the field type
CREATE OR REPLACE FUNCTION validate_metadata_field_value()
RETURNS TRIGGER AS $$
BEGIN
    -- Get the value_type for this field
    DECLARE
        field_value_type text;
    BEGIN
        SELECT value_type INTO field_value_type
        FROM ticket_metadata_field_types
        WHERE id = NEW.field_type;

        -- Validate that the correct field is set based on value_type
        CASE field_value_type
            WHEN 'text' THEN
                IF NEW.field_value_text IS NULL THEN
                    RAISE EXCEPTION 'field_value_text must be set for text fields';
                END IF;
            WHEN 'natural number' THEN
                IF NEW.field_value_int IS NULL THEN
                    RAISE EXCEPTION 'field_value_int must be set for natural number fields';
                END IF;
            WHEN 'fractional number' THEN
                IF NEW.field_value_float IS NULL THEN
                    RAISE EXCEPTION 'field_value_float must be set for fractional number fields';
                END IF;
            WHEN 'boolean' THEN
                IF NEW.field_value_bool IS NULL THEN
                    RAISE EXCEPTION 'field_value_bool must be set for boolean fields';
                END IF;
            WHEN 'date' THEN
                IF NEW.field_value_date IS NULL THEN
                    RAISE EXCEPTION 'field_value_date must be set for date fields';
                END IF;
            WHEN 'timestamp' THEN
                IF NEW.field_value_timestamp IS NULL THEN
                    RAISE EXCEPTION 'field_value_timestamp must be set for timestamp fields';
                END IF;
            WHEN 'user' THEN
                IF NEW.field_value_user IS NULL THEN
                    RAISE EXCEPTION 'field_value_user must be set for user reference fields';
                END IF;
            WHEN 'ticket' THEN
                IF NEW.field_value_ticket IS NULL THEN
                    RAISE EXCEPTION 'field_value_ticket must be set for ticket reference fields';
                END IF;
        END CASE;
    END;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_metadata_field_value_trigger
    BEFORE INSERT OR UPDATE ON ticket_metadata
    FOR EACH ROW
    EXECUTE FUNCTION validate_metadata_field_value();

--- MESSAGES ---
-- Users can post messages to tickets
CREATE TABLE public.ticket_messages (
    id           uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    ticket    uuid NOT NULL REFERENCES public.tickets (id) ON DELETE CASCADE,
    sender    uuid REFERENCES public.users (id),
    content      text NOT NULL,
    created_at   timestamp with time zone DEFAULT now()
); 


--- TRIGGERS ---
CREATE OR REPLACE FUNCTION update_ticket_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_TABLE_NAME = 'tickets' THEN
        NEW.updated_at = now();
        RETURN NEW;
    ELSE
        -- For related tables, update the referenced ticket
        UPDATE public.tickets 
        SET updated_at = now() 
        WHERE id = (
            CASE TG_TABLE_NAME
                WHEN 'ticket_messages' THEN NEW.ticket
                WHEN 'ticket_tags' THEN NEW.ticket  
                WHEN 'ticket_metadata' THEN NEW.ticket
            END
        );
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Trigger for direct ticket updates
CREATE TRIGGER update_ticket_timestamp
    BEFORE UPDATE ON public.tickets
    FOR EACH ROW
    EXECUTE FUNCTION update_ticket_updated_at();

-- Trigger for messages
CREATE TRIGGER update_ticket_timestamp_messages
    AFTER INSERT OR UPDATE OR DELETE ON public.ticket_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_ticket_updated_at();

-- Trigger for tags
CREATE TRIGGER update_ticket_timestamp_tags
    AFTER INSERT OR UPDATE OR DELETE ON public.ticket_tags
    FOR EACH ROW
    EXECUTE FUNCTION update_ticket_updated_at();

-- Trigger for metadata
CREATE TRIGGER update_ticket_timestamp_metadata
    AFTER INSERT OR UPDATE OR DELETE ON public.ticket_metadata
    FOR EACH ROW
    EXECUTE FUNCTION update_ticket_updated_at();
