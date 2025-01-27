-- tickets can be assigned tags grouped by exclusive types
CREATE TABLE public.tag_types (
    id          uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    name        text NOT NULL UNIQUE CHECK (length(name) BETWEEN 1 AND 50),
    description text CHECK (length(description) <= 500)
);

CREATE TABLE public.tags (
    id          uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    type_id     uuid NOT NULL REFERENCES public.tag_types (id) ON DELETE CASCADE,
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

-- Trigger for tags
CREATE TRIGGER update_ticket_timestamp_tags
    AFTER INSERT OR UPDATE OR DELETE ON public.ticket_tags
    FOR EACH ROW
    EXECUTE FUNCTION update_ticket_updated_at();