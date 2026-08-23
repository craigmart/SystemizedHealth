#!/usr/bin/env python3
"""
Add B-Roll & Edit Directions to 80.V0A1 in Workflowy
"""

import sys
import os
import json
import urllib.request
import ssl

CONFIG_PATH = os.path.join(os.path.dirname(__file__), "config.json")
API_BASE = "https://workflowy.com/api/v1/nodes"
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
        print(f"Workflowy API Error ({method} {url}): {e}", file=sys.stderr)
        return None

def create_child_node(api_key, parent_id, name, note=None):
    payload = {"parent_id": parent_id, "name": name}
    if note:
        payload["note"] = note
    res = make_request(API_BASE, api_key, method="POST", payload=payload)
    if res and "id" in res:
        return res["id"]
    return None

def add_v0a1_notes():
    cfg = load_config()
    api_key = cfg.get("workflowy_api_key")
    if not api_key:
        print("Error: Workflowy API key missing.", file=sys.stderr)
        return

    print(f"Adding B-Roll and Edit Plan to 80.V0A1 (Node ID: {V0A1_NODE_ID})...")

    # 1. EDIT & HOOK DIRECTIONS
    edit_dir_id = create_child_node(api_key, V0A1_NODE_ID, "✂️ EDIT & HOOK DIRECTIONS")
    if edit_dir_id:
        create_child_node(api_key, edit_dir_id, "Trim verbal warm-up ('Hey, I'm Dr. Anderson...') & repeated 'just tell me what to do' phrases")
        create_child_node(api_key, edit_dir_id, "Hook Option 1 (Tight Studio Edit): Lead directly with 'Have you ever reached the point where you just want someone to look at your health and say: Just tell me exactly what to do?'")
        create_child_node(api_key, edit_dir_id, "Hook Option 2 (Pattern Interrupt): Lead with 'We are completely overwhelmed by health advice...' (Camera B / location shift)")
        create_child_node(api_key, edit_dir_id, "Hook Option 3 (Cold Open): B-roll overlay of decision overload before cutting to studio A-roll")

    # 2. SHOT LIST & B-ROLL OVERLAYS
    shots_id = create_child_node(api_key, V0A1_NODE_ID, "🎥 SHOT LIST & B-ROLL OVERLAYS (Left Frame)")
    if shots_id:
        create_child_node(api_key, shots_id, "Reframe (Structure = Freedom): Dog in fenced yard clip (80.2627-N1-002)")
        create_child_node(api_key, shots_id, "Level 1 (Foundational - FMR): Clean whole food prep, 10s run-in-place clip, brain motor cortex neuron firing graphic")
        create_child_node(api_key, shots_id, "Level 2 (Internal - TLC): Journaling on desk, open vs closed cognitive loops diagram")
        create_child_node(api_key, shots_id, "Level 3 (External - POP): Outdoor movement play, notebook / digital task list organization")
        create_child_node(api_key, shots_id, "Architecture Summary: Master 3-tiered pyramid diagram overlay (FMR / TLC / POP)")
        create_child_node(api_key, shots_id, "CTA & Outro: Web App QR Code slide + 'Subscribe for OS updates & patches'")

    print("Re-exporting fresh Workflowy_Audit_Export.md...")
    import workflowy_audit
    workflowy_audit.export_audit(api_key)

if __name__ == "__main__":
    add_v0a1_notes()
