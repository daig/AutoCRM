-- Migration: create User Skills and Proficiencies
-- Description: Adds tables for tracking user skills and proficiency levels
-- Similar to the tag system, but for user skills

--- SKILLS ---
create table public.skills (
    id          uuid default uuid_generate_v4() primary key,
    name        text not null unique check (length(name) between 1 and 50),
    description text check (length(description) <= 500)
);

--- PROFICIENCIES ---
-- proficiency is a skill level that a user has, it could be general like "beginner"
-- or it could be a specific certification like "AWS Certified Solutions Architect"
create table public.proficiencies (
    id          uuid default uuid_generate_v4() primary key,
    skill       uuid not null references public.skills (id) on delete cascade,
    name        text not null check (length(name) between 1 and 50),
    description text check (length(description) <= 500),
    -- Ensure proficiency names are unique within a skill, not globally
    unique (skill, name)
);

--- AGENT SKILLS ---
create table public.agent_skills (
    agent       uuid not null references public.users (id) on delete cascade,
    proficiency uuid not null references public.proficiencies (id) on delete cascade,
    created_at  timestamp with time zone default now(),
    primary key (agent, proficiency)
);

-- create a function to validate agent role
create or replace function validate_agent_role()
returns trigger as $$
begin
    if not exists (
        select 1 from public.users u
        where u.id = new.agent
        and u.role = 'agent'
    ) then
        raise exception 'User must have role ''agent'' to have skills';
    end if;
    return new;
end;
$$ language plpgsql;

-- create trigger to enforce agent role
create trigger enforce_agent_role
    before insert or update on public.agent_skills
    for each row
    execute function validate_agent_role();

-- create a function to validate proficiency belongs to skill
create or replace function validate_proficiency_skill()
returns trigger as $$
begin
    -- check if the proficiency belongs to the correct skill
    if not exists (
        select 1
        from public.proficiencies p
        where p.id = new.proficiency
    ) then
        raise exception 'Invalid proficiency';
    end if;
    return new;
end;
$$ language plpgsql;

-- create trigger to enforce valid proficiency for skill
create trigger enforce_valid_proficiency
    before insert or update on public.agent_skills
    for each row
    execute function validate_proficiency_skill();

-- Indexes for performance
create index idx_proficiencies_skill on public.proficiencies (skill);
create index idx_proficiencies_name on public.proficiencies (name);
create index idx_agent_skills_proficiency on public.agent_skills (proficiency);