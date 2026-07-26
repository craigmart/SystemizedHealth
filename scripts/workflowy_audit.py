#!/usr/bin/env python3
"""
Workflowy Audit & Reconciliation Script — 80.00 Systemized Health Focused

Exclusively pulls all nodes, sub-bullets, and field notes strictly under 
the "80.00 Systemized Health" root node (ID: 59ba9e35-f5fb-a2c1-ecd1-3130e5b7f596)
into Workflowy_Audit_Export.md for auditing against the local IDE workspace files.

Commands:
  python scripts/workflowy_audit.py --export
  python scripts/workflowy_audit.py --sync-delete
"""

import sys
import os
import json
import argparse
import urllib.request
import ssl
from concurrent.futures import ThreadPoolExecutor

CONFIG_PATH = os.path.join(os.path.dirname(__file__), "config.json")
API_BASE = "https://workflowy.com/api/v1/nodes"
EXPORT_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "Workflowy_Audit_Export.md")
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

def fetch_tree_recursive(api_key, parent_id, depth=0, max_depth=5):
    if depth > max_depth:
        return []
        
    children = fetch_children(api_key, parent_id)
    if not children:
        return []

    with ThreadPoolExecutor(max_workers=10) as executor:
        child_ids = [c["id"] for c in children if c.get("id")]
        futures = {cid: executor.submit(fetch_children, api_key, cid) for cid in child_ids}
        sub_results = {cid: fut.result() for cid, fut in futures.items()}

    tree = []
    for c in children:
        cid = c.get("id")
        cname = (c.get("name") or "").strip()
        cnote = (c.get("note") or "").strip()
        completed = c.get("completed", False)
        
        direct_subs = sub_results.get(cid, [])
        sub_tree = []
        if direct_subs and depth < max_depth - 1:
            for sc in direct_subs:
                scid = sc.get("id")
                scname = (sc.get("name") or "").strip()
                scnote = (sc.get("note") or "").strip()
                scompleted = sc.get("completed", False)
                
                deeper_children = []
                if depth + 2 < max_depth:
                    deeper_children = fetch_children(api_key, scid)
                    
                sub_tree.append({
                    "id": scid,
                    "name": scname,
                    "note": scnote,
                    "completed": scompleted,
                    "children": [{
                        "id": dc.get("id"),
                        "name": (dc.get("name") or "").strip(),
                        "note": (dc.get("note") or "").strip(),
                        "completed": dc.get("completed", False),
                        "children": []
                    } for dc in deeper_children]
                })

        tree.append({
            "id": cid,
            "name": cname,
            "note": cnote,
            "completed": completed,
            "children": sub_tree
        })
    return tree

def format_tree_markdown(nodes, depth=0):
    lines = []
    indent = "  " * depth
    for node in nodes:
        status = "[x]" if node["completed"] else "[ ]"
        name = node["name"] or "(Unnamed Node)"
        node_id = node["id"]
        
        lines.append(f"{indent}- {status} **{name}** `<!-- id: {node_id} -->`")
        if node["note"]:
            lines.append(f"{indent}  *Note: {node['note']}*")
            
        if node["children"]:
            lines.extend(format_tree_markdown(node["children"], depth + 1))
    return lines

def export_audit(api_key):
    print(f"Exporting full tree for root: '80.00 Systemized Health' ({ROOT_ID})...")
    output_lines = [
        "# 80.00 Systemized Health — Workflowy Audit Export",
        "**Source Root**: Workflowy `80.00 Systemized Health` (ID: `59ba9e35-f5fb-a2c1-ecd1-3130e5b7f596`)",
        "**Gold Standard Target**: Local IDE Workspace (`Videos/`, `SOPs/`)",
        "",
        "> **Audit Protocol**: This file contains ONLY items under your `80.00 Systemized Health` node in Workflowy.",
        "> - Items with `[ ]` are live nodes in Workflowy.",
        "> - To tag a node for deletion during sync, change `[ ]` or `[x]` to `[DELETE]`.",
        "> - Edit names, tags, or bullets directly in this file to update them in Workflowy.",
        "",
        "---",
        ""
    ]

    tree = fetch_tree_recursive(api_key, ROOT_ID, depth=0, max_depth=5)
    formatted = format_tree_markdown(tree, depth=0)
    output_lines.extend(formatted)

    with open(EXPORT_PATH, "w", encoding="utf-8") as f:
        f.write("\n".join(output_lines))

    print(f"\nSuccessfully generated 80.00 Systemized Health Audit at: {EXPORT_PATH}")

def delete_node_api(api_key, node_id):
    url = f"{API_BASE}/{node_id}"
    res = make_request(url, api_key, method="DELETE")
    return res is not None

def sync_deletions(api_key):
    if not os.path.exists(EXPORT_PATH):
        print(f"Error: {EXPORT_PATH} not found.", file=sys.stderr)
        return

    print("Scanning Workflowy_Audit_Export.md for [DELETE] tags...")
    delete_node_ids = set()

    with open(EXPORT_PATH, "r", encoding="utf-8") as f:
        for line in f:
            if "[DELETE]" in line and "<!-- id: " in line:
                try:
                    node_id = line.split("<!-- id: ")[1].split(" -->")[0].strip()
                    delete_node_ids.add(node_id)
                except Exception:
                    pass

    if not delete_node_ids:
        print("No items marked [DELETE] found in Workflowy_Audit_Export.md.")
        return

    print(f"Found {len(delete_node_ids)} parent/child nodes marked for deletion.")
    deleted_count = 0

    with ThreadPoolExecutor(max_workers=5) as executor:
        futures = {nid: executor.submit(delete_node_api, api_key, nid) for nid in delete_node_ids}
        for nid, fut in futures.items():
            if fut.result():
                deleted_count += 1

    print(f"Successfully deleted {deleted_count} obsolete nodes from Workflowy!")
    print("Re-exporting fresh audit state...")
    export_audit(api_key)

def main():
    parser = argparse.ArgumentParser(description="Workflowy Audit & Sync Tool for 80.00 Systemized Health")
    parser.add_argument("--sync-delete", action="store_true", help="Sync deletions from Workflowy_Audit_Export.md to live Workflowy")
    parser.add_argument("--export", action="store_true", help="Re-export live Workflowy state")
    args = parser.parse_args()

    cfg = load_config()
    api_key = cfg.get("workflowy_api_key")
    if not api_key:
        print("Error: Workflowy API key not found in scripts/config.json", file=sys.stderr)
        sys.exit(1)

    if args.sync_delete:
        sync_deletions(api_key)
    else:
        export_audit(api_key)

if __name__ == "__main__":
    main()
