-- Create users table for authentication
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'user', -- 'admin' or 'user'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert admin user
INSERT INTO users (username, password, role) 
VALUES ('admin', 'darquran2026', 'admin')
ON CONFLICT (username) DO NOTHING;

-- Insert regular user
INSERT INTO users (username, password, role) 
VALUES ('user', 'user123', 'user')
ON CONFLICT (username) DO NOTHING;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- Add RLS policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Allow anonymous access for login
CREATE POLICY "Allow anonymous read for login" ON users
    FOR SELECT
    TO anon
    USING (true);

-- Only admins can modify users
CREATE POLICY "Only admins can modify users" ON users
    FOR ALL
    TO authenticated
    USING (auth.jwt() ->> 'role' = 'admin');
