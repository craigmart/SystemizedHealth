#!/usr/bin/env python3
"""
Google Sheets Web App Integration Script for Systemized Health Video Pipeline

Pipeline Headers Matched:
  Code | Video Number | Days Upload to Publish | Drop Date | Format | Title | Uploaded | Asset URL | Platform | Notes | Task Open

Usage Examples:
  python scripts/update_sheet.py --title "Why Consuming Health Information Fails" --uploaded "2026-07-26" --task_open "NO"
  python scripts/update_sheet.py --code "80.V0A1" --uploaded "2026-07-26" --asset_url "https://..." --task_open "NO"
"""

import sys
import json
import argparse
import urllib.request
import urllib.parse
from datetime import datetime

def update_sheet(web_app_url, title="", code="", task_open="NO", uploaded="", asset_url="", notes="", drop_date="", format_type=""):
    if not uploaded and task_open.upper() == "NO":
        uploaded = datetime.now().strftime("%Y-%m-%d")

    payload = {
        "action": "update",
        "title": title,
        "code": code,
        "task_open": task_open,
        "uploaded": uploaded,
        "asset_url": asset_url,
        "notes": notes,
        "drop_date": drop_date,
        "format": format_type
    }

    data = json.dumps(payload).encode('utf-8')
    req = urllib.request.Request(
        web_app_url,
        data=data,
        headers={'Content-Type': 'application/json'}
    )

    try:
        import ssl
        ctx = ssl.create_default_context()
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE

        with urllib.request.urlopen(req, context=ctx) as response:
            result_text = response.read().decode('utf-8')
            try:
                res_json = json.loads(result_text)
                print("Result:", json.dumps(res_json, indent=2))
                return res_json
            except json.JSONDecodeError:
                print("Response received:", result_text)
                return result_text
    except Exception as e:
        print(f"Error updating sheet: {e}", file=sys.stderr)
        sys.exit(1)

def main():
    parser = argparse.ArgumentParser(description="Update Systemized Health Video Pipeline Sheet")
    parser.add_argument("--url", default=None, help="Google Apps Script Web App URL")
    parser.add_argument("--title", default="", help="Video Title")
    parser.add_argument("--code", default="", help="Johnny Decimal Video Code (e.g., 80.V0A1)")
    parser.add_argument("--task_open", default="NO", help="Task Open status (YES/NO)")
    parser.add_argument("--uploaded", default="", help="Uploaded date (YYYY-MM-DD)")
    parser.add_argument("--asset_url", default="", help="Asset URL / YouTube link")
    parser.add_argument("--notes", default="", help="Notes")
    parser.add_argument("--drop_date", default="", help="Drop Date (YYYY-MM-DD)")
    parser.add_argument("--status", default="", help="Status alias (e.g., Completed sets task_open to NO)")
    parser.add_argument("--link", default="", help="Link alias for asset_url")

    args = parser.parse_args()

    url = args.url
    if not url:
        import os
        config_path = os.path.join(os.path.dirname(__file__), "config.json")
        if os.path.exists(config_path):
            try:
                with open(config_path, "r") as f:
                    cfg = json.load(f)
                    url = cfg.get("web_app_url")
            except Exception:
                pass

    if not url:
        print("Error: Please provide --url or set 'web_app_url' in scripts/config.json", file=sys.stderr)
        sys.exit(1)

    if not args.title and not args.code:
        print("Error: Must specify either --title or --code to identify the video row.", file=sys.stderr)
        sys.exit(1)

    task_open = args.task_open
    if args.status and args.status.lower() in ["completed", "done", "finished"]:
        task_open = "NO"

    asset_url = args.asset_url or args.link

    update_sheet(
        url,
        title=args.title,
        code=args.code,
        task_open=task_open,
        uploaded=args.uploaded,
        asset_url=asset_url,
        notes=args.notes,
        drop_date=args.drop_date,
        format_type=args.format_type
    )

if __name__ == "__main__":
    main()
