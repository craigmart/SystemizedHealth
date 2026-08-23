import os
import json
import re
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
VIDEOS_DIR = PROJECT_ROOT / "Obsidian_Vault" / "Zettlekasten"
CACHE_FILE = PROJECT_ROOT / "docs" / "video_pipeline_cache.json"

def sanitize_filename(title):
    # Remove characters that are unsafe for filenames
    return re.sub(r'[\\/*?:"<>|]', "", title).strip()

def main():
    if not CACHE_FILE.exists():
        print("Cache file not found.")
        return

    with open(CACHE_FILE, "r") as f:
        cache = json.load(f)

    video_map = {v["code"]: v for v in cache["videos"]}

    updated_count = 0

    for file in VIDEOS_DIR.iterdir():
        if file.is_file() and file.name.endswith(".md"):
            # Extract code from filename, assuming it starts with '80.'
            match = re.search(r'^(80\.[A-Z0-9\-]+)', file.name)
            if not match:
                # Also check if it's HIST. something
                match = re.search(r'^(HIST\.[A-Z0-9\-]+)', file.name)
                if not match:
                    continue
            
            code = match.group(1)
            video_data = video_map.get(code)
            
            if not video_data:
                print(f"Code {code} not found in DB, skipping.")
                continue
                
            actual_title = video_data.get("title", "")
            if not actual_title:
                continue

            # Read content
            with open(file, "r", encoding="utf-8") as f:
                content = f.read()

            # Remove the H1 header like "# 80.V0A1-S2: Stop Biohacking..."
            # Let's match lines starting with "# " followed by the code
            # Or just any H1 that starts with "# " and looks like a title
            # Actually, to be safe, we can remove the specific H1 that matches `# {code}:` or `# {code} `
            # or simply the first H1 that appears after frontmatter.
            
            # The pattern could be: ^# .*$
            # Let's find the first H1 and remove it. But we must be careful not to remove all H1s.
            # Usually it's `# 80.V...: Title`
            content_new = re.sub(rf"^#\s+{re.escape(code)}[^\n]*\n+", "", content, count=1, flags=re.MULTILINE)
            
            # Check if it was removed. If not, maybe it doesn't have the code.
            if content_new == content:
                # Try just finding any H1 as the first heading
                # We'll just look for a line starting with "# " and remove it (only the first one)
                # But only if it's before ## Title Ideas etc.
                pass
            
            content = content_new

            # Write content back
            with open(file, "w", encoding="utf-8") as f:
                f.write(content)
            
            # Rename the file
            safe_title = sanitize_filename(actual_title)
            new_filename = f"{code} Script - {safe_title}.md"
            new_filepath = VIDEOS_DIR / new_filename
            
            if file != new_filepath:
                print(f"Renaming {file.name} -> {new_filename}")
                file.rename(new_filepath)
                updated_count += 1
            else:
                print(f"Title is already correct for {file.name}, just removed header if present.")

    print(f"Updated {updated_count} files.")

if __name__ == "__main__":
    main()
