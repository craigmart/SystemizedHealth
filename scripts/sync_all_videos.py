#!/usr/bin/env python3
"""
Sync all videos from SQLite database to Google Sheet pipeline endpoint.
"""
import time
import os
import json
import sqlite3
from update_sheet import update_sheet

CONFIG_PATH = os.path.join(os.path.dirname(__file__), "config.json")
DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "database", "videos.db")

def get_url():
    with open(CONFIG_PATH, "r") as f:
        return json.load(f).get("web_app_url")

def get_videos_from_db():
    if not os.path.exists(DB_PATH):
        print(f"Error: Database not found at {DB_PATH}")
        return []

    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("""
    SELECT v.video_number, v.code, v.title, v.format_type, v.drop_date,
           CASE WHEN COUNT(t.id) > 0 THEN 'YES' ELSE 'NO' END as task_open
    FROM videos v
    LEFT JOIN video_tasks t ON t.video_id = v.id AND t.status != 'Completed'
    GROUP BY v.id
    ORDER BY v.video_number ASC;
    """)
    rows = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return rows

def main():
    url = get_url()
    videos = get_videos_from_db()
    print(f"Syncing {len(videos)} videos from database/videos.db to Master Production Pipeline Google Sheet...")
    for idx, v in enumerate(videos, 1):
        print(f"[{idx}/{len(videos)}] Syncing Video #{v['video_number']} ({v['code']}) - {v['title']} (Drop: {v['drop_date']})...")
        update_sheet(
            web_app_url=url,
            title=v['title'],
            code=v['code'],
            video_number=v['video_number'],
            task_open=v['task_open'],
            drop_date=v['drop_date'],
            format_type=v['format_type']
        )
        time.sleep(0.5)

if __name__ == "__main__":
    main()
