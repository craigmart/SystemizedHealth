import sqlite3
import os
import glob
from scripts.supabase_client import SupabaseClient

def clear_videos():
    conn = sqlite3.connect('database/videos.db')
    cursor = conn.cursor()
    sb = SupabaseClient()
    
    # Get the videos to clear
    cursor.execute("SELECT video_number, code, id FROM videos WHERE video_number >= '021' AND video_number <= '032';")
    videos_to_clear = cursor.fetchall()
    
    cleared_count = 0
    for v in videos_to_clear:
        v_num, code, v_id = v
        
        new_code = f"TBD-{v_num}"
        
        # 1. Update SQLite
        cursor.execute("UPDATE videos SET code = ?, title = ?, status = ? WHERE video_number = ?;", (new_code, 'Placeholder', '#idea', v_num))
        
        # 2. Update Supabase
        sb._request('PATCH', 'videos', body={'code': new_code, 'title': 'Placeholder', 'status': '#idea'}, params={'video_number': f"eq.{v_num}"})
        
        # 3. Delete Obsidian Files
        obsidian_pattern = f"Obsidian_Vault/Zettlekasten/{code}*.md"
        for filepath in glob.glob(obsidian_pattern):
            if os.path.exists(filepath):
                os.remove(filepath)
                print(f"Deleted {filepath}")
                
        cleared_count += 1
        print(f"Cleared video {v_num} (was {code}) to {new_code} #idea placeholder.")
        
    conn.commit()
    print(f"Successfully cleared {cleared_count} videos.")

if __name__ == "__main__":
    clear_videos()
