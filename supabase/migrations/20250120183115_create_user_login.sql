-- Enable the pgcrypto extension for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create user_login table
CREATE TABLE IF NOT EXISTS public.user_login (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_login_updated_at
    BEFORE UPDATE ON public.user_login
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create function to register new user
CREATE OR REPLACE FUNCTION public.register_user(
    full_name TEXT,
    email TEXT,
    password TEXT
) RETURNS UUID AS $$
DECLARE
    new_user_id UUID;
BEGIN
    -- First create the user
    INSERT INTO public.users (full_name)
    VALUES (full_name)
    RETURNING id INTO new_user_id;

    -- Then create the login entry with hashed password
    INSERT INTO public.user_login (user_id, email, password_hash)
    VALUES (
        new_user_id,
        email,
        crypt(password, gen_salt('bf'))  -- Using bcrypt for password hashing
    );

    RETURN new_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to verify login
CREATE OR REPLACE FUNCTION public.verify_user_login(
    login_email TEXT,
    login_password TEXT
) RETURNS UUID AS $$
DECLARE
    user_id UUID;
BEGIN
    SELECT ul.user_id INTO user_id
    FROM public.user_login ul
    WHERE ul.email = login_email
    AND ul.password_hash = crypt(login_password, ul.password_hash);

    RETURN user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create index for email lookups
CREATE INDEX IF NOT EXISTS idx_user_login_email ON public.user_login (email);

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.register_user(TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.verify_user_login(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.verify_user_login(TEXT, TEXT) TO anon; 