#!/usr/bin/env python3
"""
Systemized Health — Sync Obsidian Tags (Downstream from App/DB)
scripts/sync_obsidian_tags.py

The App / Supabase database is the absolute source of truth.
This script scans all Obsidian Markdown files in the Vault and updates their
YAML tags to match the database status, ensuring local files submit to the App.
"""

import json
import re
import glob
import os
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
CACHE_FILE = PROJECT_ROOT / "docs" / "video_pipeline_cache.json"
VAULT_DIR = PROJECT_ROOT / "Obsidian_Vault" / "Zettlekasten"

PIPELINE_STATUS_TAGS = [
    "#published",
    "#uploaded",
    "#edit",
    "#film",
    "#write",
    "#idea",
]

def sync_tags():
    if not CACHE_FILE.exists():
        print("Cache not found. Run video_pipeline.py --cache first.")
        return

    with open(CACHE_FILE, "r", encoding="utf-8") as f:
        cache = json.load(f)

    videos = cache.get("videos", cache) if isinstance(cache, dict) else cache
    db_status = {v["code"]: v["status"] for v in videos if "code" in v and "status" in v}

    changed_count = 0

    for filepath in glob.glob(str(VAULT_DIR / "*.md")):
        with open(filepath, "r", encoding="utf-8") as f:
            content = f.read()

        yaml_match = re.search(r'^(---.*?---)', content, flags=re.MULTILINE | re.DOTALL)
        if not yaml_match:
            continue

        yaml_content = yaml_match.group(1)

        # Extract code from aliases or filename
        code = None
        code_match = re.search(r'aliases:\n\s+- "(.*?)"', yaml_content)
        if code_match:
            code = code_match.group(1)
        else:
            fn_match = re.search(r'^(80\.[A-Z0-9\-]+)', Path(filepath).name)
            if fn_match:
                code = fn_match.group(1)

        if not code or code not in db_status:
            continue

        expected_status = db_status[code]

        # Extract tags block
        tags_match = re.search(r'tags:\n(.*?)(?=\n[a-z_]+:|\n---|$)', yaml_content, flags=re.DOTALL)
        if not tags_match:
            continue

        tags_block = tags_match.group(1)
        
        # Find any existing pipeline status tag in the tags block
        current_status = None
        for tag in PIPELINE_STATUS_TAGS:
            if re.search(rf'["\']?{re.escape(tag)}["\']?', tags_block, re.IGNORECASE):
                current_status = tag
                break

        if current_status != expected_status:
            print(f"🔄 Updating Obsidian tag for {code}: {current_status or 'None'} -> {expected_status} (App is source of truth)")
            
            if current_status:
                # Replace the old status tag with the expected status tag
                new_tags_block = re.sub(
                    rf'["\']?{re.escape(current_status)}["\']?',
                    f'"{expected_status}"',
                    tags_block,
                    count=1,
                    flags=re.IGNORECASE
                )
            else:
                # Append the expected status tag to tags
                new_tags_block = tags_block.rstrip() + f'\n  - "{expected_status}"'

            new_yaml = yaml_content[:tags_match.start(1)] + new_tags_block + yaml_content[tags_match.end(1):]
            new_content = new_yaml + content[yaml_match.end(1):]

            with open(filepath, "w", encoding="utf-8") as f:
                f.write(new_content)

            changed_count += 1

    if changed_count > 0:
        print(f"✅ Successfully updated {changed_count} Obsidian file(s) to match the App database.")
    else:
        print("✅ All Obsidian file tags are in perfect alignment with the App database.")

if __name__ == "__main__":
    sync_tags()
