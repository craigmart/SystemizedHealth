#!/usr/bin/env python3
"""
TidyCal API Booking Synchronization Script
Systemized Health — Discovery Call Onboarding

Purpose:
  Connects to the TidyCal REST API to fetch booked appointments,
  extract client Name, Email, Appointment Start Time, and Intake Answers,
  and sync them into the local SQLite database AND Supabase CRM.

Usage:
  python scripts/tidycal_sync.py
  python scripts/tidycal_sync.py --api-key YOUR_TIDYCAL_TOKEN
"""

import os
import sys
import json
import sqlite3
import urllib.request
import urllib.error
import argparse
from datetime import datetime

# Supabase dual-write (graceful fallback if unavailable)
try:
    from supabase_client import SupabaseClient
    _supabase = SupabaseClient()
except Exception as e:
    _supabase = None
    print(f"[Warning] Supabase client unavailable: {e}")

# Paths
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CONFIG_PATH = os.path.join(BASE_DIR, "scripts", "config.json")
DB_PATH = os.path.join(BASE_DIR, "database", "clients.db")

# Candidate TidyCal REST API Endpoints
TIDYCAL_API_URLS = [
    "https://tidycal.com/api/bookings",
    "https://tidycal.com/api/v1/bookings",
    "https://tidycal.com/api/v1/booking"
]

def load_config():
    if os.path.exists(CONFIG_PATH):
        with open(CONFIG_PATH, "r") as f:
            return json.load(f)
    return {}

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

import ssl

def fetch_tidycal_bookings(api_key):
    """Fetches list of bookings from TidyCal API trying valid endpoints."""
    last_error = None
    
    # Create SSL context to handle macOS certificate validation gracefully
    try:
        ssl_context = ssl.create_default_context()
    except AttributeError:
        ssl_context = None

    # Unverified fallback for local SSL trust chain on macOS
    unverified_ssl = ssl._create_unverified_context() if hasattr(ssl, "_create_unverified_context") else None

    for url in TIDYCAL_API_URLS:
        for ctx in [ssl_context, unverified_ssl]:
            try:
                req = urllib.request.Request(url)
                req.add_header("Authorization", f"Bearer {api_key}")
                req.add_header("Accept", "application/json")
                req.add_header("User-Agent", "SystemizedHealth-ClientOnboarding/1.0")

                with urllib.request.urlopen(req, context=ctx) as resp:
                    if resp.status == 200:
                        data = json.loads(resp.read().decode("utf-8"))
                        print(f"Connected successfully via: {url}")
                        return data.get("data", data) if isinstance(data, dict) else data
            except urllib.error.HTTPError as e:
                err_msg = e.read().decode("utf-8")
                print(f"[Attempt {url}] HTTP {e.code}: {err_msg}")
                last_error = f"HTTP {e.code}: {err_msg}"
                break
            except Exception as e:
                last_error = str(e)
                continue
            
    print(f"\n[Error] Unable to reach TidyCal API. Last error: {last_error}")
    return None

def sync_booking_to_db(booking, verbose=False):
    """Inserts or updates client and discovery_call record in SQLite database."""
    conn = get_db()
    cursor = conn.cursor()

    if verbose:
        print(f"\n[TidyCal Booking Record Raw Payload]:")
        print(json.dumps(booking, indent=2))

    booking_id = str(booking.get("id", ""))
    
    # Extract client details across common TidyCal API schema keys
    client_name = (
        booking.get("name") or 
        booking.get("contact_name") or 
        booking.get("user_name") or 
        (booking.get("contact", {}).get("name") if isinstance(booking.get("contact"), dict) else None) or 
        "Unknown"
    )
    
    client_email = (
        booking.get("email") or 
        booking.get("contact_email") or 
        booking.get("user_email") or 
        (booking.get("contact", {}).get("email") if isinstance(booking.get("contact"), dict) else None) or 
        ""
    )
    
    scheduled_time = (
        booking.get("starts_at") or 
        booking.get("start_time") or 
        booking.get("booking_date") or 
        datetime.now().isoformat()
    )
    
    status_raw = str(booking.get("status", "Booked")).capitalize()
    if booking.get("cancelled_at") or booking.get("deleted_at"):
        status_raw = "Cancelled"
    
    # Extract questions / answers if present
    answers = booking.get("questions") or booking.get("answers") or booking.get("form_responses") or []
    primary_glitch = ""
    os_level_focus = ""
    source_video = "V0B Discovery Call"

    if isinstance(answers, list):
        for item in answers:
            if isinstance(item, dict):
                q_text = str(item.get("question") or item.get("label") or "").lower()
                a_text = str(item.get("answer") or item.get("value") or "").strip()
                if "glitch" in q_text or "bottleneck" in q_text or "pain" in q_text:
                    primary_glitch = a_text
                elif "level" in q_text or "os" in q_text:
                    os_level_focus = a_text
                elif any(kw in q_text for kw in ["video", "source", "code", "referral", "how did you"]):
                    if a_text:
                        source_video = a_text

    if not client_email:
        print(f"[Warning] Skipping booking ID {booking_id} due to missing email.")
        return

    # 1. Upsert Client Record
    cursor.execute("""
    INSERT INTO clients (name, email, source_video, updated_at)
    VALUES (?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(email) DO UPDATE SET
        name = excluded.name,
        source_video = COALESCE(excluded.source_video, clients.source_video),
        updated_at = CURRENT_TIMESTAMP;
    """, (client_name, client_email, source_video))

    # Retrieve Client ID
    cursor.execute("SELECT id FROM clients WHERE email = ?", (client_email,))
    client_row = cursor.fetchone()
    if not client_row:
        return
    client_id = client_row["id"]

    # 2. Upsert Discovery Call Record
    cursor.execute("""
    SELECT id FROM discovery_calls WHERE tidycal_booking_id = ? OR (client_id = ? AND scheduled_time = ?);
    """, (booking_id, client_id, scheduled_time))
    call_row = cursor.fetchone()

    if call_row:
        cursor.execute("""
        UPDATE discovery_calls
        SET status = ?, primary_glitch = ?, os_level_focus = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?;
        """, (status_raw, primary_glitch, os_level_focus, call_row["id"]))
    else:
        cursor.execute("""
        INSERT INTO discovery_calls (client_id, scheduled_time, status, primary_glitch, os_level_focus, tidycal_booking_id)
        VALUES (?, ?, ?, ?, ?, ?);
        """, (client_id, scheduled_time, status_raw, primary_glitch, os_level_focus, booking_id))

    conn.commit()
    conn.close()
    print(f"  ✅ Synced [SQLite]: {client_name} ({client_email}) — Source: {source_video} — Scheduled: {scheduled_time} — Status: {status_raw}")

    # ── Supabase dual-write ─────────────────────────────────────────
    if _supabase:
        try:
            sb_client = _supabase.upsert_client({
                "name"        : client_name,
                "email"       : client_email,
                "source_video": source_video,
                "status"      : "Cancelled" if status_raw == "Cancelled" else "Booked",
            })
            if sb_client:
                _supabase.upsert_discovery_call({
                    "client_id"           : sb_client["id"],
                    "tidycal_booking_id"  : booking_id,
                    "scheduled_time"      : scheduled_time,
                    "status"              : status_raw,
                    "primary_glitch"      : primary_glitch,
                    "os_level_focus"      : os_level_focus,
                })
                print(f"  ✅ Synced [Supabase]: {client_name}")
        except Exception as e:
            print(f"  ⚠️  Supabase write failed for {client_email}: {e}")

def main():
    parser = argparse.ArgumentParser(description="TidyCal Sync Engine")
    parser.add_argument("--api-key", help="TidyCal Personal Access Token")
    parser.add_argument("--verbose", "-v", action="store_true", help="Print raw payload details")
    args = parser.parse_args()

    config = load_config()
    api_key = args.api_key or config.get("tidycal_api_key") or os.environ.get("TIDYCAL_API_KEY")

    if not api_key:
        print("\n[TidyCal Sync Engine]")
        print("----------------------------------------")
        print("⚠️ No TidyCal API key found.")
        print("To connect to TidyCal:")
        print("1. Log in to TidyCal (https://tidycal.com)")
        print("2. Go to: Settings / Integrations -> Advanced -> API Keys")
        print("3. Generate a Personal Access Token.")
        print("4. Add \"tidycal_api_key\": \"YOUR_TOKEN\" to `scripts/config.json`.")
        print("   Or run: python scripts/tidycal_sync.py --api-key YOUR_TOKEN\n")
        return

    print(f"Fetching bookings from TidyCal API...")
    bookings = fetch_tidycal_bookings(api_key)

    if bookings is None:
        return

    active_count = sum(1 for b in bookings if not b.get("cancelled_at") and not b.get("deleted_at"))
    cancelled_count = len(bookings) - active_count
    print(f"Found {len(bookings)} total historical bookings on TidyCal ({active_count} active, {cancelled_count} cancelled).")
    for b in bookings:
        sync_booking_to_db(b, verbose=args.verbose)

    print("\nSync completed successfully.")

if __name__ == "__main__":
    main()
