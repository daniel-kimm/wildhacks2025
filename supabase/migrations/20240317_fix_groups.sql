-- Create groups table if it doesn't exist
CREATE TABLE IF NOT EXISTS groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on groups table
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their groups" ON groups;
DROP POLICY IF EXISTS "Users can create groups" ON groups;
DROP POLICY IF EXISTS "Users can update their groups" ON groups;
DROP POLICY IF EXISTS "Users can delete their groups" ON groups;

-- Policy to allow users to view groups they are members of
CREATE POLICY "Users can view their groups" ON groups
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = groups.id
      AND group_members.user_id = auth.uid()
    )
  );

-- Policy to allow users to create groups
CREATE POLICY "Users can create groups" ON groups
  FOR INSERT
  WITH CHECK (true);

-- Policy to allow users to update groups they are members of
CREATE POLICY "Users can update their groups" ON groups
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = groups.id
      AND group_members.user_id = auth.uid()
    )
  );

-- Policy to allow users to delete groups they created
CREATE POLICY "Users can delete their groups" ON groups
  FOR DELETE
  USING (created_by = auth.uid());

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS groups_created_by_idx ON groups(created_by); 