-- ============================================================
-- Systemized Health — Video Pipeline Schema Update
-- Migration: 003_update_video_status.sql
-- Run this in the Supabase SQL Editor
-- ============================================================

-- Drop the old constraint
ALTER TABLE videos DROP CONSTRAINT IF EXISTS videos_status_check;

-- Update existing records to match new taxonomy
UPDATE videos SET status = '#idea' WHERE status = 'Idea';
UPDATE videos SET status = '#write' WHERE status IN ('Script Ready', 'Ready for Audio Riff');
UPDATE videos SET status = '#film' WHERE status IN ('Ready to Film', 'Filming');
UPDATE videos SET status = '#edit' WHERE status IN ('Editing', 'In Production');
UPDATE videos SET status = '#published' WHERE status = 'Uploaded';

-- Apply the new constraint
ALTER TABLE videos
ADD CONSTRAINT videos_status_check CHECK (
    status IN (
        '#idea',
        '#write',
        '#film',
        '#edit',
        '#uploaded',
        '#published'
    )
);

-- Set default to #idea
ALTER TABLE videos ALTER COLUMN status SET DEFAULT '#idea';
