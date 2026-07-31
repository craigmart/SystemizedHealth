#!/usr/bin/env python3
"""
Systemized Health — CRM CLI Tool
scripts/crm.py

Full command-line interface for managing clients, demographics,
coaching sessions, and notes in Supabase.

Usage:
  python scripts/crm.py --list
  python scripts/crm.py --profile --email client@email.com
  python scripts/crm.py --demographics --email client@email.com
  python scripts/crm.py --add-session --email client@email.com
  python scripts/crm.py --add-note --email client@email.com
  python scripts/crm.py --export
"""

import sys
import json
import argparse
from datetime import datetime

# Import shared Supabase client
sys.path.insert(0, __file__.rsplit("/", 1)[0])
from supabase_client import SupabaseClient


def prompt(label: str, default: str = "") -> str:
    val = input(f"  {label}{f' [{default}]' if default else ''}: ").strip()
    return val if val else default


def print_divider(title: str = ""):
    width = 72
    if title:
        pad = (width - len(title) - 2) // 2
        print(f"\n{'─' * pad} {title} {'─' * pad}")
    else:
        print("─" * width)


# ── List all clients ────────────────────────────────────────────────────────
def cmd_list(db: SupabaseClient):
    clients = db.get_all_clients()
    print_divider("SYSTEMIZED HEALTH — CLIENT CRM")
    print(f"  {'NAME':<22} {'EMAIL':<30} {'STATUS':<18} {'CREATED'}")
    print_divider()
    if not clients:
        print("  No clients found.")
    for c in clients:
        created = (c.get("created_at") or "")[:10]
        print(f"  {c['name'][:22]:<22} {c['email'][:30]:<30} {c.get('status',''):<18} {created}")
    print_divider()
    print(f"  Total: {len(clients)} clients\n")


# ── Full client profile ─────────────────────────────────────────────────────
def cmd_profile(db: SupabaseClient, email: str):
    client = db.get_client_by_email(email)
    if not client:
        print(f"❌ No client found with email: {email}")
        return

    client_id = client["id"]
    demographics = db.get_demographics(client_id)
    calls = db.get_discovery_calls(client_id)
    sessions = db.get_coaching_sessions(client_id)
    notes = db.get_notes(client_id)

    print_divider(f"CLIENT PROFILE")
    print(f"  Name     : {client.get('name')}")
    print(f"  Email    : {client.get('email')}")
    print(f"  Phone    : {client.get('phone') or '—'}")
    print(f"  Status   : {client.get('status')}")
    print(f"  Source   : {client.get('source_video')}")
    print(f"  Added    : {(client.get('created_at') or '')[:10]}")

    if demographics:
        print_divider("DEMOGRAPHICS")
        fields = [
            ("DOB", "date_of_birth"), ("Gender", "gender"),
            ("Location", None), ("Occupation", "occupation"),
            ("Chief Concern", "chief_complaint"), ("Coaching Goals", "health_goals"),
            ("Referral Source", "referral_source"),
        ]
        for label, key in fields:
            if key == "Location":
                city = demographics.get("city") or ""
                state = demographics.get("state") or ""
                val = f"{city}, {state}".strip(", ") or "—"
                print(f"  {'Location':<20}: {val}")
            else:
                val = demographics.get(key) or "—"
                print(f"  {label:<20}: {val}")

    if calls:
        print_divider("DISCOVERY CALLS")
        for c in calls:
            sched = (c.get("scheduled_time") or "")[:16].replace("T", " ")
            print(f"  [{c.get('status')}] {sched} | TidyCal ID: {c.get('tidycal_booking_id') or '—'}")
            if c.get("primary_glitch"):
                print(f"    Glitch     : {c['primary_glitch']}")
            if c.get("os_level_focus"):
                print(f"    OS Level   : {c['os_level_focus']}")

    if sessions:
        print_divider(f"COACHING SESSIONS ({len(sessions)})")
        for s in sessions:
            date = (s.get("session_date") or "")[:10]
            print(f"  [{s.get('session_type')}] {date}")
            if s.get("chief_concern"):
                print(f"    Concern : {s['chief_concern']}")
            if s.get("plan"):
                print(f"    Plan    : {s['plan']}")
            if s.get("homework"):
                print(f"    Homework: {s['homework']}")

    if notes:
        print_divider(f"NOTES ({len(notes)})")
        for n in notes:
            created = (n.get("created_at") or "")[:16].replace("T", " ")
            print(f"  [{n.get('note_type')}] {created}")
            print(f"    {n['note']}")

    print_divider()


# ── Add/update demographics ─────────────────────────────────────────────────
def cmd_demographics(db: SupabaseClient, email: str):
    client = db.get_client_by_email(email)
    if not client:
        print(f"❌ No client found: {email}")
        return

    client_id = client["id"]
    existing = db.get_demographics(client_id) or {}
    print(f"\n📋 Updating demographics for {client['name']} ({email})")
    print("  (Press Enter to keep existing value)\n")

    data = {
        "date_of_birth"  : prompt("Date of Birth (YYYY-MM-DD)", existing.get("date_of_birth") or ""),
        "gender"         : prompt("Gender", existing.get("gender") or ""),
        "city"           : prompt("City", existing.get("city") or ""),
        "state"          : prompt("State", existing.get("state") or ""),
        "occupation"     : prompt("Occupation", existing.get("occupation") or ""),
        "referral_source": prompt("How did they hear about you?", existing.get("referral_source") or ""),
        "chief_complaint": prompt("Chief Coaching Concern", existing.get("chief_complaint") or ""),
        "health_goals"   : prompt("Health & Coaching Goals", existing.get("health_goals") or ""),
    }

    # Strip empty strings
    data = {k: v for k, v in data.items() if v}

    result = db.upsert_demographics(client_id, data)
    if result:
        print(f"\n✅ Demographics saved for {client['name']}")
    else:
        print("❌ Failed to save demographics.")


# ── Add coaching session ────────────────────────────────────────────────────
def cmd_add_session(db: SupabaseClient, email: str):
    client = db.get_client_by_email(email)
    if not client:
        print(f"❌ No client found: {email}")
        return

    client_id = client["id"]
    print(f"\n📝 New Coaching Session for {client['name']} ({email})\n")

    session_types = ["Initial", "Follow-up", "Check-in", "Emergency", "Group"]
    print("  Session Types: " + " | ".join(f"{i+1}. {t}" for i, t in enumerate(session_types)))
    type_choice = prompt("Session Type # (default: 2 = Follow-up)", "2")
    try:
        session_type = session_types[int(type_choice) - 1]
    except (ValueError, IndexError):
        session_type = "Follow-up"

    data = {
        "client_id"        : client_id,
        "session_date"     : datetime.now().isoformat(),
        "session_type"     : session_type,
        "chief_concern"    : prompt("Chief Concern (what they reported today)"),
        "current_protocols": prompt("Current Protocols / Plan"),
        "assessment"       : prompt("Your Assessment / Impression"),
        "plan"             : prompt("Plan / Protocol Changes"),
        "homework"         : prompt("Client Homework / Action Items"),
        "next_session_date": prompt("Next Session Date (YYYY-MM-DD, optional)"),
        "fathom_url"       : prompt("Fathom Recording URL (optional)"),
        "soap_subjective"  : prompt("SOAP — Subjective (optional)"),
        "soap_objective"   : prompt("SOAP — Objective (optional)"),
        "soap_assessment"  : prompt("SOAP — Assessment (optional)"),
        "soap_plan"        : prompt("SOAP — Plan (optional)"),
    }

    # Clean up empty + format next_session_date
    if data["next_session_date"]:
        try:
            data["next_session_date"] = datetime.strptime(
                data["next_session_date"], "%Y-%m-%d"
            ).isoformat()
        except ValueError:
            data.pop("next_session_date")
    else:
        data.pop("next_session_date")

    data = {k: v for k, v in data.items() if v}
    data["client_id"] = client_id  # always required

    result = db.insert_coaching_session(data)
    if result:
        print(f"\n✅ Coaching session saved for {client['name']} ({session_type})")
    else:
        print("❌ Failed to save session.")


# ── Add quick note ──────────────────────────────────────────────────────────
def cmd_add_note(db: SupabaseClient, email: str):
    client = db.get_client_by_email(email)
    if not client:
        print(f"❌ No client found: {email}")
        return

    client_id = client["id"]
    print(f"\n💬 Add Note for {client['name']} ({email})\n")

    note_types = ["General", "Progress", "Concern", "Milestone", "Admin"]
    print("  Note Types: " + " | ".join(f"{i+1}. {t}" for i, t in enumerate(note_types)))
    type_choice = prompt("Note Type # (default: 1 = General)", "1")
    try:
        note_type = note_types[int(type_choice) - 1]
    except (ValueError, IndexError):
        note_type = "General"

    note_text = prompt("Note")
    if not note_text:
        print("❌ Note cannot be empty.")
        return

    result = db.add_note(client_id, note_text, note_type)
    if result:
        print(f"\n✅ Note saved [{note_type}] for {client['name']}")
    else:
        print("❌ Failed to save note.")


# ── Add new client manually ─────────────────────────────────────────────────
def cmd_add_client(db: SupabaseClient):
    print("\n➕ Add New Client\n")
    name  = prompt("Full Name")
    email = prompt("Email")
    phone = prompt("Phone (optional)")

    if not name or not email:
        print("❌ Name and email are required.")
        return

    data = {"name": name, "email": email, "status": "Lead"}
    if phone:
        data["phone"] = phone

    result = db.upsert_client(data)
    if result:
        print(f"\n✅ Client added: {name} ({email})")
    else:
        print("❌ Failed to add client.")


# ── Export to CSV ───────────────────────────────────────────────────────────
def cmd_export(db: SupabaseClient):
    import csv
    import os
    clients = db.get_all_clients()
    if not clients:
        print("No clients to export.")
        return

    export_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "exports", "clients_export.csv")
    os.makedirs(os.path.dirname(export_path), exist_ok=True)

    fieldnames = ["id", "name", "email", "phone", "status", "source_video", "created_at", "updated_at"]
    with open(export_path, "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(clients)

    print(f"✅ Exported {len(clients)} clients to: {export_path}")


# ── Main CLI ────────────────────────────────────────────────────────────────
def main():
    parser = argparse.ArgumentParser(
        description="Systemized Health — Supabase CRM CLI",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python scripts/crm.py --list
  python scripts/crm.py --profile --email client@email.com
  python scripts/crm.py --demographics --email client@email.com
  python scripts/crm.py --add-session --email client@email.com
  python scripts/crm.py --add-note --email client@email.com
  python scripts/crm.py --add-client
  python scripts/crm.py --export
  python scripts/crm.py --test
        """
    )
    parser.add_argument("--list",         action="store_true", help="List all clients")
    parser.add_argument("--profile",      action="store_true", help="Show full client profile")
    parser.add_argument("--demographics", action="store_true", help="Add/update demographics")
    parser.add_argument("--add-session",  action="store_true", help="Add a coaching session")
    parser.add_argument("--add-note",     action="store_true", help="Add a quick note")
    parser.add_argument("--add-client",   action="store_true", help="Add a new client manually")
    parser.add_argument("--export",       action="store_true", help="Export all clients to CSV")
    parser.add_argument("--test",         action="store_true", help="Test Supabase connection")
    parser.add_argument("--email",        type=str,            help="Client email address")
    args = parser.parse_args()

    db = SupabaseClient()

    if args.test:
        db.test_connection()
    elif args.list:
        cmd_list(db)
    elif args.profile:
        if not args.email:
            print("❌ --profile requires --email")
            sys.exit(1)
        cmd_profile(db, args.email)
    elif args.demographics:
        if not args.email:
            print("❌ --demographics requires --email")
            sys.exit(1)
        cmd_demographics(db, args.email)
    elif args.add_session:
        if not args.email:
            print("❌ --add-session requires --email")
            sys.exit(1)
        cmd_add_session(db, args.email)
    elif args.add_note:
        if not args.email:
            print("❌ --add-note requires --email")
            sys.exit(1)
        cmd_add_note(db, args.email)
    elif args.add_client:
        cmd_add_client(db)
    elif args.export:
        cmd_export(db)
    else:
        cmd_list(db)


if __name__ == "__main__":
    main()
