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
    "80.V0B-S1": "98a6f57c-a79f-4a5f-b31d-4611f944fa0b",
    "80.V0B-S2": "f092f66d-1bf8-8686-aa68-54cdd969476b",
    "80.V0B-S3": "eda9003c-e092-491c-b4db-ee24ff43eb89",
    "80.V0A-S1": "05a69931-ef84-4292-bd92-b00e1bb682f0",
    "80.V0A-S2": "9146cb9c-964c-4563-b47f-811d5ff4150d",
    "80.V0A-S3": "65d28662-3e70-47dc-a7f3-3cdd81a304ec",
    "80.V0A1-S1": "cb9366de-e092-4db8-b1a2-fc9fdb7418fe",
    "80.V0A1-S2": "738e2ebe-9069-4b85-bbdc-0e7f8c36fce1",
    "80.V0A1-S3": "968af5a3-f781-45d9-a44e-9e364422f819"
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
        ("80.V0A1-S2", "Obsidian_Vault/Videos/V0A1-S2 - Level 1 FMR Baseline (80.V0A1-S2)/V0A1-S2 Script - Level 1 FMR Baseline.md"),
        ("80.V0A1-S3", "Obsidian_Vault/Videos/V0A1-S3 - The 3-Tier Health Pyramid (80.V0A1-S3)/V0A1-S3 Script - The 3-Tier Health Pyramid.md")
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
        
        # Remove any existing Shots or teleprompter nodes to clean old format
        for c in children:
            c_name = c.get("name", "")
            if "Shots" in c_name or "Teleprompter" in c_name or "Test Node" in c_name:
                print(f"Cleaning existing node '{c_name}'...")
                delete_node(api_key, c.get("id"))

        # Create clean emoji-free Shots folder
        teleprompter_node_id = create_child_node(api_key, v_id, "Shots")

        if not teleprompter_node_id:
            print(f"Failed to create teleprompter node for {code}")
            continue

        raw_blocks = script_section.strip().split("### ")
        for block in raw_blocks:
            if not block.strip():
                continue
            lines = [l.strip() for l in block.strip().split("\n") if l.strip()]
            header = lines[0]  # e.g. "80.V0A-S1>1 — The Hook #film #insidetruck"
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
