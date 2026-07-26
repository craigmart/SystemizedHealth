#!/usr/bin/env python3
"""
Workflowy Sync Script for Systemized Health Video Outlines & Field Notes

API: Workflowy API v1 (https://workflowy.com/api/v1/nodes)

Usage:
  # List all root nodes or top-level pipeline items
  python scripts/workflowy_sync.py --list

  # Push outline file to Workflowy
  python scripts/workflowy_sync.py --push --file "Videos/80.V0A1-Outline.md" --title "80.V0A1 - The Systemize Operating System"

  # Pull production tags & completion status from Workflowy for a video
  python scripts/workflowy_sync.py --pull --code "80.V0A1"
"""

import sys
import os
import json
import argparse
import urllib.request
import urllib.parse
import ssl

CONFIG_PATH = os.path.join(os.path.dirname(__file__), "config.json")
API_BASE = "https://workflowy.com/api/v1/nodes"

def load_config():
    if os.path.exists(CONFIG_PATH):
        try:
            with open(CONFIG_PATH, "r") as f:
                return json.load(f)
        except Exception:
            pass
    return {}

def make_request(url, api_key, method="GET", payload=None):
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    data = json.dumps(payload).encode('utf-8') if payload else None
    req = urllib.request.Request(url, data=data, headers=headers, method=method)

    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE

    try:
        with urllib.request.urlopen(req, context=ctx) as resp:
            body = resp.read().decode('utf-8')
            return json.loads(body) if body else {"status": "ok"}
    except Exception as e:
        print(f"Workflowy API Error ({method} {url}): {e}", file=sys.stderr)
        return None

def fetch_all_nodes(api_key):
    res = make_request(API_BASE, api_key, method="GET")
    if res and "nodes" in res:
        return res["nodes"]
    return []

def find_or_create_root_node(api_key, root_name="Systemized Health Pipeline"):
    nodes = fetch_all_nodes(api_key)
    # Check for existing user folders first
    candidate_names = [root_name.lower(), "80.00 systemized health", "systemized health (2025)", "systemized health"]
    
    for candidate in candidate_names:
        for node in nodes:
            if node.get("parent_id") is None and candidate in node.get("name", "").strip().lower():
                print(f"Using existing Workflowy root node: '{node.get('name')}' (ID: {node['id']})")
                return node["id"]

    # Create root node if not found
    payload = {"name": root_name, "note": "Systemized Health Master Video Field Notes & Outlines"}
    res = make_request(API_BASE, api_key, method="POST", payload=payload)
    if res and "id" in res:
        print(f"Created root Workflowy folder: '{root_name}' (ID: {res['id']})")
        return res["id"]
    return None

def create_child_node(api_key, parent_id, name, note=None):
    payload = {"parent_id": parent_id, "name": name}
    if note:
        payload["note"] = note
    res = make_request(API_BASE, api_key, method="POST", payload=payload)
    if res and "id" in res:
        return res["id"]
    return None

def parse_markdown_to_bullets(filepath):
    """Parses a markdown outline file into a tree structure for Workflowy."""
    if not os.path.exists(filepath):
        print(f"Error: File not found {filepath}", file=sys.stderr)
        return []

    lines = []
    with open(filepath, "r", encoding="utf-8") as f:
        for line in f:
            stripped = line.rstrip()
            if stripped:
                lines.append(stripped)
    return lines

def push_outline(api_key, filepath, title=""):
    root_id = find_or_create_root_node(api_key)
    if not root_id:
        print("Error: Could not obtain parent Workflowy root folder.", file=sys.stderr)
        return

    filename = os.path.basename(filepath)
    video_title = title or os.path.splitext(filename)[0]

    # Create main video bullet
    video_node_id = create_child_node(api_key, root_id, f"🎬 {video_title}", note=f"Source: {filename}")
    if not video_node_id:
        print("Error creating video node in Workflowy.", file=sys.stderr)
        return

    print(f"Pushed master item: '{video_title}' to Workflowy.")

    lines = parse_markdown_to_bullets(filepath)
    count = 0
    for line in lines:
        cleaned = line.lstrip("#*- ").strip()
        if cleaned:
            create_child_node(api_key, video_node_id, cleaned)
            count += 1

    print(f"Successfully pushed {count} bullet nodes under '{video_title}' in Workflowy!")

def pull_field_status(api_key, code_or_title):
    nodes = fetch_all_nodes(api_key)
    target_term = code_or_title.strip().lower()

    matching_video_nodes = []
    for node in nodes:
        name = node.get("name", "").lower()
        if target_term in name:
            matching_video_nodes.append(node)

    if not matching_video_nodes:
        print(f"No Workflowy nodes found matching '{code_or_title}'.")
        return

    print(f"--- Workflowy Field Status for '{code_or_title}' ---")
    for parent in matching_video_nodes:
        pid = parent["id"]
        print(f"\nVideo Node: {parent.get('name')} (Completed: {parent.get('completed', False)})")
        children = [n for n in nodes if n.get("parent_id") == pid]
        
        tags_found = []
        for child in children:
            cname = child.get("name", "")
            completed = child.get("completed", False)
            status_str = "[DONE]" if completed else "[OPEN]"
            print(f"  - {status_str} {cname}")
            
            # Extract tags like #filmed, #shot, #broll
            words = cname.split()
            for w in words:
                if w.startswith("#"):
                    tags_found.append(w)
        
        if tags_found:
            print(f"  Found Field Tags: {', '.join(set(tags_found))}")

def main():
    parser = argparse.ArgumentParser(description="Sync Video Outlines & Field Notes with Workflowy")
    parser.add_argument("--key", default=None, help="Workflowy API Key")
    parser.add_argument("--list", action="store_true", help="List root nodes in Workflowy")
    parser.add_argument("--push", action="store_true", help="Push outline to Workflowy")
    parser.add_argument("--pull", action="store_true", help="Pull field tags from Workflowy")
    parser.add_argument("--file", default="", help="Path to markdown outline file")
    parser.add_argument("--title", default="", help="Video Title for Workflowy node")
    parser.add_argument("--code", default="", help="Video Code / Keyword to pull (e.g. 80.V0A1)")

    args = parser.parse_args()
    cfg = load_config()
    api_key = args.key or cfg.get("workflowy_api_key")

    if not api_key:
        print("Error: Workflowy API Key not set in scripts/config.json", file=sys.stderr)
        sys.exit(1)

    if args.list:
        nodes = fetch_all_nodes(api_key)
        roots = [n for n in nodes if n.get("parent_id") is None]
        print("--- Top Level Workflowy Nodes ---")
        for r in roots:
            print(f"- {r.get('name')} (ID: {r.get('id')})")
    elif args.push:
        if not args.file:
            print("Error: Please provide --file <path_to_markdown>", file=sys.stderr)
            sys.exit(1)
        push_outline(api_key, args.file, args.title)
    elif args.pull:
        if not args.code:
            print("Error: Please provide --code or keyword to pull status.", file=sys.stderr)
            sys.exit(1)
        pull_field_status(api_key, args.code)
    else:
        parser.print_help()

if __name__ == "__main__":
    main()
