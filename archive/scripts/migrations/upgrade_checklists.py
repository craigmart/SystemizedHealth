#!/usr/bin/env python3
"""
Systemized Health — Upgrade Checklist & Status Alignment Script
scripts/upgrade_checklists.py

Applies the upgraded tag and checklist relationship across all videos:
1. Flipping status checks off all tasks in previous & completed phases.
2. For #published videos, checks off Writing, Filming, Editing, and Publishing,
   leaving post-publish tasks (pub_cards, archive_gemini_notebook) open for active videos.
3. Synchronizes cards_created boolean with pub_cards checklist status.
4. Preserves 100% completion for historical and verified published archives.
"""

import sys
import os
import json
import re
import sqlite3
from pathlib import Path

# Add scripts directory to path
sys.path.insert(0, os.path.dirname(__file__))

from supabase_client import SupabaseClient

PROJECT_ROOT = Path(__file__).resolve().parent.parent
DB_PATH = PROJECT_ROOT / "database" / "videos.db"
CACHE_PATH = PROJECT_ROOT / "docs" / "video_pipeline_cache.json"
DOC_PROPS = PROJECT_ROOT / "docs" / "Published_Video_Propositions.md"

LONG_ITEMS = {
    'Writing': ['prep_notebook', 'prep_card'],
    'Filming': ['film_recorded'],
    'Editing': ['edit_transcript', 'edit_broll', 'edit_sound', 'edit_vidiq', 'edit_obsidian'],
    'Publishing': ['pub_upload', 'pub_thumb', 'pub_schedule'],
    'Archived': ['pub_cards', 'archive_gemini_notebook']
}

SHORT_ITEMS = {
    'Writing': ['short_card', 'short_outline'],
    'Filming': ['short_film'],
    'Editing': ['short_descript', 'edit_transcript', 'edit_vidiq', 'edit_obsidian'],
    'Publishing': ['pub_upload', 'pub_schedule'],
    'Archived': ['pub_cards', 'archive_gemini_notebook']
}


def main():
    print("🔄 Starting Tag & Checklist Relationship Upgrade...")
    
    # 1. Read verified completed videos from Published_Video_Propositions.md
    done_codes = set()
    if DOC_PROPS.exists():
        with open(DOC_PROPS, 'r', encoding='utf-8') as f:
            content = f.read()
        done_codes = set(re.findall(r'\|\s*\*\*.*?\*\*\s*\|\s*\`([^\`]+)\`', content))
    print(f"📋 Verified completed card sets in documentation: {len(done_codes)}")

    # 2. Connect to Supabase and SQLite
    sb = SupabaseClient()
    sqlite_conn = sqlite3.connect(DB_PATH)
    sqlite_cursor = sqlite_conn.cursor()

    # Fetch all videos from Supabase
    all_videos = sb.get_all_videos()
    if not all_videos:
        print("❌ Error fetching videos from Supabase.")
        sys.exit(1)

    print(f"📦 Total videos in database: {len(all_videos)}")

    updated_count = 0

    for v in all_videos:
        code = v.get('code')
        status = (v.get('status') or '').strip()
        v_num = v.get('video_number')
        is_short = (v.get('format_type') == 'Short') or ('-S' in (code or ''))
        is_hist = (code or '').startswith('HIST')
        is_done_doc = code in done_codes
        
        items_by_phase = SHORT_ITEMS if is_short else LONG_ITEMS
        
        # Existing checklist parse
        chk_raw = v.get('edit_checklist')
        chk = {}
        if isinstance(chk_raw, str) and chk_raw.strip():
            try:
                chk = json.loads(chk_raw)
            except:
                chk = {}
        elif isinstance(chk_raw, dict):
            chk = dict(chk_raw)

        old_chk = dict(chk)
        old_cards_created = v.get('cards_created')

        # Determine completed phases based on status tag
        completed_phases = []
        clean_status = status.lower().replace('#', '').strip()
        if clean_status == 'film':
            completed_phases = ['Writing']
        elif clean_status == 'edit':
            completed_phases = ['Writing', 'Filming']
        elif clean_status == 'uploaded':
            completed_phases = ['Writing', 'Filming', 'Editing']
        elif clean_status == 'published':
            completed_phases = ['Writing', 'Filming', 'Editing', 'Publishing']
        elif clean_status in ['archive', 'archived']:
            completed_phases = ['Writing', 'Filming', 'Editing', 'Publishing', 'Archived']

        # Check off all items for completed phases
        for phase in completed_phases:
            for k in items_by_phase.get(phase, []):
                chk[k] = True

        # Handle post-publish / archived tasks
        if is_hist or is_done_doc:
            # 31 verified complete videos + historical
            for phase in ['Writing', 'Filming', 'Editing', 'Publishing', 'Archived']:
                for k in items_by_phase.get(phase, []):
                    chk[k] = True
            new_cards_created = True
        else:
            # Active/Recent published videos
            if code == '80.V2A1-S2A':
                chk['pub_cards'] = False
                chk['archive_gemini_notebook'] = False
                new_cards_created = False
            elif code == '80.V2A1-S3A':
                chk['pub_cards'] = True
                chk['archive_gemini_notebook'] = False
                new_cards_created = True
            else:
                new_cards_created = chk.get('pub_cards', old_cards_created if old_cards_created is not None else False)

        # Synchronize pub_cards with new_cards_created
        if 'pub_cards' in chk:
            chk['pub_cards'] = bool(new_cards_created)

        # Update if changed
        if chk != old_chk or new_cards_created != old_cards_created:
            chk_json_str = json.dumps(chk)
            
            # 1. Update Supabase
            sb.upsert_video({
                'video_number': v_num,
                'code': code,
                'title': v.get('title') or code,
                'format_type': 'Short' if is_short else 'Long',
                'status': status,
                'edit_checklist': chk_json_str,
                'cards_created': new_cards_created
            })

            # 2. Update SQLite
            sqlite_cursor.execute("""
                UPDATE videos 
                SET cards_created = ?
                WHERE video_number = ? OR code = ?
            """, (1 if new_cards_created else 0, v_num, code))
            
            updated_count += 1
            print(f"  ✅ Updated [{code} | {status}]: cards_created={new_cards_created}")

    sqlite_conn.commit()
    sqlite_conn.close()

    print(f"\n🎉 Successfully upgraded {updated_count} video records across Supabase and SQLite.")

    # Refresh local cache
    print("\n🔄 Refreshing local cache via scripts/video_pipeline.py --cache...")
    import subprocess
    subprocess.run([sys.executable, str(PROJECT_ROOT / "scripts" / "video_pipeline.py"), "--cache"], check=True)
    print("✅ Cache refreshed successfully.")

if __name__ == "__main__":
    main()
