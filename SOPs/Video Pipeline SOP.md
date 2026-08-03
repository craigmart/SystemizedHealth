# 80.06 — Video Pipeline SOP

This document defines the authoritative operating standard for managing the Systemized Health video pipeline. All video metadata, status tracking, and production scheduling flows through **Supabase** as the single source of truth.

---

## 1. Source of Truth

**Supabase (`videos` table) is the absolute single Source of Truth** for all video metadata, drop dates, status progression, and production scheduling.

- **Mandatory Supabase Sync**: Any modification to video drop schedules, titles, or status MUST be updated directly in Supabase (via `python3 scripts/db_manager.py --seed`, `python3 scripts/video_pipeline.py --status <code> <status>`, or `python3 scripts/video_pipeline.py --add '<json>'`).
- **Derived Downstream Targets**: Local SQLite (`database/videos.db`), markdown reports (`TODO.md`, `Analytics/`), local cache (`docs/video_pipeline_cache.json`), and iCalendar feeds (`publication_calendar.ics`) are derived targets synced from Supabase.

| Layer | System | Role & Access |
| :--- | :--- | :--- |
| **Primary Source of Truth** | **Supabase `videos` table** | REST API — `https://qkeloxawnpvyfasujonv.supabase.co` |
| **Primary Sync Tool** | `scripts/db_manager.py` / `scripts/video_pipeline.py` | Command line management engine |
| **Local Cache** | `docs/video_pipeline_cache.json` | Generated from Supabase via `video_pipeline.py --cache` |
| **Archived Files** | `backups/pipeline_archive/` | Historical reference only — do not edit |

> Never edit `backups/pipeline_archive/Master_Video_Pipeline.md` or `.csv`. They are frozen snapshots. All live schedule changes must be executed against Supabase.

---

## 2. Supabase Schema

### Table: `videos` (core metadata)
| Column | Type | Description |
| :--- | :--- | :--- |
| `video_number` | TEXT | Sequential production order (`001`–`099`) |
| `code` | TEXT | Johnny Decimal code (`80.V0A`, `80.V0A-S1`, etc.) |
| `format_type` | TEXT | `Long` or `Short` |
| `title` | TEXT | Full video title |
| `drop_date` | DATE | Scheduled YouTube publish date |
| `status` | TEXT | Current pipeline stage (see §3) |
| `uploaded_date` | DATE | Date uploaded to YouTube (auto-stamped) |
| `youtube_id` | TEXT | YouTube video ID (once published) |
| `jdex_code` | TEXT | JDex knowledge reference code |
| `os_level` | TEXT | Systemized OS level (`Level 1: FMR`, etc.) |
| `notes` | TEXT | Free-form production notes |

### Supporting Tables
- **`video_stats`** — Performance snapshots (views, CTR, retention, etc.) over time
- **`video_keywords`** — vidIQ keyword data per video
- **`video_tasks`** — Production task checklist per video

---

## 3. Pipeline Status Progression

Every video moves strictly through these statuses in order:

```
Idea → Script Ready → Ready for Audio Riff → Ready to Film → Filming → Editing → In Production → Uploaded
```

| Status | Meaning |
| :--- | :--- |
| `Idea` | Concept identified, not yet scripted |
| `Script Ready` | Pre-recording outline or teleprompter script complete |
| `Ready for Audio Riff` | Blueprint ready; waiting for Dr. Anderson's audio brainstorm |
| `Ready to Film` | Full script finalized in Workflowy under `Shots` |
| `Filming` | On-set recording in progress |
| `Editing` | Footage captured; editing in LumaFusion / Descript |
| `In Production` | Editing complete; final review before upload |
| `Uploaded` | Live on YouTube (auto-stamps `uploaded_date`) |

---

## 4. CLI Command Reference

All pipeline operations use `scripts/video_pipeline.py` from the project root:

```bash
# View full pipeline
python3 scripts/video_pipeline.py --list

# Filter by status
python3 scripts/video_pipeline.py --list --filter Editing

# Next week's drops + upload gap warnings
python3 scripts/video_pipeline.py --week

# Update a video's status (auto-stamps uploaded_date when Uploaded)
python3 scripts/video_pipeline.py --status 80.V0A-S1 Uploaded

# Add or upsert a new video
python3 scripts/video_pipeline.py --add '{"video_number":"017","code":"80.V1B2","format_type":"Long","title":"New Video Title","drop_date":"2026-09-07"}'

# Generate docs/Video_Pipeline_Status.md from live Supabase data
python3 scripts/video_pipeline.py --doc

# Write docs/video_pipeline_cache.json (for offline / agent reads)
python3 scripts/video_pipeline.py --cache
```

---

## 5. Adding a New Video

1. Run `--add` with the required fields: `video_number`, `code`, `format_type`, `title`
2. Optionally include: `drop_date`, `status`, `jdex_code`, `os_level`, `notes`
3. Create the local folder: `Videos/[###] - [Title] ([Code])/`
4. Verify with `python3 scripts/video_pipeline.py --list`

---

## 6. Updating Status

When a video advances through production, update Supabase immediately:

```bash
python3 scripts/video_pipeline.py --status <code> <new_status>
```

Examples:
```bash
python3 scripts/video_pipeline.py --status 80.V0A-S1 Editing
python3 scripts/video_pipeline.py --status 80.V0A-S1 Uploaded
```

When set to `Uploaded`, `uploaded_date` is automatically stamped with today's date.

---

## 7. Agent Protocol

- The AI agent reads the `videos` table directly via Supabase REST API — no local cache required.
- To update a video's status, the agent will provide the exact `--status` command for Dr. Anderson to run from his terminal.
- The agent can query live drop schedules, status summaries, and upload gaps on demand.
- Session startup includes running `python3 scripts/video_pipeline.py --cache` to write a fresh local snapshot.

---

## 8. Session Startup Checklist

At the start of every session, run:

```bash
python3 scripts/tidycal_sync.py          # Pull new TidyCal bookings
python3 scripts/sync_agreements.py       # Pull Google Form agreements
python3 scripts/client_db_manager.py --doc  # Refresh Client_Onboarding_Status.md
python3 scripts/video_pipeline.py --cache   # Refresh video_pipeline_cache.json
```
