-- Add pinning fields to topic_messages for conversation comments
ALTER TABLE topic_messages
ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS pinned_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS pinned_by UUID REFERENCES profiles(id);

-- Create index for faster pinned comments queries
CREATE INDEX IF NOT EXISTS idx_topic_messages_pinned ON topic_messages(topic_id, is_pinned) WHERE is_pinned = TRUE;