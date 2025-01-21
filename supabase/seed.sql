-- Seed data for AutoCRM

-- Insert default users
INSERT INTO auth.users (id, email) VALUES
    ('d0d4671c-d9de-4c23-8286-a5f2c6c8d1f7', 'alice@autocrm.com'),
    ('b0b4671c-d9de-4c23-8286-a5f2c6c8d1f8', 'bob@autocrm.com'),
    ('c0c4671c-d9de-4c23-8286-a5f2c6c8d1f9', 'carl@customer.com');

INSERT INTO public.users (id, full_name) VALUES
    ('d0d4671c-d9de-4c23-8286-a5f2c6c8d1f7', 'Alice Smith'),
    ('b0b4671c-d9de-4c23-8286-a5f2c6c8d1f8', 'Bob Johnson'),
    ('c0c4671c-d9de-4c23-8286-a5f2c6c8d1f9', 'Carl Wilson');

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
    ('cost', 'fractional number', 'Estimated cost to resolve this ticket');

-- Insert default tickets with proper UUIDs
WITH ticket_ids AS (
  SELECT 
    uuid_generate_v4() as ticket1_id,
    uuid_generate_v4() as ticket2_id,
    uuid_generate_v4() as ticket3_id
)
INSERT INTO public.tickets (id, title, description) 
SELECT ticket1_id, 'Server Performance Issues', 'Investigating slow response times in production environment'
FROM ticket_ids
UNION ALL
SELECT ticket2_id, 'New User Onboarding Flow', 'Design and implement improved user onboarding experience'
FROM ticket_ids
UNION ALL
SELECT ticket3_id, 'Bug: Login Page CSS', 'Fix styling issues on the login page for mobile devices'
FROM ticket_ids;

-- Add tags to tickets
INSERT INTO public.ticket_tags (ticket, tag)
SELECT t.id, tag.id
FROM public.tickets t
CROSS JOIN (
    SELECT id, name, type_id 
    FROM public.tags 
    WHERE (name = 'high' AND type_id = (SELECT id FROM tag_types WHERE name = 'priority'))
       OR (name = 'pending' AND type_id = (SELECT id FROM tag_types WHERE name = 'status'))
) tag
WHERE t.title = 'Server Performance Issues'
UNION ALL
SELECT t.id, tag.id
FROM public.tickets t
CROSS JOIN (
    SELECT id, name, type_id 
    FROM public.tags 
    WHERE (name = 'medium' AND type_id = (SELECT id FROM tag_types WHERE name = 'priority'))
       OR (name = 'open' AND type_id = (SELECT id FROM tag_types WHERE name = 'status'))
) tag
WHERE t.title = 'New User Onboarding Flow'
UNION ALL
SELECT t.id, tag.id
FROM public.tickets t
CROSS JOIN (
    SELECT id, name, type_id 
    FROM public.tags 
    WHERE (name = 'low' AND type_id = (SELECT id FROM tag_types WHERE name = 'priority'))
       OR (name = 'open' AND type_id = (SELECT id FROM tag_types WHERE name = 'status'))
) tag
WHERE t.title = 'Bug: Login Page CSS';

-- Add metadata to tickets
-- Assigned users
INSERT INTO public.ticket_metadata (ticket, field_type, field_value_user)
SELECT 
    t.id,
    ft.id,
    u.id
FROM public.tickets t
CROSS JOIN public.ticket_metadata_field_types ft
CROSS JOIN public.users u
WHERE ft.name = 'assigned'
AND (
    (t.title = 'Server Performance Issues' AND u.full_name = 'Bob Johnson') OR
    (t.title = 'New User Onboarding Flow' AND u.full_name = 'Alice Smith') OR
    (t.title = 'Bug: Login Page CSS' AND u.full_name = 'Bob Johnson')
);

-- Due dates
INSERT INTO public.ticket_metadata (ticket, field_type, field_value_date)
SELECT 
    t.id,
    ft.id,
    CASE 
        WHEN t.title = 'Server Performance Issues' THEN CURRENT_DATE + INTERVAL '2 days'
        WHEN t.title = 'New User Onboarding Flow' THEN CURRENT_DATE + INTERVAL '5 days'
        WHEN t.title = 'Bug: Login Page CSS' THEN CURRENT_DATE + INTERVAL '3 days'
    END
FROM public.tickets t
CROSS JOIN public.ticket_metadata_field_types ft
WHERE ft.name = 'due_date'
AND t.title IN ('Server Performance Issues', 'New User Onboarding Flow', 'Bug: Login Page CSS');

-- Add messages to tickets
INSERT INTO public.ticket_messages (ticket, sender, content)
SELECT 
    t.id,
    u.id,
    m.content
FROM public.tickets t
CROSS JOIN (
    VALUES 
        ('Server Performance Issues', 'Bob Johnson', 'Initial investigation shows high CPU usage during peak hours.'),
        ('Server Performance Issues', 'Alice Smith', 'I noticed memory usage is also spiking. Could be a memory leak.'),
        ('Server Performance Issues', 'Bob Johnson', 'Good catch. I''ll check the application logs for memory-related issues.'),
        ('New User Onboarding Flow', 'Alice Smith', 'Started wireframing the new flow. Will share designs tomorrow.'),
        ('New User Onboarding Flow', 'Bob Johnson', 'Remember to include email verification step in the flow.'),
        ('Bug: Login Page CSS', 'Bob Johnson', 'Confirmed the issue on iPhone and Android devices.'),
        ('Bug: Login Page CSS', 'Alice Smith', 'The problem seems to be with the media queries. Working on a fix.')
) AS m(ticket_title, sender_name, content)
JOIN public.users u ON u.full_name = m.sender_name
WHERE t.title = m.ticket_title; 