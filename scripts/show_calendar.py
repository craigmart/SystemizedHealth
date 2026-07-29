#!/usr/bin/env python3
"""
Systemized Health Dynamic Publication & Task Calendar Viewer
Queries directly from database/videos.db
"""

import os
import sqlite3

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "database", "videos.db")

def main():
    if not os.path.exists(DB_PATH):
        print(f"Error: Database not found at {DB_PATH}. Run python scripts/db_manager.py --seed first.")
        return

    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    # Get all drop dates
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
        events_by_date[dt].append(f"🎬 [DROP {d['format_type']:<5}] {d['code']:<12} | {d['title']:<40} | {d['status']}")

    for t in tasks:
        dt = t['due_date']
        if dt not in events_by_date:
            events_by_date[dt] = []
        events_by_date[dt].append(f"⏳ [TASK DUE]   {t['code']:<12} | {t['task_name']:<40} | Open Task")

    print("=" * 95)
    print(" 📅 SYSTEMIZED HEALTH — DYNAMIC PUBLICATION & TASK CALENDAR")
    print("=" * 95)
    for dt in sorted(events_by_date.keys()):
        print(f"\n📌 Date: {dt}")
        print("-" * 95)
        for ev in events_by_date[dt]:
            print(f"   {ev}")
    print("=" * 95)

if __name__ == "__main__":
    main()
