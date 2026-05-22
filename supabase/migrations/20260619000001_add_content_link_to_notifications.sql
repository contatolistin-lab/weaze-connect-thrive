-- Add content and link columns to notifications table
-- These are used by the TypeScript code for user-facing notification messages

ALTER TABLE public.notifications 
ADD COLUMN IF NOT EXISTS content TEXT,
ADD COLUMN IF NOT EXISTS link TEXT;
