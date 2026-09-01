import json
import sqlite3
from scripts.supabase_client import SupabaseClient

def dict_factory(cursor, row):
    d = {}
    for idx, col in enumerate(cursor.description):
        d[col[0]] = row[idx]
    return d

conn = sqlite3.connect('database/videos.db')
conn.row_factory = dict_factory
cursor = conn.cursor()
sb = SupabaseClient()

with open('/tmp/supa_dump.json', 'r') as f:
    dumped_videos = json.load(f)

# Get sqlite valid columns
cursor.execute("PRAGMA table_info(videos)")
valid_cols = [c['name'] for c in cursor.fetchall()]

status_map = {
    'Uploaded': '#uploaded',
    'Editing': '#edit',
    'In Production': '#edit',
    'Ready for Audio Riff': '#write',
}

print(f"Restoring {len(dumped_videos)} videos to SQLite...")
for v in dumped_videos:
    if v.get('status') in status_map:
        v['status'] = status_map[v['status']]

    # Filter out anything not in sqlite
    v_clean = {k: v[k] for k in v if k in valid_cols and k not in ['id', 'created_at', 'updated_at']}
    
    cols = ", ".join(v_clean.keys())
    vals_placeholder = ", ".join(["?"] * len(v_clean))
    vals = tuple(v_clean.values())
    
    try:
        cursor.execute(f"INSERT INTO videos ({cols}) VALUES ({vals_placeholder})", vals)
    except Exception as e:
        print(f"SQLite Insert error for {v.get('video_number')}: {e}")
    
conn.commit()
print("SQLite done!")
