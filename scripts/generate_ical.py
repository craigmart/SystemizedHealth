#!/usr/bin/env python3
"""
Systemized Health — iCalendar (.ics) Feed Generator
Generates docs/publication_calendar.ics from docs/video_pipeline_cache.json
Can be imported directly into Google Calendar, Apple Calendar, or subscribed to via URL.
"""

import os
import json
import re
from datetime import datetime, date, timedelta, timezone

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CACHE_PATH = os.path.join(BASE_DIR, "docs", "video_pipeline_cache.json")
ICS_PATH = os.path.join(BASE_DIR, "docs", "publication_calendar.ics")


def sanitize_text(text: str) -> str:
    if not text:
        return ""
    # Clean text for ICS format
    clean = str(text).replace("\r\n", "\\n").replace("\n", "\\n").replace(",", "\\,").replace(";", "\\;")
    return clean


def format_date_ics(date_str: str) -> str:
    """Converts YYYY-MM-DD to YYYYMMDD string for all-day ICS events."""
    dt = datetime.strptime(date_str, "%Y-%m-%d")
    return dt.strftime("%Y%m%d")


def format_date_end_ics(date_str: str) -> str:
    """All-day events in ICS end on the next day."""
    dt = datetime.strptime(date_str, "%Y-%m-%d") + timedelta(days=1)
    return dt.strftime("%Y%m%d")


def generate_ics():
    if not os.path.exists(CACHE_PATH):
        print(f"❌ Cache file not found at {CACHE_PATH}")
        return

    with open(CACHE_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)

    videos = data.get("videos", [])
    now_stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")

    lines = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//Systemized Health//Publication Calendar 1.0//EN",
        "CALSCALE:GREGORIAN",
        "METHOD:PUBLISH",
        "X-WR-CALNAME:Systemized Health Drop Schedule",
        "X-WR-TIMEZONE:America/New_York",
        "X-WR-CALDESC:Publication drop dates and video pipeline schedule for Systemized Health",
    ]

    count = 0
    for v in videos:
        drop_date = v.get("drop_date")
        if not drop_date:
            continue

        code = v.get("code") or "N/A"
        title = v.get("title") or "Untitled Video"
        fmt = v.get("format_type") or "Video"
        status = v.get("status") or "Planned"
        os_level = v.get("os_level") or ""
        notes = v.get("notes") or ""

        icon = "🎬" if fmt.lower() == "long" else "⚡"
        summary = f"{icon} [{fmt}] {code}: {title}"

        # Create detailed event description
        desc_parts = [
            f"Video Code: {code}",
            f"Format: {fmt}",
            f"Status: {status}",
        ]
        if os_level:
            desc_parts.append(f"OS Level: {os_level}")
        if notes:
            desc_parts.append(f"Notes: {notes}")
        desc_parts.append("CTA Link: http://call.systemizedhealth.com/")

        description = "\\n".join([sanitize_text(p) for p in desc_parts])

        dt_start = format_date_ics(drop_date)
        dt_end = format_date_end_ics(drop_date)
        uid = f"video-{code.lower().replace('.', '-')}-{dt_start}@systemizedhealth.com"

        lines.extend([
            "BEGIN:VEVENT",
            f"UID:{uid}",
            f"DTSTAMP:{now_stamp}",
            f"DTSTART;VALUE=DATE:{dt_start}",
            f"DTEND;VALUE=DATE:{dt_end}",
            f"SUMMARY:{sanitize_text(summary)}",
            f"DESCRIPTION:{description}",
            f"STATUS:{'CONFIRMED' if status.lower() in ['uploaded', 'completed'] else 'TENTATIVE'}",
            "CATEGORIES:Publication,YouTube,Content Drop",
            "END:VEVENT"
        ])
        count += 1

    lines.append("END:VCALENDAR")

    with open(ICS_PATH, "w", encoding="utf-8") as f:
        f.write("\r\n".join(lines) + "\r\n")

    print(f"✅ Generated iCalendar feed with {count} events at: {ICS_PATH}")


if __name__ == "__main__":
    generate_ics()
