-- ============================================================
-- Systemized Health — Video Pipeline Schema
-- Migration: 002_video_pipeline.sql
-- Run this in the Supabase SQL Editor
-- ============================================================

-- ============================================================
-- TABLE 1: videos
-- Core metadata — one row per video
-- ============================================================
CREATE TABLE IF NOT EXISTS videos (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    video_number        TEXT UNIQUE NOT NULL,      -- "001", "002", etc.
    code                TEXT UNIQUE NOT NULL,      -- "80.V0B", "80.V0B-S1", etc.
    format_type         TEXT NOT NULL
                        CHECK (format_type IN ('Long', 'Short')),
    title               TEXT NOT NULL,
    description         TEXT,
    jdex_code           TEXT,                      -- JDex knowledge reference
    os_level            TEXT,                      -- e.g. "Level 1: FMR"
    folder_path         TEXT,                      -- Local Videos/ folder path
    status              TEXT NOT NULL DEFAULT 'Idea'
                        CHECK (status IN (
                            'Idea',
                            'Script Ready',
                            'Ready for Audio Riff',
                            'Ready to Film',
                            'Filming',
                            'Editing',
                            'In Production',
                            'Uploaded'
                        )),
    drop_date           DATE,
    uploaded_date       DATE,
    youtube_id          TEXT,
    primary_keyword     TEXT,
    vidiq_title_score   REAL DEFAULT 0.0,
    notes               TEXT,
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE 2: video_stats
-- Performance snapshots — multiple rows per video over time
-- ============================================================
CREATE TABLE IF NOT EXISTS video_stats (
    id                              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    video_id                        UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
    snapshot_date                   TIMESTAMPTZ DEFAULT NOW(),
    views                           INTEGER DEFAULT 0,
    vph                             REAL DEFAULT 0.0,
    impressions                     INTEGER DEFAULT 0,
    ctr_pct                         REAL DEFAULT 0.0,
    average_view_duration_seconds   INTEGER DEFAULT 0,
    retention_rate_pct              REAL DEFAULT 0.0,
    likes                           INTEGER DEFAULT 0,
    comments                        INTEGER DEFAULT 0,
    shares                          INTEGER DEFAULT 0,
    subscribers_gained              INTEGER DEFAULT 0,
    vidiq_score                     REAL DEFAULT 0.0,
    outlier_score                   REAL DEFAULT 0.0,
    notes                           TEXT
);

-- ============================================================
-- TABLE 3: video_keywords
-- vidIQ keyword intelligence — multiple rows per video
-- ============================================================
CREATE TABLE IF NOT EXISTS video_keywords (
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    video_id                    UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
    keyword                     TEXT NOT NULL,
    estimated_monthly_search    INTEGER DEFAULT 0,
    competition_score           REAL DEFAULT 0.0,
    overall_score               REAL DEFAULT 0.0,
    is_primary                  BOOLEAN DEFAULT FALSE
);

-- ============================================================
-- TABLE 4: video_tasks
-- Production tasks by phase — multiple rows per video
-- ============================================================
CREATE TABLE IF NOT EXISTS video_tasks (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    video_id        UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
    task_name       TEXT NOT NULL,
    phase           TEXT DEFAULT 'Phase I',
    status          TEXT DEFAULT 'Pending'
                    CHECK (status IN ('Pending', 'In Progress', 'Completed')),
    due_date        DATE,
    completed_at    TIMESTAMPTZ,
    notes           TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_videos_number      ON videos(video_number);
CREATE INDEX IF NOT EXISTS idx_videos_status      ON videos(status);
CREATE INDEX IF NOT EXISTS idx_videos_drop_date   ON videos(drop_date);
CREATE INDEX IF NOT EXISTS idx_stats_video        ON video_stats(video_id);
CREATE INDEX IF NOT EXISTS idx_stats_date         ON video_stats(snapshot_date);
CREATE INDEX IF NOT EXISTS idx_keywords_video     ON video_keywords(video_id);
CREATE INDEX IF NOT EXISTS idx_tasks_video        ON video_tasks(video_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status       ON video_tasks(status);

-- ============================================================
-- ROW LEVEL SECURITY — service role only
-- ============================================================
ALTER TABLE videos          ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_stats     ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_keywords  ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_tasks     ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access" ON videos
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access" ON video_stats
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access" ON video_keywords
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access" ON video_tasks
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ============================================================
-- AUTO-UPDATE updated_at on videos
-- ============================================================
CREATE TRIGGER trg_videos_updated
    BEFORE UPDATE ON videos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- SEED DATA — Current 16-video pipeline
-- ============================================================
INSERT INTO videos (video_number, code, format_type, title, status, drop_date, uploaded_date, jdex_code, os_level, notes)
VALUES
    ('001', '80.V0B',      'Long',  'Health Info & Biology Baseline',                                    'Uploaded',              '2026-08-03', '2026-07-26', '80.10', 'Level 1: FMR', 'Published'),
    ('002', '80.V0A',      'Long',  '230,000 Patient Visits',                                            'Uploaded',              '2026-08-17', '2026-07-26', '80.10', 'Baseline',     'Published'),
    ('003', '80.V1B1',     'Long',  'Exercise Optional (Movement Mandatory)',                             'Uploaded',              '2026-08-10', '2026-07-26', '77.01', 'Level 1: FMR', 'Published'),
    ('004', '80.V0A1',     'Long',  'Systemized OS Framework',                                           'In Production',         '2026-08-24', NULL,         '81.05', 'Level 1: FMR', 'Currently Editing'),
    ('005', '80.V0B-S1',   'Short', 'Why Health Information Alone Keeps You Broken',                     'Editing',               '2026-08-04', NULL,         '42.02', 'Level 1: FMR', '6/6 Shots Filmed — Editing (#edit)'),
    ('006', '80.V0B-S2',   'Short', 'The Hidden System Glitch Ruining Your Body',                        'Ready for Audio Riff',  '2026-08-06', NULL,         '77.03', 'Level 1: FMR', 'Pre-Recording Blueprint Ready'),
    ('007', '80.V0B-S3',   'Short', 'Stop Buying Health Advice from Coaches Who Dont Know Physiology',   'Ready for Audio Riff',  '2026-08-08', NULL,         '77.01', 'Level 1: FMR', 'Pre-Recording Blueprint Ready'),
    ('008', '80.V0A-S1',   'Short', 'The Biological Reason Monday Resolutions Always Fail',              'Editing',               '2026-08-18', NULL,         '41.03', 'Level 1: FMR', '6/6 Shots Filmed — Editing (#edit)'),
    ('009', '80.V0A-S2',   'Short', 'The Exact Biological Sequence Your Body Needs to Change',           'Editing',               '2026-08-20', NULL,         '42.04', 'Level 1: FMR', '6/6 Shots Filmed — Editing (#edit)'),
    ('010', '80.V0A-S3',   'Short', 'Stop Treating Your Health Like an Emergency Room',                  'Editing',               '2026-08-22', NULL,         '77.02', 'Level 1: FMR', '6/6 Shots Filmed — Editing (#edit)'),
    ('011', '80.V1B1-S1',  'Short', 'Why Exercise is Optional',                                          'Ready for Audio Riff',  '2026-08-11', NULL,         '77.01', 'Level 1: FMR', 'Pre-Recording Blueprint Ready'),
    ('012', '80.V1B1-S2',  'Short', 'Joint Imbibition: The Only Way Your Joints Actually Get Nourished', 'Ready for Audio Riff',  '2026-08-13', NULL,         '77.01', 'Level 1: FMR', 'Pre-Recording Blueprint Ready'),
    ('013', '80.V1B1-S3',  'Short', 'Cortical Smudging: Why Your Back Pain Randomly Spasms',             'Ready for Audio Riff',  '2026-08-15', NULL,         '77.03', 'Level 1: FMR', 'Pre-Recording Blueprint Ready'),
    ('014', '80.V0A1-S1',  'Short', 'Why Relying on Willpower Guarantees Physical Burnout',              'Editing',               '2026-08-25', NULL,         '42.06', 'Level 1: FMR', '6/6 Shots Filmed — Editing (#edit)'),
    ('015', '80.V0A1-S2',  'Short', 'The Level 1 FMR Baseline Every Body Needs to Master',               'Editing',               '2026-08-27', NULL,         '81.05', 'Level 1: FMR', '6/6 Shots Filmed — Editing (#edit)'),
    ('016', '80.V0A1-S3',  'Short', 'The 3-Tier Health Pyramid That Fixes Chronic Fatigue',              'Editing',               '2026-08-29', NULL,         '43.11', 'Level 1: FMR', '6/6 Shots Filmed — Editing (#edit)')
ON CONFLICT (video_number) DO UPDATE SET
    code            = EXCLUDED.code,
    title           = EXCLUDED.title,
    status          = EXCLUDED.status,
    drop_date       = EXCLUDED.drop_date,
    uploaded_date   = EXCLUDED.uploaded_date,
    notes           = EXCLUDED.notes,
    updated_at      = NOW();
