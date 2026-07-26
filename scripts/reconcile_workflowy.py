#!/usr/bin/env python3
"""
Workflowy Reconciliation Script for Systemized Health IDE Workspace

Pushes script outlines for the 4 active IDE videos (80.V0A, 80.V0A1, 80.V1B1, 80.V0B)
to Workflowy under 80.00 Systemized Health, removes stray test nodes, and re-exports
a clean 1:1 audit file (Workflowy_Audit_Export.md).
"""

import sys
import os
import json
import urllib.request
import ssl
from concurrent.futures import ThreadPoolExecutor

CONFIG_PATH = os.path.join(os.path.dirname(__file__), "config.json")
API_BASE = "https://workflowy.com/api/v1/nodes"
ROOT_ID = "59ba9e35-f5fb-a2c1-ecd1-3130e5b7f596"  # 80.00 Systemized Health

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

def fetch_children(api_key, parent_id):
    url = f"{API_BASE}?parent_id={parent_id}"
    res = make_request(url, api_key)
    return res.get("nodes", []) if res else []

def create_child_node(api_key, parent_id, name, note=None):
    payload = {"parent_id": parent_id, "name": name}
    if note:
        payload["note"] = note
    res = make_request(API_BASE, api_key, method="POST", payload=payload)
    if res and "id" in res:
        return res["id"]
    return None

def delete_node(api_key, node_id):
    url = f"{API_BASE}/{node_id}"
    return make_request(url, api_key, method="DELETE") is not None

def reconcile(api_key):
    print("Fetching direct nodes under '80.00 Systemized Health'...")
    existing = fetch_children(api_key, ROOT_ID)
    
    # 1. Remove stray / test nodes
    stray_keywords = ["test integration node", "(unnamed node)", "80.2627-l1"]
    for node in existing:
        name = (node.get("name") or "").strip().lower()
        node_id = node.get("id")
        if any(sk in name for sk in stray_keywords):
            print(f"Removing stray node: '{node.get('name')}' ({node_id})...")
            delete_node(api_key, node_id)

    # Re-fetch after cleanup
    existing = fetch_children(api_key, ROOT_ID)
    existing_map = {node.get("name", "").strip(): node.get("id") for node in existing}

    # 2. IDE Active Video Targets
    ide_videos = [
        {
            "code": "80.V0A",
            "title": "🎬 80.V0A - 230,000 Patient Visits",
            "file": "Videos/002 - 20000 Patients (80.V0A)/V0A-B Script.txt"
        },
        {
            "code": "80.V0A1",
            "title": "🎬 80.V0A1 - Systemized OS Framework",
            "file": "Videos/004 - Systemized OS (80.V0A1)/V0A1-B Script Outline.txt"
        },
        {
            "code": "80.V1B1",
            "title": "🎬 80.V1B1 - Exercise Optional (Movement Mandatory)",
            "file": "Videos/003 - Exercise Optional (80.V1B1)/V1B1-B Script.txt"
        },
        {
            "code": "80.V0B",
            "title": "🎬 80.V0B - Health Info & Biology Baseline",
            "file": "Videos/001 - Health Info (80.V0B)/V0B-B Script Outline.txt"
        }
    ]

    project_root = os.path.dirname(os.path.dirname(__file__))

    for v in ide_videos:
        title = v["title"]
        code = v["code"]
        rel_path = v["file"]
        full_path = os.path.join(project_root, rel_path)

        # Check if matching node exists
        video_node_id = None
        for ex_title, ex_id in existing_map.items():
            if code in ex_title or title in ex_title:
                video_node_id = ex_id
                break

        if not video_node_id:
            print(f"Creating new video node in Workflowy: '{title}'...")
            video_node_id = create_child_node(api_key, ROOT_ID, title, note=f"Source: {rel_path}")

        if video_node_id and os.path.exists(full_path):
            # Check existing sub-bullets
            existing_sub_nodes = fetch_children(api_key, video_node_id)
            if not existing_sub_nodes:
                print(f"Pushing outline bullets for '{code}' from {rel_path}...")
                with open(full_path, "r", encoding="utf-8") as f:
                    lines = [line.strip() for line in f if line.strip()]

                for line in lines[:25]:  # Limit top-level script outline lines
                    cleaned = line.lstrip("#*- ").strip()
                    if cleaned:
                        create_child_node(api_key, video_node_id, cleaned)

    print("\nReconciliation complete! Re-exporting fresh Workflowy_Audit_Export.md...")
    import workflowy_audit
    workflowy_audit.export_audit(api_key)

def main():
    cfg = load_config()
    api_key = cfg.get("workflowy_api_key")
    if not api_key:
        print("Error: Workflowy API key not found in scripts/config.json", file=sys.stderr)
        sys.exit(1)

    reconcile(api_key)

if __name__ == "__main__":
    main()
