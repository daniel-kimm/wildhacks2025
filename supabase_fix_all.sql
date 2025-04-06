-- Fix for groups table
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

-- Fix for group_members table
-- Create group_members table if it doesn't exist
CREATE TABLE IF NOT EXISTS group_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT valid_role CHECK (role IN ('admin', 'member')),
  CONSTRAINT unique_group_member UNIQUE (group_id, user_id)
);

-- Enable RLS on group_members table
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view group members" ON group_members;
DROP POLICY IF EXISTS "Users can add themselves to groups" ON group_members;
DROP POLICY IF EXISTS "Users can remove themselves from groups" ON group_members;

-- Policy to allow users to view group members for groups they are members of
CREATE POLICY "Users can view group members" ON group_members
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM group_members AS gm
      WHERE gm.group_id = group_members.group_id
      AND gm.user_id = auth.uid()
    )
  );

-- Policy to allow users to add themselves to groups
CREATE POLICY "Users can add themselves to groups" ON group_members
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Policy to allow users to remove themselves from groups
CREATE POLICY "Users can remove themselves from groups" ON group_members
  FOR DELETE
  USING (user_id = auth.uid());

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS group_members_group_id_idx ON group_members(group_id);
CREATE INDEX IF NOT EXISTS group_members_user_id_idx ON group_members(user_id);

-- Fix for hangouts table
-- Create hangouts table if it doesn't exist
CREATE TABLE IF NOT EXISTS hangouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  price_limit INTEGER NOT NULL,
  distance_limit INTEGER NOT NULL,
  time_of_day TEXT NOT NULL,
  preferences TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  selected_activity TEXT,
  activity_details JSONB,
  
  CONSTRAINT valid_time_of_day CHECK (time_of_day IN ('morning', 'afternoon', 'evening', 'night')),
  CONSTRAINT valid_status CHECK (status IN ('pending', 'confirmed', 'cancelled'))
);

-- Enable RLS on hangouts table
ALTER TABLE hangouts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view hangouts for their groups" ON hangouts;
DROP POLICY IF EXISTS "Users can create hangouts for their groups" ON hangouts;
DROP POLICY IF EXISTS "Users can update hangouts for their groups" ON hangouts;

-- Policy to allow users to view hangouts for groups they are members of
CREATE POLICY "Users can view hangouts for their groups" ON hangouts
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = hangouts.group_id
      AND group_members.user_id = auth.uid()
    )
  );

-- Policy to allow users to create hangouts for groups they are members of
CREATE POLICY "Users can create hangouts for their groups" ON hangouts
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = hangouts.group_id
      AND group_members.user_id = auth.uid()
    )
  );

-- Policy to allow users to update hangouts for groups they are members of
CREATE POLICY "Users can update hangouts for their groups" ON hangouts
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = hangouts.group_id
      AND group_members.user_id = auth.uid()
    )
  );

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS hangouts_group_id_idx ON hangouts(group_id);
CREATE INDEX IF NOT EXISTS hangouts_status_idx ON hangouts(status); 