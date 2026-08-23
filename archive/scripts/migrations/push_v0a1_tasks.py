#!/usr/bin/env python3
"""
Push 80.V0A1 Production Checklist Tasks to Workflowy
"""

import sys
import os
import json
import urllib.request
import ssl

CONFIG_PATH = os.path.join(os.path.dirname(__file__), "config.json")
WORKFLOWY_API_BASE = "https://workflowy.com/api/v1/nodes"
V0A1_NODE_ID = "40b5d6ae-8341-4447-a00b-6b7c61c759b1"  # 🎬 80.V0A1 - Systemized OS Framework

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

def create_child_node(api_key, parent_id, name, note=None):
    payload = {"parent_id": parent_id, "name": name}
    if note:
        payload["note"] = note
    res = make_request(WORKFLOWY_API_BASE, api_key, method="POST", payload=payload)
    if res:
        return res.get("item_id") or res.get("id")
    return None

CHECKLIST_GROUPS = [
    {
        "category": "✂️ 1. A-Roll Dialogue Trimming & Edits",
        "items": [
            "Trim Hook Verbal Warm-up (slice out 'Hey, I'm Dr. Anderson...' & repeated 'just tell me what to do')",
            "Lock Hook Option (Option 1: Tight Studio Edit / Option 2: Location Shift / Option 3: Cold Open)",
            "Clean Up Level 3 Transition (cut verbal reset/stumble before 'Once you get level one...')",
            "Pacing Tightening (trim micro-pauses between Level 1, Level 2, Level 3)"
        ]
    },
    {
        "category": "🎥 2. Multi-Cam & Framing Cuts",
        "items": [
            "Angle B Switch at Dog & Fence Analogy ('For example, a dog in a yard...')",
            "Angle A Punch-in at Level 2 Connection (digital zoom on personal spirituality segment)",
            "Angle A Reset at Level 3 Transition (reset framing to wide/medium Angle A)"
        ]
    },
    {
        "category": "🎞️ 3. B-Roll & Visual Asset Sourcing",
        "items": [
            "Choice Paradox / Overwhelm Montage (rapid-fire: whole food -> pillow -> dialing dad)",
            "Dog & Fence Visual Asset (80.2627-N1-002: 2D graphic or stock clip)",
            "Level 1 (FMR) B-Roll: Clean whole food prep clip (Fuel)",
            "Level 1 (FMR) B-Roll: 10-second run-in-place clip (Move)",
            "Level 1 (FMR) B-Roll: Brain motor cortex neuron firing graphic (Move)",
            "Level 1 (FMR) B-Roll: Sleep / recovery visual (Rest)",
            "Level 2 (TLC) B-Roll: Journaling on desk / thoughtful reflection",
            "Level 2 (TLC) B-Roll: Open vs closed cognitive loops diagram",
            "Level 3 (POP) B-Roll: Outdoor movement / play clip (Play)",
            "Level 3 (POP) B-Roll: Digital task list / calendar organization clip (Organize)"
        ]
    },
    {
        "category": "📊 4. On-Screen Graphics (Left Overlays)",
        "items": [
            "Level 1 Title Card (LEVEL 1: FMR - Fuel • Move • Rest)",
            "Level 2 Title Card (LEVEL 2: TLC - Think • Learn • Connect)",
            "Level 3 Title Card (LEVEL 3: POP - Play • Organize • Purpose)",
            "Master OS Pyramid Diagram Overlay (3-tiered Systemized OS graphic)"
        ]
    },
    {
        "category": "📲 5. Web App Integration & Outro CTA",
        "items": [
            "Record 5-10s Web App UI dynamic screen capture",
            "Build QR Code Split-Screen Layout (Web App QR Code + screen capture demo)",
            "Software Patch Outro Callout ('Subscribe for OS updates & patches')"
        ]
    },
    {
        "category": "🚀 6. Pick-Ups & Location Shots (Optional)",
        "items": [
            "Outdoor Teaser Hook Clip (15-second location-shift intro before studio cut)"
        ]
    }
]

def main():
    cfg = load_config()
    key = cfg.get("workflowy_api_key")
    if not key:
        print("Error: Workflowy API key missing.", file=sys.stderr)
        return

    print("Pushing Production Checklist to Workflowy under 80.V0A1...")
    checklist_root_id = create_child_node(key, V0A1_NODE_ID, "📝 80.V0A1 Production Checklist #task")

    if checklist_root_id:
        for group in CHECKLIST_GROUPS:
            group_node_id = create_child_node(key, checklist_root_id, group["category"])
            if group_node_id:
                for item in group["items"]:
                    create_child_node(key, group_node_id, f"[ ] {item}")

    print("Re-exporting fresh Workflowy_Audit_Export.md...")
    import workflowy_audit
    workflowy_audit.export_audit(key)

    print("✅ 80.V0A1 Production Checklist pushed and synced to Workflowy!")

if __name__ == "__main__":
    main()
