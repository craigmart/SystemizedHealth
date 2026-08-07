#!/usr/bin/env python3
"""
Systemized Health — Reconcile Published Videos
scripts/sync_published_videos.py

Pulls live videos from vidIQ, matches them to the local database, 
updates the title and views, and dynamically renames Obsidian Vault files.
"""

import sys
import os
import json
import re
import shutil
from datetime import datetime
from pathlib import Path

# Add scripts directory to path to import local modules
sys.path.insert(0, os.path.dirname(__file__))

from vidiq_sync import call_mcp_tool, load_config
from supabase_client import SupabaseClient
import sqlite3

PROJECT_ROOT = Path(__file__).resolve().parent.parent
VIDEOS_DIR = PROJECT_ROOT / "Obsidian_Vault" / "Videos"
CHANNEL_ID = "UCSnF1YqGqmNosGdX5JqY1gQ"
DB_PATH = PROJECT_ROOT / "database" / "videos.db"

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def sanitize_filename(name):
    return name.replace("/", "-").replace(":", "-").replace("\\", "-").strip()

def fetch_live_videos():
    cfg = load_config()
    api_key = cfg.get("vidiq_api_key")
    if not api_key:
        print("❌ Error: vidiq_api_key missing.")
        return []

    print("Fetching live videos from YouTube/vidIQ...")
    
    videos = []
    # Fetch Long
    res_long_recent = call_mcp_tool("vidiq_channel_videos", {"channelId": CHANNEL_ID, "videoFormat": "long", "popular": False}, api_key)
    res_long_pop = call_mcp_tool("vidiq_channel_videos", {"channelId": CHANNEL_ID, "videoFormat": "long", "popular": True}, api_key)
    
    # Fetch Short
    res_short_recent = call_mcp_tool("vidiq_channel_videos", {"channelId": CHANNEL_ID, "videoFormat": "short", "popular": False}, api_key)
    res_short_pop = call_mcp_tool("vidiq_channel_videos", {"channelId": CHANNEL_ID, "videoFormat": "short", "popular": True}, api_key)

    def process_res(res, format_type):
        if not res: return
        for v in res.get("videos", []):
            v["format_type"] = format_type
            videos.append(v)
            
    process_res(res_long_recent, "Long")
    process_res(res_long_pop, "Long")
    process_res(res_short_recent, "Short")
    process_res(res_short_pop, "Short")
    
    # Deduplicate by videoId
    unique_videos = {v["videoId"]: v for v in videos}
    return list(unique_videos.values())

def find_markdown_file(code):
    """Finds the markdown file and its parent folder for a given video code."""
    # Look for a folder that starts with the shortcode
    short_code = code.split(".")[-1] # e.g. "80.V0B-S1" -> "V0B-S1"
    
    for folder in VIDEOS_DIR.iterdir():
        if folder.is_dir() and folder.name.startswith(f"{short_code} -"):
            for file in folder.iterdir():
                if file.name.endswith(".md") and file.name.startswith(f"{short_code} Script"):
                    return folder, file
    return None, None

def sync_published_videos():
    live_videos = fetch_live_videos()
    print(f"Fetched {len(live_videos)} unique live videos.")

    conn = get_db()
    cursor = conn.cursor()
    sb = SupabaseClient()

    # Load all local DB videos
    cursor.execute("SELECT * FROM videos WHERE video_number NOT LIKE 'H%'")
    db_videos = [dict(row) for row in cursor.fetchall()]
    
    today_str = datetime.now().strftime("%a %-m/%-d") # e.g. Fri 8/7

    matched_count = 0

    for live in live_videos:
        yt_id = live["videoId"]
        yt_title = live["title"]
        pub_date = live.get("publishedAt", "")[:10]
        format_type = live["format_type"]
        views = live.get("viewCount", 0)

        # 1. Match by youtube_id
        match = next((v for v in db_videos if v["youtube_id"] == yt_id), None)
        
        # 2. Match by drop_date and format_type
        if not match:
            date_matches = [v for v in db_videos if v["drop_date"] == pub_date and v["format_type"] == format_type]
            if len(date_matches) == 1:
                match = date_matches[0]
            elif len(date_matches) > 1:
                print(f"⚠️ Multiple {format_type} videos found for {pub_date}. Cannot safely map '{yt_title}'.")
                continue
        
        if match:
            matched_count += 1
            code = match["code"]
            v_num = match["video_number"]
            old_title = match["title"]
            
            print(f"🔄 Syncing [{code}]: '{old_title}' -> '{yt_title}'")
            
            # Update DB
            cursor.execute("""
                UPDATE videos 
                SET title = ?, youtube_id = ?, status = '#published', uploaded_date = ? 
                WHERE id = ?
            """, (yt_title, yt_id, pub_date, match["id"]))
            
            if sb:
                # Update Supabase using the code
                sb.upsert_video({
                    "video_number": v_num,
                    "code": code,
                    "format_type": format_type,
                    "title": yt_title,
                    "youtube_id": yt_id,
                    "status": "#published",
                    "uploaded_date": pub_date
                })

            # Update File System
            folder, file = find_markdown_file(code)
            if folder and file:
                short_code = code.split(".")[-1]
                safe_title = sanitize_filename(yt_title)
                
                new_folder_name = f"{short_code} - {safe_title} ({code})"
                new_file_name = f"{short_code} Script - {safe_title}.md"
                
                new_folder_path = VIDEOS_DIR / new_folder_name
                
                # Read content before renaming
                with open(file, "r", encoding="utf-8") as f:
                    content = f.read()

                # Update H1
                content = re.sub(r"^# .*\n", f"# {code}: {safe_title}\n", content, flags=re.MULTILINE)
                
                # Inject Views and Status
                views_line = f"**Views**: {views:,} (as of {today_str})  \n"
                
                if "**Views**:" in content:
                    content = re.sub(r"\*\*Views\*\*:[^\n]+\n", views_line, content)
                else:
                    # Insert after Status or Drop Date
                    content = re.sub(r"(\*\*Drop Date\*\*:[^\n]+\n)", r"\1" + views_line, content)
                
                # Make sure status is #published
                content = re.sub(r"\*\*Status\*\*:[^\n]+\n", "**Status**: #published  \n", content)
                
                with open(file, "w", encoding="utf-8") as f:
                    f.write(content)
                
                # Rename file then folder
                new_file_path = folder / new_file_name
                if file.name != new_file_name:
                    file.rename(new_file_path)
                    
                if folder.name != new_folder_name:
                    folder.rename(new_folder_path)

    conn.commit()
    conn.close()
    
    print(f"✅ Successfully reconciled {matched_count} published videos.")
    
    # Run the cache rebuild to update all downstream docs (like drop schedule)
    os.system(f"python3 {PROJECT_ROOT}/scripts/video_pipeline.py --cache")

if __name__ == "__main__":
    sync_published_videos()
