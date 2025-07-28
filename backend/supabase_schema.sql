-- Supabase schema for Shepherd MVP repository analysis
-- Run this in your Supabase SQL editor

-- Create the repository_analyses table
CREATE TABLE IF NOT EXISTS repository_analyses (
    id BIGSERIAL PRIMARY KEY,
    run_id UUID UNIQUE NOT NULL,
    repository_url TEXT NOT NULL,
    project_description TEXT,
    environment TEXT NOT NULL CHECK (environment IN ('local', 'testnet')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
    user_id TEXT,
    reference_files TEXT[], -- Array of file names/paths
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Add indexes for better performance
    CONSTRAINT valid_environment CHECK (environment IN ('local', 'testnet')),
    CONSTRAINT valid_status CHECK (status IN ('pending', 'running', 'completed', 'failed'))
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_repository_analyses_run_id ON repository_analyses(run_id);
CREATE INDEX IF NOT EXISTS idx_repository_analyses_user_id ON repository_analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_repository_analyses_status ON repository_analyses(status);
CREATE INDEX IF NOT EXISTS idx_repository_analyses_created_at ON repository_analyses(created_at DESC);

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_repository_analyses_updated_at 
    BEFORE UPDATE ON repository_analyses 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS) for better security
ALTER TABLE repository_analyses ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to see their own analyses
CREATE POLICY "Users can view their own analyses" ON repository_analyses
    FOR SELECT USING (auth.uid()::text = user_id);

-- Create policy to allow users to insert their own analyses
CREATE POLICY "Users can insert their own analyses" ON repository_analyses
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- Create policy to allow users to update their own analyses
CREATE POLICY "Users can update their own analyses" ON repository_analyses
    FOR UPDATE USING (auth.uid()::text = user_id);

-- Optional: Create a view for easier querying
CREATE OR REPLACE VIEW repository_analyses_summary AS
SELECT 
    run_id,
    repository_url,
    environment,
    status,
    user_id,
    created_at,
    updated_at,
    CASE 
        WHEN status = 'completed' THEN 'Analysis completed successfully'
        WHEN status = 'failed' THEN 'Analysis failed'
        WHEN status = 'running' THEN 'Analysis in progress'
        ELSE 'Analysis pending'
    END as status_description
FROM repository_analyses
ORDER BY created_at DESC;

-- Grant necessary permissions
GRANT ALL ON repository_analyses TO authenticated;
GRANT ALL ON repository_analyses_summary TO authenticated;
GRANT USAGE ON SEQUENCE repository_analyses_id_seq TO authenticated; 

-- Disable RLS temporarily for testing
ALTER TABLE repository_analyses DISABLE ROW LEVEL SECURITY;