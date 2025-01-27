create extension if not EXISTS "uuid-ossp"; 
create extension if not EXISTS pg_trgm;

create schema if not exists trigger;
grant usage on schema trigger to public;