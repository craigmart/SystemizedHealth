#!/usr/bin/env python3
"""
Systemized Health — Google Form Agreement Sync Engine

Purpose:
  Fetches signed Discovery Call Coaching Agreements from the linked Google Form Responses Sheet,
  matches responses by client email, and updates the client record in `database/clients.db`
  setting status to 'Agreement Signed'.

Usage:
  python scripts/sync_agreements.py --sheet-url "https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/edit"
  python scripts/sync_agreements.py
"""

import os
import sys
import csv
import json
import re
import sqlite3
import urllib.request
import urllib.error
import ssl
import argparse
from datetime import datetime

# Supabase dual-write (graceful fallback if unavailable)
try:
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    from supabase_client import SupabaseClient
    _supabase = SupabaseClient()
except Exception as e:
    _supabase = None
    print(f"[Warning] Supabase client unavailable: {e}")

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CONFIG_PATH = os.path.join(BASE_DIR, "scripts", "config.json")
DB_PATH = os.path.join(BASE_DIR, "database", "clients.db")

def load_config():
    if os.path.exists(CONFIG_PATH):
        with open(CONFIG_PATH, "r") as f:
            return json.load(f)
    return {}

def save_config(config):
    with open(CONFIG_PATH, "w") as f:
        json.dump(config, f, indent=2)

def extract_csv_url(sheet_url):
    """Converts a standard Google Sheet URL into a direct CSV export URL."""
    sheet_id_match = re.search(r"/d/([a-zA-Z0-9-_]+)", sheet_url)
    if not sheet_id_match:
        raise ValueError("Invalid Google Sheet URL format. Could not locate Spreadsheet ID.")
    
    sheet_id = sheet_id_match.group(1)
    
    # Extract gid if present
    gid_match = re.search(r"[#&?]gid=([0-9]+)", sheet_url)
    gid_param = f"&gid={gid_match.group(1)}" if gid_match else ""
    
    return f"https://docs.google.com/spreadsheets/d/{sheet_id}/export?format=csv{gid_param}"

def fetch_csv_data(csv_url):
    """Fetches CSV content from published or shared Google Sheet URL."""
    try:
        ctx = ssl._create_unverified_context()
    except Exception:
        ctx = None

    req = urllib.request.Request(csv_url)
    req.add_header("User-Agent", "SystemizedHealth-AgreementSync/1.0")

    try:
        with urllib.request.urlopen(req, context=ctx) as resp:
            content = resp.read().decode("utf-8")
            return content
    except urllib.error.HTTPError as e:
        print(f"[Error] HTTP {e.code} fetching Google Sheet: {e.reason}")
        print("Tip: Make sure the Google Sheet sharing permissions are set to 'Anyone with the link can view' or 'Published to Web'.")
        return None
    except Exception as e:
        print(f"[Error] Failed to connect to Google Sheet: {e}")
        return None

def sync_agreements_to_db(csv_content, sheet_url=""):
    """Parses agreement responses and updates client database."""
    reader = csv.DictReader(csv_content.splitlines())
    
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    synced_count = 0

    print("\nProcessing Google Form Agreement Responses...")
    print("--------------------------------------------------------------------------")

    for row in reader:
        email = ""
        name = ""
        timestamp = ""

        for key, val in row.items():
            if not key or not val:
                continue
            k_lower = key.strip().lower()
            val_clean = val.strip()

            if "email" in k_lower and not email:
                email = val_clean
            elif ("signature" in k_lower or "name" in k_lower or "client" in k_lower) and not name:
                name = val_clean
            elif "timestamp" in k_lower and not timestamp:
                timestamp = val_clean

        if not email and not name:
            continue

        # 1. Lookup client by Email or Name
        client_row = None
        if email:
            cursor.execute("SELECT id, name, email FROM clients WHERE email = ?", (email,))
            client_row = cursor.fetchone()
        
        if not client_row and name:
            # First try exact / substring match
            cursor.execute("SELECT id, name, email FROM clients WHERE LOWER(name) LIKE ?", (f"%{name.lower()}%",))
            client_row = cursor.fetchone()

        if not client_row and name:
            # Token match: check if last word of signature matches name or email prefix
            name_parts = [p.lower() for p in name.split() if len(p) >= 3]
            cursor.execute("SELECT id, name, email FROM clients;")
            all_clients = cursor.fetchall()
            
            # First pass: try matching the last name (e.g. "lastone")
            if name_parts:
                last_word = name_parts[-1]
                for c in all_clients:
                    c_name_lower = c["name"].lower()
                    c_email_lower = c["email"].lower()
                    if last_word == c_name_lower or last_word in c_email_lower:
                        client_row = c
                        break

            # Second pass: try any token match
            if not client_row:
                for c in all_clients:
                    c_name_lower = c["name"].lower()
                    c_email_lower = c["email"].lower()
                    for part in name_parts:
                        if part == c_name_lower or part in c_email_lower:
                            client_row = c
                            break
                    if client_row:
                        break

        if not client_row:
            # Create client record if completely new
            client_email = email or f"{name.lower().replace(' ', '.')}@placeholder.local"
            cursor.execute("""
            INSERT INTO clients (name, email, source_video, updated_at)
            VALUES (?, ?, 'V0B Discovery Call Agreement', CURRENT_TIMESTAMP);
            """, (name or "Discovery Call Client", client_email))
            cursor.execute("SELECT id, name, email FROM clients WHERE id = last_insert_rowid()")
            client_row = cursor.fetchone()

        client_id = client_row["id"]
        client_name = client_row["name"]

        # 2. Update Discovery Call Status to 'Agreement Signed'
        cursor.execute("SELECT id, status FROM discovery_calls WHERE client_id = ?", (client_id,))
        call_row = cursor.fetchone()

        if call_row:
            cursor.execute("""
            UPDATE discovery_calls
            SET status = 'Agreement Signed', breezedoc_agreement_url = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?;
            """, (sheet_url, call_row["id"]))
        else:
            cursor.execute("""
            INSERT INTO discovery_calls (client_id, scheduled_time, status, breezedoc_agreement_url, notes)
            VALUES (?, ?, 'Agreement Signed', ?, ?);
            """, (client_id, timestamp or datetime.now().isoformat(), sheet_url, f"Form Signed on {timestamp}"))

        synced_count += 1
        print(f"  ✅ Agreement Signed [SQLite]: {client_name} ({client_row['email']})")

        # ── Supabase dual-write ─────────────────────────────────────────
        if _supabase:
            try:
                sb_client = _supabase.get_client_by_email(client_row["email"])
                if sb_client:
                    # Update client status
                    _supabase.update_client_status(sb_client["id"], "Agreement Signed")
                    # Update discovery call status
                    _supabase.update_discovery_call_by_client(
                        sb_client["id"], "Agreement Signed",
                        extra={"breezedoc_agreement_url": sheet_url}
                    )
                    print(f"  ✅ Agreement Signed [Supabase]: {client_name}")
                else:
                    # Client not yet in Supabase — create them
                    new_client = _supabase.upsert_client({
                        "name"  : client_name,
                        "email" : client_row["email"],
                        "status": "Agreement Signed",
                    })
                    if new_client:
                        print(f"  ✅ New client + agreement [Supabase]: {client_name}")
            except Exception as e:
                print(f"  ⚠️  Supabase agreement write failed: {e}")

    conn.commit()
    conn.close()

    print("--------------------------------------------------------------------------")
    print(f"Sync complete. Updated {synced_count} agreement records in database.\n")

def main():
    parser = argparse.ArgumentParser(description="Google Form Agreement Sync Engine")
    parser.add_argument("--sheet-url", help="Google Sheet URL for Form Responses")
    args = parser.parse_args()

    config = load_config()
    sheet_url = args.sheet_url or config.get("agreement_sheet_url")

    if not sheet_url:
        print("\n[Google Form Agreement Sync Engine]")
        print("--------------------------------------------------------------------------")
        print("⚠️ No Google Sheet URL provided.")
        print("Please provide your Form Responses Google Sheet URL:")
        print("  python scripts/sync_agreements.py --sheet-url \"https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/edit\"")
        print("\nOr save \"agreement_sheet_url\" in scripts/config.json.\n")
        return

    # Update config if new URL passed
    if args.sheet_url and args.sheet_url != config.get("agreement_sheet_url"):
        config["agreement_sheet_url"] = args.sheet_url
        save_config(config)

    print(f"Connecting to Google Sheet...")
    csv_url = extract_csv_url(sheet_url)
    csv_content = fetch_csv_data(csv_url)

    if csv_content:
        sync_agreements_to_db(csv_content, sheet_url=sheet_url)

if __name__ == "__main__":
    main()
