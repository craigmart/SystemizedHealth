#!/usr/bin/env python3
"""
Systemized Health — Video Pipeline Manager
scripts/video_pipeline.py

Single source of truth: Supabase `videos` table.
All status updates, queries, and reports go through here.

Usage:
    python3 scripts/video_pipeline.py --list
    python3 scripts/video_pipeline.py --week
    python3 scripts/video_pipeline.py --status <code> <new_status>
    python3 scripts/video_pipeline.py --add '<json>'
    python3 scripts/video_pipeline.py --doc
"""

import argparse
import json
import sys
from collections import Counter
from datetime import date, timedelta
from pathlib import Path

# ── Import shared Supabase client ──────────────────────────────────────────
sys.path.insert(0, str(Path(__file__).parent))
from supabase_client import SupabaseClient

# ── Status ordering for display ────────────────────────────────────────────
STATUS_ORDER = [
    "Idea",
    "Script Ready",
    "Ready for Audio Riff",
    "Ready to Film",
    "Filming",
    "Editing",
    "In Production",
    "Uploaded",
]

STATUS_EMOJI = {
    "Idea":                 "💡",
    "Script Ready":         "📝",
    "Ready for Audio Riff": "🎙️",
    "Ready to Film":        "🎬",
    "Filming":              "📸",
    "Editing":              "✂️",
    "In Production":        "⚙️",
    "Uploaded":             "✅",
}


# ─────────────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────────────

def fmt_row(v: dict) -> str:
    emoji = STATUS_EMOJI.get(v.get("status", ""), "❓")
    num   = v.get("video_number", "???")
    code  = v.get("code", "")
    fmt   = v.get("format_type", "")
    title = v.get("title", "")[:55]
    drop  = v.get("drop_date") or "—"
    stat  = v.get("status", "")
    return f"  {num}  {code:<14} {fmt:<6} {title:<56} {drop}  {emoji} {stat}"


def header() -> str:
    return (
        f"  {'#':<4} {'Code':<14} {'Fmt':<6} {'Title':<56} {'Drop':<12} {'Status'}\n"
        + "  " + "─" * 110
    )


def next_week_range():
    today = date.today()
    days_until_monday = (7 - today.weekday()) % 7 or 7
    start = today + timedelta(days=days_until_monday)
    end   = start + timedelta(days=6)
    return start, end


# ─────────────────────────────────────────────────────────────────────────────
# Commands
# ─────────────────────────────────────────────────────────────────────────────

def cmd_list(db: SupabaseClient, status_filter: str = None):
    """Print all videos, optionally filtered by status."""
    videos = db.get_all_videos()
    if not videos:
        print("No videos found in Supabase.")
        return

    if status_filter:
        videos = [v for v in videos if v.get("status", "").lower() == status_filter.lower()]
        if not videos:
            print(f"No videos with status '{status_filter}'.")
            return

    print(f"\n{'─'*114}")
    print(f"  Systemized Health — Video Pipeline  ({len(videos)} videos)")
    print(f"{'─'*114}")
    print(header())
    for v in videos:
        print(fmt_row(v))
    print(f"{'─'*114}\n")


def cmd_week(db: SupabaseClient):
    """Show videos dropping next week."""
    start, end = next_week_range()
    videos = db.get_all_videos()

    dropping = [
        v for v in videos
        if v.get("drop_date") and start <= date.fromisoformat(v["drop_date"]) <= end
    ]
    dropping.sort(key=lambda v: v["drop_date"])

    print(f"\n📅  Next Week  ({start.strftime('%b %d')} – {end.strftime('%b %d, %Y')})")
    print(f"{'─'*114}")
    if not dropping:
        print("  No videos scheduled for next week.\n")
        return

    print(header())
    for v in dropping:
        print(fmt_row(v))
    print(f"{'─'*114}\n")

    needs_work = [v for v in dropping if v.get("status") != "Uploaded"]
    if needs_work:
        print(f"  ⚠️  {len(needs_work)} video(s) still need work before upload:\n")
        for v in needs_work:
            emoji = STATUS_EMOJI.get(v.get("status", ""), "❓")
            print(f"     {v['code']:<14} {emoji} {v['status']}")
        print()


def cmd_status(db: SupabaseClient, code: str, new_status: str, extra: dict = None):
    """Update a video's status by code."""
    video = db.get_video_by_code(code)
    if not video:
        print(f"❌  No video found with code '{code}'")
        sys.exit(1)

    if new_status not in STATUS_ORDER:
        print(f"❌  Invalid status '{new_status}'. Choose from:")
        for s in STATUS_ORDER:
            print(f"     • {s}")
        sys.exit(1)

    if new_status == "Uploaded":
        extra = extra or {}
        extra.setdefault("uploaded_date", date.today().isoformat())

    result = db.update_video_status(video["video_number"], new_status, extra=extra)
    if result:
        old_emoji = STATUS_EMOJI.get(video["status"], "❓")
        new_emoji = STATUS_EMOJI.get(new_status, "❓")
        print(f"\n  ✅  {code}  →  {old_emoji} {video['status']}  →  {new_emoji} {new_status}\n")
    else:
        print(f"❌  Failed to update status for '{code}'")
        sys.exit(1)


def cmd_add(db: SupabaseClient, json_str: str):
    """Add or upsert a video from a JSON string."""
    try:
        data = json.loads(json_str)
    except json.JSONDecodeError as e:
        print(f"❌  Invalid JSON: {e}")
        sys.exit(1)

    required = ["video_number", "code", "format_type", "title"]
    missing = [k for k in required if k not in data]
    if missing:
        print(f"❌  Missing required fields: {', '.join(missing)}")
        sys.exit(1)

    result = db.upsert_video(data)
    if result:
        print(f"\n  ✅  Video upserted:  {result['code']}  {result['title']}\n")
    else:
        print("❌  Failed to upsert video.")
        sys.exit(1)


def cmd_doc(db: SupabaseClient, output_path: str = None):
    """Generate a markdown report from Supabase → docs/Video_Pipeline_Status.md."""
    videos = db.get_all_videos()
    if not videos:
        print("No videos found.")
        return

    today = date.today().isoformat()
    lines = [
        "# Video Pipeline Status",
        "",
        f"> **Source of truth:** Supabase `videos` table  |  Generated: {today}",
        "> To update status: `python3 scripts/video_pipeline.py --status <code> <status>`",
        "",
        "---",
        "",
        "## 🎬 Active Pipeline",
        "",
        "| # | Code | Format | Title | Drop Date | Status | Uploaded |",
        "| :--- | :--- | :--- | :--- | :--- | :--- | :--- |",
    ]

    for v in videos:
        num      = v.get("video_number", "")
        code     = v.get("code", "")
        fmt      = v.get("format_type", "")
        title    = v.get("title", "")
        drop     = v.get("drop_date") or "—"
        stat     = v.get("status", "")
        uploaded = v.get("uploaded_date") or "—"
        emoji    = STATUS_EMOJI.get(stat, "")
        lines.append(f"| **{num}** | `{code}` | {fmt} | {title} | {drop} | {emoji} {stat} | {uploaded} |")

    lines += [
        "",
        "---",
        "",
        "## 📊 Status Summary",
        "",
    ]

    counts = Counter(v.get("status") for v in videos)
    for s in STATUS_ORDER:
        if s in counts:
            emoji = STATUS_EMOJI.get(s, "")
            lines.append(f"- {emoji} **{s}**: {counts[s]}")

    lines.append("")

    doc = "\n".join(lines)
    out_path = Path(output_path) if output_path else Path(__file__).parent.parent / "docs" / "Video_Pipeline_Status.md"
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(doc)
    print(f"\n  ✅  Report written → {out_path}\n")


# ─────────────────────────────────────────────────────────────────────────────
# CLI
# ─────────────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(
        description="Systemized Health — Video Pipeline (Supabase)",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python3 scripts/video_pipeline.py --list
  python3 scripts/video_pipeline.py --list --filter Editing
  python3 scripts/video_pipeline.py --week
  python3 scripts/video_pipeline.py --status 80.V0A-S1 Uploaded
  python3 scripts/video_pipeline.py --status 80.V0A1 "In Production"
  python3 scripts/video_pipeline.py --add '{"video_number":"017","code":"80.V1B2","format_type":"Long","title":"New Video"}'
  python3 scripts/video_pipeline.py --doc
        """,
    )

    parser.add_argument("--list",   action="store_true", help="List all videos")
    parser.add_argument("--filter", metavar="STATUS",    help="Filter --list by status")
    parser.add_argument("--week",   action="store_true", help="Show next week's drop schedule")
    parser.add_argument("--status", nargs=2, metavar=("CODE", "STATUS"),
                        help="Update video status: --status <code> <new_status>")
    parser.add_argument("--add",    metavar="JSON",      help="Add/upsert a video from JSON string")
    parser.add_argument("--doc",    action="store_true", help="Generate docs/Video_Pipeline_Status.md")
    parser.add_argument("--out",    metavar="PATH",      help="Output path override for --doc")

    args = parser.parse_args()

    if not any([args.list, args.week, args.status, args.add, args.doc]):
        parser.print_help()
        sys.exit(0)

    db = SupabaseClient()

    if args.list:
        cmd_list(db, status_filter=args.filter)

    if args.week:
        cmd_week(db)

    if args.status:
        cmd_status(db, code=args.status[0], new_status=args.status[1])

    if args.add:
        cmd_add(db, args.add)

    if args.doc:
        cmd_doc(db, output_path=args.out)


if __name__ == "__main__":
    main()
