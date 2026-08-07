#!/usr/bin/env python3
"""
Systemized Health — JDex to Obsidian Sync
scripts/sync_jdex_to_obsidian.py

Parses JDex_Export.md and generates individual atomic Markdown nodes
in Obsidian_Vault/JDex/.
"""

import os
import re
import html
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
EXPORT_FILE = PROJECT_ROOT / "JDex_Export.md"
JDEX_DIR = PROJECT_ROOT / "Obsidian_Vault" / "JDex"

def sanitize_filename(name):
    # Remove invalid characters for filenames
    name = name.replace("/", "-").replace(":", "-").replace("\\", "-")
    return name.strip()

def parse_jdex_export():
    if not EXPORT_FILE.exists():
        print(f"❌ Could not find {EXPORT_FILE}")
        return []

    jdex_nodes = []
    pattern = re.compile(r"^\s*-\s*([\d\.-]+)\s*-?\s*(.*?)\s*\(Note:\s*(.*?)\)")

    with open(EXPORT_FILE, "r", encoding="utf-8") as f:
        for line in f:
            match = pattern.search(line)
            if match:
                code = match.group(1).strip()
                title = html.unescape(match.group(2).strip())
                note = html.unescape(match.group(3).strip())
                
                if title.startswith("- "):
                    title = title[2:]
                
                jdex_nodes.append({
                    "code": code,
                    "title": title,
                    "note": note
                })
    return jdex_nodes

def sync_nodes(nodes):
    JDEX_DIR.mkdir(parents=True, exist_ok=True)
    
    created = 0
    updated = 0

    for node in nodes:
        code = node["code"]
        title = node["title"]
        note = node["note"]

        filename = f"{code} {sanitize_filename(title)}.md"
        filepath = JDEX_DIR / filename
        
        content = f"---\naliases: [\"{code}\"]\ntags: [\"#jdex\"]\n---\n# {code} {title}\n\n"
        if note:
            content += f"{note}\n"
        
        if filepath.exists():
            updated += 1
        else:
            with open(filepath, "w", encoding="utf-8") as f:
                f.write(content)
            created += 1

    print(f"✅ Sync Complete: {created} nodes created, {updated} nodes skipped (already exist).")

if __name__ == "__main__":
    print("Starting JDex to Obsidian Sync...")
    nodes = parse_jdex_export()
    print(f"Found {len(nodes)} JDex nodes in export.")
    sync_nodes(nodes)
