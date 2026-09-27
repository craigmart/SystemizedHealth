import sqlite3

def fix():
    conn = sqlite3.connect('database/videos.db')
    cursor = conn.cursor()
    cursor.execute("SELECT id, video_number FROM videos")
    for new_id, vnum in cursor.fetchall():
        try:
            old_id = int(vnum)
            cursor.execute("UPDATE video_stats SET video_id = ? WHERE video_id = ?", (new_id, old_id))
        except ValueError:
            pass # Skip H001 and similar
    conn.commit()
    print("Fixed.")

if __name__ == '__main__':
    fix()
