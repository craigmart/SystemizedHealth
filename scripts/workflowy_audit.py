#!/usr/bin/env python3
"""
Workflowy Audit & Reconciliation Script for Systemized Health (Fast Parallel Fetcher)

Pulls all Systemized Health and Zettelkasten nodes from Workflowy into a single 
IDE workspace markdown file (Workflowy_Audit_Export.md) for auditing against the repo's
gold standard files.
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

def load_config():
    if os.path.exists(CONFIG_PATH):
        try:
            with open(CONFIG_PATH, "r") as f:
                return json.load(f)
        except Exception:
            pass
    return {}

def make_request(url, api_key):
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    req = urllib.request.Request(url, headers=headers, method="GET")
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE

    try:
        with urllib.request.urlopen(req, context=ctx) as resp:
            body = resp.read().decode('utf-8')
            return json.loads(body) if body else {"nodes": []}
    except Exception as e:
        print(f"Workflowy API Error ({url}): {e}", file=sys.stderr)
        return {"nodes": []}

def fetch_children(api_key, parent_id):
    url = f"{API_BASE}?parent_id={parent_id}"
    res = make_request(url, api_key)
    return res.get("nodes", [])

def export_audit(api_key):
    roots = [
        ("SYSTEMIZED HEALTH (2025)", "bfaaa1bd-91db-13e8-cb59-e36dea29c86e"),
        ("80.00 Systemized Health", "59ba9e35-f5fb-a2c1-ecd1-3130e5b7f596"),
        ("ZETTELKASTEN", "e78e8d27-a8f7-d4bb-52c3-58c399293516")
    ]

    output_lines = [
        "# Workflowy Audit Export & Reconciliation Blueprint",
        "**Source**: Live Workflowy Account",
        "**Gold Standard Target**: Systemized Health Local IDE Workspace (`Videos/`, `SOPs/`)",
        "",
        "> **Audit Protocol**: Review every section below against your local workspace files.",
        "> - Items with `[ ]` are live nodes in Workflowy.",
        "> - To tag a node for deletion during sync, change `[ ]` or `[x]` to `[DELETE]`.",
        "> - Edit node names or sub-bullets directly in this file to update them on Workflowy.",
        "",
        "---",
        ""
    ]

    with ThreadPoolExecutor(max_workers=10) as executor:
        for root_name, root_id in roots:
            print(f"Exporting: '{root_name}' ({root_id})...")
            output_lines.append(f"## Root Node: {root_name} `<!-- root_id: {root_id} -->`\n")
            
            children = fetch_children(api_key, root_id)
            
            # If not Zettelkasten, parallel fetch subchildren
            subchildren_map = {}
            if "ZETTELKASTEN" not in root_name and children:
                child_ids = [c["id"] for c in children if c.get("id")]
                futures = {cid: executor.submit(fetch_children, api_key, cid) for cid in child_ids}
                for cid, fut in futures.items():
                    subchildren_map[cid] = fut.result()

            for c in children:
                cname = (c.get("name") or "").strip()
                cnote = (c.get("note") or "").strip()
                status = "[x]" if c.get("completed") else "[ ]"
                cid = c.get("id")
                
                output_lines.append(f"- {status} **{cname}** `<!-- id: {cid} -->`")
                if cnote:
                    output_lines.append(f"  *Note: {cnote}*")

                if cid in subchildren_map:
                    for sc in subchildren_map[cid]:
                        scname = (sc.get("name") or "").strip()
                        scnote = (sc.get("note") or "").strip()
                        sstatus = "[x]" if sc.get("completed") else "[ ]"
                        scid = sc.get("id")
                        
                        output_lines.append(f"  - {sstatus} **{scname}** `<!-- id: {scid} -->`")
                        if scnote:
                            output_lines.append(f"    *Note: {scnote}*")
                            
            output_lines.append("\n---\n")

    with open(EXPORT_PATH, "w", encoding="utf-8") as f:
        f.write("\n".join(output_lines))

    print(f"\nSuccessfully generated Workflowy_Audit_Export.md at: {EXPORT_PATH}")

def main():
    cfg = load_config()
    api_key = cfg.get("workflowy_api_key")
    if not api_key:
        print("Error: Workflowy API key not found in scripts/config.json", file=sys.stderr)
        sys.exit(1)

    export_audit(api_key)

if __name__ == "__main__":
    main()
