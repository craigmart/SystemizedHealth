#!/usr/bin/env python3
"""
Systemized Health — Video Database Manager & CLI Engine
scripts/db_manager.py

Data source: Supabase (cloud) via supabase_client.SupabaseClient
Previously: database/videos.db (SQLite) — now retired as source of truth.

Schema in Supabase:
  - videos         (Metadata & Drop Dates)
  - video_stats    (vidIQ & Performance Analytics)
  - video_keywords (vidIQ Keyword Intelligence)
  - video_tasks    (Production Tasks & Due Dates)

Usage Examples:
  python scripts/db_manager.py --list
  python scripts/db_manager.py --calendar
  python scripts/db_manager.py --seed
  python scripts/db_manager.py --json
  python scripts/db_manager.py --export-csv
  python scripts/db_manager.py --add-task "004" --task "Record Audio Dictation" --phase "Phase I" --due "2026-08-10"
  python scripts/db_manager.py --update-status "005" --status "Uploaded"
"""

import sys
import os
import json
import csv
import argparse
from datetime import datetime

# ── Resolve project root & import shared Supabase client ────────────────────
SCRIPT_DIR = os.path.dirname(__file__)
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)
sys.path.insert(0, SCRIPT_DIR)

from supabase_client import SupabaseClient

CSV_PATH = os.path.join(PROJECT_ROOT, "Master_Video_Pipeline.csv")

PIPELINE_SEED = [
    {"video_number": "001", "code": "80.V0B",     "format_type": "Long",  "title": "Knowledge Isn't Enough—Here's What Actually Works",       "status": "Uploaded",             "drop_date": "2026-08-03", "uploaded_date": "2026-07-26", "jdex_code": "80.10", "os_level": "Level 1: FMR", "notes": "Published"},
    {"video_number": "002", "code": "80.V0A",     "format_type": "Long",  "title": "230,000 Patient Visits",                                          "status": "Uploaded",             "drop_date": "2026-08-17", "uploaded_date": "2026-07-26", "jdex_code": "80.10", "os_level": "Baseline",     "notes": "Published"},
    {"video_number": "003", "code": "80.V1B1",    "format_type": "Long",  "title": "Exercise Optional (Movement Mandatory)",                           "status": "Uploaded",             "drop_date": "2026-08-10", "uploaded_date": "2026-07-26", "jdex_code": "77.01", "os_level": "Level 1: FMR", "notes": "Published"},
    {"video_number": "004", "code": "80.V0A1",    "format_type": "Long",  "title": "Systemized OS Framework",                                         "status": "In Production",        "drop_date": "2026-08-24", "uploaded_date": None,         "jdex_code": "81.05", "os_level": "Level 1: FMR", "notes": "Currently Editing"},
    {"video_number": "005", "code": "80.V0B-S1",  "format_type": "Short", "title": "Why Health Information Alone Keeps You Broken",                   "status": "Editing",              "drop_date": "2026-08-04", "uploaded_date": None,         "jdex_code": "42.02", "os_level": "Level 1: FMR", "notes": "6/6 Shots Filmed — Editing (#edit)"},
    {"video_number": "006", "code": "80.V0B-S2",  "format_type": "Short", "title": "The Hidden System Glitch Ruining Your Body",                      "status": "Ready for Audio Riff", "drop_date": "2026-08-06", "uploaded_date": None,         "jdex_code": "77.03", "os_level": "Level 1: FMR", "notes": "Pre-Recording Blueprint Ready"},
    {"video_number": "007", "code": "80.V0B-S3",  "format_type": "Short", "title": "Stop Buying Health Advice from Coaches Who Dont Know Physiology",  "status": "Ready for Audio Riff", "drop_date": "2026-08-08", "uploaded_date": None,         "jdex_code": "77.01", "os_level": "Level 1: FMR", "notes": "Pre-Recording Blueprint Ready"},
    {"video_number": "008", "code": "80.V0A-S1",  "format_type": "Short", "title": "The Biological Reason Monday Resolutions Always Fail",             "status": "Editing",              "drop_date": "2026-08-18", "uploaded_date": None,         "jdex_code": "41.03", "os_level": "Level 1: FMR", "notes": "6/6 Shots Filmed — Editing (#edit)"},
    {"video_number": "009", "code": "80.V0A-S2",  "format_type": "Short", "title": "The Exact Biological Sequence Your Body Needs to Change",          "status": "Editing",              "drop_date": "2026-08-20", "uploaded_date": None,         "jdex_code": "42.04", "os_level": "Level 1: FMR", "notes": "6/6 Shots Filmed — Editing (#edit)"},
    {"video_number": "010", "code": "80.V0A-S3",  "format_type": "Short", "title": "Stop Treating Your Health Like an Emergency Room",                 "status": "Editing",              "drop_date": "2026-08-22", "uploaded_date": None,         "jdex_code": "77.02", "os_level": "Level 1: FMR", "notes": "6/6 Shots Filmed — Editing (#edit)"},
    {"video_number": "011", "code": "80.V1B1-S1", "format_type": "Short", "title": "Why Exercise is Optional",                                         "status": "Ready for Audio Riff", "drop_date": "2026-08-11", "uploaded_date": None,         "jdex_code": "77.01", "os_level": "Level 1: FMR", "notes": "Pre-Recording Blueprint Ready"},
    {"video_number": "012", "code": "80.V1B1-S2", "format_type": "Short", "title": "Joint Imbibition: The Only Way Your Joints Actually Get Nourished", "status": "Ready for Audio Riff", "drop_date": "2026-08-13", "uploaded_date": None,         "jdex_code": "77.01", "os_level": "Level 1: FMR", "notes": "Pre-Recording Blueprint Ready"},
    {"video_number": "013", "code": "80.V1B1-S3", "format_type": "Short", "title": "Cortical Smudging: Why Your Back Pain Randomly Spasms",            "status": "Ready for Audio Riff", "drop_date": "2026-08-15", "uploaded_date": None,         "jdex_code": "77.03", "os_level": "Level 1: FMR", "notes": "Pre-Recording Blueprint Ready"},
    {"video_number": "014", "code": "80.V0A1-S1", "format_type": "Short", "title": "Why Relying on Willpower Guarantees Physical Burnout",             "status": "Editing",              "drop_date": "2026-08-25", "uploaded_date": None,         "jdex_code": "42.06", "os_level": "Level 1: FMR", "notes": "6/6 Shots Filmed — Editing (#edit)"},
    {"video_number": "015", "code": "80.V0A1-S2", "format_type": "Short", "title": "The Level 1 FMR Baseline Every Body Needs to Master",              "status": "Editing",              "drop_date": "2026-08-27", "uploaded_date": None,         "jdex_code": "81.05", "os_level": "Level 1: FMR", "notes": "6/6 Shots Filmed — Editing (#edit)"},
    {"video_number": "016", "code": "80.V0A1-S3", "format_type": "Short", "title": "The 3-Tier Health Pyramid That Fixes Chronic Fatigue",             "status": "Editing",              "drop_date": "2026-08-29", "uploaded_date": None,         "jdex_code": "43.11", "os_level": "Level 1: FMR", "notes": "6/6 Shots Filmed — Editing (#edit)"},
]

DEFAULT_TASKS = [
    ("Phase I: Audio Dictation (-A)",  "Phase I",  "2026-08-01"),
    ("Phase II: Script Blueprint (-B)", "Phase II", "2026-08-05"),
    ("Phase III: On-Camera Filming",    "Phase III", "2026-08-10"),
    ("Phase III: Workflowy Sync",       "Phase III", "2026-08-12"),
]


# ── seed ─────────────────────────────────────────────────────────────────────
def seed_db():
    db = SupabaseClient()
    print(f"Seeding {len(PIPELINE_SEED)} videos to Supabase...")
    for v in PIPELINE_SEED:
        result = db.upsert_video(v)
        if result:
            print(f"  ✅ {result['video_number']} — {result['title'][:50]}")
            # Seed default tasks for non-uploaded videos
            if v["status"] != "Uploaded":
                video_id = result["id"]
                existing = db.get_tasks(video_id)
                existing_names = {t["task_name"] for t in existing}
                for t_name, t_phase, t_due in DEFAULT_TASKS:
                    if t_name not in existing_names:
                        db.add_video_task(video_id, {
                            "task_name": t_name,
                            "phase": t_phase,
                            "status": "Pending",
                            "due_date": t_due,
                        })
        else:
            print(f"  ❌ Failed to upsert video_number={v['video_number']}")
    print("Seed complete.")


# ── list ──────────────────────────────────────────────────────────────────────
def list_videos():
    db = SupabaseClient()
    videos = db.get_all_videos()
    if not videos:
        print("No videos found in Supabase.")
        return

    print("=" * 115)
    print(f"{'#':<5} | {'Code':<12} | {'Fmt':<6} | {'Title':<44} | {'Drop Date':<11} | {'Status':<20} | {'Views':<6}")
    print("=" * 115)
    for v in videos:
        stats = db.get_latest_stats(v["id"]) or {}
        views = stats.get("views", 0)
        fmt   = v.get("format_type", "")
        title = v.get("title", "")[:44]
        drop  = v.get("drop_date") or "—"
        status = v.get("status", "")
        print(f"{v['video_number']:<5} | {v['code']:<12} | {fmt:<6} | {title:<44} | {drop:<11} | {status:<20} | {views:<6}")
    print("=" * 115)
    print(f"Total: {len(videos)} videos")


# ── calendar ──────────────────────────────────────────────────────────────────
def show_calendar():
    db = SupabaseClient()
    videos = db.get_all_videos()

    events_by_date = {}

    for v in videos:
        drop = v.get("drop_date")
        if drop:
            events_by_date.setdefault(drop, []).append(
                f"🎬 [DROP {v['format_type']}] {v['code']} — {v['title']} ({v['status']})"
            )
        # Pull open tasks
        tasks = db.get_tasks(v["id"], open_only=True)
        for t in tasks:
            due = t.get("due_date")
            if due:
                events_by_date.setdefault(due, []).append(
                    f"⏳ [TASK DUE] {v['code']} — {t['task_name']}"
                )

    print("=" * 90)
    print(" 📅 SYSTEMIZED HEALTH — DYNAMIC PUBLICATION & TASK CALENDAR")
    print("=" * 90)
    for dt in sorted(events_by_date.keys()):
        print(f"\n📌 Date: {dt}")
        print("-" * 90)
        for ev in events_by_date[dt]:
            print(f"   {ev}")
    print("=" * 90)


# ── export json ───────────────────────────────────────────────────────────────
def export_json():
    db = SupabaseClient()
    videos = db.get_all_videos()
    for v in videos:
        v["latest_stats"]  = db.get_latest_stats(v["id"])
        v["tasks"]         = db.get_tasks(v["id"])
        v["keywords"]      = db.get_keywords(v["id"])
    return json.dumps(videos, indent=2, default=str)


# ── export csv ────────────────────────────────────────────────────────────────
def export_csv():
    db = SupabaseClient()
    videos = db.get_all_videos()
    with open(CSV_PATH, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["Video Number", "Code", "Format", "Title", "Drop Date",
                         "Status", "Uploaded Date", "Notes"])
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
    print(f"Exported {len(videos)} videos to CSV: {CSV_PATH}")


# ── add task ──────────────────────────────────────────────────────────────────
def add_task(video_ref: str, task_name: str, phase: str = "Phase I", due_date: str = None):
    db = SupabaseClient()
    # Accept video_number or code
    video = db.get_video_by_number(video_ref) or db.get_video_by_code(video_ref)
    if not video:
        print(f"Error: Video '{video_ref}' not found in Supabase.")
        return
    result = db.add_video_task(video["id"], {
        "task_name": task_name,
        "phase": phase,
        "status": "Pending",
        "due_date": due_date,
    })
    if result:
        print(f"✅ Added task '{task_name}' for video {video['video_number']} ({video['code']}). Due: {due_date}")
    else:
        print("❌ Failed to add task.")


# ── update status ─────────────────────────────────────────────────────────────
def update_status(video_ref: str, status: str, uploaded_date: str = None):
    db = SupabaseClient()
    video = db.get_video_by_number(video_ref) or db.get_video_by_code(video_ref)
    if not video:
        print(f"Error: Video '{video_ref}' not found in Supabase.")
        return
    extra = {}
    if uploaded_date:
        extra["uploaded_date"] = uploaded_date
    elif status == "Uploaded":
        extra["uploaded_date"] = datetime.today().strftime("%Y-%m-%d")
    result = db.update_video_status(video["video_number"], status, extra)
    if result:
        print(f"✅ Updated {video['video_number']} — {video['title'][:50]}")
        print(f"   Status: {result.get('status')}  |  Uploaded: {result.get('uploaded_date', '—')}")
    else:
        print("❌ Failed to update status.")


# ── main ──────────────────────────────────────────────────────────────────────
def main():
    parser = argparse.ArgumentParser(description="Systemized Health — Video DB Manager (Supabase)")
    parser.add_argument("--seed",          action="store_true", help="Seed all 16 videos to Supabase")
    parser.add_argument("--list",          action="store_true", help="List all videos and latest metrics")
    parser.add_argument("--calendar",      action="store_true", help="Display publication & task calendar")
    parser.add_argument("--json",          action="store_true", help="Export clean JSON")
    parser.add_argument("--export-csv",    action="store_true", help="Export to Master_Video_Pipeline.csv")
    parser.add_argument("--add-task",      default=None,        help="Video number or code to add a task to")
    parser.add_argument("--task",          default="",          help="Task name")
    parser.add_argument("--phase",         default="Phase I",   help="Task phase")
    parser.add_argument("--due",           default=None,        help="Due date YYYY-MM-DD")
    parser.add_argument("--update-status", default=None,        help="Video number or code to update status")
    parser.add_argument("--status",        default=None,        help="New status value")
    parser.add_argument("--uploaded-date", default=None,        help="Uploaded date YYYY-MM-DD (optional with --update-status)")

    args = parser.parse_args()

    if args.seed:
        seed_db()
    elif args.list:
        list_videos()
    elif args.calendar:
        show_calendar()
    elif args.json:
        print(export_json())
    elif args.export_csv:
        export_csv()
    elif args.add_task:
        if not args.task:
            print("Error: --task '<name>' is required when using --add-task.")
            sys.exit(1)
        add_task(args.add_task, args.task, args.phase, args.due)
    elif args.update_status:
        if not args.status:
            print("Error: --status '<value>' is required when using --update-status.")
            sys.exit(1)
        update_status(args.update_status, args.status, args.uploaded_date)
    else:
        list_videos()


if __name__ == "__main__":
    main()
