import os
import json
import re
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
VIDEOS_DIR = PROJECT_ROOT / "Obsidian_Vault" / "Videos"
CACHE_FILE = PROJECT_ROOT / "docs" / "video_pipeline_cache.json"

def main():
    if not CACHE_FILE.exists():
        print("Cache file not found.")
        return

    with open(CACHE_FILE, "r") as f:
        cache = json.load(f)

    video_map = {v["code"]: v for v in cache["videos"]}
    updated_count = 0

    for root, dirs, files in os.walk(VIDEOS_DIR):
        for file in files:
            if file.endswith(".md"):
                filepath = Path(root) / file
                
                with open(filepath, "r", encoding="utf-8") as f:
                    content = f.read()

                # Find the video code in the content
                code_match = re.search(r"\*\*Video Code\*\*:\s*`([^`]+)`", content)
                if not code_match:
                    continue
                
                code = code_match.group(1)
                video_data = video_map.get(code)
                if not video_data:
                    continue

                status = video_data.get("status", "#idea")
                drop_date = video_data.get("drop_date", "TBD")
                
                # Check if Drop Date or Status is already in the header
                if "**Drop Date**" in content or "**Status**" in content:
                    # Replace them if they exist
                    content = re.sub(r"\*\*Status\*\*:[^\n]+\n", "", content)
                    content = re.sub(r"\*\*Drop Date\*\*:[^\n]+\n", "", content)

                # Insert them right after Video Code
                replacement = f"**Video Code**: `{code}`  \n**Status**: {status}  \n**Drop Date**: {drop_date}  "
                content = re.sub(r"\*\*Video Code\*\*:\s*`[^`]+`(\s*)", replacement + r"\1", content, count=1)

                with open(filepath, "w", encoding="utf-8") as f:
                    f.write(content)
                
                updated_count += 1

    print(f"✅ Updated {updated_count} video scripts with visible Drop Date and Status headers.")

if __name__ == "__main__":
    main()
