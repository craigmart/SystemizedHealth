#!/usr/bin/env python3
"""
Systemized Health — Sync Johnny Decimal (JDex) Taxonomy from Workflowy
scripts/sync_workflowy_jdex.py

Authoritative Source: Workflowy JDex Node (ID: 4404fe5a-74f3-90ee-941c-39de281959ca)
Share URL: https://workflowy.com/s/jdex/nItQHGQVgRMmOIYe

This script:
1. Fetches the complete JDex tree from Workflowy.
2. Formats and writes `docs/workflowy_jdex_tree.json`.
3. Generates a clean Markdown cheatsheet `docs/JDex_Taxonomy_Reference.md`.
4. Discovers new JDex codes and optionally creates matching notes in `Obsidian_Vault/JDex/`.
"""

import os
import sys
import json
import re
import html
from pathlib import Path
from datetime import datetime

PROJECT_ROOT = Path(__file__).resolve().parent.parent
CONFIG_PATH = PROJECT_ROOT / "scripts" / "config.json"
OUTPUT_JSON = PROJECT_ROOT / "docs" / "workflowy_jdex_tree.json"
OUTPUT_MD = PROJECT_ROOT / "docs" / "JDex_Taxonomy_Reference.md"
OBSIDIAN_JDEX_DIR = PROJECT_ROOT / "Obsidian_Vault" / "JDex"

JDEX_ROOT_NODE_ID = "4404fe5a-74f3-90ee-941c-39de281959ca"
API_BASE = "https://workflowy.com/api/v1/nodes"

def load_config():
    if CONFIG_PATH.exists():
        try:
            with open(CONFIG_PATH, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            print(f"Error reading config: {e}", file=sys.stderr)
    return {}

def make_request(url, api_key):
    import urllib.request
    import ssl

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    req = urllib.request.Request(url, headers=headers, method="GET")
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE

    try:
        with urllib.request.urlopen(req, context=ctx, timeout=15) as resp:
            body = resp.read().decode("utf-8")
            return json.loads(body) if body else {}
    except Exception as e:
        print(f"⚠️ Workflowy API Error ({url}): {e}", file=sys.stderr)
        return None

def clean_text(raw):
    if not raw:
        return ""
    # Strip HTML tags
    t = re.sub(r"<[^>]+>", "", raw)
    return html.unescape(t).strip()

def fetch_children(parent_id, api_key, depth=0, max_depth=3):
    if depth > max_depth:
        return []
    url = f"{API_BASE}?parent_id={parent_id}"
    res = make_request(url, api_key)
    if not res or "nodes" not in res:
        return []

    results = []
    for node in res["nodes"]:
        name = clean_text(node.get("name", ""))
        note = clean_text(node.get("note", ""))
        node_id = node.get("id")
        
        children = fetch_children(node_id, api_key, depth=depth+1, max_depth=max_depth)

        results.append({
            "id": node_id,
            "name": name,
            "note": note,
            "children": children
        })
    return results

def flatten_jdex_nodes(tree, parent_path=""):
    """Extract all items that look like a Johnny Decimal code (e.g. 81.05 or 41)."""
    flat = []
    for item in tree:
        name = item["name"]
        match = re.search(r"(\d{2}(?:\.\d{1,2}(?:\.\d{1,2})?)?)\s*[-–:]?\s*(.+)", name)
        code = match.group(1) if match else None
        title = match.group(2).strip() if match else name

        flat.append({
            "code": code,
            "name": name,
            "title": title,
            "note": item.get("note", ""),
            "path": f"{parent_path} > {name}" if parent_path else name,
            "has_children": len(item.get("children", [])) > 0
        })
        if item.get("children"):
            flat.extend(flatten_jdex_nodes(item["children"], parent_path=name))
    return flat

def generate_markdown_cheatsheet(tree):
    now = datetime.now().strftime("%Y-%m-%d %H:%M")
    md = [
        "# 🗂️ Johnny Decimal (JDex) Master Taxonomy",
        f"\n*Synchronized from Workflowy: {now}*",
        "*Authoritative Source*: [Workflowy JDex](https://workflowy.com/s/jdex/nItQHGQVgRMmOIYe)\n",
        "---\n"
    ]

    def render_nodes(nodes, level=2):
        prefix = "#" * level
        for node in nodes:
            name = node["name"]
            note = node.get("note", "")
            md.append(f"{prefix} {name}")
            if note:
                md.append(f"> {note}\n")
            if node.get("children"):
                render_nodes(node["children"], level=min(level+1, 5))
            md.append("")

    render_nodes(tree, level=2)
    return "\n".join(md)

def sync_obsidian_notes(flat_nodes):
    OBSIDIAN_JDEX_DIR.mkdir(parents=True, exist_ok=True)
    created_count = 0

    for item in flat_nodes:
        code = item["code"]
        title = item["title"]
        if not code or "." not in code:
            continue  # Only create for specific decimal codes like 81.05 or 41.03

        # Sanitize filename
        safe_title = re.sub(r'[/\\:*?"<>|]', '-', title).strip()
        filename = f"{code} {safe_title}.md"
        filepath = OBSIDIAN_JDEX_DIR / filename

        if not filepath.exists():
            content = f"# {code} {title}\n\n{title}\n\n## Clinical & Zettelkasten Propositions\n\n*(Synchronized from Workflowy JDex)*\n"
            with open(filepath, "w", encoding="utf-8") as f:
                f.write(content)
            created_count += 1

    return created_count

def main():
    cfg = load_config()
    api_key = cfg.get("workflowy_api_key")
    if not api_key:
        print("❌ Error: workflowy_api_key missing in scripts/config.json", file=sys.stderr)
        sys.exit(1)

    print(f"🚀 Fetching authoritative JDex tree from Workflowy (Root: {JDEX_ROOT_NODE_ID})...", flush=True)
    tree = fetch_children(JDEX_ROOT_NODE_ID, api_key, depth=0, max_depth=3)

    if not tree:
        print("❌ Failed to fetch JDex tree from Workflowy.", file=sys.stderr)
        sys.exit(1)

    # 1. Save Raw JSON
    OUTPUT_JSON.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_JSON, "w", encoding="utf-8") as f:
        json.dump(tree, f, indent=2)
    print(f"  ✅ Saved JSON tree ({len(tree)} top categories) → {OUTPUT_JSON}", flush=True)

    # 2. Generate Markdown Cheatsheet
    cheatsheet = generate_markdown_cheatsheet(tree)
    with open(OUTPUT_MD, "w", encoding="utf-8") as f:
        f.write(cheatsheet)
    print(f"  ✅ Generated Markdown Reference → {OUTPUT_MD}", flush=True)

    # 3. Flatten and sync Obsidian Notes
    flat = flatten_jdex_nodes(tree)
    created = sync_obsidian_notes(flat)
    print(f"  ✅ Discovered {len(flat)} total nodes across all levels.")
    if created > 0:
        print(f"  ✨ Created {created} new JDex category notes in Obsidian_Vault/JDex/")
    else:
        print("  ✨ All specific JDex category notes in Obsidian_Vault/JDex/ are up to date.")

if __name__ == "__main__":
    main()
