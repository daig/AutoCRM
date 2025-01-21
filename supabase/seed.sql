-- Seed data for AutoCRM

-- Insert default users
INSERT INTO public.users (id, full_name) VALUES
    (uuid_generate_v4(), 'Alice Smith'),
    (uuid_generate_v4(), 'Bob Johnson'),
    (uuid_generate_v4(), 'Carl Wilson');

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

-- Insert tickets, tags, and metadata in one transaction
WITH new_tickets AS (
  INSERT INTO public.tickets (id, title, description) 
  VALUES
    (uuid_generate_v4(), 'Server Performance Issues', 'Investigating slow response times in production environment'),
    (uuid_generate_v4(), 'New User Onboarding Flow', 'Design and implement improved user onboarding experience'),
    (uuid_generate_v4(), 'Bug: Login Page CSS', 'Fix styling issues on the login page for mobile devices')
  RETURNING id, title
),
-- Insert tags
ticket_tags_insert AS (
  INSERT INTO public.ticket_tags (ticket, tag)
  SELECT t.id, tag.id
  FROM new_tickets t
  CROSS JOIN (
      SELECT id, name, type_id 
      FROM public.tags 
      WHERE (name = 'high' AND type_id = (SELECT id FROM tag_types WHERE name = 'priority'))
         OR (name = 'pending' AND type_id = (SELECT id FROM tag_types WHERE name = 'status'))
  ) tag
  WHERE t.title = 'Server Performance Issues'
  UNION ALL
  SELECT t.id, tag.id
  FROM new_tickets t
  CROSS JOIN (
      SELECT id, name, type_id 
      FROM public.tags 
      WHERE (name = 'medium' AND type_id = (SELECT id FROM tag_types WHERE name = 'priority'))
         OR (name = 'open' AND type_id = (SELECT id FROM tag_types WHERE name = 'status'))
  ) tag
  WHERE t.title = 'New User Onboarding Flow'
  UNION ALL
  SELECT t.id, tag.id
  FROM new_tickets t
  CROSS JOIN (
      SELECT id, name, type_id 
      FROM public.tags 
      WHERE (name = 'low' AND type_id = (SELECT id FROM tag_types WHERE name = 'priority'))
         OR (name = 'open' AND type_id = (SELECT id FROM tag_types WHERE name = 'status'))
  ) tag
  WHERE t.title = 'Bug: Login Page CSS'
),
-- Insert assigned users metadata
assigned_users_insert AS (
  INSERT INTO public.ticket_metadata (ticket, field_type, field_value_user)
  SELECT 
      t.id,
      ft.id,
      u.id
  FROM new_tickets t
  CROSS JOIN public.ticket_metadata_field_types ft
  CROSS JOIN public.users u
  WHERE ft.name = 'assigned'
  AND (
      (t.title = 'Server Performance Issues' AND u.full_name = 'Bob Johnson') OR
      (t.title = 'New User Onboarding Flow' AND u.full_name = 'Alice Smith') OR
      (t.title = 'Bug: Login Page CSS' AND u.full_name = 'Bob Johnson')
  )
),
-- Insert due dates metadata
due_dates_insert AS (
  INSERT INTO public.ticket_metadata (ticket, field_type, field_value_date)
  SELECT 
      t.id,
      ft.id,
      CASE 
          WHEN t.title = 'Server Performance Issues' THEN CURRENT_DATE + INTERVAL '2 days'
          WHEN t.title = 'New User Onboarding Flow' THEN CURRENT_DATE + INTERVAL '5 days'
          WHEN t.title = 'Bug: Login Page CSS' THEN CURRENT_DATE + INTERVAL '3 days'
      END
  FROM new_tickets t
  CROSS JOIN public.ticket_metadata_field_types ft
  WHERE ft.name = 'due_date'
  AND t.title IN ('Server Performance Issues', 'New User Onboarding Flow', 'Bug: Login Page CSS')
)
-- Insert messages
INSERT INTO public.ticket_messages (ticket, sender, content)
SELECT 
    t.id,
    u.id,
    m.content
FROM new_tickets t
CROSS JOIN (
    VALUES 
        ('Server Performance Issues', 'Bob Johnson', 'Initial investigation shows high CPU usage during peak hours.'),
        ('Server Performance Issues', 'Alice Smith', 'I noticed memory usage is also spiking. Could be a memory leak.'),
        ('Server Performance Issues', 'Bob Johnson', 'Good catch. I''ll check the application logs for memory-related issues.'),
        ('New User Onboarding Flow', 'Alice Smith', 'Started wireframing the new flow. Will share designs tomorrow.'),
        ('New User Onboarding Flow', 'Bob Johnson', 'Remember to include email verification step in the flow..'),
        ('Bug: Login Page CSS', 'Bob Johnson', 'Confirmed the issue on iPhone and Android devices.'),
        ('Bug: Login Page CSS', 'Alice Smith', 'The problem seems to be with the media queries. Working on a fix.')
) AS m(ticket_title, sender_name, content)
JOIN public.users u ON u.full_name = m.sender_name
WHERE t.title = m.ticket_title; 