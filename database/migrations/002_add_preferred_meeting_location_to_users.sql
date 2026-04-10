-- Migration: add preferred_meeting_location to users table
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS preferred_meeting_location VARCHAR(20) DEFAULT NULL;
