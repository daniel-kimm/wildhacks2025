-- Create hangouts table
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

-- Add RLS policies for hangouts
ALTER TABLE hangouts ENABLE ROW LEVEL SECURITY;

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