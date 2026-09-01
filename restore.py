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

status_map = {
    'Uploaded': '#uploaded',
    'Editing': '#edit',
    'In Production': '#edit',
    'Ready for Audio Riff': '#write',
}

print("Restoring videos from local SQLite to Supabase...")
cursor.execute("SELECT * FROM videos")
videos = cursor.fetchall()

for v in videos:
    if 'id' in v:
        del v['id']
    if 'created_at' in v:
        del v['created_at']
    if 'updated_at' in v:
        del v['updated_at']
        
    if v['status'] in status_map:
        v['status'] = status_map[v['status']]
    
    res = sb.upsert_video(v)
    if res and 'id' in res:
        print(f"Upserted {v['video_number']} ({v['code']}) -> {res['id']}")
    else:
        print(f"Failed or missing id for {v['video_number']}: {res}")

print(f"Restore complete! Pushed {len(videos)} videos.")
