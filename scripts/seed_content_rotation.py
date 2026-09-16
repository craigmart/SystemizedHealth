#!/usr/bin/env python3
"""
Systemized Health — Seed Content Rotation Schedule
scripts/seed_content_rotation.py

Reads docs/content_rotation.csv and syncs the entire 12-month rotation
schedule into Supabase and local SQLite database:
1. Migrates legacy placeholders TBD-027 through TBD-032 to canonical rotation codes:
   - 80.V2A-S2 (2026-09-17)
   - 80.V2A-S3 (2026-09-19)
   - 80.V3A1   (2026-09-21)
   - 80.V3A1-S1 (2026-09-22)
   - 80.V3A1-S2 (2026-09-24)
   - 80.V3A1-S3 (2026-09-26)
2. Upserts videos 037 to 244 for all subsequent rotation drops through September 2027.
3. Generates pipeline/public/content_rotation.json for instant frontend lookups.
4. Refreshes video pipeline cache, iCal calendar, and Drop_Schedule.md.
"""

import csv
import json
import sqlite3
import sys
from datetime import datetime
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
CSV_FILE = PROJECT_ROOT / "docs" / "content_rotation.csv"
PUBLIC_ROTATION_JSON = PROJECT_ROOT / "pipeline" / "public" / "content_rotation.json"
SQLITE_DB = PROJECT_ROOT / "database" / "videos.db"

sys.path.insert(0, str(Path(__file__).parent))
from supabase_client import SupabaseClient


def build_rotation_records():
    if not CSV_FILE.exists():
        print(f"❌ File not found: {CSV_FILE}")
        sys.exit(1)

    with open(CSV_FILE, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        rows = list(reader)

    # Topic leaf counts based on already-published library:
    # 80.V1A has V1A (count: 1) -> next long is V1A2
    # 80.V1B has V1B1, V1B2 (count: 2) -> next long is V1B3
    # 80.V1C has V1C1 (count: 1) -> next long is V1C2
    # 80.V2A has no long yet (count: 0) -> next long is V2A1
    # 80.V2B has V2B1-S1 -> next long starts at V2B2
    # 80.V2C has V2C1 (count: 1) -> next long is V2C2
    # 80.V3A, V3B, V3C, V4 -> start at 1
    long_counts = {
        "V1A": 1,
        "V1B": 2,
        "V1C": 1,
        "V2A": 0,
        "V2B": 1,
        "V2C": 1,
        "V3A": 0,
        "V3B": 0,
        "V3C": 0,
        "V4": 0,
    }

    # Initial parent codes for initial shorts before the first Long of that leaf drops
    current_long_code = {
        "V2A": "80.V2A" # rows 1 & 2 are 80.V2A-S2 and 80.V2A-S3
    }

    records = []

    for idx, r in enumerate(rows):
        base_code = r["Code"].strip()
        fmt = r["Format"].strip()
        raw_date = r["Drop Date"].strip()
        level = r["Level"].strip()
        pillar = r["Pillar"].strip()

        # Parse date MM/DD/YYYY -> YYYY-MM-DD
        dt = datetime.strptime(raw_date, "%m/%d/%Y")
        drop_date = dt.strftime("%Y-%m-%d")

        is_long = (fmt == "Long")
        format_type = "Long" if is_long else "Short"

        if is_long:
            long_counts[base_code] += 1
            num = long_counts[base_code]
            if base_code == "V4":
                code = f"80.V4-{num:02d}"
            else:
                code = f"80.{base_code}{num}"
            current_long_code[base_code] = code
        else:
            s_num = fmt.split()[-1] # '1', '2', '3'
            parent = current_long_code.get(base_code, f"80.{base_code}1")
            code = f"{parent}-S{s_num}"

        # Assign video_number:
        # Rows 0..5 correspond to legacy slots 027..032
        if idx < 6:
            video_number = f"{27 + idx:03d}"
        else:
            video_number = f"{37 + (idx - 6):03d}"

        # Title: Level & Pillar guidance before transcript
        if is_long:
            title = f"{level} — {pillar}"
        else:
            title = f"{level} — {pillar} ({fmt})"

        jdex_code = f"80.{base_code}" if not base_code.startswith("80.") else base_code

        record = {
            "video_number": video_number,
            "code": code,
            "format_type": format_type,
            "title": title,
            "drop_date": drop_date,
            "status": "#idea",
            "os_level": level,
            "jdex_code": jdex_code,
            "notes": f"Pillar: {pillar} | Format: {fmt} | Rotation Schedule",
            "cards_created": True, # Pre-production ideas don't block WIP cards
            "pillar": pillar,
            "rotation_format": fmt,
        }
        records.append(record)

    return records


def sync_to_supabase_and_sqlite(records):
    db = SupabaseClient()
    print(f"Connecting to Supabase at {db.base_url}...")

    # Write public JSON for frontend
    PUBLIC_ROTATION_JSON.parent.mkdir(parents=True, exist_ok=True)
    with open(PUBLIC_ROTATION_JSON, "w", encoding="utf-8") as f:
        json.dump(records, f, indent=2)
    print(f"  ✅ Saved rotation catalog → {PUBLIC_ROTATION_JSON} ({len(records)} entries)")

    # Prepare SQLite connection
    conn = sqlite3.connect(SQLITE_DB)
    cursor = conn.cursor()

    print(f"\nUpserting {len(records)} rotation records to Supabase & SQLite...")
    success_count = 0

    for i, r in enumerate(records):
        db_payload = {
            "video_number": r["video_number"],
            "code": r["code"],
            "format_type": r["format_type"],
            "title": r["title"],
            "drop_date": r["drop_date"],
            "status": r["status"],
            "os_level": r["os_level"],
            "jdex_code": r["jdex_code"],
            "notes": r["notes"],
            "cards_created": r["cards_created"]
        }

        # Supabase upsert
        res = db.upsert_video(db_payload)
        if res:
            success_count += 1
        else:
            print(f"  ⚠️ Warning: Failed Supabase upsert for {r['code']} ({r['video_number']})")

        # SQLite upsert
        cursor.execute("""
            INSERT INTO videos (video_number, code, format_type, title, status, drop_date, os_level, jdex_code, description, cards_created)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(video_number) DO UPDATE SET
                code = excluded.code,
                format_type = excluded.format_type,
                title = CASE WHEN videos.status IN ('#published', '#uploaded', '#edit') AND videos.title != 'Placeholder' THEN videos.title ELSE excluded.title END,
                status = CASE WHEN videos.status IN ('#published', '#uploaded', '#edit') THEN videos.status ELSE excluded.status END,
                drop_date = excluded.drop_date,
                os_level = excluded.os_level,
                jdex_code = excluded.jdex_code,
                description = excluded.description,
                cards_created = excluded.cards_created
        """, (
            r["video_number"],
            r["code"],
            r["format_type"],
            r["title"],
            r["status"],
            r["drop_date"],
            r["os_level"],
            r["jdex_code"],
            r["notes"],
            1 if r["cards_created"] else 0
        ))

        if (i + 1) % 25 == 0 or (i + 1) == len(records):
            print(f"  Processed {i + 1}/{len(records)} records...")

    conn.commit()
    conn.close()
    print(f"\n✅ Upserted {success_count}/{len(records)} videos into Supabase & SQLite.")


def main():
    records = build_rotation_records()
    print(f"Generated {len(records)} rotation records from {CSV_FILE.name}.")
    sync_to_supabase_and_sqlite(records)

    # Regenerate cache, iCalendar feed, Drop_Schedule.md
    print("\nRefreshing pipeline cache, iCal calendar, and drop schedule...")
    from video_pipeline import cmd_cache
    db = SupabaseClient()
    cmd_cache(db)
    print("\n🎉 Content rotation schedule successfully synced!")


if __name__ == "__main__":
    main()
