
--- MESSAGES ---
-- Users can post messages to tickets
CREATE TABLE public.ticket_messages (
    id           uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    ticket    uuid NOT NULL REFERENCES public.tickets (id) ON DELETE CASCADE,
    sender    uuid REFERENCES public.users (id),
    content      text NOT NULL,
    created_at   timestamp with time zone DEFAULT now()
); 

-- Trigger for messages
CREATE TRIGGER update_ticket_timestamp_messages
    AFTER INSERT OR UPDATE OR DELETE ON public.ticket_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_ticket_updated_at();