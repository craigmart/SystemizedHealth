import re
with open("scripts/generate_analytics_reports.py", "r") as f:
    code = f.read()

new_query = """    # 10. Top 10 Videos by Views
    cursor.execute('''
    SELECT v.video_number, v.code, v.title, v.format_type, s.views, s.vph, s.ctr_pct
    FROM video_stats s
    JOIN videos v ON s.video_id = v.id
    WHERE s.snapshot_date = (SELECT MAX(snapshot_date) FROM video_stats WHERE video_id = v.id)
    ORDER BY s.views DESC LIMIT 10;
    ''')
    top_10_views = [dict(r) for r in cursor.fetchall()]

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
        "top_10_views": top_10_views
    }
"""

old_return = """    return {
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
        "stats_all_time": stats_all_time
    }"""

if old_return in code:
    code = code.replace(old_return, new_query)
    with open("scripts/generate_analytics_reports.py", "w") as f:
        f.write(code)
    print("Patched!")
else:
    print("Could not find return block!")
