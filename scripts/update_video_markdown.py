#!/usr/bin/env python3
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
                
                # Extract code from filename, e.g., "V0B-S1 Script - ..."
                # Wait, the filenames are like "V0B-S1 Script - ...", but the full code is "80.V0B-S1"
                # Let's extract the code from the first line or filename
                with open(filepath, "r", encoding="utf-8") as f:
                    content = f.read()
                
                # If already has YAML, skip or update? Let's just skip if it already starts with ---
                if content.startswith("---"):
                    continue

                # Find the video code in the content
                # "Video Code**: `80.V0B-S1`"
                code_match = re.search(r"Video Code\*\*:\s*`([^`]+)`", content)
                if not code_match:
                    continue
                
                code = code_match.group(1)
                video_data = video_map.get(code)
                if not video_data:
                    continue

                # Parse suggested settings
                settings_match = re.search(r"Suggested Settings\*\*:\s*([^\n]+)", content)
                settings_tags = []
                if settings_match:
                    settings_str = settings_match.group(1)
                    settings_tags = [t.strip() for t in settings_str.split() if t.startswith("#")]

                # Create YAML
                status = video_data.get("status", "#idea")
                format_type = video_data.get("format_type", "")
                drop_date = video_data.get("drop_date", "")
                
                tags = ["#video", status] + settings_tags
                tags_str = ", ".join([f'"{t}"' for t in tags])

                yaml = f"---\naliases: [\"{code}\"]\ntags: [{tags_str}]\nformat: \"{format_type}\"\ndrop_date: \"{drop_date}\"\n---\n"
                
                # Replace JDex Topic Code: `42.02` with [[42.02]]
                content = re.sub(r"(JDex Topic Code\*\*:\s*)`([^`]+)`(.*)", r"\1[[\2]]\3", content)

                new_content = yaml + content

                with open(filepath, "w", encoding="utf-8") as f:
                    f.write(new_content)
                
                updated_count += 1

    print(f"✅ Updated {updated_count} video scripts with Obsidian YAML frontmatter and Zettelkasten backlinks.")

if __name__ == "__main__":
    main()
