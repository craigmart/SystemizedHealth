#!/usr/bin/env python3
"""
Clean old flat top-level nodes from 80.00 Systemized Health in Workflowy.
Ensures 80.00 contains ONLY the two section parents:
  1. 📁 80.10 - Operations & Systems (ID: ffb06114-f8ce-4b1b-a22d-c8eb66ecd824)
  2. 🎬 80.V - Video Production Pipeline (ID: 677ca675-32e8-4fcd-b69f-d2b5469e16b9)
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
OPS_ID = "ffb06114-f8ce-4b1b-a22d-c8eb66ecd824"
VIDEO_ID = "677ca675-32e8-4fcd-b69f-d2b5469e16b9"

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

def delete_node(api_key, node_id):
    url = f"{API_BASE}/{node_id}"
    return make_request(url, api_key, method="DELETE") is not None

def clean():
    cfg = load_config()
    api_key = cfg.get("workflowy_api_key")
    if not api_key:
        print("Error: Workflowy API key missing.", file=sys.stderr)
        return

    print("Fetching direct children under 80.00 Systemized Health...")
    children = fetch_children(api_key, ROOT_ID)

    to_delete = []
    for c in children:
        cid = c.get("id")
        cname = c.get("name", "").strip()
        if cid not in [OPS_ID, VIDEO_ID] and "80.10 - Operations" not in cname and "80.V - Video" not in cname:
            print(f"Marking old flat node for deletion: '{cname}' ({cid})...")
            to_delete.append(cid)

    print(f"Deleting {len(to_delete)} old flat nodes...")
    with ThreadPoolExecutor(max_workers=5) as executor:
        for cid in to_delete:
            executor.submit(delete_node, api_key, cid)

    print("Cleanup complete! Re-exporting fresh audit state...")
    import workflowy_audit
    workflowy_audit.export_audit(api_key)

if __name__ == "__main__":
    clean()
