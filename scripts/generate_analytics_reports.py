#!/usr/bin/env python3
"""
Systemized Health Daily Analytics Reports Generator

Generates 4 dedicated timeframe analytics report files in `Analytics/`:
  - Analytics/Analytics_48h.md      (48-Hour Velocity & Real-Time Pulse)
  - Analytics/Analytics_7d.md       (7-Day Weekly Performance & Drop Calendar)
  - Analytics/Analytics_28d.md      (28-Day Monthly Growth & Subscriber Acceleration)
  - Analytics/Analytics_AllTime.md  (All-Time Lifetime Channel Catalog & Executive Summary)
"""

import os
import sys
import sqlite3
import json
import re
from datetime import datetime, timedelta

REPO_ROOT = os.path.dirname(os.path.dirname(__file__))
ANALYTICS_DIR = os.path.join(REPO_ROOT, "Analytics")
DB_PATH = os.path.join(REPO_ROOT, "database", "videos.db")

def ensure_analytics_dir():
    if not os.path.exists(ANALYTICS_DIR):
        os.makedirs(ANALYTICS_DIR)

def get_db_connection():
    if not os.path.exists(DB_PATH):
        print(f"Error: Database not found at {DB_PATH}", file=sys.stderr)
        sys.exit(1)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def fetch_analytics_data(conn):
    cursor = conn.cursor()
    now = datetime.now()
    t_48h = (now - timedelta(hours=48)).strftime("%Y-%m-%d %H:%M:%S")
    t_7d = (now - timedelta(days=7)).strftime("%Y-%m-%d")
    t_28d = (now - timedelta(days=28)).strftime("%Y-%m-%d")
    today_str = now.strftime("%Y-%m-%d")
    updated_at_str = now.strftime("%Y-%m-%d %H:%M:%S")

    # 1. Video counts & pipeline status
    cursor.execute("SELECT status, count(*) as count FROM videos GROUP BY status;")
    status_counts = {r['status']: r['count'] for r in cursor.fetchall()}
    total_videos = sum(status_counts.values())

    # 2. Format breakdown
    cursor.execute("SELECT format_type, count(*) as count FROM videos GROUP BY format_type;")
    format_counts = {r['format_type']: r['count'] for r in cursor.fetchall()}

    # 3. Upcoming Drops (Next 7 & 28 days)
    cursor.execute("""
    SELECT video_number, code, format_type, title, drop_date, status, jdex_code, os_level
    FROM videos
    WHERE drop_date >= ?
    ORDER BY drop_date ASC;
    """, (today_str,))
    upcoming_drops = [dict(r) for r in cursor.fetchall()]

    # 4. All Videos Catalog
    cursor.execute("""
    SELECT video_number, code, format_type, title, drop_date, status, jdex_code, os_level, uploaded_date
    FROM videos
    ORDER BY video_number ASC;
    """)
    all_videos = [dict(r) for r in cursor.fetchall()]

    # 5. Open tasks
    cursor.execute("""
    SELECT t.task_name, t.phase, t.status, t.due_date, v.code, v.title
    FROM video_tasks t
    JOIN videos v ON v.id = t.video_id
    WHERE t.status != 'Completed'
    ORDER BY t.due_date ASC;
    """)
    open_tasks = [dict(r) for r in cursor.fetchall()]

    # 6. Stats - 48 Hours
    cursor.execute("""
    SELECT COALESCE(SUM(views), 0) as views, COALESCE(SUM(vph), 0.0) as vph, COALESCE(SUM(likes), 0) as likes, COALESCE(SUM(comments), 0) as comments
    FROM (
        SELECT views, vph, likes, comments
        FROM video_stats
        JOIN videos ON video_stats.video_id = videos.id
        WHERE snapshot_date >= ?
        GROUP BY video_id
        HAVING snapshot_date = MAX(snapshot_date)
    );
    """, (t_48h,))
    res_48h = cursor.fetchone()
    stats_48h = dict(res_48h) if res_48h else {"views": 0, "vph": 0.0, "likes": 0, "comments": 0}

    # 7. Stats - 7 Days
    cursor.execute("""
    SELECT COALESCE(SUM(views), 0) as views, COALESCE(SUM(likes), 0) as likes, COALESCE(AVG(ctr_pct), 0.0) as avg_ctr, COALESCE(SUM(comments), 0) as comments
    FROM (
        SELECT views, likes, ctr_pct, comments
        FROM video_stats
        JOIN videos ON video_stats.video_id = videos.id
        WHERE snapshot_date >= ?
        GROUP BY video_id
        HAVING snapshot_date = MAX(snapshot_date)
    );
    """, (t_7d,))
    res_7d = cursor.fetchone()
    stats_7d = dict(res_7d) if res_7d else {"views": 0, "likes": 0, "avg_ctr": 0.0, "comments": 0}

    # 8. Stats - 28 Days
    cursor.execute("""
    SELECT COALESCE(SUM(views), 0) as views, COALESCE(SUM(likes), 0) as likes, COALESCE(SUM(subscribers_gained), 0) as subs, COALESCE(AVG(ctr_pct), 0.0) as avg_ctr
    FROM (
        SELECT views, likes, subscribers_gained, ctr_pct
        FROM video_stats
        JOIN videos ON video_stats.video_id = videos.id
        WHERE snapshot_date >= ?
        GROUP BY video_id
        HAVING snapshot_date = MAX(snapshot_date)
    );
    """, (t_28d,))
    res_28d = cursor.fetchone()
    stats_28d = dict(res_28d) if res_28d else {"views": 0, "likes": 0, "subs": 0, "avg_ctr": 0.0}

    # 9. Stats - All Time
    cursor.execute("""
    SELECT COALESCE(SUM(views), 0) as views, COALESCE(SUM(likes), 0) as likes, COALESCE(SUM(comments), 0) as comments, COALESCE(SUM(subscribers_gained), 0) as subs
    FROM (
        SELECT views, likes, comments, subscribers_gained
        FROM video_stats
        JOIN videos ON video_stats.video_id = videos.id
        GROUP BY video_id
        HAVING snapshot_date = MAX(snapshot_date)
    );
    """)
    res_all = cursor.fetchone()
    stats_all_time = dict(res_all) if res_all else {"views": 0, "likes": 0, "comments": 0, "subs": 0}

    # 10. Top 10 vidIQ Outliers
    cursor.execute('''
    SELECT v.video_number, v.code, v.title, v.format_type, s.views, s.vph, s.ctr_pct, s.outlier_score, s.vidiq_score
    FROM video_stats s
    JOIN videos v ON s.video_id = v.id
    WHERE s.snapshot_date = (SELECT MAX(snapshot_date) FROM video_stats WHERE video_id = v.id)
    ORDER BY s.outlier_score DESC LIMIT 10;
    ''')
    top_10_outliers = [dict(r) for r in cursor.fetchall()]

    # 11. Top 10 Shorts and Longs with Rank Change
    cursor.execute('''
        SELECT snapshot_date 
        FROM video_stats 
        WHERE snapshot_date <= date('now', '-30 day') 
        ORDER BY snapshot_date DESC LIMIT 1
    ''')
    res = cursor.fetchone()
    if not res:
        cursor.execute('SELECT MIN(snapshot_date) as sd FROM video_stats')
        res = cursor.fetchone()
    old_snapshot = res['sd'] if res and 'sd' in res.keys() else (res[0] if res else None)

    old_ranks = {}
    if old_snapshot:
        cursor.execute('''
            SELECT v.id AS video_id, 
                   RANK() OVER(PARTITION BY v.format_type ORDER BY s.views DESC) as rank_30d
            FROM video_stats s
            JOIN videos v ON s.video_id = v.id
            WHERE s.snapshot_date = ?
        ''', (old_snapshot,))
        for r in cursor.fetchall():
            old_ranks[r['video_id']] = r['rank_30d']

    cursor.execute('''
        SELECT v.id, v.title, v.format_type, s.views
        FROM video_stats s
        JOIN videos v ON s.video_id = v.id
        WHERE s.snapshot_date = (SELECT MAX(snapshot_date) FROM video_stats WHERE video_id = v.id)
          AND v.format_type = 'Short'
        ORDER BY s.views DESC LIMIT 10;
    ''')
    top_10_shorts = []
    for i, r in enumerate(cursor.fetchall()):
        curr_rank = i + 1
        old_rank = old_ranks.get(r['id'])
        rank_change = (old_rank - curr_rank) if old_rank else None
        top_10_shorts.append({'title': r['title'], 'views': r['views'], 'rank_change': rank_change})

    cursor.execute('''
        SELECT v.id, v.title, v.format_type, s.views
        FROM video_stats s
        JOIN videos v ON s.video_id = v.id
        WHERE s.snapshot_date = (SELECT MAX(snapshot_date) FROM video_stats WHERE video_id = v.id)
          AND v.format_type = 'Long'
        ORDER BY s.views DESC LIMIT 10;
    ''')
    top_10_longs = []
    for i, r in enumerate(cursor.fetchall()):
        curr_rank = i + 1
        old_rank = old_ranks.get(r['id'])
        rank_change = (old_rank - curr_rank) if old_rank else None
        top_10_longs.append({'title': r['title'], 'views': r['views'], 'rank_change': rank_change})

    return {
        "today_str": today_str,
        "updated_at_str": updated_at_str,
        "total_videos": total_videos,
        "status_counts": status_counts,
        "format_counts": format_counts,
        "upcoming_drops": upcoming_drops,
        "all_videos": all_videos,
        "open_tasks": open_tasks,
        "stats_48h": stats_48h,
        "stats_7d": stats_7d,
        "stats_28d": stats_28d,
        "stats_all_time": stats_all_time,
        "top_10_outliers": top_10_outliers,
        "top_10_shorts": top_10_shorts,
        "top_10_longs": top_10_longs
    }


def generate_48h_report(data):
    filepath = os.path.join(ANALYTICS_DIR, "Analytics_48h.md")
    updated = data["updated_at_str"]
    s = data["stats_48h"]
    
    content = f"""# ⏱️ 48-Hour Velocity & Real-Time Pulse Report

*Last System Update: `{updated}`*

---

## ⚡ 48-Hour Real-Time Performance Summary

| Metric | 48-Hour Snapshot Value | Status Indicator |
| :--- | :--- | :--- |
| **48-Hour Total Views** | `{s['views']:,}` | 🟢 Staged Pre-Launch |
| **Avg VPH (Views Per Hour)** | `{s['vph']:.1f}` | ⚡ Velocity Steady |
| **48-Hour Likes** | `{s['likes']:,}` | 👍 Engagement Active |
| **48-Hour Comments** | `{s['comments']:,}` | 💬 Community Response |

---

## 📊 Pipeline Real-Time Status

* **Uploaded / Staged Videos**: `{data['status_counts'].get('#published', 0) + data['status_counts'].get('#uploaded', 0)}`
* **In Production**: `{data['status_counts'].get('#edit', 0)}`
* **Ready for Audio Riff**: `{data['status_counts'].get('#write', 0)}`

---

## 🎯 Next Scheduled Drops (Immediate 48-Hour Window)

"""
    immediate_drops = [d for d in data['upcoming_drops'] if d['drop_date'] <= (datetime.now() + timedelta(days=2)).strftime("%Y-%m-%d")]
    if immediate_drops:
        for d in immediate_drops:
            content += f"- **{d['drop_date']}** | `{d['code']}` ({d['format_type']}): **{d['title']}** — *[{d['status']}]*\n"
    else:
        content += "*No immediate video drops scheduled in the next 48 hours. Next scheduled channel launch drop begins August 3, 2026.*\n"

    content += """
---
*This document is automatically updated daily by `scripts/generate_analytics_reports.py`.*
"""
    with open(filepath, "w") as f:
        f.write(content)
    return filepath

def generate_7d_report(data):
    filepath = os.path.join(ANALYTICS_DIR, "Analytics_7d.md")
    updated = data["updated_at_str"]
    s = data["stats_7d"]
    
    content = f"""# 📅 7-Day Weekly Performance & Drop Calendar Report

*Last System Update: `{updated}`*

---

## 📈 7-Day Weekly Metric Summary

| Metric | 7-Day Total | Target Standard |
| :--- | :--- | :--- |
| **7-Day Total Views** | `{s['views']:,}` | Staged Pre-Release Baseline |
| **7-Day Total Likes** | `{s['likes']:,}` | High Retention Audience |
| **7-Day Average CTR** | `{s['avg_ctr']:.1f}%` | Standard: > 8.0% |
| **7-Day Comments** | `{s['comments']:,}` | Community Feedback |

---

## 🗓️ 7-Day Video Drop Calendar

Upcoming content drops scheduled for the next 7 days:

| Drop Date | Code | Format | Title | Status | JDex Topic |
| :--- | :--- | :--- | :--- | :--- | :--- |
"""
    next_7d_drops = [d for d in data['upcoming_drops'] if d['drop_date'] <= (datetime.now() + timedelta(days=7)).strftime("%Y-%m-%d")]
    if next_7d_drops:
        for d in next_7d_drops:
            content += f"| **{d['drop_date']}** | `{d['code']}` | {d['format_type']} | {d['title']} | **{d['status']}** | `{d['jdex_code']}` |\n"
    else:
        content += "| — | — | — | *Pre-release window active; drops start Aug 3, 2026* | — | — |\n"

    content += f"""
---

## ⏳ Weekly Production Milestones

* **Long-Form Videos Uploaded**: `{len([v for v in data['all_videos'] if v['format_type'] == 'Long' and v['status'] in ['#uploaded', '#published']])}`
* **Short-Form Blueprints Ready**: `{len([v for v in data['all_videos'] if v['format_type'] == 'Short'])}`
* **Active Open Tasks Due**: `{len(data['open_tasks'])}`

---
*This document is automatically updated daily by `scripts/generate_analytics_reports.py`.*
"""
    with open(filepath, "w") as f:
        f.write(content)
    return filepath

def generate_28d_report(data):
    filepath = os.path.join(ANALYTICS_DIR, "Analytics_28d.md")
    updated = data["updated_at_str"]
    s = data["stats_28d"]
    
    content = f"""# 🚀 28-Day Monthly Growth & Subscriber Acceleration Report

*Last System Update: `{updated}`*

---

## 📊 28-Day Executive Metrics

| Metric | 28-Day Monthly Total | Channel Benchmark |
| :--- | :--- | :--- |
| **28-Day Monthly Views** | `{s['views']:,}` | Growth Phase |
| **Subscribers Gained** | `+{s['subs']}` | Conversion Goal |
| **28-Day Total Likes** | `{s['likes']:,}` | Audience Value |
| **Average Monthly CTR** | `{s['avg_ctr']:.1f}%` | Thumbnail Efficiency |

---

## 📦 Content Format Breakdown (28-Day Pipeline)

| Format Type | Total Asset Count | Status Summary |
| :--- | :--- | :--- |
| **Long-Form Narratives** | `{data['format_counts'].get('Long', 0)}` | 3 Uploaded, 1 In Production |
| **Short-Form Content** | `{data['format_counts'].get('Short', 0)}` | 12 Pre-Recording Blueprints / Ready for Audio Riff |

---

## 🗓️ 28-Day Full Video Drop Queue

| Drop Date | Code | Format | Title | Status |
| :--- | :--- | :--- | :--- | :--- |
"""
    for d in data['upcoming_drops'][:15]:
        content += f"| **{d['drop_date']}** | `{d['code']}` | {d['format_type']} | {d['title']} | **{d['status']}** |\n"

    content += f"""
---
*This document is automatically updated daily by `scripts/generate_analytics_reports.py`.*
"""
    with open(filepath, "w") as f:
        f.write(content)
    return filepath

def generate_alltime_report(data):
    filepath = os.path.join(ANALYTICS_DIR, "Analytics_AllTime.md")
    updated = data["updated_at_str"]
    s = data["stats_all_time"]
    
    content = f"""# 🏆 All-Time Lifetime Channel Catalog & Executive Report

*Last System Update: `{updated}`*

---

## 👑 Lifetime Channel Totals

| Executive Metric | All-Time Total |
| :--- | :--- |
| **Total Lifetime Views** | `{s['views']:,}` |
| **Total Lifetime Likes** | `{s['likes']:,}` |
| **Total Lifetime Comments** | `{s['comments']:,}` |
| **Total Subscribers Gained** | `+{s['subs']}` |
| **Total Pipeline Assets (`001`-`099`)** | `{data['total_videos']}` |

---

## 📋 Complete Master Video Registry (`001` - `099`)

| Video # | Code | Format | Title | Drop Date | Status | JDex Topic |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
"""
    for v in data['all_videos']:
        content += f"| **{v['video_number']}** | `{v['code']}` | {v['format_type']} | {v['title']} | {v['drop_date']} | **{v['status']}** | `{v['jdex_code']}` |\n"

    content += f"""
---
*This document is automatically updated daily by `scripts/generate_analytics_reports.py`.*
"""
    with open(filepath, "w") as f:
        f.write(content)
    return filepath

def generate_video_paths():
    import sys
    sys.path.append(os.path.join(REPO_ROOT, "scripts"))
    from generate_video_paths import generate_paths
    generate_paths()
    return os.path.join(REPO_ROOT, "pipeline", "public", "video_paths.json")

def generate_json_for_app(data):
    app_dir = os.path.join(REPO_ROOT, "pipeline", "public")
    if not os.path.exists(app_dir):
        os.makedirs(app_dir)
    filepath = os.path.join(app_dir, "analytics.json")
    with open(filepath, "w") as f:
        json.dump(data, f, indent=2)
    return filepath

def main():
    ensure_analytics_dir()
    conn = get_db_connection()
    data = fetch_analytics_data(conn)
    conn.close()

    f1 = generate_48h_report(data)
    f2 = generate_7d_report(data)
    f3 = generate_28d_report(data)
    f4 = generate_alltime_report(data)
    f_json = generate_json_for_app(data)
    f_paths = generate_video_paths()

    print("Successfully generated all 4 timeframe Analytics Reports in Analytics/:")
    print(f"  - {f1}")
    print(f"  - {f2}")
    print(f"  - {f3}")
    print(f"  - {f4}")
    print(f"  - {f_json} (App Data)")
    print(f"  - {f_paths} (App Video Paths)")

if __name__ == "__main__":
    main()
