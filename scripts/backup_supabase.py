#!/usr/bin/env python3
"""
Systemized Health — Supabase Full Backup
scripts/backup_supabase.py

Dumps all Supabase tables to a timestamped JSON file in backups/.
Optionally also writes a CSV snapshot of the videos table.

Usage:
    python scripts/backup_supabase.py            # JSON backup
    python scripts/backup_supabase.py --csv      # JSON + CSV
    python scripts/backup_supabase.py --list     # List existing backups
"""

import os
import sys
import json
import csv
import argparse
from datetime import datetime, timezone

SCRIPT_DIR   = os.path.dirname(__file__)
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)
BACKUP_DIR   = os.path.join(PROJECT_ROOT, "backups")
sys.path.insert(0, SCRIPT_DIR)

from supabase_client import SupabaseClient


def run_backup(include_csv: bool = False):
    os.makedirs(BACKUP_DIR, exist_ok=True)

    db  = SupabaseClient()
    now = datetime.now(timezone.utc)
    ts  = now.strftime("%Y-%m-%d_%H%M%S")

    print(f"🔄 Starting Supabase backup — {ts}")

    # ── Pull all tables ──────────────────────────────────────────────────────
    payload = {
        "backup_timestamp": now.isoformat(),
        "tables": {}
    }

    tables = {
        # Video pipeline
        "videos":           lambda: db.get_all_videos(),
        "video_stats":      lambda: db._request("GET", "video_stats",    params={"order": "snapshot_date.desc"}) or [],
        "video_keywords":   lambda: db._request("GET", "video_keywords", params={"order": "video_id.asc"}) or [],
        "video_tasks":      lambda: db._request("GET", "video_tasks",    params={"order": "due_date.asc"}) or [],
        # CRM
        "clients":          lambda: db.get_all_clients(),
        "client_demographics": lambda: db._request("GET", "client_demographics", params={"order": "created_at.desc"}) or [],
        "discovery_calls":  lambda: db._request("GET", "discovery_calls", params={"order": "scheduled_time.desc"}) or [],
        "coaching_sessions":lambda: db._request("GET", "coaching_sessions", params={"order": "session_date.desc"}) or [],
        "coaching_notes":   lambda: db._request("GET", "coaching_notes", params={"order": "created_at.desc"}) or [],
    }

    for table_name, fetcher in tables.items():
        try:
            rows = fetcher()
            payload["tables"][table_name] = rows
            print(f"  ✅ {table_name}: {len(rows)} rows")
        except Exception as e:
            print(f"  ❌ {table_name}: {e}")
            payload["tables"][table_name] = []

    # ── Write JSON backup ────────────────────────────────────────────────────
    json_path = os.path.join(BACKUP_DIR, f"{ts}_backup.json")
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(payload, f, indent=2, default=str)
    print(f"\n💾 JSON backup saved → {json_path}")

    # ── Optional CSV snapshot of videos ─────────────────────────────────────
    if include_csv:
        videos    = payload["tables"].get("videos", [])
        csv_path  = os.path.join(BACKUP_DIR, f"{ts}_videos.csv")
        with open(csv_path, "w", newline="", encoding="utf-8") as f:
            writer = csv.writer(f)
            writer.writerow(["Video Number", "Code", "Format", "Title",
                             "Drop Date", "Status", "Uploaded Date", "Notes"])
            for v in videos:
                writer.writerow([
                    v.get("video_number", ""),
                    v.get("code", ""),
                    v.get("format_type", ""),
                    v.get("title", ""),
                    v.get("drop_date", "") or "",
                    v.get("status", ""),
                    v.get("uploaded_date", "") or "",
                    v.get("notes", "") or "",
                ])
        print(f"📄 CSV snapshot saved  → {csv_path}")

    # ── Summary ──────────────────────────────────────────────────────────────
    total_rows = sum(len(v) for v in payload["tables"].values())
    print(f"\n✅ Backup complete — {total_rows} total rows across {len(tables)} tables.")
    return json_path


def list_backups():
    if not os.path.exists(BACKUP_DIR):
        print("No backups directory found.")
        return
    files = sorted(
        [f for f in os.listdir(BACKUP_DIR) if f.endswith("_backup.json")],
        reverse=True
    )
    if not files:
        print("No backups found in backups/")
        return
    print(f"📦 Supabase Backups ({len(files)} found in backups/):")
    print("-" * 60)
    for fname in files:
        fpath = os.path.join(BACKUP_DIR, fname)
        size_kb = os.path.getsize(fpath) / 1024
        print(f"  {fname}  ({size_kb:.1f} KB)")


def main():
    parser = argparse.ArgumentParser(description="Supabase Full Backup")
    parser.add_argument("--csv",  action="store_true", help="Also write a CSV snapshot of the videos table")
    parser.add_argument("--list", action="store_true", help="List existing backup files")
    args = parser.parse_args()

    if args.list:
        list_backups()
    else:
        run_backup(include_csv=args.csv)


if __name__ == "__main__":
    main()
