#!/usr/bin/env python3
"""
Systemized Health — Analytics Database Migration Script
scripts/migrate_analytics_db.py

Adds `channel_monthly_stats` and `eom_reports` tables to `database/videos.db` (SQLite).
Also verifies schema readiness.
"""

import os
import sys
import sqlite3

REPO_ROOT = os.path.dirname(os.path.dirname(__file__))
DB_PATH = os.path.join(REPO_ROOT, "database", "videos.db")

def migrate():
    if not os.path.exists(DB_PATH):
        print(f"Error: Database file not found at {DB_PATH}", file=sys.stderr)
        sys.exit(1)

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # 1. channel_monthly_stats table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS channel_monthly_stats (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        report_month TEXT UNIQUE NOT NULL, -- YYYY-MM
        total_videos INTEGER DEFAULT 0,
        long_videos_count INTEGER DEFAULT 0,
        short_videos_count INTEGER DEFAULT 0,
        total_views INTEGER DEFAULT 0,
        total_subscribers INTEGER DEFAULT 0,
        subscribers_gained INTEGER DEFAULT 0,
        total_likes INTEGER DEFAULT 0,
        total_comments INTEGER DEFAULT 0,
        total_watch_hours REAL DEFAULT 0.0,
        avg_ctr_pct REAL DEFAULT 0.0,
        avg_vph REAL DEFAULT 0.0,
        discovery_call_leads INTEGER DEFAULT 0,
        intensives_converted INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # 2. eom_reports table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS eom_reports (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        report_month TEXT UNIQUE NOT NULL, -- YYYY-MM
        report_title TEXT NOT NULL,
        summary_json TEXT, -- JSON blob of full report details (Top 5s, metrics, deltas)
        markdown_path TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # 3. Ensure video_stats has necessary columns if missing
    cursor.execute("PRAGMA table_info(video_stats);")
    existing_cols = {row[1] for row in cursor.fetchall()}
    
    new_cols = [
        ("subscribers_gained", "INTEGER DEFAULT 0"),
        ("vph", "REAL DEFAULT 0.0"),
        ("ctr_pct", "REAL DEFAULT 0.0"),
        ("outlier_score", "REAL DEFAULT 0.0")
    ]
    for col_name, col_def in new_cols:
        if col_name not in existing_cols:
            cursor.execute(f"ALTER TABLE video_stats ADD COLUMN {col_name} {col_def};")
            print(f"  + Added column '{col_name}' to video_stats table")

    conn.commit()
    conn.close()
    print("✅ Analytics database migration successfully completed for SQLite database/videos.db.")

if __name__ == "__main__":
    migrate()
