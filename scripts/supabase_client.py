#!/usr/bin/env python3
"""
Systemized Health — Supabase CRM Client
scripts/supabase_client.py

Shared helper module for all Supabase REST API operations.
Uses urllib only — no third-party SDK required.

Usage (imported by other scripts):
    from supabase_client import SupabaseClient
    db = SupabaseClient()
    db.upsert_client({"name": "Jane", "email": "jane@example.com"})
"""

import os
import json
import urllib.request
import urllib.error
import urllib.parse
import ssl
from pathlib import Path

# ── Load .env from scripts/ directory ──────────────────────────────────────
def _load_env():
    env_path = Path(__file__).parent / ".env"
    if env_path.exists():
        with open(env_path) as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    key, _, val = line.partition("=")
                    os.environ.setdefault(key.strip(), val.strip())

_load_env()

SUPABASE_URL = os.environ.get("SUPABASE_URL", "").rstrip("/")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_KEY", "")


class SupabaseClient:
    """Thin REST client for Supabase PostgREST API."""

    def __init__(self, url: str = None, key: str = None):
        self.base_url = (url or SUPABASE_URL).rstrip("/")
        self.key = key or SUPABASE_KEY
        if not self.base_url or not self.key:
            raise ValueError(
                "Supabase URL and SERVICE_KEY are required.\n"
                "Add them to scripts/.env:\n"
                "  SUPABASE_URL=https://your-project.supabase.co\n"
                "  SUPABASE_SERVICE_KEY=your-service-role-key\n"
            )
        # Build REST endpoint base
        self.rest = f"{self.base_url}/rest/v1"
        self._ssl = ssl._create_unverified_context()
        # Build a no-proxy opener so injected system proxies (e.g. IDE tunnels)
        # don't intercept and block Supabase HTTPS requests.
        self._opener = urllib.request.build_opener(
            urllib.request.ProxyHandler({}),          # empty dict = no proxies
            urllib.request.HTTPSHandler(context=self._ssl),
        )

    # ── Internal request helper ─────────────────────────────────────────────
    def _request(self, method: str, path: str, body=None, params: dict = None) -> list | dict | None:
        url = f"{self.rest}/{path.lstrip('/')}"
        if params:
            query = "&".join(f"{k}={v}" for k, v in params.items())
            url = f"{url}?{query}"

        data = json.dumps(body).encode() if body is not None else None
        req = urllib.request.Request(url, data=data, method=method)
        req.add_header("apikey", self.key)
        req.add_header("Authorization", f"Bearer {self.key}")
        req.add_header("Content-Type", "application/json")
        req.add_header("Prefer", "return=representation")  # return affected rows

        try:
            with self._opener.open(req) as resp:
                raw = resp.read().decode("utf-8")
                return json.loads(raw) if raw.strip() else []
        except urllib.error.HTTPError as e:
            err = e.read().decode("utf-8")
            print(f"[Supabase Error] {method} {path} → HTTP {e.code}: {err}")
            return None
        except Exception as e:
            print(f"[Supabase Error] {method} {path} → {e}")
            return None

    # ── Connection test ─────────────────────────────────────────────────────
    def test_connection(self) -> bool:
        result = self._request("GET", "clients", params={"limit": "1"})
        if result is not None:
            print(f"✅ Supabase connection OK → {self.base_url}")
            return True
        print("❌ Supabase connection failed.")
        return False

    # ── clients table ───────────────────────────────────────────────────────
    def upsert_client(self, data: dict) -> dict | None:
        """Insert or update a client by email. Returns the upserted row."""
        req = urllib.request.Request(
            f"{self.rest}/clients",
            data=json.dumps(data).encode(),
            method="POST"
        )
        req.add_header("apikey", self.key)
        req.add_header("Authorization", f"Bearer {self.key}")
        req.add_header("Content-Type", "application/json")
        req.add_header("Prefer", "resolution=merge-duplicates,return=representation")
        req.add_header("on_conflict", "email")

        try:
            with self._opener.open(req) as resp:
                raw = resp.read().decode("utf-8")
                rows = json.loads(raw) if raw.strip() else []
                return rows[0] if rows else None
        except urllib.error.HTTPError as e:
            err = e.read().decode("utf-8")
            print(f"[Supabase Error] upsert_client → HTTP {e.code}: {err}")
            return None
        except Exception as e:
            print(f"[Supabase Error] upsert_client → {e}")
            return None

    def get_client_by_email(self, email: str) -> dict | None:
        rows = self._request("GET", "clients", params={"email": f"eq.{email}", "limit": "1"})
        return rows[0] if rows else None

    def get_all_clients(self) -> list:
        return self._request("GET", "clients", params={"order": "created_at.desc"}) or []

    def update_client_status(self, client_id: str, status: str):
        url = f"{self.rest}/clients?id=eq.{client_id}"
        req = urllib.request.Request(url, data=json.dumps({"status": status}).encode(), method="PATCH")
        req.add_header("apikey", self.key)
        req.add_header("Authorization", f"Bearer {self.key}")
        req.add_header("Content-Type", "application/json")
        req.add_header("Prefer", "return=representation")
        try:
            with self._opener.open(req) as resp:
                return json.loads(resp.read().decode("utf-8"))
        except Exception as e:
            print(f"[Supabase Error] update_client_status → {e}")
            return None

    # ── client_demographics table ───────────────────────────────────────────
    def upsert_demographics(self, client_id: str, data: dict) -> dict | None:
        data["client_id"] = client_id
        req = urllib.request.Request(
            f"{self.rest}/client_demographics",
            data=json.dumps(data).encode(),
            method="POST"
        )
        req.add_header("apikey", self.key)
        req.add_header("Authorization", f"Bearer {self.key}")
        req.add_header("Content-Type", "application/json")
        req.add_header("Prefer", "resolution=merge-duplicates,return=representation")
        req.add_header("on_conflict", "client_id")
        try:
            with self._opener.open(req) as resp:
                raw = resp.read().decode("utf-8")
                rows = json.loads(raw) if raw.strip() else []
                return rows[0] if rows else None
        except urllib.error.HTTPError as e:
            err = e.read().decode("utf-8")
            print(f"[Supabase Error] upsert_demographics → HTTP {e.code}: {err}")
            return None
        except Exception as e:
            print(f"[Supabase Error] upsert_demographics → {e}")
            return None

    def get_demographics(self, client_id: str) -> dict | None:
        rows = self._request("GET", "client_demographics",
                             params={"client_id": f"eq.{client_id}", "limit": "1"})
        return rows[0] if rows else None

    # ── discovery_calls table ───────────────────────────────────────────────
    def upsert_discovery_call(self, data: dict) -> dict | None:
        req = urllib.request.Request(
            f"{self.rest}/discovery_calls",
            data=json.dumps(data).encode(),
            method="POST"
        )
        req.add_header("apikey", self.key)
        req.add_header("Authorization", f"Bearer {self.key}")
        req.add_header("Content-Type", "application/json")
        req.add_header("Prefer", "resolution=merge-duplicates,return=representation")
        req.add_header("on_conflict", "tidycal_booking_id")
        try:
            with self._opener.open(req) as resp:
                raw = resp.read().decode("utf-8")
                rows = json.loads(raw) if raw.strip() else []
                return rows[0] if rows else None
        except urllib.error.HTTPError as e:
            err = e.read().decode("utf-8")
            print(f"[Supabase Error] upsert_discovery_call → HTTP {e.code}: {err}")
            return None
        except Exception as e:
            print(f"[Supabase Error] upsert_discovery_call → {e}")
            return None

    def get_discovery_calls(self, client_id: str) -> list:
        return self._request("GET", "discovery_calls",
                             params={"client_id": f"eq.{client_id}",
                                     "order": "scheduled_time.desc"}) or []

    def update_discovery_call_status(self, tidycal_booking_id: str, status: str, extra: dict = None):
        payload = {"status": status}
        if extra:
            payload.update(extra)
        url = f"{self.rest}/discovery_calls?tidycal_booking_id=eq.{tidycal_booking_id}"
        req = urllib.request.Request(url, data=json.dumps(payload).encode(), method="PATCH")
        req.add_header("apikey", self.key)
        req.add_header("Authorization", f"Bearer {self.key}")
        req.add_header("Content-Type", "application/json")
        req.add_header("Prefer", "return=representation")
        try:
            with self._opener.open(req) as resp:
                return json.loads(resp.read().decode("utf-8"))
        except Exception as e:
            print(f"[Supabase Error] update_discovery_call_status → {e}")
            return None

    def update_discovery_call_by_client(self, client_id: str, status: str, extra: dict = None):
        payload = {"status": status}
        if extra:
            payload.update(extra)
        url = f"{self.rest}/discovery_calls?client_id=eq.{client_id}&order=scheduled_time.desc&limit=1"
        req = urllib.request.Request(url, data=json.dumps(payload).encode(), method="PATCH")
        req.add_header("apikey", self.key)
        req.add_header("Authorization", f"Bearer {self.key}")
        req.add_header("Content-Type", "application/json")
        req.add_header("Prefer", "return=representation")
        try:
            with self._opener.open(req) as resp:
                return json.loads(resp.read().decode("utf-8"))
        except Exception as e:
            print(f"[Supabase Error] update_discovery_call_by_client → {e}")
            return None

    # ── coaching_sessions table ─────────────────────────────────────────────
    def insert_coaching_session(self, data: dict) -> dict | None:
        result = self._request("POST", "coaching_sessions", body=data)
        if isinstance(result, list):
            return result[0] if result else None
        return result

    def get_coaching_sessions(self, client_id: str) -> list:
        return self._request("GET", "coaching_sessions",
                             params={"client_id": f"eq.{client_id}",
                                     "order": "session_date.desc"}) or []

    # ── coaching_notes table ────────────────────────────────────────────────
    def add_note(self, client_id: str, note: str, note_type: str = "General") -> dict | None:
        result = self._request("POST", "coaching_notes",
                               body={"client_id": client_id, "note": note, "note_type": note_type})
        if isinstance(result, list):
            return result[0] if result else None
        return result

    def get_notes(self, client_id: str) -> list:
        return self._request("GET", "coaching_notes",
                             params={"client_id": f"eq.{client_id}",
                                     "order": "created_at.desc"}) or []

    # ── videos table ────────────────────────────────────────────────────────
    def upsert_video(self, data: dict) -> dict | None:
        """Insert or update a video by video_number. Returns the upserted row."""
        req = urllib.request.Request(
            f"{self.rest}/videos?on_conflict=video_number",
            data=json.dumps(data).encode(),
            method="POST"
        )
        req.add_header("apikey", self.key)
        req.add_header("Authorization", f"Bearer {self.key}")
        req.add_header("Content-Type", "application/json")
        req.add_header("Prefer", "resolution=merge-duplicates,return=representation")
        try:
            with self._opener.open(req) as resp:
                raw = resp.read().decode("utf-8")
                rows = json.loads(raw) if raw.strip() else []
                return rows[0] if rows else None
        except urllib.error.HTTPError as e:
            err = e.read().decode("utf-8")
            print(f"[Supabase Error] upsert_video → HTTP {e.code}: {err}")
            return None
        except Exception as e:
            print(f"[Supabase Error] upsert_video → {e}")
            return None

    def get_video_by_number(self, video_number: str) -> dict | None:
        rows = self._request("GET", "videos",
                             params={"video_number": f"eq.{video_number}", "limit": "1"})
        return rows[0] if rows else None

    def get_video_by_code(self, code: str) -> dict | None:
        rows = self._request("GET", "videos",
                             params={"code": f"eq.{code}", "limit": "1"})
        return rows[0] if rows else None

    def get_all_videos(self) -> list:
        return self._request("GET", "videos",
                             params={"order": "video_number.asc"}) or []

    def update_video_status(self, video_number: str, status: str, extra: dict = None) -> dict | None:
        payload = {"status": status}
        if extra:
            payload.update(extra)
        url = f"{self.rest}/videos?video_number=eq.{video_number}"
        req = urllib.request.Request(url, data=json.dumps(payload).encode(), method="PATCH")
        req.add_header("apikey", self.key)
        req.add_header("Authorization", f"Bearer {self.key}")
        req.add_header("Content-Type", "application/json")
        req.add_header("Prefer", "return=representation")
        try:
            with self._opener.open(req) as resp:
                rows = json.loads(resp.read().decode("utf-8"))
                return rows[0] if rows else None
        except Exception as e:
            print(f"[Supabase Error] update_video_status → {e}")
            return None

    # ── video_stats table ────────────────────────────────────────────────────
    def add_video_stats(self, video_id: str, data: dict) -> dict | None:
        """Insert a performance snapshot for a video."""
        data["video_id"] = video_id
        result = self._request("POST", "video_stats", body=data)
        if isinstance(result, list):
            return result[0] if result else None
        return result

    def get_latest_stats(self, video_id: str) -> dict | None:
        rows = self._request("GET", "video_stats",
                             params={"video_id": f"eq.{video_id}",
                                     "order": "snapshot_date.desc",
                                     "limit": "1"})
        return rows[0] if rows else None

    # ── video_keywords table ─────────────────────────────────────────────────
    def upsert_keyword(self, video_id: str, keyword: str, data: dict) -> dict | None:
        """Upsert a keyword row for a video."""
        data["video_id"] = video_id
        data["keyword"] = keyword
        result = self._request("POST", "video_keywords", body=data)
        if isinstance(result, list):
            return result[0] if result else None
        return result

    def get_keywords(self, video_id: str) -> list:
        return self._request("GET", "video_keywords",
                             params={"video_id": f"eq.{video_id}",
                                     "order": "overall_score.desc"}) or []

    # ── video_tasks table ────────────────────────────────────────────────────
    def add_video_task(self, video_id: str, data: dict) -> dict | None:
        """Insert a production task for a video."""
        data["video_id"] = video_id
        result = self._request("POST", "video_tasks", body=data)
        if isinstance(result, list):
            return result[0] if result else None
        return result

    def get_tasks(self, video_id: str, open_only: bool = False) -> list:
        params = {"video_id": f"eq.{video_id}", "order": "due_date.asc"}
        if open_only:
            params["status"] = "neq.Completed"
        return self._request("GET", "video_tasks", params=params) or []

    def update_task_status(self, task_id: str, status: str) -> dict | None:
        payload = {"status": status}
        if status == "Completed":
            from datetime import datetime, timezone
            payload["completed_at"] = datetime.now(timezone.utc).isoformat()
        url = f"{self.rest}/video_tasks?id=eq.{task_id}"
        req = urllib.request.Request(url, data=json.dumps(payload).encode(), method="PATCH")
        req.add_header("apikey", self.key)
        req.add_header("Authorization", f"Bearer {self.key}")
        req.add_header("Content-Type", "application/json")
        req.add_header("Prefer", "return=representation")
        try:
            with self._opener.open(req) as resp:
                rows = json.loads(resp.read().decode("utf-8"))
                return rows[0] if rows else None
        except Exception as e:
            print(f"[Supabase Error] update_task_status → {e}")
            return None


# ── CLI test mode ───────────────────────────────────────────────────────────
if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Supabase CRM Client")
    parser.add_argument("--test", action="store_true", help="Test Supabase connection")
    args = parser.parse_args()

    if args.test:
        db = SupabaseClient()
        ok = db.test_connection()
        if ok:
            videos = db.get_all_videos()
            print(f"   Videos in Supabase: {len(videos)}")
    else:
        parser.print_help()
