import sqlite3
import os
import glob
from scripts.supabase_client import SupabaseClient

def delete_unwanted_videos():
    conn = sqlite3.connect('database/videos.db')
    cursor = conn.cursor()
    sb = SupabaseClient()
    
    # Get the videos to delete
    cursor.execute("SELECT video_number, code, id FROM videos WHERE video_number >= '021' AND video_number <= '032';")
    videos_to_delete = cursor.fetchall()
    
    deleted_count = 0
    for v in videos_to_delete:
        v_num, code, v_id = v
        
        # 1. Delete from SQLite
        cursor.execute("DELETE FROM videos WHERE video_number = ?;", (v_num,))
        
        # 2. Delete from Supabase
        sb._request('DELETE', 'videos', params={'video_number': f"eq.{v_num}"})
        
        # 3. Delete Obsidian Files
        obsidian_pattern = f"Obsidian_Vault/Zettlekasten/{code}*.md"
        for filepath in glob.glob(obsidian_pattern):
            if os.path.exists(filepath):
                os.remove(filepath)
                print(f"Deleted {filepath}")
                
        deleted_count += 1
        print(f"Deleted video {v_num} ({code}) from database.")
        
    conn.commit()
    print(f"Successfully deleted {deleted_count} videos.")

if __name__ == "__main__":
    delete_unwanted_videos()
