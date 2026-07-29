#!/usr/bin/env python3
"""
Systemized Health On-Demand Workflowy Report Generator

Generates and pushes video analytics, 4-timeframe views, drop calendars, and open production tasks to Workflowy.

Usage:
  python scripts/workflowy_report.py --preview              # Preview report locally in terminal
  python scripts/workflowy_report.py --push                 # Push report directly to Workflowy
  python scripts/workflowy_report.py --sync-vidiq --push     # Fetch live vidIQ metrics & push report
"""

import sys
import os
import json
import sqlite3
import argparse
from datetime import datetime, timedelta
from workflowy_sync import load_config, make_request, fetch_all_nodes, create_child_node, find_or_create_root_node, API_BASE

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "database", "videos.db")

def get_db_data():
    if not os.path.exists(DB_PATH):
        print(f"Error: Database not found at {DB_PATH}. Run python scripts/db_manager.py --seed first.")
        sys.exit(1)

    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    now = datetime.now()
    t_48h = (now - timedelta(hours=48)).strftime("%Y-%m-%d %H:%M:%S")
    t_7d = (now - timedelta(days=7)).strftime("%Y-%m-%d")
    t_28d = (now - timedelta(days=28)).strftime("%Y-%m-%d")

    # 1. Total & Status summary
    cursor.execute("SELECT status, count(*) as count FROM videos GROUP BY status;")
    status_summary = {r['status']: r['count'] for r in cursor.fetchall()}

    # 2. Upcoming Drop Dates
    today_str = now.strftime("%Y-%m-%d")
    cursor.execute("""
    SELECT code, format_type, title, drop_date, status
    FROM videos
    WHERE drop_date >= ?
    ORDER BY drop_date ASC
    LIMIT 7;
    """, (today_str,))
    upcoming_drops = cursor.fetchall()

    # 3. Open tasks with due dates
    cursor.execute("""
    SELECT t.id, t.task_name, t.phase, t.due_date, v.code, v.title
    FROM video_tasks t
    JOIN videos v ON v.id = t.video_id
    WHERE t.status != 'Completed'
    ORDER BY t.due_date ASC;
    """)
    open_tasks = cursor.fetchall()

    # 4. Timeframe Analytics
    # (a) Last 48 Hours
    cursor.execute("""
    SELECT COALESCE(SUM(views), 0) as views, COALESCE(SUM(vph), 0.0) as vph, COALESCE(SUM(likes), 0) as likes
    FROM video_stats
    WHERE snapshot_date >= ?;
    """, (t_48h,))
    stats_48h = cursor.fetchone()

    # (b) Last 7 Days
    cursor.execute("""
    SELECT COALESCE(SUM(views), 0) as views, COALESCE(SUM(likes), 0) as likes, COALESCE(AVG(ctr_pct), 0.0) as avg_ctr
    FROM video_stats
    WHERE snapshot_date >= ?;
    """, (t_7d,))
    stats_7d = cursor.fetchone()

    # (c) Last 28 Days
    cursor.execute("""
    SELECT COALESCE(SUM(views), 0) as views, COALESCE(SUM(likes), 0) as likes, COALESCE(SUM(subscribers_gained), 0) as subs
    FROM video_stats
    WHERE snapshot_date >= ?;
    """, (t_28d,))
    stats_28d = cursor.fetchone()

    # (d) All Time
    cursor.execute("""
    SELECT COALESCE(SUM(views), 0) as views, COALESCE(SUM(likes), 0) as likes, COALESCE(SUM(comments), 0) as comments
    FROM video_stats;
    """)
    stats_all_time = cursor.fetchone()

    conn.close()

    return {
        "today_str": today_str,
        "status_summary": status_summary,
        "upcoming_drops": upcoming_drops,
        "open_tasks": open_tasks,
        "stats_48h": stats_48h,
        "stats_7d": stats_7d,
        "stats_28d": stats_28d,
        "stats_all_time": stats_all_time
    }

def format_report_lines(data):
    lines = []
    today = data["today_str"]
    lines.append(f"📊 Systemized Health Daily Report — {today}")
    
    # Section 1: Overview
    stat_summary = data["status_summary"]
    pub_count = stat_summary.get("Uploaded", 0)
    in_prod = stat_summary.get("In Production", 0) + stat_summary.get("Ready for Audio Riff", 0)
    lines.append(f"📈 Pipeline Status: {pub_count} Uploaded | {in_prod} In Production")

    # Section 2: 4-Timeframe Performance Analytics
    lines.append("⏱️ Channel Performance Across 4 Timeframes:")
    
    s48 = data["stats_48h"]
    lines.append(f"  - Last 48 Hours: {s48['views']:,} Views | {s48['vph']:.1f} Avg VPH Velocity")

    s7 = data["stats_7d"]
    lines.append(f"  - Last 7 Days: {s7['views']:,} Views | {s7['likes']:,} Likes | {s7['avg_ctr']:.1f}% Avg CTR")

    s28 = data["stats_28d"]
    lines.append(f"  - Last 28 Days: {s28['views']:,} Views | {s28['likes']:,} Likes | +{s28['subs']} Subscribers")

    s_all = data["stats_all_time"]
    lines.append(f"  - All Time (Lifetime): {s_all['views']:,} Total Views | {s_all['likes']:,} Likes | {s_all['comments']:,} Comments")

    # Section 3: Upcoming Drop Calendar
    lines.append("📅 Upcoming Video Drops (Next 7 Days):")
    if data["upcoming_drops"]:
        for d in data["upcoming_drops"]:
            lines.append(f"  - {d['drop_date']} | {d['code']} ({d['format_type']}): {d['title']} [{d['status']}]")
    else:
        lines.append("  - No videos scheduled for drop in the next 7 days.")

    # Section 4: Production Tasks
    lines.append("⏳ Open Production Tasks & Due Dates:")
    if data["open_tasks"]:
        for t in data["open_tasks"]:
            due = f"Due: {t['due_date']}" if t['due_date'] else "No Due Date"
            lines.append(f"  - [{due}] {t['code']} — {t['task_name']} ({t['phase']})")
    else:
        lines.append("  - All production tasks completed!")

    return lines

def save_report_to_repo(report_lines):
    repo_root = os.path.dirname(os.path.dirname(__file__))
    analytics_dir = os.path.join(repo_root, "Analytics")
    if not os.path.exists(analytics_dir):
        os.makedirs(analytics_dir)
    
    report_file = os.path.join(analytics_dir, "Analytics_Daily_Report.md")
    with open(report_file, "w", encoding="utf-8") as f:
        f.write("\n".join(report_lines) + "\n")
    print(f"Successfully saved 4-Timeframe Daily Report to repository file: {report_file}")
    return report_file

def main():
    parser = argparse.ArgumentParser(description="On-Demand Systemized Health Report Generator with 4 Timeframes")
    parser.add_argument("--preview", action="store_true", help="Print report locally in CLI")
    parser.add_argument("--push", action="store_true", help="Deprecated: Analytics are saved locally to repository files")
    parser.add_argument("--save", action="store_true", help="Save report to Analytics/Analytics_Daily_Report.md")

    args = parser.parse_args()
    data = get_db_data()
    lines = format_report_lines(data)

    if args.preview or not args.push:
        print("\n" + "=" * 80)
        for l in lines:
            print(l)
        print("=" * 80 + "\n")

    # Save to local repository file in Analytics/
    save_report_to_repo(lines)

    if args.push:
        print("Notice: Pushing analytics to Workflowy is disabled per user directive. Analytics are preserved in Analytics/ directory.", file=sys.stderr)

if __name__ == "__main__":
    main()
