#!/usr/bin/env python3
"""
Systemized Health — Restore Canonical Historical Videos
scripts/restore_historical_videos.py

Restores all 22 canonical historical published videos (H001-H007, HS001-HS015)
into Supabase and SQLite videos.db with status #published, accurate drop dates,
and verified YouTube video IDs.
"""

import sys
import os
import sqlite3
from pathlib import Path

# Add scripts directory to path
sys.path.insert(0, os.path.dirname(__file__))

from supabase_client import SupabaseClient

PROJECT_ROOT = Path(__file__).resolve().parent.parent
DB_PATH = PROJECT_ROOT / "database" / "videos.db"

CANONICAL_HISTORICAL_VIDEOS = [
    # ── Long Videos (7) ──────────────────────────────────────────────────────
    {
        "video_number": "H001",
        "code": "HIST.L01",
        "format_type": "Long",
        "title": "The Biological Requirement for Weekly Structure",
        "drop_date": "2026-01-01",
        "uploaded_date": "2026-01-01",
        "youtube_id": "7PBxkzu3l-Q",
        "status": "#published",
        "cards_created": True,
    },
    {
        "video_number": "H002",
        "code": "HIST.L02",
        "format_type": "Long",
        "title": "The Biological Reality of GLP-1: Fuel vs. Motivation",
        "drop_date": "2026-03-24",
        "uploaded_date": "2026-03-24",
        "youtube_id": "bvmmlepNU_I",
        "status": "#published",
        "cards_created": True,
    },
    {
        "video_number": "H003",
        "code": "HIST.L03",
        "format_type": "Long",
        "title": "The Nervous System Secret to Consistent Gains",
        "drop_date": "2026-01-22",
        "uploaded_date": "2026-01-22",
        "youtube_id": "cGXl54siR8c",
        "status": "#published",
        "cards_created": True,
    },
    {
        "video_number": "H004",
        "code": "HIST.L04",
        "format_type": "Long",
        "title": "The Biological Cost of an Unstructured Week",
        "drop_date": "2026-01-14",
        "uploaded_date": "2026-01-14",
        "youtube_id": "MGzcr5xWJ98",
        "status": "#published",
        "cards_created": True,
    },
    {
        "video_number": "H005",
        "code": "HIST.L05",
        "format_type": "Long",
        "title": "Decision Fatigue Is Destroying Your Productivity",
        "drop_date": "2026-01-06",
        "uploaded_date": "2026-01-06",
        "youtube_id": "gUQJlS9WgtY",
        "status": "#published",
        "cards_created": True,
    },
    {
        "video_number": "H006",
        "code": "HIST.L06",
        "format_type": "Long",
        "title": "The Metabolic Glitch Behind Morning Hunger",
        "drop_date": "2026-03-12",
        "uploaded_date": "2026-03-12",
        "youtube_id": "8_hrdHBkXHw",
        "status": "#published",
        "cards_created": True,
    },
    {
        "video_number": "H007",
        "code": "HIST.L07",
        "format_type": "Long",
        "title": "Why Supplements Cannot Fix a Broken Baseline",
        "drop_date": "2026-03-21",
        "uploaded_date": "2026-03-21",
        "youtube_id": "k_9aspbRXJE",
        "status": "#published",
        "cards_created": True,
    },

    # ── Short Videos (15) ────────────────────────────────────────────────────
    {
        "video_number": "HS001",
        "code": "HIST.S01",
        "format_type": "Short",
        "title": "The Biological Calibration for Morning Hunger",
        "drop_date": "2026-03-21",
        "uploaded_date": "2026-03-21",
        "youtube_id": "zHiBt3dbte4",
        "status": "#published",
        "cards_created": True,
    },
    {
        "video_number": "HS002",
        "code": "HIST.S02",
        "format_type": "Short",
        "title": "The Biological Mechanics of Habit Attachment",
        "drop_date": "2026-01-13",
        "uploaded_date": "2026-01-13",
        "youtube_id": "n2A3Wi2g2uM",
        "status": "#published",
        "cards_created": True,
    },
    {
        "video_number": "HS003",
        "code": "HIST.S03",
        "format_type": "Short",
        "title": "Your steps have been tracked your whole life",
        "drop_date": "2026-03-30",
        "uploaded_date": "2026-03-30",
        "youtube_id": "F16bN5jbV8w",
        "status": "#published",
        "cards_created": True,
    },
    {
        "video_number": "HS004",
        "code": "HIST.S04",
        "format_type": "Short",
        "title": "The Biological Prerequisite for Fasting",
        "drop_date": "2026-04-03",
        "uploaded_date": "2026-04-03",
        "youtube_id": "SzoLkKy67X8",
        "status": "#published",
        "cards_created": True,
    },
    {
        "video_number": "HS005",
        "code": "HIST.S05",
        "format_type": "Short",
        "title": "Start Running from ZERO",
        "drop_date": "2026-02-07",
        "uploaded_date": "2026-02-07",
        "youtube_id": "8FKzFafJ6lY",
        "status": "#published",
        "cards_created": True,
    },
    {
        "video_number": "HS006",
        "code": "HIST.S06",
        "format_type": "Short",
        "title": "The Neurological Function of Clarity",
        "drop_date": "2026-01-15",
        "uploaded_date": "2026-01-15",
        "youtube_id": "h957-iWfypA",
        "status": "#published",
        "cards_created": True,
    },
    {
        "video_number": "HS007",
        "code": "HIST.S07",
        "format_type": "Short",
        "title": "The Biological Failure of Motivation",
        "drop_date": "2026-01-08",
        "uploaded_date": "2026-01-08",
        "youtube_id": "YT_6EukW9M4",
        "status": "#published",
        "cards_created": True,
    },
    {
        "video_number": "HS008",
        "code": "HIST.S08",
        "format_type": "Short",
        "title": "The Neurological Reality of Willpower",
        "drop_date": "2026-01-07",
        "uploaded_date": "2026-01-07",
        "youtube_id": "iH7R_MXE92s",
        "status": "#published",
        "cards_created": True,
    },
    {
        "video_number": "HS009",
        "code": "HIST.S09",
        "format_type": "Short",
        "title": "The Biological Minimum for Daily Steps",
        "drop_date": "2026-03-23",
        "uploaded_date": "2026-03-23",
        "youtube_id": "-ps4rpApMl8",
        "status": "#published",
        "cards_created": True,
    },
    {
        "video_number": "HS010",
        "code": "HIST.S10",
        "format_type": "Short",
        "title": "The Neurological Failure of Random Workouts",
        "drop_date": "2026-01-20",
        "uploaded_date": "2026-01-20",
        "youtube_id": "oS-1-se9-Vw",
        "status": "#published",
        "cards_created": True,
    },
    {
        "video_number": "HS011",
        "code": "HIST.S11",
        "format_type": "Short",
        "title": "The Neurological Cost of GLP-1",
        "drop_date": "2026-03-26",
        "uploaded_date": "2026-03-26",
        "youtube_id": "-jvtwj_tTpE",
        "status": "#published",
        "cards_created": True,
    },
    {
        "video_number": "HS012",
        "code": "HIST.S12",
        "format_type": "Short",
        "title": "The Biological Mandate for Recovery",
        "drop_date": "2026-01-21",
        "uploaded_date": "2026-01-21",
        "youtube_id": "qSDkAcapvT0",
        "status": "#published",
        "cards_created": True,
    },
    {
        "video_number": "HS013",
        "code": "HIST.S13",
        "format_type": "Short",
        "title": "The Biological Necessity of Weekly Structure",
        "drop_date": "2026-01-13",
        "uploaded_date": "2026-01-13",
        "youtube_id": "Y8yEZnk6uSw",
        "status": "#published",
        "cards_created": True,
    },
    {
        "video_number": "HS014",
        "code": "HIST.S14",
        "format_type": "Short",
        "title": "The Neurological Cost of Decision Fatigue",
        "drop_date": "2026-01-16",
        "uploaded_date": "2026-01-16",
        "youtube_id": "AtMN9oEjR2s",
        "status": "#published",
        "cards_created": True,
    },
    {
        "video_number": "HS015",
        "code": "HIST.S15",
        "format_type": "Short",
        "title": "The Clinical Architecture of Anchor Habits",
        "drop_date": "2026-01-09",
        "uploaded_date": "2026-01-09",
        "youtube_id": "_Mzizq3SDW8",
        "status": "#published",
        "cards_created": True,
    },
]


def restore_videos():
    print("🚀 Restoring 22 Canonical Historical Videos...")

    # 1. Update SQLite
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    for v in CANONICAL_HISTORICAL_VIDEOS:
        cursor.execute("""
            INSERT INTO videos (video_number, code, format_type, title, status, drop_date, uploaded_date, youtube_id, cards_created)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(video_number) DO UPDATE SET
                code = excluded.code,
                format_type = excluded.format_type,
                title = excluded.title,
                status = excluded.status,
                drop_date = excluded.drop_date,
                uploaded_date = excluded.uploaded_date,
                youtube_id = excluded.youtube_id,
                cards_created = excluded.cards_created;
        """, (
            v["video_number"],
            v["code"],
            v["format_type"],
            v["title"],
            v["status"],
            v["drop_date"],
            v["uploaded_date"],
            v["youtube_id"],
            1 if v.get("cards_created") else 0
        ))

    conn.commit()
    conn.close()
    print("✅ Successfully updated SQLite database/videos.db.")

    # 2. Update Supabase
    sb = SupabaseClient()
    sb_success = 0
    for v in CANONICAL_HISTORICAL_VIDEOS:
        res = sb.upsert_video({
            "video_number": v["video_number"],
            "code": v["code"],
            "format_type": v["format_type"],
            "title": v["title"],
            "status": v["status"],
            "drop_date": v["drop_date"],
            "uploaded_date": v["uploaded_date"],
            "youtube_id": v["youtube_id"],
            "cards_created": v.get("cards_created", True)
        })
        if res:
            sb_success += 1
            print(f"  ✓ Supabase synced: [{v['video_number']}] {v['code']} - {v['title']}")
        else:
            print(f"  ❌ Supabase error syncing: [{v['video_number']}] {v['code']}")

    print(f"✅ Successfully synced {sb_success}/{len(CANONICAL_HISTORICAL_VIDEOS)} videos to Supabase.")


if __name__ == "__main__":
    restore_videos()
