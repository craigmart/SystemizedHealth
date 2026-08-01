#!/usr/bin/env python3
"""
Systemized Health — Generate Master Video Pipeline Markdown
scripts/generate_pipeline_md.py

Reads all videos from Supabase and writes Master_Video_Pipeline.md.
Run this instead of manually editing the markdown file.

Usage:
    python scripts/generate_pipeline_md.py
"""

import os
import sys
from datetime import datetime, timezone

SCRIPT_DIR   = os.path.dirname(__file__)
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)
sys.path.insert(0, SCRIPT_DIR)

from supabase_client import SupabaseClient

MD_PATH = os.path.join(PROJECT_ROOT, "Master_Video_Pipeline.md")


def format_row(v: dict) -> str:
    num         = v.get("video_number", "")
    code        = v.get("code", "")
    fmt         = v.get("format_type", "")
    title       = v.get("title", "")
    drop_date   = v.get("drop_date") or "—"
    status      = v.get("status", "")
    upload_date = v.get("uploaded_date") or "—"
    notes       = v.get("notes") or ""
    return f"| **{num}** | `{code}` | {fmt} | {title} | {drop_date} | **{status}** | {upload_date} | {notes} |"


def main():
    db = SupabaseClient()
    videos = db.get_all_videos()
    if not videos:
        print("No videos found in Supabase. Aborting.")
        sys.exit(1)

    now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

    lines = [
        "# Master Video Production Pipeline",
        "",
        "This is the authoritative registry for all Systemized Health video content. "
        "Every video (Long or Short) is assigned a unique sequential 3-digit Video Number (`001` - `099`) "
        "reflecting its production order.",
        "",
        f"> **Auto-generated from Supabase** — Last updated: `{now}`  ",
        f"> Run `python scripts/generate_pipeline_md.py` to refresh.",
        "",
        "---",
        "",
        "## 🎬 Active Production Pipeline",
        "",
        "| Video # | Code | Format | Title | Drop Date | Status | Uploaded Date | Notes |",
        "| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |",
    ]

    for v in videos:
        lines.append(format_row(v))

    lines += [
        "",
        "---",
        "",
        "## 🛠️ Maintenance Standard",
        "1. **Adding New Videos**: Use `python scripts/db_manager.py --seed` or upsert directly via `db_manager.py`.",
        "2. **Updating Status**: `python scripts/db_manager.py --update-status <number> --status <value>`",
        "3. **Regenerate this file**: `python scripts/generate_pipeline_md.py`",
        "4. **Repository Sync**: Git commits preserve the full historical record of production changes.",
        "",
    ]

    with open(MD_PATH, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))

    print(f"✅ Master_Video_Pipeline.md regenerated ({len(videos)} videos) → {MD_PATH}")


if __name__ == "__main__":
    main()
