#!/usr/bin/env python3
"""
Sync all videos from Supabase to Google Sheet pipeline endpoint.
"""
import time
import os
import sys

SCRIPT_DIR = os.path.dirname(__file__)
sys.path.insert(0, SCRIPT_DIR)

import json
from supabase_client import SupabaseClient
from update_sheet import update_sheet

CONFIG_PATH = os.path.join(SCRIPT_DIR, "config.json")


def get_url():
    with open(CONFIG_PATH, "r") as f:
        return json.load(f).get("web_app_url")


def main():
    db     = SupabaseClient()
    videos = db.get_all_videos()
    url    = get_url()

    if not videos:
        print("No videos found in Supabase.")
        return

    print(f"Syncing {len(videos)} videos from Supabase to Master Production Pipeline Google Sheet...")
    for idx, v in enumerate(videos, 1):
        # Determine if any open tasks exist for this video
        tasks     = db.get_tasks(v["id"], open_only=True)
        task_open = "YES" if tasks else "NO"

        print(f"[{idx}/{len(videos)}] Syncing Video #{v['video_number']} ({v['code']}) — {v['title']} (Drop: {v.get('drop_date', '—')})...")
        update_sheet(
            web_app_url  = url,
            title        = v["title"],
            code         = v["code"],
            video_number = v["video_number"],
            task_open    = task_open,
            drop_date    = v.get("drop_date", ""),
            format_type  = v["format_type"],
        )
        time.sleep(0.5)

    print(f"\n✅ Sync complete — {len(videos)} videos pushed to Google Sheet.")


if __name__ == "__main__":
    main()
