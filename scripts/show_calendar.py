#!/usr/bin/env python3
"""
Systemized Health August 2026 CLI Publication Calendar Viewer
"""

import os

AUGUST_CALENDAR = [
    {
        "week": "Week 1 (Aug 1 - Aug 7)",
        "items": [
            {"drop": "2026-08-03 (Mon)", "code": "80.V0A", "format": "Long", "title": "230,000 Patient Visits", "status": "Uploaded (Private)"},
            {"drop": "2026-08-04 (Tue)", "code": "80.V0A-S1", "format": "Short", "title": "Why Monday Health Resolutions Fail", "status": "Uploaded (Private)"},
            {"drop": "2026-08-06 (Thu)", "code": "80.V0A-S2", "format": "Short", "title": "The Biological Sequence of Change", "status": "Uploaded (Private)"},
            {"drop": "2026-08-08 (Sat)", "code": "80.V0A-S3", "format": "Short", "title": "Stop Treating Health Like an Emergency", "status": "Uploaded (Private)"}
        ]
    },
    {
        "week": "Week 2 (Aug 8 - Aug 14)",
        "items": [
            {"drop": "2026-08-10 (Mon)", "code": "80.V1B1", "format": "Long", "title": "Exercise Optional (Movement Mandatory)", "status": "Uploaded (Private)"},
            {"drop": "2026-08-11 (Tue)", "code": "80.V1B1-S1", "format": "Short", "title": "Why Exercise is Optional", "status": "Uploaded (Private)"},
            {"drop": "2026-08-13 (Thu)", "code": "80.V1B1-S2", "format": "Short", "title": "Joint Imbibition: How Joints Eat", "status": "Uploaded (Private)"},
            {"drop": "2026-08-15 (Sat)", "code": "80.V1B1-S3", "format": "Short", "title": "Cortical Smudging: Why Back Pain Spasms", "status": "Uploaded (Private)"}
        ]
    },
    {
        "week": "Week 3 (Aug 15 - Aug 21)",
        "items": [
            {"drop": "2026-08-17 (Mon)", "code": "80.V0B", "format": "Long", "title": "Health Info & Biology Baseline", "status": "Uploaded (Private)"},
            {"drop": "2026-08-18 (Tue)", "code": "80.V0B-S1", "format": "Short", "title": "Information Overload vs Implementation", "status": "Uploaded (Private)"},
            {"drop": "2026-08-20 (Thu)", "code": "80.V0B-S2", "format": "Short", "title": "Finding Your System Glitch", "status": "Uploaded (Private)"},
            {"drop": "2026-08-22 (Sat)", "code": "80.V0B-S3", "format": "Short", "title": "Doctor vs Coach: Rebuilding Baseline", "status": "Uploaded (Private)"}
        ]
    },
    {
        "week": "Week 4 (Aug 22 - Aug 31)",
        "items": [
            {"drop": "2026-08-24 (Mon)", "code": "80.V0A1", "format": "Long", "title": "Systemized OS Framework", "status": "In Edit (A-Roll Done)"},
            {"drop": "2026-08-25 (Tue)", "code": "80.V0A1-S1", "format": "Short", "title": "The Willpower Trap", "status": "Outlined"},
            {"drop": "2026-08-27 (Thu)", "code": "80.V0A1-S2", "format": "Short", "title": "Level 1 FMR Baseline", "status": "Outlined"},
            {"drop": "2026-08-29 (Sat)", "code": "80.V0A1-S3", "format": "Short", "title": "Discovery Call Coaching Protocol", "status": "Outlined"}
        ]
    }
]

def main():
    print("=" * 80)
    print(" 📅 SYSTEMIZED HEALTH — AUGUST 2026 PUBLICATION CALENDAR")
    print("=" * 80)
    for block in AUGUST_CALENDAR:
        print(f"\n📌 {block['week']}")
        print("-" * 80)
        for item in block["items"]:
            fmt_icon = "🎬 [Long] " if item["format"] == "Long" else "⚡ [Short]"
            print(f"  {item['drop']:<18} | {fmt_icon:<10} | {item['code']:<11} | {item['title']:<40} | {item['status']}")
    print("=" * 80)

if __name__ == "__main__":
    main()
