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

-- Insert default tickets
INSERT INTO public.tickets (id, title, description) VALUES
    ('t1d4671c-d9de-4c23-8286-a5f2c6c8d1f1', 'Server Performance Issues', 'Investigating slow response times in production environment'),
    ('t2d4671c-d9de-4c23-8286-a5f2c6c8d1f2', 'New User Onboarding Flow', 'Design and implement improved user onboarding experience'),
    ('t3d4671c-d9de-4c23-8286-a5f2c6c8d1f3', 'Bug: Login Page CSS', 'Fix styling issues on the login page for mobile devices');

-- Add tags to tickets
INSERT INTO public.ticket_tags (ticket, tag) VALUES
    -- Server Performance Issues - high priority, pending
    ('t1d4671c-d9de-4c23-8286-a5f2c6c8d1f1', (SELECT id FROM tags WHERE name = 'high' AND type_id = (SELECT id FROM tag_types WHERE name = 'priority'))),
    ('t1d4671c-d9de-4c23-8286-a5f2c6c8d1f1', (SELECT id FROM tags WHERE name = 'pending' AND type_id = (SELECT id FROM tag_types WHERE name = 'status'))),
    
    -- New User Onboarding Flow - medium priority, open
    ('t2d4671c-d9de-4c23-8286-a5f2c6c8d1f2', (SELECT id FROM tags WHERE name = 'medium' AND type_id = (SELECT id FROM tag_types WHERE name = 'priority'))),
    ('t2d4671c-d9de-4c23-8286-a5f2c6c8d1f2', (SELECT id FROM tags WHERE name = 'open' AND type_id = (SELECT id FROM tag_types WHERE name = 'status'))),
    
    -- Bug: Login Page CSS - low priority, open
    ('t3d4671c-d9de-4c23-8286-a5f2c6c8d1f3', (SELECT id FROM tags WHERE name = 'low' AND type_id = (SELECT id FROM tag_types WHERE name = 'priority'))),
    ('t3d4671c-d9de-4c23-8286-a5f2c6c8d1f3', (SELECT id FROM tags WHERE name = 'open' AND type_id = (SELECT id FROM tag_types WHERE name = 'status')));

-- Add metadata to tickets
INSERT INTO public.ticket_metadata (ticket, field_type, field_value_user) 
SELECT 
    't1d4671c-d9de-4c23-8286-a5f2c6c8d1f1',
    (SELECT id FROM ticket_metadata_field_types WHERE name = 'assigned'),
    'b0b4671c-d9de-4c23-8286-a5f2c6c8d1f8'; -- Assigned to Bob

INSERT INTO public.ticket_metadata (ticket, field_type, field_value_date)
SELECT 
    't1d4671c-d9de-4c23-8286-a5f2c6c8d1f1',
    (SELECT id FROM ticket_metadata_field_types WHERE name = 'due_date'),
    CURRENT_DATE + INTERVAL '2 days';

INSERT INTO public.ticket_metadata (ticket, field_type, field_value_user)
SELECT 
    't2d4671c-d9de-4c23-8286-a5f2c6c8d1f2',
    (SELECT id FROM ticket_metadata_field_types WHERE name = 'assigned'),
    'd0d4671c-d9de-4c23-8286-a5f2c6c8d1f7'; -- Assigned to Alice

INSERT INTO public.ticket_metadata (ticket, field_type, field_value_date)
SELECT 
    't2d4671c-d9de-4c23-8286-a5f2c6c8d1f2',
    (SELECT id FROM ticket_metadata_field_types WHERE name = 'due_date'),
    CURRENT_DATE + INTERVAL '5 days';

INSERT INTO public.ticket_metadata (ticket, field_type, field_value_user)
SELECT 
    't3d4671c-d9de-4c23-8286-a5f2c6c8d1f3',
    (SELECT id FROM ticket_metadata_field_types WHERE name = 'assigned'),
    'b0b4671c-d9de-4c23-8286-a5f2c6c8d1f8'; -- Assigned to Bob

INSERT INTO public.ticket_metadata (ticket, field_type, field_value_date)
SELECT 
    't3d4671c-d9de-4c23-8286-a5f2c6c8d1f3',
    (SELECT id FROM ticket_metadata_field_types WHERE name = 'due_date'),
    CURRENT_DATE + INTERVAL '3 days'; 