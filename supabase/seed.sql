-- Seed data for AutoCRM

-- Insert default tag types and tags
INSERT INTO public.tag_types (name, description) 
VALUES 
    ('status', 'Ticket status indicators'),
    ('priority', 'Priority level indicators');

INSERT INTO public.tags (type_id, name, description)
VALUES 
    -- Status tags
    ((SELECT id FROM tag_types WHERE name = 'status'), 'open', 'Ticket is new and needs attention'),
    ((SELECT id FROM tag_types WHERE name = 'status'), 'pending', 'Ticket is awaiting response or action'),
    ((SELECT id FROM tag_types WHERE name = 'status'), 'resolved', 'Issue has been resolved'),
    ((SELECT id FROM tag_types WHERE name = 'status'), 'closed', 'Ticket has been closed'),
    -- Priority tags
    ((SELECT id FROM tag_types WHERE name = 'priority'), 'low', 'Non-urgent issues that can be addressed during normal operations'),
    ((SELECT id FROM tag_types WHERE name = 'priority'), 'medium', 'Important issues requiring attention within standard timeframes'),
    ((SELECT id FROM tag_types WHERE name = 'priority'), 'high', 'Urgent issues requiring prompt attention'),
    ((SELECT id FROM tag_types WHERE name = 'priority'), 'urgent', 'Critical issues requiring immediate attention');

-- Insert default metadata field types
INSERT INTO public.ticket_metadata_field_types (name, value_type, description)
VALUES 
    ('customer', 'user', 'User who created/owns this ticket'),
    ('assigned', 'user', 'User assigned to handle this ticket'),
    ('due_date', 'date', 'Date by which this ticket should be resolved'),
    ('estimated_hours', 'natural number', 'Estimated hours to resolve this ticket'),
    ('cost', 'fractional number', 'Estimated cost to resolve this ticket'),
    ('notes', 'text', 'Additional text notes about the ticket'),
    ('is_billable', 'boolean', 'Whether this ticket is billable to the customer'),
    ('last_activity', 'timestamp', 'Timestamp of the last activity on this ticket'),
    ('blocked_by', 'ticket', 'Reference to a ticket that is blocking this one'); 

-- Insert people records for existing auth.users
INSERT INTO public.users (id, full_name, role)
SELECT 
    id,
    raw_user_meta_data->>'full_name' as full_name,
    'customer'::public.user_role as role
FROM auth.users
ON CONFLICT (id) DO NOTHING;