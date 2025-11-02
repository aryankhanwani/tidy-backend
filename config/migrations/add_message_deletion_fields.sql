-- Migration: Add deletion fields to messages table
-- Run this in Supabase SQL Editor if messages table already exists

ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS deleted_for_sender BOOLEAN DEFAULT FALSE;

ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS deleted_for_receiver BOOLEAN DEFAULT FALSE;

-- Add comments
COMMENT ON COLUMN messages.deleted_for_sender IS 'True if message is deleted for the sender';
COMMENT ON COLUMN messages.deleted_for_receiver IS 'True if message is deleted for the receiver';

