-- Migration: add created_by to events table
-- Run this if the database already exists (instead of re-running schema.sql)

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS created_by INTEGER REFERENCES users(id) ON DELETE SET NULL;
