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

def push_report_to_workflowy(api_key, report_lines):
    root_id = find_or_create_root_node(api_key, root_name="Systemized Health Pipeline")
    if not root_id:
        print("Error: Could not find or create Workflowy root folder.", file=sys.stderr)
        return

    # Check for or create "📊 Daily Analytics & Task Reports" folder under root
    nodes = fetch_all_nodes(api_key)
    reports_folder_id = None
    for n in nodes:
        if n.get("parent_id") == root_id and "daily analytics" in n.get("name", "").lower():
            reports_folder_id = n["id"]
            break

    if not reports_folder_id:
        reports_folder_id = create_child_node(api_key, root_id, "📊 Daily Analytics & Task Reports")
        if not reports_folder_id:
            print("Error creating Daily Analytics folder in Workflowy.", file=sys.stderr)
            return

    # Create top report node
    today_title = report_lines[0]
    report_node_id = create_child_node(api_key, reports_folder_id, today_title)
    if not report_node_id:
        print("Error creating report node in Workflowy.", file=sys.stderr)
        return

    # Push child lines
    for line in report_lines[1:]:
        create_child_node(api_key, report_node_id, line.strip())

    print(f"Successfully pushed 4-Timeframe Daily Report to Workflowy under '📊 Daily Analytics & Task Reports'!")

def main():
    parser = argparse.ArgumentParser(description="On-Demand Workflowy Report Generator with 4 Timeframes")
    parser.add_argument("--preview", action="store_true", help="Print report locally in CLI")
    parser.add_argument("--push", action="store_true", help="Push report directly to Workflowy")

    args = parser.parse_args()
    data = get_db_data()
    lines = format_report_lines(data)

    if args.preview or not args.push:
        print("\n" + "=" * 80)
        for l in lines:
            print(l)
        print("=" * 80 + "\n")

    if args.push:
        cfg = load_config()
        api_key = cfg.get("workflowy_api_key")
        if not api_key:
            print("Error: Workflowy API Key not found in scripts/config.json", file=sys.stderr)
            sys.exit(1)
        push_report_to_workflowy(api_key, lines)

if __name__ == "__main__":
    main()
