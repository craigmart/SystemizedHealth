#!/usr/bin/env python3
"""
Sync August 2026 Publication Calendar to Google Sheets & Workflowy
"""

import sys
import os
import json
import urllib.request
import ssl

CONFIG_PATH = os.path.join(os.path.dirname(__file__), "config.json")
WORKFLOWY_API_BASE = "https://workflowy.com/api/v1/nodes"
SCHEDULE_NODE_ID = "f83c0276-1447-4b16-bceb-ebc54fefb5be"  # 80.10-WF - Schedule

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
        print(f"API Error ({method} {url}): {e}", file=sys.stderr)
        return None

def fetch_children(api_key, parent_id):
    url = f"{WORKFLOWY_API_BASE}?parent_id={parent_id}"
    res = make_request(url, api_key)
    return res.get("nodes", []) if res else []

def create_child_node(api_key, parent_id, name, note=None):
    payload = {"parent_id": parent_id, "name": name}
    if note:
        payload["note"] = note
    res = make_request(WORKFLOWY_API_BASE, api_key, method="POST", payload=payload)
    if res:
        return res.get("item_id") or res.get("id")
    return None

def update_sheet(web_app_url, title, code, format_type, uploaded, drop_date, status="Completed"):
    task_open = "NO" if status.lower() in ["completed", "done", "finished"] else "YES"
    payload = {
        "action": "update",
        "title": title,
        "code": code,
        "format": format_type,
        "uploaded": uploaded,
        "drop_date": drop_date,
        "task_open": task_open,
        "notes": f"Scheduled for {drop_date}"
    }
    data = json.dumps(payload).encode('utf-8')
    req = urllib.request.Request(
        web_app_url,
        data=data,
        headers={'Content-Type': 'application/json'}
    )
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE

    try:
        with urllib.request.urlopen(req, context=ctx) as response:
            return response.read().decode('utf-8')
    except Exception as e:
        print(f"Sheet Error for {code}: {e}", file=sys.stderr)
        return None

# August 2026 Calendar Schedule
AUGUST_CALENDAR = [
    # Week 1
    {"week": "Week 1 (Aug 1 - Aug 7)", "items": [
        {"code": "80.V0A", "title": "230,000 Patient Visits", "format": "Long", "uploaded": "2026-07-20", "drop_date": "2026-08-03", "status": "Uploaded"},
        {"code": "80.V0A-S1", "title": "Why Monday Health Resolutions Fail", "format": "Short", "uploaded": "2026-07-20", "drop_date": "2026-08-04", "status": "Uploaded"},
        {"code": "80.V0A-S2", "title": "The Biological Sequence of Change", "format": "Short", "uploaded": "2026-07-20", "drop_date": "2026-08-06", "status": "Uploaded"},
        {"code": "80.V0A-S3", "title": "Stop Treating Health Like an Emergency", "format": "Short", "uploaded": "2026-07-20", "drop_date": "2026-08-08", "status": "Uploaded"}
    ]},
    # Week 2
    {"week": "Week 2 (Aug 8 - Aug 14)", "items": [
        {"code": "80.V1B1", "title": "Exercise Optional (Movement Mandatory)", "format": "Long", "uploaded": "2026-07-22", "drop_date": "2026-08-10", "status": "Uploaded"},
        {"code": "80.V1B1-S1", "title": "Why Exercise is Optional", "format": "Short", "uploaded": "2026-07-22", "drop_date": "2026-08-11", "status": "Uploaded"},
        {"code": "80.V1B1-S2", "title": "Joint Imbibition: How Joints Eat", "format": "Short", "uploaded": "2026-07-22", "drop_date": "2026-08-13", "status": "Uploaded"},
        {"code": "80.V1B1-S3", "title": "Cortical Smudging: Why Back Pain Spasms", "format": "Short", "uploaded": "2026-07-22", "drop_date": "2026-08-15", "status": "Uploaded"}
    ]},
    # Week 3
    {"week": "Week 3 (Aug 15 - Aug 21)", "items": [
        {"code": "80.V0B", "title": "Health Info & Biology Baseline", "format": "Long", "uploaded": "2026-07-24", "drop_date": "2026-08-17", "status": "Uploaded"},
        {"code": "80.V0B-S1", "title": "Information Overload vs Implementation", "format": "Short", "uploaded": "2026-07-24", "drop_date": "2026-08-18", "status": "Uploaded"},
        {"code": "80.V0B-S2", "title": "Finding Your System Glitch", "format": "Short", "uploaded": "2026-07-24", "drop_date": "2026-08-20", "status": "Uploaded"},
        {"code": "80.V0B-S3", "title": "Doctor vs Coach: Rebuilding Baseline", "format": "Short", "uploaded": "2026-07-24", "drop_date": "2026-08-22", "status": "Uploaded"}
    ]},
    # Week 4
    {"week": "Week 4 (Aug 22 - Aug 31)", "items": [
        {"code": "80.V0A1", "title": "Systemized OS Framework", "format": "Long", "uploaded": "2026-07-26", "drop_date": "2026-08-24", "status": "In Edit"},
        {"code": "80.V0A1-S1", "title": "The Willpower Trap", "format": "Short", "uploaded": "", "drop_date": "2026-08-25", "status": "Planned"},
        {"code": "80.V0A1-S2", "title": "Level 1 FMR Baseline", "format": "Short", "uploaded": "", "drop_date": "2026-08-27", "status": "Planned"},
        {"code": "80.V0A1-S3", "title": "Discovery Call Coaching Protocol", "format": "Short", "uploaded": "", "drop_date": "2026-08-29", "status": "Planned"}
    ]}
]

def sync():
    cfg = load_config()
    web_app_url = cfg.get("web_app_url")
    workflowy_key = cfg.get("workflowy_api_key")

    print("1. Updating Google Sheets Master Pipeline...")
    for block in AUGUST_CALENDAR:
        for item in block["items"]:
            print(f"  Syncing sheet for [{item['code']}] {item['title']} (Drop: {item['drop_date']})...")
            update_sheet(
                web_app_url,
                title=item["title"],
                code=item["code"],
                format_type=item["format"],
                uploaded=item["uploaded"],
                drop_date=item["drop_date"],
                status="Completed" if item["status"] == "Uploaded" else "In Progress"
            )

    if workflowy_key:
        print("\n2. Syncing August Calendar to Workflowy ('80.10-WF - Schedule')...")
        # Check existing items under Schedule node
        existing = fetch_children(workflowy_key, SCHEDULE_NODE_ID)
        existing_names = {node.get("name", "").strip(): node.get("id") for node in existing}

        august_node_id = None
        for name, nid in existing_names.items():
            if "August 2026" in name:
                august_node_id = nid
                break

        if not august_node_id:
            august_node_id = create_child_node(workflowy_key, SCHEDULE_NODE_ID, "📅 August 2026 Publication Schedule")

        if august_node_id:
            for block in AUGUST_CALENDAR:
                week_title = f"🗓️ {block['week']}"
                week_node_id = create_child_node(workflowy_key, august_node_id, week_title)
                if week_node_id:
                    for item in block["items"]:
                        icon = "🎬" if item["format"] == "Long" else "⚡"
                        status_str = f"[{item['status']}]"
                        node_text = f"{icon} {item['drop_date']} — {item['code']}: {item['title']} ({item['format']}) {status_str}"
                        create_child_node(workflowy_key, week_node_id, node_text)

    print("\n3. Re-exporting fresh Workflowy_Audit_Export.md...")
    import workflowy_audit
    workflowy_audit.export_audit(workflowy_key)

    print("\n✅ August 2026 Publication Calendar successfully synced to Google Sheets and Workflowy!")

if __name__ == "__main__":
    sync()
