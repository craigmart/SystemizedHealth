#!/usr/bin/env python3
import time
import os
import json
from update_sheet import update_sheet

CONFIG_PATH = os.path.join(os.path.dirname(__file__), "config.json")

def get_url():
    with open(CONFIG_PATH, "r") as f:
        return json.load(f).get("web_app_url")

videos = [
    {"video_number": "001", "code": "80.V0B", "title": "Health Info & Biology Baseline", "format_type": "Long", "drop_date": "2026-08-17", "task_open": "NO"},
    {"video_number": "002", "code": "80.V0A", "title": "230,000 Patient Visits", "format_type": "Long", "drop_date": "2026-08-03", "task_open": "NO"},
    {"video_number": "003", "code": "80.V1B1", "title": "Exercise Optional (Movement Mandatory)", "format_type": "Long", "drop_date": "2026-08-10", "task_open": "NO"},
    {"video_number": "004", "code": "80.V0A1", "title": "Systemized OS Framework", "format_type": "Long", "drop_date": "2026-08-24", "task_open": "YES"},

    {"video_number": "005", "code": "80.V0B-S1", "title": "Information Overload vs Implementation", "format_type": "Short", "drop_date": "2026-08-18", "task_open": "YES"},
    {"video_number": "006", "code": "80.V0B-S2", "title": "Finding Your System Glitch", "format_type": "Short", "drop_date": "2026-08-20", "task_open": "YES"},
    {"video_number": "007", "code": "80.V0B-S3", "title": "Doctor vs Coach: Rebuilding Baseline", "format_type": "Short", "drop_date": "2026-08-22", "task_open": "YES"},

    {"video_number": "008", "code": "80.V0A-S1", "title": "Why Monday Health Resolutions Fail", "format_type": "Short", "drop_date": "2026-08-04", "task_open": "YES"},
    {"video_number": "009", "code": "80.V0A-S2", "title": "The Biological Sequence of Change", "format_type": "Short", "drop_date": "2026-08-06", "task_open": "YES"},
    {"video_number": "010", "code": "80.V0A-S3", "title": "Stop Treating Health Like an Emergency", "format_type": "Short", "drop_date": "2026-08-08", "task_open": "YES"},

    {"video_number": "011", "code": "80.V1B1-S1", "title": "Why Exercise is Optional", "format_type": "Short", "drop_date": "2026-08-11", "task_open": "YES"},
    {"video_number": "012", "code": "80.V1B1-S2", "title": "Joint Imbibition: How Joints Eat", "format_type": "Short", "drop_date": "2026-08-13", "task_open": "YES"},
    {"video_number": "013", "code": "80.V1B1-S3", "title": "Cortical Smudging: Why Back Pain Spasms", "format_type": "Short", "drop_date": "2026-08-15", "task_open": "YES"},

    {"video_number": "014", "code": "80.V0A1-S1", "title": "The Willpower Trap", "format_type": "Short", "drop_date": "2026-08-25", "task_open": "YES"},
    {"video_number": "015", "code": "80.V0A1-S2", "title": "Level 1 FMR Baseline", "format_type": "Short", "drop_date": "2026-08-27", "task_open": "YES"},
    {"video_number": "016", "code": "80.V0A1-S3", "title": "The 3-Tier Health Pyramid", "format_type": "Short", "drop_date": "2026-08-29", "task_open": "YES"}
]

def main():
    url = get_url()
    print(f"Syncing {len(videos)} videos to Master Production Pipeline Google Sheet...")
    for idx, v in enumerate(videos, 1):
        print(f"[{idx}/{len(videos)}] Syncing Video #{v['video_number']} ({v['code']}) - {v['title']} (Drop: {v['drop_date']})...")
        update_sheet(
            web_app_url=url,
            title=v['title'],
            code=v['code'],
            video_number=v['video_number'],
            task_open=v['task_open'],
            drop_date=v['drop_date'],
            format_type=v['format_type']
        )
        time.sleep(0.5)

if __name__ == "__main__":
    main()
