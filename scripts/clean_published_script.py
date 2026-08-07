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

try:
    import google.generativeai as genai
except ImportError:
    genai = None

PROJECT_ROOT = Path(__file__).resolve().parent.parent
VIDEOS_DIR = PROJECT_ROOT / "Obsidian_Vault" / "Videos"
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
        
    genai.configure(api_key=api_key)
    
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
        model = genai.GenerativeModel('gemini-flash-latest')
        response = model.generate_content(prompt)
        return response.text.strip()
    except Exception as e:
        return f"*(Error generating propositions: {e})*"

def process_file(file_path):
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()
        
    # We want to keep: YAML, H1, and the Metadata block.
    # The metadata block usually ends before "## 1. Title Ideas"
    
    header_match = re.search(r"(---.*?---.*?\n# .*?\n.*?\*\*JDex Topic Code\*\*:[^\n]+\n)", content, flags=re.DOTALL)
    if not header_match:
        print(f"Skipping {file_path.name} - could not parse header.")
        return False
        
    header_block = header_match.group(1).strip()
    
    # Extract Section 3
    s3_match = re.search(r"## 3\. Full Script[^\n]*\n(.*?)## 4\.", content, flags=re.DOTALL)
    if not s3_match:
        # Maybe there is no Section 4? Try to just get everything until next H2
        s3_match = re.search(r"## 3\. Full Script[^\n]*\n(.*?)(?:## 4\.|## 5\.|## Propositions|$)", content, flags=re.DOTALL)
        
    if not s3_match:
        print(f"Skipping {file_path.name} - could not find Section 3.")
        return False
        
    raw_script = s3_match.group(1)
    clean_script = clean_transcript(raw_script)
    
    print(f"Processing {file_path.name}...")
    propositions = extract_propositions(clean_script)
    
    new_content = f"{header_block}\n\n## Final Transcript\n\n{clean_script}\n\n## Propositions\n\n{propositions}\n"
    
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(new_content)
        
    return True

def clean_all_published():
    count = 0
    for folder in VIDEOS_DIR.iterdir():
        if folder.is_dir():
            for file in folder.iterdir():
                if file.name.endswith(".md"):
                    with open(file, "r", encoding="utf-8") as f:
                        content = f.read()
                    if "**Status**: #published" in content:
                        if "## Final Transcript" not in content:
                            if process_file(file):
                                count += 1
    print(f"✅ Cleaned {count} published video scripts.")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        # Process specific file
        process_file(Path(sys.argv[1]))
    else:
        # Process all published
        clean_all_published()
