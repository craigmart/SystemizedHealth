#!/usr/bin/env python3
"""
Workflowy Reorganization Script — 80.00 Systemized Health Structure

Organizes 80.00 into two clean master parent categories:
  1. 📁 80.10 - Operations & Systems
  2. 🎬 80.V - Video Production Pipeline

Creates new child containers under each parent and deletes old flat top-level nodes.
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

def copy_node_tree(api_key, old_node_id, new_parent_id):
    """Recursively copies node and its subchildren under new_parent_id."""
    children = fetch_children(api_key, old_node_id)
    for c in children:
        cname = (c.get("name") or "").strip()
        cnote = (c.get("note") or "").strip()
        cid = c.get("id")
        
        new_cid = create_child_node(api_key, new_parent_id, cname, note=cnote)
        if new_cid:
            copy_node_tree(api_key, cid, new_cid)

def reorganize(api_key):
    print("Fetching direct nodes under '80.00 Systemized Health'...")
    existing = fetch_children(api_key, ROOT_ID)

    ops_node_id = None
    video_node_id = None

    for node in existing:
        name = node.get("name", "").strip()
        nid = node.get("id")
        if "80.10 - Operations" in name or "📁 80.10" in name:
            ops_node_id = nid
        elif "80.V - Video" in name or "🎬 80.V" in name:
            video_node_id = nid

    if not ops_node_id:
        print("Creating parent node: '📁 80.10 - Operations & Systems'...")
        ops_node_id = create_child_node(api_key, ROOT_ID, "📁 80.10 - Operations & Systems")

    if not video_node_id:
        print("Creating parent node: '🎬 80.V - Video Production Pipeline'...")
        video_node_id = create_child_node(api_key, ROOT_ID, "🎬 80.V - Video Production Pipeline")

    print(f"Ops Parent ID: {ops_node_id}")
    print(f"Video Parent ID: {video_node_id}")

    # Re-fetch children after parent creation
    existing = fetch_children(api_key, ROOT_ID)

    nodes_to_delete = []

    for node in existing:
        nid = node.get("id")
        name = (node.get("name") or "").strip()
        note = (node.get("note") or "").strip()

        if nid in [ops_node_id, video_node_id]:
            continue

        target_parent_id = None
        if any(kw in name for kw in ["80.V", "80.26", "Patient Visits", "Systemized OS", "Exercise Optional", "Health Info"]):
            target_parent_id = video_node_id
        else:
            target_parent_id = ops_node_id

        print(f"Recreating '{name}' under new section container...")
        new_nid = create_child_node(api_key, target_parent_id, name, note=note)
        if new_nid:
            copy_node_tree(api_key, nid, new_nid)
            nodes_to_delete.append(nid)

    print(f"Deleting {len(nodes_to_delete)} old flat top-level nodes...")
    with ThreadPoolExecutor(max_workers=5) as executor:
        for nid in nodes_to_delete:
            executor.submit(delete_node, api_key, nid)

    print("\nReorganization complete! Re-exporting fresh Workflowy_Audit_Export.md...")
    import workflowy_audit
    workflowy_audit.export_audit(api_key)

def main():
    cfg = load_config()
    api_key = cfg.get("workflowy_api_key")
    if not api_key:
        print("Error: Workflowy API key not found in scripts/config.json", file=sys.stderr)
        sys.exit(1)

    reorganize(api_key)

if __name__ == "__main__":
    main()
