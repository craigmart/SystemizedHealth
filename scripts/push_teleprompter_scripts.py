#!/usr/bin/env python3
"""
Push Stage 2 Teleprompter Scripts to Workflowy for Filming on Set (Single Paragraph per Clip, #film Tagged, No Emojis)
"""
import os
import sys
import json
import time
import urllib.request
import ssl

CONFIG_PATH = os.path.join(os.path.dirname(__file__), "config.json")
API_BASE = "https://workflowy.com/api/v1/nodes"

NODE_MAP = {
    "80.V0A-S1": "05a69931-ef84-4292-bd92-b00e1bb682f0",
    "80.V0A-S2": "9146cb9c-964c-4563-b47f-811d5ff4150d",
    "80.V0A-S3": "65d28662-3e70-47dc-a7f3-3cdd81a304ec",
    "80.V0A1-S1": "cb9366de-e092-4db8-b1a2-fc9fdb7418fe"
}

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

    time.sleep(0.3)  # Rate limit safety delay
    try:
        with urllib.request.urlopen(req, context=ctx) as resp:
            body = resp.read().decode('utf-8')
            return json.loads(body) if body else {"status": "ok"}
    except Exception as e:
        print(f"Workflowy API Error ({method} {url}): {e}", file=sys.stderr)
        return None

def fetch_children(api_key, parent_id):
    url = f"{API_BASE}?parent_id={parent_id}"
    res = make_request(url, api_key)
    return res.get("nodes", []) if res else []

def create_child_node(api_key, parent_id, name, note=None):
    payload = {"parent_id": parent_id, "name": name}
    if note:
        payload["note"] = note
    res = make_request(API_BASE, api_key, method="POST", payload=payload)
    if res:
        return res.get("item_id") or res.get("id")
    return None

def delete_node(api_key, node_id):
    url = f"{API_BASE}/{node_id}"
    return make_request(url, api_key, method="DELETE") is not None

def push_scripts():
    cfg = load_config()
    api_key = cfg.get("workflowy_api_key")
    if not api_key:
        print("Error: Workflowy API Key not found in config.json.", file=sys.stderr)
        sys.exit(1)

    targets = [
        ("80.V0A-S1", "Videos/008 - Why Monday Health Resolutions Fail (80.V0A-S1)/V0A-S1 Script - Why Monday Health Resolutions Fail.md"),
        ("80.V0A-S2", "Videos/009 - The Biological Sequence of Change (80.V0A-S2)/V0A-S2 Script - The Biological Sequence of Change.md"),
        ("80.V0A-S3", "Videos/010 - Stop Treating Health Like an Emergency (80.V0A-S3)/V0A-S3 Script - Stop Treating Health Like an Emergency.md"),
        ("80.V0A1-S1", "Videos/014 - The Willpower Trap (80.V0A1-S1)/V0A1-S1 Script - The Willpower Trap.md")
    ]

    project_root = os.path.dirname(os.path.dirname(__file__))

    for code, rel_path in targets:
        full_path = os.path.join(project_root, rel_path)
        if not os.path.exists(full_path):
            print(f"File not found: {rel_path}")
            continue

        v_id = NODE_MAP.get(code)
        if not v_id:
            print(f"Node ID for '{code}' not mapped.")
            continue

        print(f"\nProcessing '{code}' (Workflowy ID: {v_id})...")

        with open(full_path, "r", encoding="utf-8") as f:
            content = f.read()

        if "## 3. Full Script (Teleprompter Ready)" in content:
            script_section = content.split("## 3. Full Script (Teleprompter Ready)")[1].split("---")[0]
        else:
            script_section = content

        children = fetch_children(api_key, v_id)
        
        # Remove any existing teleprompter nodes to clean old format & emojis
        for c in children:
            c_name = c.get("name", "")
            if "Teleprompter" in c_name or "Test Node" in c_name:
                print(f"Cleaning existing node '{c_name}'...")
                delete_node(api_key, c.get("id"))

        # Create clean emoji-free Teleprompter folder
        teleprompter_node_id = create_child_node(api_key, v_id, "Teleprompter Clips (Filming Order)")

        if not teleprompter_node_id:
            print(f"Failed to create teleprompter node for {code}")
            continue

        raw_blocks = script_section.strip().split("### ")
        for block in raw_blocks:
            if not block.strip():
                continue
            lines = [l.strip() for l in block.strip().split("\n") if l.strip()]
            header = lines[0]  # e.g. "80.V0A-S1>1 — The Hook #film #insidetruck" or "Clip 80.V0A-S1>1..."
            if header.startswith("Clip "):
                header = header[5:].strip()
            text_lines = lines[1:]

            # Consolidate text lines into a single spoken paragraph
            single_paragraph = " ".join(text_lines).strip()

            clip_header_text = header
            clip_id = create_child_node(api_key, teleprompter_node_id, clip_header_text)
            
            if clip_id and single_paragraph:
                create_child_node(api_key, clip_id, single_paragraph)

        print(f"Successfully pushed single-paragraph teleprompter clips for {code} to Workflowy!")

    print("\nAll teleprompter scripts successfully synchronized to Workflowy!")
    import workflowy_audit
    workflowy_audit.export_audit(api_key)

if __name__ == "__main__":
    push_scripts()
