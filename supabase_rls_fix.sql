-- Enable RLS on groups table if not already enabled
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

-- Also ensure group_members table has proper RLS policies
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