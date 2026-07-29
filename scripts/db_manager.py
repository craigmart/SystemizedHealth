#!/usr/bin/env python3
"""
Systemized Health Database Manager & CLI Engine

Database: database/videos.db (SQLite)
Schema:
  - videos (Metadata & Drop Dates)
  - video_stats (vidIQ & Performance Analytics)
  - video_keywords (vidIQ Keyword Intelligence)
  - video_tasks (Production Tasks & Due Dates)

Usage Examples:
  python scripts/db_manager.py --init
  python scripts/db_manager.py --seed
  python scripts/db_manager.py --list
  python scripts/db_manager.py --calendar
  python scripts/db_manager.py --json
  python scripts/db_manager.py --export-csv
  python scripts/db_manager.py --add-task "004" --task "Record Audio Dictation" --phase "Phase I" --due "2026-08-10"
"""

import sys
import os
import json
import sqlite3
import csv
import argparse
from datetime import datetime, timedelta

DB_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "database")
DB_PATH = os.path.join(DB_DIR, "videos.db")
CSV_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "Master_Video_Pipeline.csv")

def get_connection():
    if not os.path.exists(DB_DIR):
        os.makedirs(DB_DIR, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_connection()
    cursor = conn.cursor()

    # 1. Master Videos Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS videos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        video_number TEXT UNIQUE NOT NULL,
        code TEXT UNIQUE NOT NULL,
        format_type TEXT NOT NULL CHECK(format_type IN ('Long', 'Short')),
        title TEXT NOT NULL,
        description TEXT,
        jdex_code TEXT,
        os_level TEXT,
        folder_path TEXT,
        status TEXT NOT NULL DEFAULT 'Idea',
        drop_date DATE,
        uploaded_date DATE,
        youtube_id TEXT,
        primary_keyword TEXT,
        vidiq_title_score REAL DEFAULT 0.0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # 2. Performance Stats Snapshots Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS video_stats (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        video_id INTEGER NOT NULL,
        snapshot_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        views INTEGER DEFAULT 0,
        vph REAL DEFAULT 0.0,
        impressions INTEGER DEFAULT 0,
        ctr_pct REAL DEFAULT 0.0,
        average_view_duration_seconds INTEGER DEFAULT 0,
        retention_rate_pct REAL DEFAULT 0.0,
        likes INTEGER DEFAULT 0,
        comments INTEGER DEFAULT 0,
        shares INTEGER DEFAULT 0,
        subscribers_gained INTEGER DEFAULT 0,
        vidiq_score REAL DEFAULT 0.0,
        outlier_score REAL DEFAULT 0.0,
        notes TEXT,
        FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE
    );
    """)

    # 3. vidIQ Keyword Intelligence Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS video_keywords (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        video_id INTEGER NOT NULL,
        keyword TEXT NOT NULL,
        estimated_monthly_search INTEGER DEFAULT 0,
        competition_score REAL DEFAULT 0.0,
        overall_score REAL DEFAULT 0.0,
        is_primary BOOLEAN DEFAULT 0,
        FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE
    );
    """)

    # 4. Production Tasks Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS video_tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        video_id INTEGER NOT NULL,
        task_name TEXT NOT NULL,
        phase TEXT DEFAULT 'Phase I',
        status TEXT DEFAULT 'Pending' CHECK(status IN ('Pending', 'In Progress', 'Completed')),
        due_date DATE,
        completed_at TIMESTAMP,
        notes TEXT,
        FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE
    );
    """)

    conn.commit()
    conn.close()
    print(f"Database initialized successfully at: {DB_PATH}")

def seed_db():
    init_db()
    conn = get_connection()
    cursor = conn.cursor()

    initial_videos = [
        {"video_number": "001", "code": "80.V0B", "format_type": "Long", "title": "Health Info & Biology Baseline", "drop_date": "2026-08-17", "status": "Uploaded", "uploaded_date": "2026-07-26", "notes": "Published", "jdex_code": "80.10", "os_level": "Level 1: FMR"},
        {"video_number": "002", "code": "80.V0A", "format_type": "Long", "title": "230,000 Patient Visits", "drop_date": "2026-08-03", "status": "Uploaded", "uploaded_date": "2026-07-26", "notes": "Published", "jdex_code": "80.10", "os_level": "Baseline"},
        {"video_number": "003", "code": "80.V1B1", "format_type": "Long", "title": "Exercise Optional (Movement Mandatory)", "drop_date": "2026-08-10", "status": "Uploaded", "uploaded_date": "2026-07-26", "notes": "Published", "jdex_code": "77.01", "os_level": "Level 1: FMR"},
        {"video_number": "004", "code": "80.V0A1", "format_type": "Long", "title": "Systemized OS Framework", "drop_date": "2026-08-24", "status": "In Production", "uploaded_date": None, "notes": "Currently Editing", "jdex_code": "81.05", "os_level": "Level 1: FMR"},
        
        {"video_number": "005", "code": "80.V0B-S1", "format_type": "Short", "title": "Why Health Information Alone Keeps You Broken", "drop_date": "2026-08-18", "status": "Ready for Audio Riff", "uploaded_date": None, "notes": "Pre-Recording Blueprint Ready", "jdex_code": "42.02", "os_level": "Level 1: FMR"},
        {"video_number": "006", "code": "80.V0B-S2", "format_type": "Short", "title": "The Hidden System Glitch Ruining Your Body", "drop_date": "2026-08-20", "status": "Ready for Audio Riff", "uploaded_date": None, "notes": "Pre-Recording Blueprint Ready", "jdex_code": "77.03", "os_level": "Level 1: FMR"},
        {"video_number": "007", "code": "80.V0B-S3", "format_type": "Short", "title": "Stop Buying Health Advice from Coaches Who Dont Know Physiology", "drop_date": "2026-08-22", "status": "Ready for Audio Riff", "uploaded_date": None, "notes": "Pre-Recording Blueprint Ready", "jdex_code": "77.01", "os_level": "Level 1: FMR"},
        {"video_number": "008", "code": "80.V0A-S1", "format_type": "Short", "title": "The Biological Reason Monday Resolutions Always Fail", "drop_date": "2026-08-04", "status": "Ready for Audio Riff", "uploaded_date": None, "notes": "Pre-Recording Blueprint Ready", "jdex_code": "41.03", "os_level": "Level 1: FMR"},
        {"video_number": "009", "code": "80.V0A-S2", "format_type": "Short", "title": "The Exact Biological Sequence Your Body Needs to Change", "drop_date": "2026-08-06", "status": "Ready for Audio Riff", "uploaded_date": None, "notes": "Pre-Recording Blueprint Ready", "jdex_code": "42.04", "os_level": "Level 1: FMR"},
        {"video_number": "010", "code": "80.V0A-S3", "format_type": "Short", "title": "Stop Treating Your Health Like an Emergency Room", "drop_date": "2026-08-08", "status": "Ready for Audio Riff", "uploaded_date": None, "notes": "Pre-Recording Blueprint Ready", "jdex_code": "77.02", "os_level": "Level 1: FMR"},
        {"video_number": "011", "code": "80.V1B1-S1", "format_type": "Short", "title": "Exercise is Optional But Movement is Biologically Mandatory", "drop_date": "2026-08-11", "status": "Ready for Audio Riff", "uploaded_date": None, "notes": "Pre-Recording Blueprint Ready", "jdex_code": "77.01", "os_level": "Level 1: FMR"},
        {"video_number": "012", "code": "80.V1B1-S2", "format_type": "Short", "title": "Joint Imbibition: The Only Way Your Joints Actually Get Nourished", "drop_date": "2026-08-13", "status": "Ready for Audio Riff", "uploaded_date": None, "notes": "Pre-Recording Blueprint Ready", "jdex_code": "77.01", "os_level": "Level 1: FMR"},
        {"video_number": "013", "code": "80.V1B1-S3", "format_type": "Short", "title": "Cortical Smudging: Why Your Back Pain Randomly Spasms", "drop_date": "2026-08-15", "status": "Ready for Audio Riff", "uploaded_date": None, "notes": "Pre-Recording Blueprint Ready", "jdex_code": "77.03", "os_level": "Level 1: FMR"},
        {"video_number": "014", "code": "80.V0A1-S1", "format_type": "Short", "title": "Why Relying on Willpower Guarantees Physical Burnout", "drop_date": "2026-08-25", "status": "Ready for Audio Riff", "uploaded_date": None, "notes": "Pre-Recording Blueprint Ready", "jdex_code": "42.06", "os_level": "Level 1: FMR"},
        {"video_number": "015", "code": "80.V0A1-S2", "format_type": "Short", "title": "The Level 1 FMR Baseline Every Body Needs to Master", "drop_date": "2026-08-27", "status": "Ready for Audio Riff", "uploaded_date": None, "notes": "Pre-Recording Blueprint Ready", "jdex_code": "81.05", "os_level": "Level 1: FMR"},
        {"video_number": "016", "code": "80.V0A1-S3", "format_type": "Short", "title": "The 3-Tier Health Pyramid That Fixes Chronic Fatigue", "drop_date": "2026-08-29", "status": "Ready for Audio Riff", "uploaded_date": None, "notes": "Pre-Recording Blueprint Ready", "jdex_code": "43.11", "os_level": "Level 1: FMR"}
    ]

    videos_dir_abs = os.path.join(os.path.dirname(os.path.dirname(__file__)), "Videos")
    existing_folders = [d for d in os.listdir(videos_dir_abs) if os.path.isdir(os.path.join(videos_dir_abs, d))] if os.path.exists(videos_dir_abs) else []

    for v in initial_videos:
        matching_folder = None
        for ef in existing_folders:
            if f"({v['code']})" in ef or ef.startswith(f"{v['video_number']} - "):
                matching_folder = f"Videos/{ef}"
                break
        folder = matching_folder or f"Videos/{v['video_number']} - {v['title']} ({v['code']})"

        cursor.execute("""
        INSERT INTO videos (video_number, code, format_type, title, status, drop_date, uploaded_date, jdex_code, os_level, folder_path)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(video_number) DO UPDATE SET
            code=excluded.code,
            title=excluded.title,
            status=excluded.status,
            drop_date=excluded.drop_date,
            uploaded_date=excluded.uploaded_date,
            folder_path=excluded.folder_path;
        """, (v['video_number'], v['code'], v['format_type'], v['title'], v['status'], v['drop_date'], v['uploaded_date'], v['jdex_code'], v['os_level'], folder))
        
        # Get video_id
        cursor.execute("SELECT id FROM videos WHERE video_number = ?", (v['video_number'],))
        row = cursor.fetchone()
        if row:
            video_id = row['id']
            # Seed default tasks for in-production or upcoming videos
            if v['status'] != 'Uploaded':
                tasks = [
                    ("Phase I: Audio Dictation (-A)", "Phase I", "2026-08-01"),
                    ("Phase II: Script Blueprint (-B)", "Phase II", "2026-08-05"),
                    ("Phase III: On-Camera Filming", "Phase III", "2026-08-10"),
                    ("Phase III: Workflowy Sync", "Phase III", "2026-08-12")
                ]
                for t_name, t_phase, t_due in tasks:
                    cursor.execute("""
                    INSERT OR IGNORE INTO video_tasks (video_id, task_name, phase, status, due_date)
                    VALUES (?, ?, ?, 'Pending', ?);
                    """, (video_id, t_name, t_phase, t_due))

    conn.commit()
    conn.close()
    print("Database seeded with initial pipeline data successfully!")

def list_videos():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
    SELECT v.video_number, v.code, v.format_type, v.title, v.drop_date, v.status,
           COALESCE(s.views, 0) as views, COALESCE(s.vph, 0.0) as vph, COALESCE(s.ctr_pct, 0.0) as ctr
    FROM videos v
    LEFT JOIN video_stats s ON s.video_id = v.id AND s.id = (SELECT MAX(id) FROM video_stats WHERE video_id = v.id)
    ORDER BY v.video_number ASC;
    """)
    rows = cursor.fetchall()
    conn.close()

    print("=" * 110)
    print(f"{'#':<5} | {'Code':<12} | {'Fmt':<6} | {'Title':<42} | {'Drop Date':<11} | {'Status':<16} | {'Views':<6}")
    print("=" * 110)
    for r in rows:
        fmt_str = "Long" if r["format_type"] == "Long" else "Short"
        print(f"{r['video_number']:<5} | {r['code']:<12} | {fmt_str:<6} | {r['title'][:42]:<42} | {r['drop_date']:<11} | {r['status']:<16} | {r['views']:<6}")
    print("=" * 110)

def show_calendar():
    conn = get_connection()
    cursor = conn.cursor()
    
    # Get all video drop dates
    cursor.execute("""
    SELECT drop_date, code, format_type, title, status FROM videos WHERE drop_date IS NOT NULL ORDER BY drop_date ASC;
    """)
    drops = cursor.fetchall()

    # Get open tasks with due dates
    cursor.execute("""
    SELECT t.due_date, t.task_name, v.code, v.title
    FROM video_tasks t
    JOIN videos v ON v.id = t.video_id
    WHERE t.status != 'Completed' AND t.due_date IS NOT NULL
    ORDER BY t.due_date ASC;
    """)
    tasks = cursor.fetchall()
    conn.close()

    events_by_date = {}
    for d in drops:
        dt = d['drop_date']
        if dt not in events_by_date:
            events_by_date[dt] = []
        events_by_date[dt].append(f"🎬 [DROP {d['format_type']}] {d['code']} — {d['title']} ({d['status']})")

    for t in tasks:
        dt = t['due_date']
        if dt not in events_by_date:
            events_by_date[dt] = []
        events_by_date[dt].append(f"⏳ [TASK DUE] {t['code']} — {t['task_name']}")

    print("=" * 90)
    print(" 📅 SYSTEMIZED HEALTH — DYNAMIC PUBLICATION & TASK CALENDAR")
    print("=" * 90)
    for dt in sorted(events_by_date.keys()):
        print(f"\n📌 Date: {dt}")
        print("-" * 90)
        for ev in events_by_date[dt]:
            print(f"   {ev}")
    print("=" * 90)

def export_json():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM videos ORDER BY video_number ASC;")
    videos = [dict(row) for row in cursor.fetchall()]

    for v in videos:
        cursor.execute("SELECT * FROM video_stats WHERE video_id = ? ORDER BY snapshot_date DESC LIMIT 1;", (v['id'],))
        stat = cursor.fetchone()
        v['latest_stats'] = dict(stat) if stat else None

        cursor.execute("SELECT * FROM video_tasks WHERE video_id = ? ORDER BY due_date ASC;", (v['id'],))
        v['tasks'] = [dict(t) for t in cursor.fetchall()]

    conn.close()
    return json.dumps(videos, indent=2)

def export_csv():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT video_number, code, format_type, title, drop_date, status, uploaded_date, status as notes FROM videos ORDER BY video_number ASC;")
    rows = cursor.fetchall()
    conn.close()

    with open(CSV_PATH, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["Video Number", "Code", "Format", "Title", "Drop Date", "Status", "Uploaded Date", "Notes"])
        for r in rows:
            writer.writerow([r["video_number"], r["code"], r["format_type"], r["title"], r["drop_date"], r["status"], r["uploaded_date"] or "", r["notes"]])
    print(f"Exported database snapshot to CSV: {CSV_PATH}")

def add_task(video_number, task_name, phase="Phase I", due_date=None):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM videos WHERE video_number = ? OR code = ?;", (video_number, video_number))
    row = cursor.fetchone()
    if not row:
        print(f"Error: Video '{video_number}' not found.")
        conn.close()
        return

    cursor.execute("""
    INSERT INTO video_tasks (video_id, task_name, phase, status, due_date)
    VALUES (?, ?, ?, 'Pending', ?);
    """, (row['id'], task_name, phase, due_date))
    conn.commit()
    conn.close()
    print(f"Added task '{task_name}' for video {video_number} (Due: {due_date}).")

def main():
    parser = argparse.ArgumentParser(description="Systemized Health Database Manager")
    parser.add_argument("--init", action="store_true", help="Initialize database tables")
    parser.add_argument("--seed", action="store_true", help="Seed database from master CSV/pipeline")
    parser.add_argument("--list", action="store_true", help="List all videos and latest metrics")
    parser.add_argument("--calendar", action="store_true", help="Display publication & task due date calendar")
    parser.add_argument("--json", action="store_true", help="Export clean JSON for API / Web App")
    parser.add_argument("--export-csv", action="store_true", help="Export DB to Master_Video_Pipeline.csv")
    parser.add_argument("--add-task", default=None, help="Video number or code to add task to")
    parser.add_argument("--task", default="", help="Task name")
    parser.add_argument("--phase", default="Phase I", help="Task phase")
    parser.add_argument("--due", default=None, help="Due date YYYY-MM-DD")

    args = parser.parse_args()

    if args.init:
        init_db()
    elif args.seed:
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
            print("Error: --task '<name>' is required when adding a task.")
            sys.exit(1)
        add_task(args.add_task, args.task, args.phase, args.due)
    else:
        list_videos()

if __name__ == "__main__":
    main()
