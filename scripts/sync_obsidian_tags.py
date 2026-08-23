#!/usr/bin/env python3
"""
Systemized Health — Sync Obsidian Tags
scripts/sync_obsidian_tags.py

Scans all Obsidian Markdown files in the Vault to ensure the YAML tags 
match the database status. If a tag was changed locally (e.g., flipping 
from #film to #edit), it updates the Supabase pipeline to match.
"""

import json
import re
import glob
import os
import subprocess
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
CACHE_FILE = PROJECT_ROOT / "docs" / "video_pipeline_cache.json"
VAULT_DIR = PROJECT_ROOT / "Obsidian_Vault" / "Zettlekasten"

def sync_tags():
    if not CACHE_FILE.exists():
        print("Cache not found. Run video_pipeline.py --cache first.")
        return

    with open(CACHE_FILE, "r") as f:
        cache = json.load(f)

    # Handle both array format and dictionary wrapping
    videos = cache.get("videos", cache) if isinstance(cache, dict) else cache
    db_status = {v["code"]: (v["status"], v["video_number"], v["format_type"], v["title"]) for v in videos}

    changed_count = 0

    for filepath in glob.glob(str(VAULT_DIR / "*.md")):
        with open(filepath, "r", encoding="utf-8") as f:
            content = f.read()
        
        yaml_match = re.search(r'^(---.*?---)', content, flags=re.MULTILINE | re.DOTALL)
        if not yaml_match:
            continue
        
        yaml_content = yaml_match.group(1)
        
        # Extract code from aliases
        code_match = re.search(r'aliases:\n\s+- "(.*?)"', yaml_content)
        if not code_match:
            continue
        code = code_match.group(1)
        
        # Extract tags
        tags_match = re.search(r'tags:\n(.*?)(?=\n[a-z_]+:|\n---|$)', yaml_content, flags=re.DOTALL)
        if not tags_match:
            continue
        tags_str = tags_match.group(1).lower()
        
        status = None
        if "#published" in tags_str: status = "#published"
        elif "#publish" in tags_str: status = "#published"
        elif "#uploaded" in tags_str: status = "#uploaded"
        elif "#edit" in tags_str: status = "#edit"
        elif "#film" in tags_str: status = "#film"
        elif "#write" in tags_str: status = "#write"
        elif "#audiodraft" in tags_str: status = "#write"
        elif "#idea" in tags_str: status = "#idea"
        
        if status and code in db_status:
            db_tag, v_num, f_type, title = db_status[code]
            if db_tag != status:
                print(f"🔄 Tag discrepancy found for {code}: DB has {db_tag}, File has {status}")
                # Execute pipeline update
                add_json = json.dumps({
                    "video_number": v_num,
                    "code": code,
                    "format_type": f_type,
                    "title": title,
                    "agent_message": ""
                })
                
                cmd = [
                    "python3", str(PROJECT_ROOT / "scripts" / "video_pipeline.py"),
                    "--status", code, status,
                    "--add", add_json
                ]
                
                print(f"  Syncing {code} to {status}...")
                subprocess.run(cmd)
                changed_count += 1

    if changed_count > 0:
        print(f"✅ Successfully synced {changed_count} tag(s) to Supabase.")
        print("  Rebuilding cache...")
        subprocess.run(["python3", str(PROJECT_ROOT / "scripts" / "video_pipeline.py"), "--cache"])
    else:
        print("✅ All Obsidian tags are perfectly synced with the pipeline database.")

if __name__ == "__main__":
    sync_tags()
