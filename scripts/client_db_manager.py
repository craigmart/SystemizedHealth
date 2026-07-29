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

def main():
    parser = argparse.ArgumentParser(description="Client CRM Database Manager")
    parser.add_argument("--init", action="store_true", help="Initialize clients database schema")
    parser.add_argument("--list", action="store_true", help="List all clients and call status")
    parser.add_argument("--json", action="store_true", help="Output clients JSON data")
    args = parser.parse_args()

    if args.init:
        init_db()
    elif args.list:
        list_clients()
    elif args.json:
        export_json()
    else:
        list_clients()

if __name__ == "__main__":
    main()
