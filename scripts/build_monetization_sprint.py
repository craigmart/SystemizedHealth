#!/usr/bin/env python3
"""
Systemized Health — Build 6-Week Monetization Sprint: The Doctor's Analog Health OS
scripts/build_monetization_sprint.py

Builds off the hit video 80.V3B1 (90 Months of Bullet Journaling) to drive 4,000 watch hours
and subscriber monetization over the next 6 weeks.
"""

import csv
import json
import sqlite3
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(Path(__file__).parent))
from supabase_client import SupabaseClient

SPRINT_VIDEOS = [
    {
        "video_number": "097",
        "code": "80.V3B2",
        "title": "How a Doctor Tracks His Health in a Bullet Journal (No Art, No Apps)",
        "level": "Level 3 (Outward)",
        "pillar": "Organize",
        "jdex_code": "80.V3B",
        "format": "Long",
        "notes": "- [2026-10-15] 6-Week Monetization Sprint (Week 1): Direct sequel to 80.V3B1. Demonstrating daily & weekly health tracking spreads, sleep score, fasting window, movement, energy levels, and supplements in analog notebook."
    },
    {
        "video_number": "049",
        "code": "80.V2A2",
        "title": "What Daily Journaling Actually Does to Your Brain (The Neuroscience)",
        "level": "Level 2 (Inward)",
        "pillar": "Thinking",
        "jdex_code": "80.V2A",
        "format": "Long",
        "notes": "- [2026-10-15] 6-Week Monetization Sprint (Week 2): Cognitive load, clearing working memory, Default Mode Network down-regulation, reducing cortisol via analog handwriting vs screen scrolling."
    },
    {
        "video_number": "251",
        "code": "80.V1A2-A",
        "title": "The Fasting & Energy Log: The Simple 2-Page Spread for Metabolic Health",
        "level": "Level 1 (Foundational)",
        "pillar": "Fuel",
        "jdex_code": "80.V1A",
        "format": "Long",
        "notes": "- [2026-10-15] 6-Week Monetization Sprint (Week 3): Fasting window tracking, hunger cues vs thirst, 3 PM energy crashes, and analog food tracking without calorie apps."
    },
    {
        "video_number": "053",
        "code": "80.V2B2",
        "title": "Why Digital Health Apps Keep Failing You (And Why Paper Fixes It)",
        "level": "Level 2 (Inward)",
        "pillar": "Learning",
        "jdex_code": "80.V2B",
        "format": "Long",
        "notes": "- [2026-10-15] 6-Week Monetization Sprint (Week 4): Notification fatigue, dopamine loops, app friction vs analog tactile memory and deliberate somatic self-awareness."
    },
    {
        "video_number": "073",
        "code": "80.V1C2",
        "title": "The 3 Health Numbers I Write Down Every Morning",
        "level": "Level 1 (Foundational)",
        "pillar": "Rest",
        "jdex_code": "80.V1C",
        "format": "Long",
        "notes": "- [2026-10-15] 6-Week Monetization Sprint (Week 5): Morning routine health check: resting pulse / HRV trend, sleep latency, and the 1 primary physical objective for the day."
    },
    {
        "video_number": "065",
        "code": "80.V3C1",
        "title": "90 Months of Daily Health Logging: The 5 Biggest Glitches I Uncovered",
        "level": "Level 3 (Outward)",
        "pillar": "Connect",
        "jdex_code": "80.V3C",
        "format": "Long",
        "notes": "- [2026-10-15] 6-Week Monetization Sprint (Week 6): Retrospective review of 7.5 years of physical journals. Real patterns of illness, burnout, physical recovery, and what somatic data looks like over time."
    },
]

# Remaining long topics after the 6-week sprint
POST_SPRINT_VIDEOS = [
    {"video_number": "057", "code": "80.V4-02", "title": "Level 4 (Lab) — User Discretion", "level": "Level 4 (Lab)", "pillar": "Lab", "jdex_code": "80.V4", "format": "Long"},
    {"video_number": "061", "code": "80.V2C2", "title": "Prayer and DMN", "level": "Level 2 (Inward)", "pillar": "Connect with Creator", "jdex_code": "80.V2C", "format": "Long"},
    {"video_number": "069", "code": "80.V3A2", "title": "Level 3 (Outward) — Play", "level": "Level 3 (Outward)", "pillar": "Play", "jdex_code": "80.V3A", "format": "Long"},
    {"video_number": "077", "code": "80.V4-03", "title": "Level 4 (Lab) — User Discretion", "level": "Level 4 (Lab)", "pillar": "Lab", "jdex_code": "80.V4", "format": "Long"},
    {"video_number": "081", "code": "80.V1A3", "title": "Level 1 (Foundational) — Fuel", "level": "Level 1 (Foundational)", "pillar": "Fuel", "jdex_code": "80.V1A", "format": "Long"},
    {"video_number": "105", "code": "80.V1B4", "title": "Level 1 (Foundational) — Move", "level": "Level 1 (Foundational)", "pillar": "Move", "jdex_code": "80.V1B", "format": "Long"},
]

def update_supabase_and_sqlite():
    sb = SupabaseClient()
    conn = sqlite3.connect(PROJECT_ROOT / "database" / "videos.db")
    c = conn.cursor()

    print("Updating Supabase & SQLite records for 6-Week Monetization Sprint...")
    for v in SPRINT_VIDEOS:
        vn = v["video_number"]
        payload = {
            "title": v["title"],
            "os_level": v["level"],
            "jdex_code": v["jdex_code"],
            "notes": v["notes"],
            "format_type": "Long"
        }
        sb._request("PATCH", "videos", body=payload, params={"video_number": f"eq.{vn}"})
        c.execute("""
            UPDATE videos
            SET title = ?, os_level = ?, jdex_code = ?, format_type = 'Long'
            WHERE video_number = ?
        """, (v["title"], v["level"], v["jdex_code"], vn))
        print(f"  ✅ Updated #{vn} ({v['code']}): {v['title']}")

    conn.commit()
    conn.close()

def update_rotation_files():
    csv_file = PROJECT_ROOT / "docs" / "content_rotation.csv"
    json_file = PROJECT_ROOT / "pipeline" / "public" / "content_rotation.json"

    full_sequence = SPRINT_VIDEOS + POST_SPRINT_VIDEOS

    with open(csv_file, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=["Code", "Format", "Drop Date", "Level", "Pillar"])
        writer.writeheader()
        for r in full_sequence:
            writer.writerow({
                "Code": r["code"],
                "Format": r["format"],
                "Drop Date": "",
                "Level": r["level"],
                "Pillar": r["pillar"]
            })
    print(f"✅ Updated {csv_file} with {len(full_sequence)} topics (Sprint at top).")

    catalog_json = []
    for r in full_sequence:
        catalog_json.append({
            "video_number": r["video_number"],
            "code": r["code"],
            "format_type": "Long",
            "title": r["title"],
            "drop_date": None,
            "status": "#write" if r["code"] in ["80.V1A2-A", "80.V2A2", "80.V2C2"] else "#idea",
            "os_level": r["level"],
            "jdex_code": r["jdex_code"],
            "notes": r.get("notes"),
            "cards_created": True,
            "pillar": r["pillar"],
            "rotation_format": "Long"
        })

    with open(json_file, "w", encoding="utf-8") as f:
        json.dump(catalog_json, f, indent=2)
    print(f"✅ Updated {json_file} with {len(catalog_json)} rotation items.")

def create_obsidian_starter_notes():
    vault_dir = PROJECT_ROOT / "Obsidian_Vault" / "Zettlekasten"
    template = """---
aliases:
  - "{code}"
tags:
  - "#video"
  - "#{status}"
format: "Long"
drop_date:
---

# {code} Script — {title}

## Final Spoken Transcript

*(Spoken transcript pending filming & ingestion)*

## 3x5 Outline & Field Notes

1A - Title: {title}
1A - Thumbnail: 
1B - Hook: 
1C1 - Point #1: 
1C2 - Point #2: 
1C3 - Point #3: 
1D - Close: 
1E - CTA: Book your free 20-minute Systemized Discovery Call: call.systemizedhealth.com

## Production Log & Notes
{notes}

## Clinical Propositions (JDex)
<!-- Propositions extracted during post-recording study review -->

## Changelog
- [2026-10-15] Scaffolded for 6-Week Monetization Sprint.
"""
    for v in SPRINT_VIDEOS:
        safe_title = v["title"].replace(":", " -").replace("/", "-")
        note_path = vault_dir / f"{v['code']} Script - {safe_title}.md"
        if not note_path.exists():
            status = "write" if v["code"] in ["80.V1A2-A", "80.V2A2"] else "idea"
            content = template.format(
                code=v["code"],
                title=v["title"],
                status=status,
                notes=v.get("notes", "")
            )
            note_path.write_text(content, encoding="utf-8")
            print(f"  ✨ Created Obsidian script note → {note_path.name}")

if __name__ == "__main__":
    update_supabase_and_sqlite()
    update_rotation_files()
    create_obsidian_starter_notes()
    print("\n🎉 Monetization Sprint built successfully!")
