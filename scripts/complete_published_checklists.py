#!/usr/bin/env python3
"""
Marks all checklist items as completed for all published videos in Supabase and SQLite,
removes obsolete catalog audit task, sets cards_created = True, and refreshes the cache.
"""

import os
import sys
import json
import sqlite3
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT / "scripts"))

from supabase_client import SupabaseClient

STANDARD_KEYS = [
    "idea_demand",
    "idea_title",
    "idea_thumb",
    "idea_connected",
    "prep_notebook",
    "prep_acceptance",
    "prep_card",
    "film_recorded",
    "edit_broll",
    "edit_sound",
    "pub_thumb",
    "pub_upload",
    "pub_endscreen",
    "pub_pinned",
    "pub_schedule",
    "pub_cards",
    "archive_gemini_notebook",
    "archive_audit_48h"
]

def main():
    db = SupabaseClient()
    print("Fetching all videos from Supabase...")
    videos = db.get_all_videos()
    
    published_videos = [v for v in videos if v.get("status") in ("#published", "published")]
    print(f"Found {len(published_videos)} published videos.")
    
    updated_count = 0
    for v in published_videos:
        code = v.get("code")
        v_num = v.get("video_number")
        raw_chk = v.get("edit_checklist")
        
        chk = {}
        if raw_chk:
            if isinstance(raw_chk, str):
                try:
                    chk = json.loads(raw_chk)
                except Exception:
                    chk = {}
            elif isinstance(raw_chk, dict):
                chk = dict(raw_chk)
        
        # Merge standard completed keys
        for k in STANDARD_KEYS:
            chk[k] = True
            
        # Remove obsolete catalog audit key if present
        chk.pop("archive_catalog_audit", None)
        
        # Check custom tasks and mark done
        if "custom_tasks" in chk and isinstance(chk["custom_tasks"], list):
            for t in chk["custom_tasks"]:
                t["done"] = True
                
        new_chk_str = json.dumps(chk)
        
        # Update Supabase
        extra = {
            "edit_checklist": new_chk_str,
            "cards_created": True
        }
        res = db.update_video_status(v_num, v.get("status") or "#published", extra=extra)
        if res:
            updated_count += 1
            print(f"  ✅ Updated {code:<14} (all checklist items checked, cards_created=True)")
        else:
            print(f"  ❌ Failed to update {code}")

    print(f"\nSuccessfully updated {updated_count}/{len(published_videos)} published videos in Supabase.")
    
    # Update local SQLite
    sqlite_path = PROJECT_ROOT / "database" / "videos.db"
    if sqlite_path.exists():
        conn = sqlite3.connect(sqlite_path)
        cur = conn.cursor()
        cur.execute("UPDATE videos SET cards_created = 1 WHERE status IN ('#published', 'published')")
        conn.commit()
        conn.close()
        print("✅ Updated SQLite database/videos.db (cards_created = 1).")

    # Refresh local cache
    print("\nRefreshing docs/video_pipeline_cache.json...")
    os.system("python3 scripts/video_pipeline.py --cache")
    print("Done!")

if __name__ == "__main__":
    main()
