--- TICKETS ---

-- Create a default namespace for v5 UUIDs
CREATE OR REPLACE FUNCTION gen_namespace_v5()
RETURNS uuid AS $$
BEGIN
    -- Using a fixed string to generate a consistent namespace UUID
    RETURN uuid_generate_v5(uuid_nil(), 'autocrm.default.namespace');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create a function to generate the triage team ID
CREATE OR REPLACE FUNCTION get_triage_team_id()
RETURNS uuid AS $$
BEGIN
    -- Using the namespace to generate a consistent UUID for the triage team
    RETURN uuid_generate_v5(gen_namespace_v5(), 'triage.team');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Insert the triage team if it doesn't exist
INSERT INTO public.teams (id, name, description)
VALUES (get_triage_team_id(), 'Triage', 'Default team for new tickets')
ON CONFLICT (id) DO NOTHING;

CREATE TABLE public.tickets (
    id            uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    title         text NOT NULL,
    description   text,
    team          uuid NOT NULL DEFAULT get_triage_team_id() REFERENCES public.teams(id) ON DELETE SET DEFAULT,
    creator       uuid NOT NULL DEFAULT auth.uid() REFERENCES public.users(id),
    created_at    timestamp with time zone DEFAULT now(),
    updated_at    timestamp with time zone DEFAULT now()
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

CREATE TRIGGER update_ticket_timestamp
    BEFORE UPDATE ON public.tickets
    FOR EACH ROW
    EXECUTE FUNCTION update_ticket_updated_at();