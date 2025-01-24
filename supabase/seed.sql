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

-- Insert skills
INSERT INTO public.skills (id, name, description)
VALUES
    ('d1e2f3a4-b5c6-4321-8765-1a2b3c4d5e6f', 'Database Management', 'SQL and database optimization skills'),
    ('e2f3a4b5-c6d7-4321-8765-2b3c4d5e6f7a', 'Customer Service', 'Customer interaction and support skills'),
    ('f3a4b5c6-d7e8-4321-8765-3c4d5e6f7a8b', 'Cloud Infrastructure', 'AWS and cloud platform expertise'),
    ('a4b5c6d7-e8f9-4321-8765-4d5e6f7a8b9c', 'Technical Writing', 'Documentation and knowledge base management');

-- Insert proficiencies
INSERT INTO public.proficiencies (id, skill, name, description)
VALUES
    -- Database Management proficiencies
    ('b5c6d7e8-f9a0-4321-8765-5e6f7a8b9c0d', 'd1e2f3a4-b5c6-4321-8765-1a2b3c4d5e6f', 'SQL Expert', 'Advanced SQL query optimization and database design'),
    ('c6d7e8f9-a0b1-4321-8765-6f7a8b9c0d1e', 'd1e2f3a4-b5c6-4321-8765-1a2b3c4d5e6f', 'Database Administrator', 'Database maintenance and performance tuning'),
    
    -- Customer Service proficiencies
    ('d7e8f9a0-b1c2-4321-8765-7a8b9c0d1e2f', 'e2f3a4b5-c6d7-4321-8765-2b3c4d5e6f7a', 'Senior Support', 'Advanced customer support and conflict resolution'),
    ('e8f9a0b1-c2d3-4321-8765-8b9c0d1e2f3a', 'e2f3a4b5-c6d7-4321-8765-2b3c4d5e6f7a', 'Support Lead', 'Team leadership and escalation management'),
    
    -- Cloud Infrastructure proficiencies
    ('f9a0b1c2-d3e4-4321-8765-9c0d1e2f3a4b', 'f3a4b5c6-d7e8-4321-8765-3c4d5e6f7a8b', 'AWS Certified', 'AWS Solutions Architect certification'),
    ('a0b1c2d3-e4f5-4321-8765-0d1e2f3a4b5c', 'f3a4b5c6-d7e8-4321-8765-3c4d5e6f7a8b', 'Cloud Expert', 'Multi-cloud platform expertise'),
    
    -- Technical Writing proficiencies
    ('b1c2d3e4-f5a6-4321-8765-1e2f3a4b5c6d', 'a4b5c6d7-e8f9-4321-8765-4d5e6f7a8b9c', 'Documentation Specialist', 'Technical documentation and style guide management'),
    ('c2d3e4f5-a6b7-4321-8765-2f3a4b5c6d7e', 'a4b5c6d7-e8f9-4321-8765-4d5e6f7a8b9c', 'Knowledge Base Manager', 'Knowledge base organization and maintenance');

-- Assign skills to agents
INSERT INTO public.agent_skills (agent, proficiency)
VALUES
    -- Technical Support Team Lead (57f969fc-644d-4b2c-8e64-7ecd84ee4e13)
    ('57f969fc-644d-4b2c-8e64-7ecd84ee4e13', 'b5c6d7e8-f9a0-4321-8765-5e6f7a8b9c0d'),  -- SQL Expert
    ('57f969fc-644d-4b2c-8e64-7ecd84ee4e13', 'f9a0b1c2-d3e4-4321-8765-9c0d1e2f3a4b'),  -- AWS Certified
    ('57f969fc-644d-4b2c-8e64-7ecd84ee4e13', 'e8f9a0b1-c2d3-4321-8765-8b9c0d1e2f3a'),  -- Support Lead
    
    -- Customer Success Team Lead (f2035a53-7b2f-4b6c-89d0-6ed461e9b482)
    ('f2035a53-7b2f-4b6c-89d0-6ed461e9b482', 'd7e8f9a0-b1c2-4321-8765-7a8b9c0d1e2f'),  -- Senior Support
    ('f2035a53-7b2f-4b6c-89d0-6ed461e9b482', 'b1c2d3e4-f5a6-4321-8765-1e2f3a4b5c6d'),  -- Documentation Specialist
    ('f2035a53-7b2f-4b6c-89d0-6ed461e9b482', 'e8f9a0b1-c2d3-4321-8765-8b9c0d1e2f3a');  -- Support Lead

-- Add messages to tickets
INSERT INTO public.ticket_messages (ticket, sender, content)
VALUES
    -- Login Issue messages (creator: 2f9314b6-c529-408e-9f99-f4f70a8bcdd9)
    ('a1b2c3d4-e5f6-4321-8765-1a2b3c4d5e6f', '2f9314b6-c529-408e-9f99-f4f70a8bcdd9', 
     'I tried resetting my password but still cannot log in. Getting a "Invalid credentials" error.'),
    ('a1b2c3d4-e5f6-4321-8765-1a2b3c4d5e6f', '57f969fc-644d-4b2c-8e64-7ecd84ee4e13', 
     'I will help you with that. Could you tell me when you last successfully logged in?'),
    ('a1b2c3d4-e5f6-4321-8765-1a2b3c4d5e6f', '2f9314b6-c529-408e-9f99-f4f70a8bcdd9', 
     'It was yesterday morning, then I changed my password in the afternoon.'),
    ('a1b2c3d4-e5f6-4321-8765-1a2b3c4d5e6f', '57f969fc-644d-4b2c-8e64-7ecd84ee4e13', 
     'I see the issue in our logs. Your account was temporarily locked due to multiple failed attempts. I have unlocked it now.'),
    ('a1b2c3d4-e5f6-4321-8765-1a2b3c4d5e6f', '2f9314b6-c529-408e-9f99-f4f70a8bcdd9', 
     'Thank you! I can log in now.'),
    
    -- Feature Request messages (creator: 2f9314b6-c529-408e-9f99-f4f70a8bcdd9)
    ('b2c3d4e5-f6a7-5432-8765-2b3c4d5e6f7a', '2f9314b6-c529-408e-9f99-f4f70a8bcdd9', 
     'I often work late nights and the bright interface strains my eyes. Could we get a dark mode option?'),
    ('b2c3d4e5-f6a7-5432-8765-2b3c4d5e6f7a', '57f969fc-644d-4b2c-8e64-7ecd84ee4e13', 
     'Would you mind sharing more details about your typical usage hours? This will help us prioritize the dark mode feature.'),
    ('b2c3d4e5-f6a7-5432-8765-2b3c4d5e6f7a', '2f9314b6-c529-408e-9f99-f4f70a8bcdd9',
     'Usually between 10 PM and 2 AM. The current bright theme gives me headaches after a while.'),
    ('b2c3d4e5-f6a7-5432-8765-2b3c4d5e6f7a', '57f969fc-644d-4b2c-8e64-7ecd84ee4e13', 
     'Thank you for those details. I have added this to our feature backlog and will discuss it with the development team. We will prioritize this for our next UI update.'),
    
    -- Performance Issues messages (creator: d41d3774-844c-451f-9b65-8ffc87205b01)
    ('c3d4e5f6-a7b8-6543-8765-3c4d5e6f7a8b', 'd41d3774-844c-451f-9b65-8ffc87205b01', 
     'The system becomes unusably slow around 2-3 PM EST every day. Is anyone else experiencing this?'),
    ('c3d4e5f6-a7b8-6543-8765-3c4d5e6f7a8b', '57f969fc-644d-4b2c-8e64-7ecd84ee4e13', 
     'Thank you for reporting this. We are seeing similar reports from other users. Could you tell me what operations are particularly slow?'),
    ('c3d4e5f6-a7b8-6543-8765-3c4d5e6f7a8b', 'd41d3774-844c-451f-9b65-8ffc87205b01', 
     'Mainly the dashboard loading and any report generation.'),
    ('c3d4e5f6-a7b8-6543-8765-3c4d5e6f7a8b', '57f969fc-644d-4b2c-8e64-7ecd84ee4e13', 
     'Found the issue - one of our database queries was not properly optimized for large datasets. We will deploy a fix within the hour.'),
    ('c3d4e5f6-a7b8-6543-8765-3c4d5e6f7a8b', 'd41d3774-844c-451f-9b65-8ffc87205b01',
     'Great, thank you. I will monitor the performance after the fix is deployed.'),
    
    -- Data Export Bug messages (creator: 2f9314b6-c529-408e-9f99-f4f70a8bcdd9)
    ('d4e5f6a7-b8c9-7654-8765-4d5e6f7a8b9c', '2f9314b6-c529-408e-9f99-f4f70a8bcdd9', 
     'The CSV export is missing several custom fields we added last week. Is this a known issue?'),
    ('d4e5f6a7-b8c9-7654-8765-4d5e6f7a8b9c', '57f969fc-644d-4b2c-8e64-7ecd84ee4e13', 
     'I will look into this right away. Could you share which custom fields are missing?'),
    ('d4e5f6a7-b8c9-7654-8765-4d5e6f7a8b9c', '2f9314b6-c529-408e-9f99-f4f70a8bcdd9', 
     'All the new status fields and category tags are missing.'),
    ('d4e5f6a7-b8c9-7654-8765-4d5e6f7a8b9c', '57f969fc-644d-4b2c-8e64-7ecd84ee4e13', 
     'Thank you for the details. This appears to be affecting all custom fields. I have created a fix that will be deployed in the next release.');

-- Update tickets with team assignments
UPDATE public.tickets 
SET team = 'e5f6a7b8-c9d0-8765-4321-9a8b7c6d5e4f'
WHERE id IN ('a1b2c3d4-e5f6-4321-8765-1a2b3c4d5e6f', 'c3d4e5f6-a7b8-6543-8765-3c4d5e6f7a8b');

UPDATE public.tickets 
SET team = 'f6a7b8c9-d0e1-8765-4321-8b9c7d6e5f4a'
WHERE id IN ('b2c3d4e5-f6a7-5432-8765-2b3c4d5e6f7a', 'd4e5f6a7-b8c9-7654-8765-4d5e6f7a8b9c');

-- Update specified user to be Billing Support team lead
UPDATE public.users 
SET role = 'agent', team_id = 'a7b8c9d0-e1f2-8765-4321-7c6d5e4f3a2b', is_team_lead = true
WHERE id = '3b66feb4-d12c-4888-b36f-196a8c83590f';

-- Add billing support skills to the new team lead
INSERT INTO public.agent_skills (agent, proficiency)
VALUES
    ('3b66feb4-d12c-4888-b36f-196a8c83590f', 'd7e8f9a0-b1c2-4321-8765-7a8b9c0d1e2f'),  -- Senior Support
    ('3b66feb4-d12c-4888-b36f-196a8c83590f', 'e8f9a0b1-c2d3-4321-8765-8b9c0d1e2f3a');  -- Support Lead

-- Add team members to Billing Support team
UPDATE public.users 
SET role = 'agent', team_id = 'a7b8c9d0-e1f2-8765-4321-7c6d5e4f3a2b', is_team_lead = false
WHERE id IN ('b9c7d6e5-f4a3-4321-8765-9c0d1e2f3a4b', 'c8d7e6f5-a4b3-4321-8765-8d9c0e1f2a3b');

-- Add skills for team members
INSERT INTO public.agent_skills (agent, proficiency)
VALUES
    -- Sarah Chen's skills
    ('b9c7d6e5-f4a3-4321-8765-9c0d1e2f3a4b', 'd7e8f9a0-b1c2-4321-8765-7a8b9c0d1e2f'),  -- Senior Support
    ('b9c7d6e5-f4a3-4321-8765-9c0d1e2f3a4b', 'c6d7e8f9-a0b1-4321-8765-6f7a8b9c0d1e'),  -- Database Administrator
    
    -- Marcus Rodriguez's skills
    ('c8d7e6f5-a4b3-4321-8765-8d9c0e1f2a3b', 'b1c2d3e4-f5a6-4321-8765-1e2f3a4b5c6d'),  -- Documentation Specialist
    ('c8d7e6f5-a4b3-4321-8765-8d9c0e1f2a3b', 'd7e8f9a0-b1c2-4321-8765-7a8b9c0d1e2f');  -- Senior Support

-- Insert additional tickets for the specified user
INSERT INTO public.tickets (id, title, description, creator)
VALUES
    ('e5f6a7b8-c9d0-4321-8765-5e6f7a8b9c0d', 'Billing Cycle Issue', 'Monthly charges not reflecting recent plan upgrade', '2f9314b6-c529-408e-9f99-f4f70a8bcdd9'),
    ('f6a7b8c9-d0e1-4321-8765-6f7a8b9c0d1e', 'Refund Request', 'Double charged for last month subscription', '2f9314b6-c529-408e-9f99-f4f70a8bcdd9');

-- Attach tags to new tickets
INSERT INTO public.ticket_tags (ticket, tag)
VALUES
    -- Billing Cycle Issue: open, high priority
    ('e5f6a7b8-c9d0-4321-8765-5e6f7a8b9c0d', (SELECT id FROM tags WHERE name = 'open')),
    ('e5f6a7b8-c9d0-4321-8765-5e6f7a8b9c0d', (SELECT id FROM tags WHERE name = 'high')),
    
    -- Refund Request: pending, urgent priority
    ('f6a7b8c9-d0e1-4321-8765-6f7a8b9c0d1e', (SELECT id FROM tags WHERE name = 'pending')),
    ('f6a7b8c9-d0e1-4321-8765-6f7a8b9c0d1e', (SELECT id FROM tags WHERE name = 'urgent'));

-- Update tickets with team assignments for new tickets
UPDATE public.tickets 
SET team = 'a7b8c9d0-e1f2-8765-4321-7c6d5e4f3a2b'
WHERE id IN ('e5f6a7b8-c9d0-4321-8765-5e6f7a8b9c0d', 'f6a7b8c9-d0e1-4321-8765-6f7a8b9c0d1e');

-- Add metadata to assign ticket to billing team lead
INSERT INTO public.ticket_metadata (ticket, field_type, field_value_user)
VALUES
    ('f6a7b8c9-d0e1-4321-8765-6f7a8b9c0d1e', 
     (SELECT id FROM ticket_metadata_field_types WHERE name = 'assigned'),
     '3b66feb4-d12c-4888-b36f-196a8c83590f');

-- Add messages for new tickets
INSERT INTO public.ticket_messages (ticket, sender, content)
VALUES
    -- Billing Cycle Issue messages (creator: 2f9314b6-c529-408e-9f99-f4f70a8bcdd9)
    ('e5f6a7b8-c9d0-4321-8765-5e6f7a8b9c0d', '2f9314b6-c529-408e-9f99-f4f70a8bcdd9', 
     'I upgraded my plan last week but my billing amount still shows the old rate. I was told it would be effective immediately.'),
    ('e5f6a7b8-c9d0-4321-8765-5e6f7a8b9c0d', '3b66feb4-d12c-4888-b36f-196a8c83590f', 
     'I understand your concern. Could you tell me when exactly you upgraded and which plan you chose?'),
    ('e5f6a7b8-c9d0-4321-8765-5e6f7a8b9c0d', '2f9314b6-c529-408e-9f99-f4f70a8bcdd9', 
     'I upgraded to the Enterprise plan on Tuesday at around 2 PM.'),
    ('e5f6a7b8-c9d0-4321-8765-5e6f7a8b9c0d', 'b9c7d6e5-f4a3-4321-8765-9c0d1e2f3a4b', 
     'Let me check our billing system records for that timeframe.'),
    ('e5f6a7b8-c9d0-4321-8765-5e6f7a8b9c0d', 'c8d7e6f5-a4b3-4321-8765-8d9c0e1f2a3b', 
     'I can confirm there was a delay in our billing system. I will process the rate adjustment immediately and apply it retroactively.'),
    ('e5f6a7b8-c9d0-4321-8765-5e6f7a8b9c0d', 'c8d7e6f5-a4b3-4321-8765-8d9c0e1f2a3b', 
     'I have documented this issue in our knowledge base to help other agents handle similar cases.'),
    ('e5f6a7b8-c9d0-4321-8765-5e6f7a8b9c0d', 'b9c7d6e5-f4a3-4321-8765-9c0d1e2f3a4b', 
     'I have verified the adjustment in our system. You should see the updated rate reflected within the next hour.'),
    ('e5f6a7b8-c9d0-4321-8765-5e6f7a8b9c0d', '2f9314b6-c529-408e-9f99-f4f70a8bcdd9', 
     'Perfect, I will keep an eye out for the change. Thank you for the quick resolution.'),
    
    -- Refund Request messages (creator: 2f9314b6-c529-408e-9f99-f4f70a8bcdd9)
    ('f6a7b8c9-d0e1-4321-8765-6f7a8b9c0d1e', '2f9314b6-c529-408e-9f99-f4f70a8bcdd9', 
     'I just noticed I was charged twice for my subscription this month. Could you help me get this resolved?'),
    ('f6a7b8c9-d0e1-4321-8765-6f7a8b9c0d1e', '3b66feb4-d12c-4888-b36f-196a8c83590f', 
     'I apologize for this error. Let me check your billing history to confirm the double charge.'),
    ('f6a7b8c9-d0e1-4321-8765-6f7a8b9c0d1e', 'b9c7d6e5-f4a3-4321-8765-9c0d1e2f3a4b', 
     'I have confirmed the duplicate charge. I will process the refund right away and send you a confirmation email.'),
    ('f6a7b8c9-d0e1-4321-8765-6f7a8b9c0d1e', 'c8d7e6f5-a4b3-4321-8765-8d9c0e1f2a3b', 
     'I am adding this incident to our knowledge base and will work with our billing team to prevent similar issues.'),
    ('f6a7b8c9-d0e1-4321-8765-6f7a8b9c0d1e', '2f9314b6-c529-408e-9f99-f4f70a8bcdd9', 
     'I received the refund confirmation email. Thank you for handling this so quickly.'),
    ('f6a7b8c9-d0e1-4321-8765-6f7a8b9c0d1e', '3b66feb4-d12c-4888-b36f-196a8c83590f', 
     'You are welcome! I have also added extra validation checks to prevent future double charges. The refund should appear in your account in 3-5 business days.');
