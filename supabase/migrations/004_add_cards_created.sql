-- ============================================================
-- Systemized Health — Video Pipeline Schema Update
-- Migration: 004_add_cards_created.sql
-- ============================================================

ALTER TABLE videos ADD COLUMN IF NOT EXISTS cards_created BOOLEAN DEFAULT FALSE;
