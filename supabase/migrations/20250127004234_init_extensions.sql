CREATE EXTENSION IF NOT EXISTS "uuid-ossp"; 
CREATE EXTENSION IF NOT EXISTS pg_trgm;

create schema trigger;
grant usage on schema trigger to public;