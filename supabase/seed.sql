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


-- Insert some sample tickets
INSERT INTO public.tickets (id, title, description, creator)
VALUES
    ('a1b2c3d4-e5f6-4321-8765-1a2b3c4d5e6f', 'Login Issue', 'Unable to access account after password reset', '2f9314b6-c529-408e-9f99-f4f70a8bcdd9'),
    ('b2c3d4e5-f6a7-5432-8765-2b3c4d5e6f7a', 'Feature Request: Dark Mode', 'Would like dark mode option for reduced eye strain', '57f969fc-644d-4b2c-8e64-7ecd84ee4e13'),
    ('c3d4e5f6-a7b8-6543-8765-3c4d5e6f7a8b', 'Performance Issues', 'System running slowly during peak hours', 'd41d3774-844c-451f-9b65-8ffc87205b01'),
    ('d4e5f6a7-b8c9-7654-8765-4d5e6f7a8b9c', 'Data Export Bug', 'CSV export missing certain fields', 'f2035a53-7b2f-4b6c-89d0-6ed461e9b482');

-- Attach tags to tickets
INSERT INTO public.ticket_tags (ticket, tag)
VALUES
    -- Login Issue: open, high priority
    ('a1b2c3d4-e5f6-4321-8765-1a2b3c4d5e6f', (SELECT id FROM tags WHERE name = 'open')),
    ('a1b2c3d4-e5f6-4321-8765-1a2b3c4d5e6f', (SELECT id FROM tags WHERE name = 'high')),
    
    -- Feature Request: pending, low priority
    ('b2c3d4e5-f6a7-5432-8765-2b3c4d5e6f7a', (SELECT id FROM tags WHERE name = 'pending')),
    ('b2c3d4e5-f6a7-5432-8765-2b3c4d5e6f7a', (SELECT id FROM tags WHERE name = 'low')),
    
    -- Performance Issues: open, urgent priority
    ('c3d4e5f6-a7b8-6543-8765-3c4d5e6f7a8b', (SELECT id FROM tags WHERE name = 'open')),
    ('c3d4e5f6-a7b8-6543-8765-3c4d5e6f7a8b', (SELECT id FROM tags WHERE name = 'urgent')),
    
    -- Data Export Bug: pending, medium priority
    ('d4e5f6a7-b8c9-7654-8765-4d5e6f7a8b9c', (SELECT id FROM tags WHERE name = 'pending')),
    ('d4e5f6a7-b8c9-7654-8765-4d5e6f7a8b9c', (SELECT id FROM tags WHERE name = 'medium'));

-- Add metadata to tickets
INSERT INTO public.ticket_metadata (ticket, field_type, field_value_text, field_value_int, field_value_date, field_value_timestamp, field_value_bool, field_value_user, field_value_ticket)
VALUES
    -- Login Issue
    ('a1b2c3d4-e5f6-4321-8765-1a2b3c4d5e6f', 
     (SELECT id FROM ticket_metadata_field_types WHERE name = 'assigned'),
     NULL, NULL, NULL, NULL, NULL, 
     '57f969fc-644d-4b2c-8e64-7ecd84ee4e13', NULL),
    ('a1b2c3d4-e5f6-4321-8765-1a2b3c4d5e6f',
     (SELECT id FROM ticket_metadata_field_types WHERE name = 'estimated_hours'),
     NULL, 2, NULL, NULL, NULL, NULL, NULL),
     
    -- Feature Request
    ('b2c3d4e5-f6a7-5432-8765-2b3c4d5e6f7a',
     (SELECT id FROM ticket_metadata_field_types WHERE name = 'due_date'),
     NULL, NULL, '2024-03-01', NULL, NULL, NULL, NULL),
    ('b2c3d4e5-f6a7-5432-8765-2b3c4d5e6f7a',
     (SELECT id FROM ticket_metadata_field_types WHERE name = 'is_billable'),
     NULL, NULL, NULL, NULL, false, NULL, NULL),
     
    -- Performance Issues
    ('c3d4e5f6-a7b8-6543-8765-3c4d5e6f7a8b',
     (SELECT id FROM ticket_metadata_field_types WHERE name = 'notes'),
     'Multiple users reporting this issue. Needs immediate investigation.', 
     NULL, NULL, NULL, NULL, NULL, NULL),
    ('c3d4e5f6-a7b8-6543-8765-3c4d5e6f7a8b',
     (SELECT id FROM ticket_metadata_field_types WHERE name = 'estimated_hours'),
     NULL, 8, NULL, NULL, NULL, NULL, NULL),
     
    -- Data Export Bug
    ('d4e5f6a7-b8c9-7654-8765-4d5e6f7a8b9c',
     (SELECT id FROM ticket_metadata_field_types WHERE name = 'assigned'),
     NULL, NULL, NULL, NULL, NULL,
     'd41d3774-844c-451f-9b65-8ffc87205b01', NULL),
    ('d4e5f6a7-b8c9-7654-8765-4d5e6f7a8b9c',
     (SELECT id FROM ticket_metadata_field_types WHERE name = 'is_billable'),
     NULL, NULL, NULL, NULL, true, NULL, NULL);

-- Insert teams
INSERT INTO public.teams (id, name, description)
VALUES 
    ('e5f6a7b8-c9d0-8765-4321-9a8b7c6d5e4f', 'Technical Support', 'Handles technical issues and bugs'),
    ('f6a7b8c9-d0e1-8765-4321-8b9c7d6e5f4a', 'Customer Success', 'Handles feature requests and customer experience'),
    ('a7b8c9d0-e1f2-8765-4321-7c6d5e4f3a2b', 'Billing Support', 'Handles billing and subscription issues');

-- Update users with roles and team assignments
UPDATE public.users 
SET role = 'agent', team_id = 'e5f6a7b8-c9d0-8765-4321-9a8b7c6d5e4f', is_team_lead = true
WHERE id = '57f969fc-644d-4b2c-8e64-7ecd84ee4e13';

UPDATE public.users 
SET role = 'administrator', team_id = 'e5f6a7b8-c9d0-8765-4321-9a8b7c6d5e4f'
WHERE id = 'd41d3774-844c-451f-9b65-8ffc87205b01';

UPDATE public.users 
SET role = 'agent', team_id = 'f6a7b8c9-d0e1-8765-4321-8b9c7d6e5f4a', is_team_lead = true
WHERE id = 'f2035a53-7b2f-4b6c-89d0-6ed461e9b482';

-- Add messages to tickets
INSERT INTO public.ticket_messages (ticket, sender, content)
VALUES
    -- Login Issue messages
    ('a1b2c3d4-e5f6-4321-8765-1a2b3c4d5e6f', '2f9314b6-c529-408e-9f99-f4f70a8bcdd9', 
     'I tried resetting my password but still cannot log in. Getting a "Invalid credentials" error.'),
    ('a1b2c3d4-e5f6-4321-8765-1a2b3c4d5e6f', '57f969fc-644d-4b2c-8e64-7ecd84ee4e13', 
     'I can see the issue in our logs. Your account was temporarily locked due to multiple failed attempts. I''ve unlocked it now.'),
    ('a1b2c3d4-e5f6-4321-8765-1a2b3c4d5e6f', '2f9314b6-c529-408e-9f99-f4f70a8bcdd9', 
     'Thank you! I can log in now.'),
    
    -- Feature Request messages
    ('b2c3d4e5-f6a7-5432-8765-2b3c4d5e6f7a', '57f969fc-644d-4b2c-8e64-7ecd84ee4e13', 
     'Thanks for the suggestion. Could you tell us more about when you typically use the application?'),
    ('b2c3d4e5-f6a7-5432-8765-2b3c4d5e6f7a', 'f2035a53-7b2f-4b6c-89d0-6ed461e9b482', 
     'I''ve added this to our feature backlog. We''ll prioritize it for our next UI update.'),
    
    -- Performance Issues messages
    ('c3d4e5f6-a7b8-6543-8765-3c4d5e6f7a8b', 'd41d3774-844c-451f-9b65-8ffc87205b01', 
     'I''ve started investigating the performance issues. Can you tell me what time of day you''re seeing the slowdown?'),
    ('c3d4e5f6-a7b8-6543-8765-3c4d5e6f7a8b', 'd41d3774-844c-451f-9b65-8ffc87205b01', 
     'Found the issue - one of our database queries wasn''t properly optimized for large datasets.'),
    
    -- Data Export Bug messages
    ('d4e5f6a7-b8c9-7654-8765-4d5e6f7a8b9c', 'f2035a53-7b2f-4b6c-89d0-6ed461e9b482', 
     'I''ve reproduced the issue. Which specific fields are you noticing are missing from the export?'),
    ('d4e5f6a7-b8c9-7654-8765-4d5e6f7a8b9c', 'f2035a53-7b2f-4b6c-89d0-6ed461e9b482', 
     'This appears to be affecting all custom fields. I''ve created a fix that will be deployed in the next release.');

-- Update tickets with team assignments
UPDATE public.tickets 
SET team = 'e5f6a7b8-c9d0-8765-4321-9a8b7c6d5e4f'
WHERE id IN ('a1b2c3d4-e5f6-4321-8765-1a2b3c4d5e6f', 'c3d4e5f6-a7b8-6543-8765-3c4d5e6f7a8b');

UPDATE public.tickets 
SET team = 'f6a7b8c9-d0e1-8765-4321-8b9c7d6e5f4a'
WHERE id IN ('b2c3d4e5-f6a7-5432-8765-2b3c4d5e6f7a', 'd4e5f6a7-b8c9-7654-8765-4d5e6f7a8b9c');
