#!/usr/bin/env python3
"""
Workflowy Audit & Reconciliation Script — 80.00 Systemized Health Focused (Full Recursive Tree)

Exclusively pulls all nodes, sub-bullets, and field notes strictly under 
the "80.00 Systemized Health" root node into Workflowy_Audit_Export.md.
"""

import sys
import os
import json
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

def fetch_node_tree(api_key, node_id, current_depth=0, max_depth=5):
    if current_depth >= max_depth:
        return []
    children = fetch_children(api_key, node_id)
    if not children:
        return []

    tree = []
    with ThreadPoolExecutor(max_workers=8) as executor:
        futures = {c["id"]: executor.submit(fetch_node_tree, api_key, c["id"], current_depth + 1, max_depth) for c in children if c.get("id")}
        child_trees = {cid: fut.result() for cid, fut in futures.items()}

    for c in children:
        cid = c.get("id")
        tree.append({
            "id": cid,
            "name": (c.get("name") or "").strip(),
            "note": (c.get("note") or "").strip(),
            "completed": c.get("completed", False),
            "children": child_trees.get(cid, [])
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

def export_audit(api_key=None):
    if not api_key:
        cfg = load_config()
        api_key = cfg.get("workflowy_api_key")

    print(f"Exporting full tree for root: '80.00 Systemized Health' ({ROOT_ID})...")
    output_lines = [
        "# 80.00 Systemized Health — Workflowy Audit Export",
        "**Source Root**: Workflowy `80.00 Systemized Health` (ID: `59ba9e35-f5fb-a2c1-ecd1-3130e5b7f596`)",
        "**Gold Standard Target**: Local IDE Workspace (`Videos/`, `SOPs/`)",
        "",
        "> **Audit Protocol**: This file contains ONLY items under your `80.00 Systemized Health` node in Workflowy.",
        "> - Items with `[ ]` are live nodes in Workflowy.",
        "> - Edit names, tags, or bullets directly in this file to update them in Workflowy.",
        "",
        "---",
        ""
    ]

    tree = fetch_node_tree(api_key, ROOT_ID, current_depth=0, max_depth=5)
    formatted = format_tree_markdown(tree, depth=0)
    output_lines.extend(formatted)

    with open(EXPORT_PATH, "w", encoding="utf-8") as f:
        f.write("\n".join(output_lines))

    print(f"\nSuccessfully generated 80.00 Systemized Health Audit at: {EXPORT_PATH}")

def main():
    cfg = load_config()
    api_key = cfg.get("workflowy_api_key")
    if not api_key:
        print("Error: Workflowy API key missing.", file=sys.stderr)
        sys.exit(1)

    export_audit(api_key)

if __name__ == "__main__":
    main()
