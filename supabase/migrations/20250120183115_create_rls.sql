-- Create user role type
CREATE TYPE auth.user_role AS ENUM ('administrator', 'agent', 'customer');

-- Create custom roles in auth.users
ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS role auth.user_role DEFAULT 'customer'::auth.user_role;

-- Enable RLS on all tables
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tag_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_metadata_field_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_messages ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user is in team
CREATE OR REPLACE FUNCTION public.user_is_in_team(team_id uuid)
RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_teams
        WHERE user_id = auth.uid()
        AND team_id = $1
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to get user's role
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS public.user_role AS $$
BEGIN
    RETURN (
        SELECT role FROM public.users
        WHERE id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Teams table policies
CREATE POLICY "Administrators can create teams" ON public.teams
FOR INSERT TO authenticated
WITH CHECK ((SELECT role FROM public.users WHERE id = auth.uid()) = 'administrator');

CREATE POLICY "Administrators can delete teams" ON public.teams
FOR DELETE TO authenticated
USING ((SELECT role FROM public.users WHERE id = auth.uid()) = 'administrator');

CREATE POLICY "Team members can view their teams" ON public.teams
FOR SELECT TO authenticated
USING (public.user_is_in_team(id));

-- User_teams table policies
CREATE POLICY "Team leads can add agents to their teams" ON public.user_teams
FOR INSERT TO authenticated
WITH CHECK (
    (SELECT team_lead FROM public.teams WHERE id = team_id) = auth.uid() AND
    (SELECT role FROM public.users WHERE id = user_id) = 'agent'
);

CREATE POLICY "Administrators can add users to teams" ON public.user_teams
FOR INSERT TO authenticated
WITH CHECK (
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'administrator'
);

CREATE POLICY "Team members can view team membership" ON public.user_teams
FOR SELECT TO authenticated
USING (public.user_is_in_team(team_id));

-- Tag types policies
CREATE POLICY "Administrators can manage tag types" ON public.tag_types
FOR ALL TO authenticated
USING ((SELECT role FROM public.users WHERE id = auth.uid()) = 'administrator')
WITH CHECK ((SELECT role FROM public.users WHERE id = auth.uid()) = 'administrator');

CREATE POLICY "Everyone can view tag types" ON public.tag_types
FOR SELECT TO authenticated
USING (true);

-- Tags policies
CREATE POLICY "Administrators can manage tags" ON public.tags
FOR ALL TO authenticated
USING ((SELECT role FROM public.users WHERE id = auth.uid()) = 'administrator')
WITH CHECK ((SELECT role FROM public.users WHERE id = auth.uid()) = 'administrator');

CREATE POLICY "Everyone can view tags" ON public.tags
FOR SELECT TO authenticated
USING (true);

-- Tickets policies
CREATE POLICY "Customers can create tickets" ON public.tickets
FOR INSERT TO authenticated
WITH CHECK ((SELECT role FROM public.users WHERE id = auth.uid()) = 'customer');

CREATE POLICY "Team members can view tickets" ON public.tickets
FOR SELECT TO authenticated
USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) IN ('agent', 'administrator') AND
    (
        public.user_is_in_team(team) OR
        (SELECT team_lead FROM public.teams WHERE id = team) = auth.uid()
    )
);

-- Ticket tags policies
CREATE POLICY "Team members can view ticket tags" ON public.ticket_tags
FOR SELECT TO authenticated
USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) IN ('agent', 'administrator') AND
    (
        public.user_is_in_team((SELECT team FROM public.tickets WHERE id = ticket)) OR
        (SELECT team_lead FROM public.teams WHERE id = (SELECT team FROM public.tickets WHERE id = ticket)) = auth.uid()
    )
);

-- Ticket metadata field types policies
CREATE POLICY "Administrators can manage metadata field types" ON public.ticket_metadata_field_types
FOR ALL TO authenticated
USING ((SELECT role FROM public.users WHERE id = auth.uid()) = 'administrator')
WITH CHECK ((SELECT role FROM public.users WHERE id = auth.uid()) = 'administrator');

CREATE POLICY "Everyone can view metadata field types" ON public.ticket_metadata_field_types
FOR SELECT TO authenticated
USING (true);

-- Ticket metadata policies
CREATE POLICY "Team members can view ticket metadata" ON public.ticket_metadata
FOR SELECT TO authenticated
USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) IN ('agent', 'administrator') AND
    (
        public.user_is_in_team((SELECT team FROM public.tickets WHERE id = ticket)) OR
        (SELECT team_lead FROM public.teams WHERE id = (SELECT team FROM public.tickets WHERE id = ticket)) = auth.uid()
    )
);

-- Messages policies
CREATE POLICY "Team members can view ticket messages" ON public.ticket_messages
FOR SELECT TO authenticated
USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) IN ('agent', 'administrator') AND
    (
        public.user_is_in_team((SELECT team FROM public.tickets WHERE id = ticket)) OR
        (SELECT team_lead FROM public.teams WHERE id = (SELECT team FROM public.tickets WHERE id = ticket)) = auth.uid()
    )
);

-- Users policies
CREATE POLICY "Users can view their own profile" ON public.users
FOR SELECT TO authenticated
USING (id = auth.uid());

CREATE POLICY "Team members can view team member profiles" ON public.users
FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.user_teams ut1
        WHERE ut1.user_id = auth.uid()
        AND EXISTS (
            SELECT 1 FROM public.user_teams ut2
            WHERE ut2.team_id = ut1.team_id
            AND ut2.user_id = users.id
        )
    )
); 