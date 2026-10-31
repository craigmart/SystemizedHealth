#!/usr/bin/env python3
"""
Systemized Health Client CRM Database Manager & CLI Engine

Database: database/clients.db (SQLite)
Schema:
  - clients (Client Contact Info & Video Source)
  - discovery_calls (TidyCal Bookings, Intake Answers & Transcripts)

Usage Examples:
  python scripts/client_db_manager.py --init
  python scripts/client_db_manager.py --list
  python scripts/client_db_manager.py --json
"""

import sys
import os
import json
import sqlite3
import argparse
from datetime import datetime

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_DIR = os.path.join(BASE_DIR, "database")
DB_PATH = os.path.join(DB_DIR, "clients.db")
STATUS_DOC_PATH = os.path.join(BASE_DIR, "docs", "Client_Onboarding_Status.md")
LOCAL_REGISTRY_PATH = os.path.join(BASE_DIR, "docs", "client_registry.local.md")

def get_connection():
    if not os.path.exists(DB_DIR):
        os.makedirs(DB_DIR, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_connection()
    cursor = conn.cursor()

    # 1. Clients Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS clients (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        phone TEXT,
        source_video TEXT DEFAULT 'V0B Discovery Call',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # 2. Discovery Calls Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS discovery_calls (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        client_id INTEGER NOT NULL,
        scheduled_time TIMESTAMP NOT NULL,
        status TEXT DEFAULT 'Booked' CHECK(status IN ('Booked', 'Agreement Sent', 'Agreement Signed', 'Completed', 'No-Show', 'Cancelled')),
        primary_glitch TEXT,
        os_level_focus TEXT,
        tidycal_booking_id TEXT UNIQUE,
        fathom_transcript_url TEXT,
        breezedoc_agreement_url TEXT,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
    );
    """)

    conn.commit()
    conn.close()
    print(f"Client Database initialized successfully at: {DB_PATH}")

def list_clients():
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
    SELECT 
        c.id as client_id,
        c.name,
        c.email,
        c.source_video,
        d.scheduled_time,
        d.status,
        d.primary_glitch,
        d.os_level_focus
    FROM clients c
    LEFT JOIN discovery_calls d ON c.id = d.client_id
    ORDER BY d.scheduled_time DESC;
    """)

    rows = cursor.fetchall()
    conn.close()

    print("\n==========================================================================")
    print("                SYSTEMIZED HEALTH — CLIENT CRM REGISTRY                   ")
    print("==========================================================================")
    print(f"{'ID':<4} | {'NAME':<18} | {'EMAIL':<25} | {'STATUS':<10} | {'SCHEDULED TIME'}")
    print("-" * 74)

    if not rows:
        print("No client records found.")
    else:
        for r in rows:
            sched = r["scheduled_time"] or "N/A"
            status = r["status"] or "N/A"
            print(f"{r['client_id']:<4} | {r['name'][:18]:<18} | {r['email'][:25]:<25} | {status:<10} | {sched}")

    print("-" * 74)
    print(f"Total Client Records: {len(rows)}\n")

def export_json():
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
    SELECT c.*, d.scheduled_time, d.status, d.primary_glitch, d.os_level_focus, d.tidycal_booking_id
    FROM clients c
    LEFT JOIN discovery_calls d ON c.id = d.client_id;
    """)

    rows = [dict(r) for r in cursor.fetchall()]
    conn.close()
    print(json.dumps(rows, indent=2))

def update_status_doc():
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
    SELECT 
        c.id as client_id,
        c.name,
        c.email,
        c.source_video,
        d.scheduled_time,
        d.status,
        d.primary_glitch,
        d.os_level_focus
    FROM clients c
    LEFT JOIN discovery_calls d ON c.id = d.client_id
    ORDER BY d.scheduled_time DESC;
    """)

    rows = cursor.fetchall()
    conn.close()

    today_str = datetime.now().strftime("%Y-%m-%d")

    active_rows = []
    cancelled_rows = []

    for r in rows:
        sched = r["scheduled_time"] or "N/A"
        status = r["status"] or "Booked"
        formatted = f"| {r['client_id']} | {r['name']} | {r['email']} | {status} | {sched} |"
        if status == "Cancelled":
            cancelled_rows.append(formatted)
        else:
            active_rows.append(formatted)

    if not active_rows:
        active_table_md = "| - | No active bookings | - | - | - |"
    else:
        active_table_md = "\n".join(active_rows)

    if not cancelled_rows:
        cancelled_table_md = "| - | No cancelled records | - | - | - |"
    else:
        cancelled_table_md = "\n".join(cancelled_rows)

    # Full rows stay in a gitignored file. The tracked status doc only stores counts.
    local_registry = f"""# Local client registry

*Generated {today_str} by `scripts/client_db_manager.py --doc`.*

This file is gitignored. It is the local copy of names and emails from `database/clients.db`.
Do not commit it. Resource URLs stay in `scripts/config.json`.

## Active bookings ({len(active_rows)})

| Client ID | Name | Email | Status | Scheduled Time |
| :--- | :--- | :--- | :--- | :--- |
{active_table_md}

## Cancelled / test records ({len(cancelled_rows)})

| Client ID | Name | Email | Status | Scheduled Time |
| :--- | :--- | :--- | :--- | :--- |
{cancelled_table_md}
"""
    os.makedirs(os.path.dirname(LOCAL_REGISTRY_PATH), exist_ok=True)
    with open(LOCAL_REGISTRY_PATH, "w") as f:
        f.write(local_registry)

    content = f"""# Systemized Health — Client Onboarding & CRM Status

*Last Updated: {today_str}*

This document maintains the live operational status and verification checklist for Systemized Health's **Free 20-Minute Systemized Discovery Call** funnel.

Names, emails, and phone numbers are not stored in this file. They stay in the local database.

---

## 1. Funnel Architecture & Integration Links

- **Short URL Redirect**: [`call.systemizedhealth.com`](http://call.systemizedhealth.com/) $\\rightarrow$ TidyCal
- **Booking Endpoint**: [TidyCal Discovery Call](https://tidycal.com/craigandersondc/systemized-discovery-call)
- **Discovery Call Agreement**: `discovery_call_agreement_url` in `scripts/config.json` (template: `scripts/config.example.json`)
- **Form Responses Sheet**: `agreement_sheet_url` in `scripts/config.json`
- **Database Engine**: `database/clients.db` (local only; not committed)

---

## 2. Onboarding Verification Checklist

| Step | Component | Description | Status |
| :--- | :--- | :--- | :--- |
| **01** | **Traffic Redirect** | `call.systemizedhealth.com` 301 redirects to TidyCal. | ✅ **Verified** |
| **02** | **TidyCal Intake** | 20-Minute Discovery Call availability & intake form. | ✅ **Verified** |
| **03** | **Agreement Redirect**| TidyCal confirmation page redirects to Google Form. | ✅ **Verified** |
| **04** | **Booking API Sync** | `tidycal_sync.py` pulls bookings into `clients.db`. | ✅ **Verified** |
| **05** | **Agreement Form Sync**| `sync_agreements.py` matches responses & marks `'Agreement Signed'`. | ✅ **Verified** |

---

## 3. Client Registry

Local database counts only. The row listing, including names and emails, is written to gitignored `docs/client_registry.local.md`.

| | Count |
| :--- | :--- |
| Active bookings | {len(active_rows)} |
| Cancelled / test records | {len(cancelled_rows)} |

---

## 4. Maintenance Commands

To refresh client bookings, agreements, and update this status document:
```bash
python3 scripts/tidycal_sync.py
python3 scripts/sync_agreements.py
python3 scripts/client_db_manager.py --doc
```
"""

    with open(STATUS_DOC_PATH, "w") as f:
        f.write(content)

    print(f"Updated onboarding status document at: {STATUS_DOC_PATH}")
    print(f"Wrote local client registry (gitignored) at: {LOCAL_REGISTRY_PATH}")

def main():
    parser = argparse.ArgumentParser(description="Client CRM Database Manager")
    parser.add_argument("--init", action="store_true", help="Initialize clients database schema")
    parser.add_argument("--list", action="store_true", help="List all clients and call status")
    parser.add_argument("--json", action="store_true", help="Output clients JSON data")
    parser.add_argument("--doc", action="store_true", help="Update the status doc counts and the gitignored local client registry")
    args = parser.parse_args()

    if args.init:
        init_db()
    elif args.list:
        list_clients()
    elif args.json:
        export_json()
    elif args.doc:
        update_status_doc()
    else:
        list_clients()
        update_status_doc()

if __name__ == "__main__":
    main()
