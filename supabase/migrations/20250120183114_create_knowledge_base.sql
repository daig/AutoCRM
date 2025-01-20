-- Create knowledge base table
CREATE TABLE public.knowledge_base (
    id          uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    title       text NOT NULL,
    content     text NOT NULL,
    tags        text[] DEFAULT '{}',
    created_at  timestamp with time zone DEFAULT now(),
    updated_at  timestamp with time zone DEFAULT now()
); 