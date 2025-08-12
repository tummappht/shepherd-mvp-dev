-- Supabase SQL schema for repository_analyses table

-- Create the table
CREATE TABLE repository_analyses (
    id SERIAL PRIMARY KEY,
    run_id UUID UNIQUE NOT NULL,
    user_id TEXT NOT NULL,
    repository_url TEXT NOT NULL,
    project_description TEXT,
    environment TEXT CHECK (environment IN ('local', 'testnet')),
    reference_files JSONB DEFAULT '[]'::jsonb,
    
    -- Status fields
    status TEXT CHECK (status IN ('pending', 'queued', 'running', 'completed', 'failed', 'cancelled')) DEFAULT 'pending',
    queue_position INTEGER,
    estimated_wait INTEGER, -- in minutes
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    failed_at TIMESTAMP WITH TIME ZONE,
    
    -- Error tracking
    error TEXT,
    
    -- Results (can store analysis results here)
    results JSONB DEFAULT '{}'::jsonb,
    
    -- Indexes for performance
    INDEX idx_user_id ON repository_analyses(user_id),
    INDEX idx_status ON repository_analyses(status),
    INDEX idx_created_at ON repository_analyses(created_at DESC)
);

-- Enable Row Level Security
ALTER TABLE repository_analyses ENABLE ROW LEVEL SECURITY;

-- Create policy for users to see their own analyses
CREATE POLICY "Users can view own analyses" ON repository_analyses
    FOR SELECT USING (auth.uid()::text = user_id OR user_id = '@0xps');

-- Create policy for users to create their own analyses
CREATE POLICY "Users can create own analyses" ON repository_analyses
    FOR INSERT WITH CHECK (auth.uid()::text = user_id OR user_id = '@0xps');

-- Create policy for users to update their own analyses
CREATE POLICY "Users can update own analyses" ON repository_analyses
    FOR UPDATE USING (auth.uid()::text = user_id OR user_id = '@0xps');

-- Create policy for users to delete their own analyses
CREATE POLICY "Users can delete own analyses" ON repository_analyses
    FOR DELETE USING (auth.uid()::text = user_id OR user_id = '@0xps');

-- Create function to automatically update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update updated_at
CREATE TRIGGER update_repository_analyses_updated_at
    BEFORE UPDATE ON repository_analyses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();