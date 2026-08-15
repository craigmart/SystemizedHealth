with open("scripts/generate_analytics_reports.py", "r") as f:
    code = f.read()

# I will replace the top_10_views query with top_10_outliers
old_query = """    # 10. Top 10 Videos by Views
    cursor.execute('''
    SELECT v.video_number, v.code, v.title, v.format_type, s.views, s.vph, s.ctr_pct
    FROM video_stats s
    JOIN videos v ON s.video_id = v.id
    WHERE s.snapshot_date = (SELECT MAX(snapshot_date) FROM video_stats WHERE video_id = v.id)
    ORDER BY s.views DESC LIMIT 10;
    ''')
    top_10_views = [dict(r) for r in cursor.fetchall()]"""

new_query = """    # 10. Top 10 vidIQ Outliers
    cursor.execute('''
    SELECT v.video_number, v.code, v.title, v.format_type, s.views, s.vph, s.ctr_pct, s.outlier_score, s.vidiq_score
    FROM video_stats s
    JOIN videos v ON s.video_id = v.id
    WHERE s.snapshot_date = (SELECT MAX(snapshot_date) FROM video_stats WHERE video_id = v.id)
    ORDER BY s.outlier_score DESC LIMIT 10;
    ''')
    top_10_outliers = [dict(r) for r in cursor.fetchall()]"""

if old_query in code:
    code = code.replace(old_query, new_query)
    code = code.replace('"top_10_views": top_10_views', '"top_10_outliers": top_10_outliers')
    with open("scripts/generate_analytics_reports.py", "w") as f:
        f.write(code)
    print("Patched!")
else:
    print("Failed to find old query")
