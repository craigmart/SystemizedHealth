#!/usr/bin/env python3
"""
Systemized Health — Rework Pipeline to Quality Focus (No Due Dates, 3-Month Long Cycle)
scripts/rework_rotation_pipeline.py

1. Preserves all #published videos.
2. Preserves active production videos:
   - 80.V1A2-A (#edit)
   - 80.V2C2 (#write)
3. Keeps the 3-month topic rotation cycle (11 Long videos going through the 3 levels 3 times):
   - 049: 80.V2A2  - Level 2 (Inward) — Thinking: What Daily Journaling Actually Does to Your Brain
   - 053: 80.V2B2  - Level 2 (Inward) — Learning
   - 057: 80.V4-02  - Level 4 (Lab) — Lab
   - 061: 80.V2C2  - Level 2 (Inward) — Connect: Prayer and DMN (#write)
   - 065: 80.V3C1  - Level 3 (Outward) — Purpose
   - 069: 80.V3A2  - Level 3 (Outward) — Play
   - 073: 80.V1C2  - Level 1 (Foundational) — Rest
   - 077: 80.V4-03  - Level 4 (Lab) — Lab
   - 081: 80.V1A3  - Level 1 (Foundational) — Fuel
   - 097: 80.V3B2  - Level 3 (Outward) — Organize
   - 105: 80.V1B4  - Level 1 (Foundational) — Move
4. Clears all drop_date values to None on future #idea videos (removing date pressure).
5. Deletes all pre-seeded future shorts and distant 2027 placeholders from Supabase & SQLite.
6. Regenerates docs/content_rotation.csv and pipeline/public/content_rotation.json.
"""

import csv
import json
import sqlite3
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(Path(__file__).parent))
from supabase_client import SupabaseClient

KEEP_VNS = {'049', '053', '057', '061', '065', '069', '073', '077', '081', '097', '105', '251'}

CANONICAL_UPDATES = {
    '049': {'code': '80.V2A2', 'title': 'What Daily Journaling Actually Does to Your Brain', 'format_type': 'Long', 'os_level': 'Level 2 (Inward)', 'jdex_code': '80.V2A'},
    '053': {'code': '80.V2B2', 'title': 'Level 2 (Inward) — Learning', 'format_type': 'Long', 'os_level': 'Level 2 (Inward)', 'jdex_code': '80.V2B'},
    '057': {'code': '80.V4-02', 'title': 'Level 4 (Lab) — User Discretion', 'format_type': 'Long', 'os_level': 'Level 4 (Lab)', 'jdex_code': '80.V4'},
    '061': {'code': '80.V2C2', 'title': 'Prayer and DMN', 'format_type': 'Long', 'os_level': 'Level 2 (Inward)', 'jdex_code': '80.V2C'},
    '065': {'code': '80.V3C1', 'title': 'Level 3 (Outward) — Connect', 'format_type': 'Long', 'os_level': 'Level 3 (Outward)', 'jdex_code': '80.V3C'},
    '069': {'code': '80.V3A2', 'title': 'Level 3 (Outward) — Play', 'format_type': 'Long', 'os_level': 'Level 3 (Outward)', 'jdex_code': '80.V3A'},
    '073': {'code': '80.V1C2', 'title': 'Level 1 (Foundational) — Rest', 'format_type': 'Long', 'os_level': 'Level 1 (Foundational)', 'jdex_code': '80.V1C'},
    '077': {'code': '80.V4-03', 'title': 'Level 4 (Lab) — User Discretion', 'format_type': 'Long', 'os_level': 'Level 4 (Lab)', 'jdex_code': '80.V4'},
    '081': {'code': '80.V1A3', 'title': 'Level 1 (Foundational) — Fuel', 'format_type': 'Long', 'os_level': 'Level 1 (Foundational)', 'jdex_code': '80.V1A'},
    '097': {'code': '80.V3B2', 'title': 'Level 3 (Outward) — Organize', 'format_type': 'Long', 'os_level': 'Level 3 (Outward)', 'jdex_code': '80.V3B'},
    '105': {'code': '80.V1B4', 'title': 'Level 1 (Foundational) — Move', 'format_type': 'Long', 'os_level': 'Level 1 (Foundational)', 'jdex_code': '80.V1B'},
}

def rework_supabase():
    sb = SupabaseClient()
    print("Fetching videos from Supabase...")
    all_videos = sb._request('GET', 'videos', params={'order': 'video_number.asc'})
    if not all_videos:
        print("❌ Could not fetch videos from Supabase.")
        return

    to_delete = []
    to_update = []

    for v in all_videos:
        vn = v.get('video_number', '')
        status = v.get('status', '')

        if status == '#published':
            continue

        if vn in KEEP_VNS:
            updates = CANONICAL_UPDATES.get(vn, {})
            payload = {
                'format_type': 'Long',
                'drop_date': None,
            }
            if updates:
                payload.update(updates)
            to_update.append((vn, payload))
        else:
            to_delete.append(vn)

    print(f"Supabase Plan: {len(all_videos)} total | {len(to_update)} to update | {len(to_delete)} to delete")

    # Perform updates
    for vn, payload in to_update:
        res = sb._request('PATCH', 'videos', body=payload, params={'video_number': f'eq.{vn}'})
        code = payload.get('code', vn)
        print(f"  ✅ Updated #{vn} ({code}) -> drop_date=None, format=Long")

    # Perform deletes
    deleted_count = 0
    for vn in to_delete:
        res = sb._request('DELETE', 'videos', params={'video_number': f'eq.{vn}'})
        deleted_count += 1
        if deleted_count % 25 == 0:
            print(f"  ... deleted {deleted_count}/{len(to_delete)} pruned videos")

    print(f"✅ Supabase pruning complete! Deleted {deleted_count} unneeded videos.")

def rework_sqlite():
    db_path = PROJECT_ROOT / "database" / "videos.db"
    conn = sqlite3.connect(db_path)
    c = conn.cursor()

    c.execute("SELECT video_number, status FROM videos")
    rows = c.fetchall()

    deleted = 0
    for vn, status in rows:
        if status == '#published':
            continue
        if vn not in KEEP_VNS:
            c.execute("DELETE FROM videos WHERE video_number = ?", (vn,))
            deleted += 1
        else:
            updates = CANONICAL_UPDATES.get(vn, {})
            code = updates.get('code')
            title = updates.get('title')
            level = updates.get('os_level')
            jdex = updates.get('jdex_code')
            if code and title:
                c.execute("""
                    UPDATE videos 
                    SET code = ?, title = ?, format_type = 'Long', os_level = ?, jdex_code = ?, drop_date = NULL 
                    WHERE video_number = ?
                """, (code, title, level, jdex, vn))
            else:
                c.execute("UPDATE videos SET format_type = 'Long', drop_date = NULL WHERE video_number = ?", (vn,))

    conn.commit()
    conn.close()
    print(f"✅ SQLite pruning complete! Deleted {deleted} rows.")

def update_csv_and_json():
    csv_file = PROJECT_ROOT / "docs" / "content_rotation.csv"
    json_file = PROJECT_ROOT / "pipeline" / "public" / "content_rotation.json"

    # Define the 11 Long topics in rotation sequence
    rotation_sequence = [
        {"Code": "80.V2A2", "Format": "Long", "Drop Date": "", "Level": "Level 2 (Inward)", "Pillar": "Thinking", "Title": "What Daily Journaling Actually Does to Your Brain", "VideoNumber": "049"},
        {"Code": "80.V2B2", "Format": "Long", "Drop Date": "", "Level": "Level 2 (Inward)", "Pillar": "Learning", "Title": "Level 2 (Inward) — Learning", "VideoNumber": "053"},
        {"Code": "80.V4-02", "Format": "Long", "Drop Date": "", "Level": "Level 4 (Lab)", "Pillar": "Lab", "Title": "Level 4 (Lab) — User Discretion", "VideoNumber": "057"},
        {"Code": "80.V2C2", "Format": "Long", "Drop Date": "", "Level": "Level 2 (Inward)", "Pillar": "Connect with Creator", "Title": "Prayer and DMN", "VideoNumber": "061"},
        {"Code": "80.V3C1", "Format": "Long", "Drop Date": "", "Level": "Level 3 (Outward)", "Pillar": "Connect", "Title": "Level 3 (Outward) — Connect", "VideoNumber": "065"},
        {"Code": "80.V3A2", "Format": "Long", "Drop Date": "", "Level": "Level 3 (Outward)", "Pillar": "Play", "Title": "Level 3 (Outward) — Play", "VideoNumber": "069"},
        {"Code": "80.V1C2", "Format": "Long", "Drop Date": "", "Level": "Level 1 (Foundational)", "Pillar": "Rest", "Title": "Level 1 (Foundational) — Rest", "VideoNumber": "073"},
        {"Code": "80.V4-03", "Format": "Long", "Drop Date": "", "Level": "Level 4 (Lab)", "Pillar": "Lab", "Title": "Level 4 (Lab) — User Discretion", "VideoNumber": "077"},
        {"Code": "80.V1A3", "Format": "Long", "Drop Date": "", "Level": "Level 1 (Foundational)", "Pillar": "Fuel", "Title": "Level 1 (Foundational) — Fuel", "VideoNumber": "081"},
        {"Code": "80.V3B2", "Format": "Long", "Drop Date": "", "Level": "Level 3 (Outward)", "Pillar": "Organize", "Title": "Level 3 (Outward) — Organize", "VideoNumber": "097"},
        {"Code": "80.V1B4", "Format": "Long", "Drop Date": "", "Level": "Level 1 (Foundational)", "Pillar": "Move", "Title": "Level 1 (Foundational) — Move", "VideoNumber": "105"},
    ]

    with open(csv_file, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=["Code", "Format", "Drop Date", "Level", "Pillar"])
        writer.writeheader()
        for r in rotation_sequence:
            writer.writerow({
                "Code": r["Code"],
                "Format": r["Format"],
                "Drop Date": r["Drop Date"],
                "Level": r["Level"],
                "Pillar": r["Pillar"]
            })
    print(f"✅ Updated {csv_file} with {len(rotation_sequence)} rotation topics.")

    catalog_json = []
    for r in rotation_sequence:
        catalog_json.append({
            "video_number": r["VideoNumber"],
            "code": r["Code"],
            "format_type": "Long",
            "title": r["Title"],
            "drop_date": None,
            "status": "#idea" if r["Code"] != "80.V2C2" else "#write",
            "os_level": r["Level"],
            "jdex_code": f"80.{r['Code'].split('-')[0].replace('80.', '')}",
            "notes": None,
            "cards_created": True,
            "pillar": r["Pillar"],
            "rotation_format": "Long"
        })

    with open(json_file, 'w', encoding='utf-8') as f:
        json.dump(catalog_json, f, indent=2)
    print(f"✅ Updated {json_file} with {len(catalog_json)} rotation items.")

if __name__ == '__main__':
    rework_supabase()
    rework_sqlite()
    update_csv_and_json()
    print("\n🎉 Pipeline rework script completed successfully!")
