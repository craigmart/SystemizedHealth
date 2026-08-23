#!/usr/bin/env python3
"""
Clean up Workflowy Video Nodes:
1. Remove all 'note' fields on nodes under 80.00 Systemized Health tree.
2. Remove 'Clip ' prefix from clip node titles (e.g. 'Clip 80.V0A-S2>4 ...' -> '80.V0A-S2>4 ...').
3. Re-export Workflowy_Audit_Export.md.
"""

import sys
import os
import json
import urllib.request
import ssl
import time

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

def make_request(url, api_key, method="GET", payload=None, retries=5):
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    data = json.dumps(payload).encode('utf-8') if payload else None

    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE

    for attempt in range(retries):
        time.sleep(0.3)  # Respect rate limits
        req = urllib.request.Request(url, data=data, headers=headers, method=method)
        try:
            with urllib.request.urlopen(req, context=ctx) as resp:
                body = resp.read().decode('utf-8')
                return json.loads(body) if body else {"status": "ok"}
        except urllib.error.HTTPError as e:
            if e.code == 429:
                wait_time = (attempt + 1) * 2
                print(f"Rate limited (429). Retrying in {wait_time}s... (Attempt {attempt+1}/{retries})", file=sys.stderr)
                time.sleep(wait_time)
                continue
            else:
                print(f"Workflowy API Error ({method} {url}): {e}", file=sys.stderr)
                return None
        except Exception as e:
            print(f"Workflowy API Error ({method} {url}): {e}", file=sys.stderr)
            return None
    return None

def fetch_children(api_key, parent_id):
    url = f"{API_BASE}?parent_id={parent_id}"
    res = make_request(url, api_key)
    return res.get("nodes", []) if res else []

def clean_node_recursive(api_key, node):
    node_id = node.get("id")
    orig_name = node.get("name") or ""
    orig_note = node.get("note") or ""

    new_name = orig_name
    if new_name.startswith("Clip "):
        new_name = new_name[5:].strip()

    name_changed = (new_name != orig_name)
    note_cleared = bool(orig_note.strip())

    if name_changed or note_cleared:
        payload = {}
        if name_changed:
            payload["name"] = new_name
            print(f"  [RENAME] '{orig_name}' -> '{new_name}'")
        if note_cleared:
            payload["note"] = ""
            print(f"  [CLEAR NOTE] '{orig_name}' (Was: '{orig_note}')")

        # Include both name and note in payload to ensure both are updated cleanly
        payload["name"] = new_name
        payload["note"] = ""
        make_request(f"{API_BASE}/{node_id}", api_key, method="POST", payload=payload)

    children = fetch_children(api_key, node_id)
    for child in children:
        clean_node_recursive(api_key, child)

def main():
    cfg = load_config()
    api_key = cfg.get("workflowy_api_key")
    if not api_key:
        print("Error: Workflowy API key missing.", file=sys.stderr)
        sys.exit(1)

    print(f"Fetching root node '{ROOT_ID}'...")
    root_children = fetch_children(api_key, ROOT_ID)

    print(f"Processing {len(root_children)} root sections...")
    for child in root_children:
        clean_node_recursive(api_key, child)

    print("\nWorkflowy node cleanup complete! Re-exporting fresh audit...")
    import workflowy_audit
    workflowy_audit.export_audit(api_key)

if __name__ == "__main__":
    main()
