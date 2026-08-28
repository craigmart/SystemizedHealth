#!/usr/bin/env python3
"""
Systemized Health — Clean Published Script
scripts/clean_published_script.py

Cleans up a published video script by removing scaffolding, formatting the
teleprompter script into a clean article, and using Gemini Pro to extract
propositions linked to JDex codes.
"""

import sys
import os
import re
import json
from pathlib import Path
from datetime import datetime

try:
    from google import genai
except ImportError:
    genai = None

PROJECT_ROOT = Path(__file__).resolve().parent.parent
VIDEOS_DIR = PROJECT_ROOT / "Obsidian_Vault" / "Zettlekasten"
JDEX_FILE = PROJECT_ROOT / "JDex_Export.md"
CONFIG_FILE = PROJECT_ROOT / "scripts" / "config.json"

def load_config():
    if CONFIG_FILE.exists():
        with open(CONFIG_FILE, "r") as f:
            return json.load(f)
    return {}

def clean_transcript(text):
    # Remove teleprompter headers like `### 80.V0B-S1>1 — The Hook #edit`
    text = re.sub(r"^###\s+.*?\n", "", text, flags=re.MULTILINE)
    
    # Remove performance cues like [breath], [pause], [gesture], [tone shift]
    text = re.sub(r"\[.*?\]", "", text)
    
    # Clean up multiple newlines
    text = re.sub(r"\n{3,}", "\n\n", text)
    
    return text.strip()

def extract_propositions(transcript):
    if not genai:
        return "- LLM library not installed."
        
    cfg = load_config()
    api_key = cfg.get("gemini_api_key")
    if not api_key:
        return "*(Gemini API key missing in config.json. Please add it to generate propositions.)*"
        
    jdex_context = ""
    if JDEX_FILE.exists():
        with open(JDEX_FILE, "r") as f:
            jdex_context = f.read()

    prompt = f"""
You are an expert knowledge manager for Dr. Craig Anderson's Zettelkasten.
I will provide you with a video transcript and his JDex (Index) outline.

Your task is to extract 3-5 core "propositions" (key claims/insights) from the transcript.
Format them as a bulleted list. For each proposition, append the most relevant JDex code in double brackets (e.g., [[42.02]]) at the end of the line.

JDEX OUTLINE:
{jdex_context}

TRANSCRIPT:
{transcript}

OUTPUT FORMAT:
- Proposition 1 [[JDexCode]]
- Proposition 2 [[JDexCode]]
"""
    try:
        client = genai.Client(api_key=api_key)
        response = client.models.generate_content(
            model='gemini-3.6-flash',
            contents=prompt,
        )
        return response.text.strip()
    except Exception as e:
        return f"*(Error generating propositions: {e})*"

def process_file(file_path):
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()
        
    # We want to keep: YAML
    yaml_match = re.search(r'^(---.*?---)', content, flags=re.MULTILINE | re.DOTALL)
    if not yaml_match:
        print(f"Skipping {file_path.name} - could not parse YAML header.")
        return False
        
    yaml_content = yaml_match.group(1)
    
    tags_block = re.search(r'(tags:.*?)(?=\n[a-z_]+:|\n---|$)', yaml_content, flags=re.DOTALL)
    if tags_block:
        tags_str = tags_block.group(1)
        new_tags = "tags:\n  - \"#video\"\n"
        if "published" in tags_str.lower(): new_tags += "  - \"#published\"\n"
        elif "uploaded" in tags_str.lower(): new_tags += "  - \"#uploaded\"\n"
        elif "edit" in tags_str.lower(): new_tags += "  - \"#edit\"\n"
        
        yaml_content = yaml_content.replace(tags_str, new_tags)
    
    header_block = yaml_content
    
    # Extract script content
    s3_match = re.search(r"## 3\. Full Script[^\n]*\n(.*?)(?:## 4\.|## 5\.|## Propositions|## Changelog|## Raw Audio|$)", content, flags=re.DOTALL)
    
    if not s3_match:
        # Fallback to finding Final Transcript if already partially cleaned
        s3_match = re.search(r"## Final Transcript[^\n]*\n(.*?)(?:## Propositions|## Changelog|$)", content, flags=re.DOTALL)
        if not s3_match:
            print(f"Skipping {file_path.name} - could not find Section 3 or Final Transcript.")
            return False
            
    raw_script = s3_match.group(1)
    clean_script = clean_transcript(raw_script)
    
    print(f"Processing {file_path.name}...")
    propositions = extract_propositions(clean_script)
    
    changelog_match = re.search(r"## Changelog\n(.*)", content, flags=re.DOTALL)
    changelog = changelog_match.group(1).strip() if changelog_match else ""
    
    new_content = f"{header_block}\n\n## Final Transcript\n\n{clean_script}\n\n## Propositions\n\n{propositions}\n"
    if changelog:
        new_content += f"\n## Changelog\n\n{changelog}\n"
    else:
        new_content += f"\n## Changelog\n\n- [{datetime.now().strftime('%Y-%m-%d')}] Script cleaned and propositions extracted.\n"
    
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(new_content)
        
    return True

def clean_all_eligible():
    count = 0
    for file in VIDEOS_DIR.iterdir():
        if file.is_file() and file.name.endswith(".md"):
            with open(file, "r", encoding="utf-8") as f:
                content = f.read()
            # Check if the YAML tags contain 'edit', 'uploaded', or 'published'
            yaml_match = re.search(r'^---(.*?)---', content, re.MULTILINE | re.DOTALL)
            is_eligible = False
            if yaml_match:
                tags = yaml_match.group(1).lower()
                if any(t in tags for t in ['edit', 'uploaded', 'published']):
                    is_eligible = True
            if is_eligible:
                if "## Final Transcript" not in content:
                    if process_file(file):
                        count += 1
    print(f"✅ Cleaned {count} eligible video scripts.")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        # Process specific file
        process_file(Path(sys.argv[1]))
    else:
        # Process all eligible
        clean_all_eligible()
