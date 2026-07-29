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

    doc_path = os.path.join(BASE_DIR, "docs", "Client_Onboarding_Status.md")
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

    content = f"""# Systemized Health — Client Onboarding & CRM Status

*Last Updated: {today_str}*

This document maintains the live operational status, verification checklist, and active client intake registry for Systemized Health's **Free 20-Minute Systemized Discovery Call** funnel.

---

## 1. Funnel Architecture & Integration Links

- **Short URL Redirect**: [`call.systemizedhealth.com`](http://call.systemizedhealth.com/) $\\rightarrow$ TidyCal
- **Booking Endpoint**: [TidyCal Discovery Call](https://tidycal.com/craigandersondc/systemized-discovery-call)
- **Discovery Call Agreement**: [Google Form Agreement](https://docs.google.com/forms/d/e/1FAIpQLScOmaeooaLLHFBppRqDI4Mtb9uM8qnU9eUH0gjo0HFU_NqGzQ/viewform?usp=header)
- **Form Responses Sheet**: [Google Sheet Responses](https://docs.google.com/spreadsheets/d/1wbJfIx92aliZilY4Yyr_oFRaz1TN06erOti6HKZk-ZA/edit?usp=sharing)
- **Database Engine**: [`database/clients.db`](file://{DB_PATH})

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

## 3. Active Client Registry Table

*(Auto-generated from `database/clients.db` — Active Bookings)*

| Client ID | Name | Email | Status | Scheduled Time |
| :--- | :--- | :--- | :--- | :--- |
{active_table_md}

<details>
<summary><b>View Cancelled / Test Records ({len(cancelled_rows)})</b></summary>

| Client ID | Name | Email | Status | Scheduled Time |
| :--- | :--- | :--- | :--- | :--- |
{cancelled_table_md}

</details>

---

## 4. Maintenance Commands

To refresh client bookings, agreements, and update this status document:
```bash
python3 scripts/tidycal_sync.py
python3 scripts/sync_agreements.py
python3 scripts/client_db_manager.py --doc
```
"""

    with open(doc_path, "w") as f:
        f.write(content)

    print(f"Updated live onboarding status document at: {doc_path}")

def main():
    parser = argparse.ArgumentParser(description="Client CRM Database Manager")
    parser.add_argument("--init", action="store_true", help="Initialize clients database schema")
    parser.add_argument("--list", action="store_true", help="List all clients and call status")
    parser.add_argument("--json", action="store_true", help="Output clients JSON data")
    parser.add_argument("--doc", action="store_true", help="Update docs/Client_Onboarding_Status.md living report")
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
