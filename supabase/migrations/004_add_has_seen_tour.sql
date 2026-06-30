-- Migration: add_has_seen_tour
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS has_seen_tour BOOLEAN DEFAULT FALSE;
