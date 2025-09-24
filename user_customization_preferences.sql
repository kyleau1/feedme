-- User Customization Preferences Table
-- Stores user's preferred customizations for menu items

CREATE TABLE IF NOT EXISTS user_customization_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  item_id UUID NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
  customizations JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, item_id)
);

-- Add RLS policies
ALTER TABLE user_customization_preferences ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access their own preferences
CREATE POLICY "Users can access their own customization preferences" ON user_customization_preferences
  FOR ALL USING (auth.uid()::text = user_id);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_user_customization_preferences_user_id 
  ON user_customization_preferences(user_id);

CREATE INDEX IF NOT EXISTS idx_user_customization_preferences_item_id 
  ON user_customization_preferences(item_id);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_customization_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_customization_preferences_updated_at
  BEFORE UPDATE ON user_customization_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_user_customization_preferences_updated_at();
