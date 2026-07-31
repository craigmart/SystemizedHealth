-- ============================================================
-- Systemized Health — Supabase CRM Schema
-- Migration: 001_initial_schema.sql
-- Run this once in Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- TABLE 1: clients
-- Core contact record — one row per person
-- ============================================================
CREATE TABLE IF NOT EXISTS clients (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            TEXT NOT NULL,
    email           TEXT UNIQUE NOT NULL,
    phone           TEXT,
    source_video    TEXT DEFAULT 'V0B Discovery Call',
    status          TEXT DEFAULT 'Lead'
                    CHECK (status IN ('Lead', 'Booked', 'Agreement Signed', 'Active Client', 'Inactive', 'No-Show', 'Cancelled')),
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE 2: client_demographics
-- One row per client — health & personal info
-- ============================================================
CREATE TABLE IF NOT EXISTS client_demographics (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id           UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    date_of_birth       DATE,
    gender              TEXT,
    city                TEXT,
    state               TEXT,
    occupation          TEXT,
    referral_source     TEXT,          -- How they heard about Systemized Health
    chief_complaint     TEXT,          -- Primary coaching concern
    health_goals        TEXT,          -- What they want to achieve
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(client_id)
);

-- ============================================================
-- TABLE 3: discovery_calls
-- One row per TidyCal booking — onboarding funnel tracking
-- ============================================================
CREATE TABLE IF NOT EXISTS discovery_calls (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id               UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    tidycal_booking_id      TEXT UNIQUE,
    scheduled_time          TIMESTAMPTZ,
    status                  TEXT DEFAULT 'Booked'
                            CHECK (status IN ('Booked', 'Agreement Sent', 'Agreement Signed', 'Completed', 'No-Show', 'Cancelled')),
    primary_glitch          TEXT,          -- Intake answer: main bottleneck
    os_level_focus          TEXT,          -- Intake answer: OS level
    fathom_transcript_url   TEXT,          -- Fathom call recording link
    breezedoc_agreement_url TEXT,          -- Signed agreement URL
    notes                   TEXT,
    created_at              TIMESTAMPTZ DEFAULT NOW(),
    updated_at              TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE 4: coaching_sessions
-- One row per coaching call or visit
-- ============================================================
CREATE TABLE IF NOT EXISTS coaching_sessions (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id           UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    session_date        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    session_type        TEXT DEFAULT 'Follow-up'
                        CHECK (session_type IN ('Initial', 'Follow-up', 'Check-in', 'Emergency', 'Group')),
    chief_concern       TEXT,          -- What the client reported today
    current_protocols   TEXT,          -- What they are currently doing
    assessment          TEXT,          -- Your clinical impression
    plan                TEXT,          -- Changes / new protocols assigned
    homework            TEXT,          -- Action items for client
    next_session_date   TIMESTAMPTZ,
    fathom_url          TEXT,          -- Call recording link
    -- SOAP fields
    soap_subjective     TEXT,
    soap_objective      TEXT,
    soap_assessment     TEXT,
    soap_plan           TEXT,
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE 5: coaching_notes
-- Free-form timestamped notes — quick entries, not full sessions
-- ============================================================
CREATE TABLE IF NOT EXISTS coaching_notes (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id   UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    note        TEXT NOT NULL,
    note_type   TEXT DEFAULT 'General'
                CHECK (note_type IN ('General', 'Progress', 'Concern', 'Milestone', 'Admin')),
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEXES for fast lookups
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_clients_email       ON clients(email);
CREATE INDEX IF NOT EXISTS idx_clients_status      ON clients(status);
CREATE INDEX IF NOT EXISTS idx_disc_calls_client   ON discovery_calls(client_id);
CREATE INDEX IF NOT EXISTS idx_disc_calls_tidycal  ON discovery_calls(tidycal_booking_id);
CREATE INDEX IF NOT EXISTS idx_coaching_client     ON coaching_sessions(client_id);
CREATE INDEX IF NOT EXISTS idx_coaching_date       ON coaching_sessions(session_date);
CREATE INDEX IF NOT EXISTS idx_notes_client        ON coaching_notes(client_id);

-- ============================================================
-- ROW LEVEL SECURITY — service role only
-- ============================================================
ALTER TABLE clients              ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_demographics  ENABLE ROW LEVEL SECURITY;
ALTER TABLE discovery_calls      ENABLE ROW LEVEL SECURITY;
ALTER TABLE coaching_sessions    ENABLE ROW LEVEL SECURITY;
ALTER TABLE coaching_notes       ENABLE ROW LEVEL SECURITY;

-- Allow service role full access (your Python scripts use this)
CREATE POLICY "Service role full access" ON clients
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access" ON client_demographics
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access" ON discovery_calls
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access" ON coaching_sessions
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access" ON coaching_notes
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ============================================================
-- AUTO-UPDATE updated_at on row changes
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_clients_updated
    BEFORE UPDATE ON clients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_demographics_updated
    BEFORE UPDATE ON client_demographics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_discovery_calls_updated
    BEFORE UPDATE ON discovery_calls
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_coaching_sessions_updated
    BEFORE UPDATE ON coaching_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
