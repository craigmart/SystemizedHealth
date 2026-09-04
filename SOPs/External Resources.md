# 80.05 — External Resources & Systems Catalog

This document tracks all external software platforms, web applications, databases, and third-party documents connected to the Systemized Health ecosystem.

---

## 1. Master Resource Registry

| ID | Resource Name | Platform | Primary Purpose | Integration / Automation Status |
| :--- | :--- | :--- | :--- | :--- |
| **EXT-01** | **Video Pipeline Database** | Supabase (PostgreSQL) | Central video production database tracking all video metadata, drop dates, status, stats, keywords, and tasks. | **Live Supabase REST API** via `scripts/video_pipeline.py` |
| **EXT-02** | **NotebookLM Clinical Research Workspace** | NotebookLM | Academic research assistant, medical literature query engine, and research citation lookup. (Transcripts stored locally in IDE, NOT NotebookLM). | Research Query Engine |
| **EXT-03** | **Workflowy Proposition Surface** | Workflowy | Zettelkasten clinical proposition cards for future organic video branching. | Manual tag mapping (`JDex` codes) |
| **EXT-04** | **Discovery Call Transcripts** | Fathom.ai | Recording and AI transcription of 20-minute patient discovery calls for pattern recognition. | Automated recording & transcript extraction |
| **EXT-05** | **Discovery Call Scheduling** | TidyCal | Patient intake and scheduling for free 20-minute discovery calls. | Live Web Endpoint |
| **EXT-06** | **Video Editing Workspace** | LumaFusion | Final NLE video editing with left-aligned minimal supporting slides overlay. | Local storage & DAS export |
| **EXT-07** | **vidIQ Channel Analytics & Search Intelligence** | vidIQ (API / MCP) | Live read-only access to channel performance metrics, keyword search volumes, view velocity, retention analytics, and topic scores. | **Live Read-Only API/MCP** via `scripts/vidiq_sync.py` (`vidiq_api_key`) |
| **EXT-08** | **Video Pipeline CLI** | Python / Supabase REST | On-demand CLI for querying, updating, and reporting on the video pipeline directly against Supabase. | `scripts/video_pipeline.py` |
| **EXT-09** | **Coaching Agreement & E-Signatures** | BreezeDoc | Legal coaching disclosures, client waivers, and coaching agreement e-signatures. | Web Service & Document Templates |
| **EXT-10** | **Client CRM Database & Sync Engine** | SQLite / Python | Central client contacts, intake answers, call records, and TidyCal sync engine. | `database/clients.db`, `scripts/client_db_manager.py` & `scripts/tidycal_sync.py` |

---

## 2. Resource Specifications & Integration Protocols

### EXT-01: Video Pipeline Database
- **Platform**: Supabase (PostgreSQL — hosted)
- **Project URL**: `https://qkeloxawnpvyfasujonv.supabase.co`
- **Primary Table**: `videos` — one row per video, tracks `video_number`, `code`, `format_type`, `title`, `drop_date`, `status`, `uploaded_date`, `youtube_id`, `jdex_code`, `os_level`, `notes`
- **Supporting Tables**: `video_stats` (performance snapshots), `video_keywords` (vidIQ data), `video_tasks` (production tasks)
- **Management CLI**: [`scripts/video_pipeline.py`](file:///Users/craiganderson/Developer/SystemizedHealth/scripts/video_pipeline.py)
- **Schema Migration**: [`supabase/migrations/002_video_pipeline.sql`](file:///Users/craiganderson/Developer/SystemizedHealth/supabase/migrations/002_video_pipeline.sql)
- **Archived Flat Files**: `backups/pipeline_archive/Master_Video_Pipeline.md` & `.csv` (historical reference only — do not edit)
- **Agent Read Access**: Direct Supabase REST API (no local cache required — RLS disabled on `videos` table)
- **Maintenance Protocol**: All status updates, new video additions, and metadata changes go through `scripts/video_pipeline.py`. Never edit flat files.

---

### EXT-02: NotebookLM Clinical Research Workspace
- **Platform**: Google NotebookLM (Gemini Notebook)
- **Primary Purpose**: Academic research assistant, medical literature query engine, anatomical mechanism verification, and research citation lookup.
- **Workflow Protocol**: NotebookLM is queried strictly for academic research and citation verification during script outlining and slide design. All raw transcripts (`-A`, `-C`) and script outlines (`-B`) are stored locally in the IDE project under `Videos/`, NOT in NotebookLM.

---

### EXT-03: Workflowy Field Notes & Production Outlines
- **Platform**: Workflowy
- **Local Integration Script**: [`scripts/workflowy_sync.py`](file:///Users/craiganderson/SystemizedHealth/scripts/workflowy_sync.py) & [`scripts/push_teleprompter_scripts.py`](file:///Users/craiganderson/SystemizedHealth/scripts/push_teleprompter_scripts.py)
- **Config Key**: `workflowy_api_key` in [`scripts/config.json`](file:///Users/craiganderson/SystemizedHealth/scripts/config.json)
- **Primary Purpose**: Mobile field notes for on-set filming, scene tracking, and Zettelkasten clinical proposition surfacing.
- **5-Stage Pipeline Tag Standard**: Every video node in Workflowy moves through five standardized stage tags:
  - `#write`: Scripting & full writing process (audio transcription to teleprompter script).
  - `#film`: Script is finished & ready to film (staged in Workflowy under `Shots`).
  - `#edit`: Recording is finished, ready to edit in LumaFusion and Descript.
  - `#upload` (or `#approve`): Finished editing, ready to upload & review metadata, thumbnail upload, etc. (Checkpoint for metadata checklist).
  - `#publish`: Ready to publish.
- **Workflow Protocol**:
  1. **Push Outline**: AI Technical Editor drafts the script/scene outline in the IDE and pushes it to Workflowy under `Systemized Health > Production Pipeline > [80.V Code] > Shots`.
  2. **Field Filming & Tagging**: Dr. Anderson opens Workflowy on mobile/iPad while on set. As scenes or B-roll shots are captured on camera, bullets are tagged inline (e.g., `#film`, `#insidetruck`, `#outside`, `#broll-captured`).
  3. **Pull Production Status**: AI Technical Editor pulls field tags back into the IDE to verify filming completion and update master pipeline status.
  4. **Zettelkasten Proposition Surfacing**: Clinical propositions extracted from video transcripts are created or updated under the `ZETTELKASTEN` node using the format:
     `[JDex Code] // [Proposition Statement] #Main ([Video Codes])`
     Example: `72.45 // Gamma motor neurons regulate muscle spindle sensitivity (80.V1B1, 80.V1B2)`
     Execution command: `python scripts/workflowy_sync.py --add-prop --jdex "72.45" --text "[Statement]" --video "[80.V Code]"`. Automatically appends new video codes to existing propositions.


---

### EXT-04 & EXT-05: Patient Discovery Call Ecosystem
- **Platforms**: TidyCal (Scheduling) & Fathom.ai (Transcripts)
- **Purpose**: Captures real-world physical pain points, patient anecdotes, and clinical friction without hard selling.
- **Workflow Step**: Call transcripts are reviewed during Phase I ("The Raw Input") of video production to ground narrative hooks in real human experiences.

---

### EXT-07: vidIQ Channel Analytics & Search Intelligence
- **Platform**: vidIQ REST API / MCP (Model Context Protocol)
- **Local Integration Script**: [`scripts/vidiq_sync.py`](file:///Users/craiganderson/SystemizedHealth/scripts/vidiq_sync.py)
- **Config Key**: `vidiq_api_key` (Bearer Token from vidIQ Account Settings > MCP) in [`scripts/config.json`](file:///Users/craiganderson/SystemizedHealth/scripts/config.json)
- **Primary Purpose**: Live, read-only channel performance data, keyword search volumes, view velocity, retention metrics, and competitive topic scores. Zero YouTube API quota drain.
- **Workflow Step**: Queried live by the AI Technical Editor during Phase I ("The Raw Input") & Phase II ("The Editorial Filters") to analyze performance, evaluate keyword demand, and select high-converting Zettelkasten video topics.

---

### EXT-08: Video Pipeline CLI
- **Platform**: Python CLI → Supabase REST API
- **Script**: [`scripts/video_pipeline.py`](file:///Users/craiganderson/Developer/SystemizedHealth/scripts/video_pipeline.py)
- **Source of Truth**: Supabase `videos` table (see EXT-01)
- **On-Demand Execution Protocol**:
  | Command | Purpose |
  | :--- | :--- |
  | `python3 scripts/video_pipeline.py --list` | List all videos with current status |
  | `python3 scripts/video_pipeline.py --list --filter Editing` | Filter by status |
  | `python3 scripts/video_pipeline.py --week` | Show next week's drop schedule + upload gaps |
  | `python3 scripts/video_pipeline.py --status <code> <status>` | Update video status in Supabase |
  | `python3 scripts/video_pipeline.py --add '<json>'` | Add or upsert a new video |
  | `python3 scripts/video_pipeline.py --doc` | Generate `docs/Video_Pipeline_Status.md` report |
  | `python3 scripts/video_pipeline.py --cache` | Write `docs/video_pipeline_cache.json` for offline reads |
- **Valid Statuses**: `Idea` → `Script Ready` → `Ready for Audio Riff` → `Ready to Film` → `Filming` → `Editing` → `In Production` → `Uploaded`
- **Note**: The old SQLite `database/videos.db`, `scripts/db_manager.py`, and `scripts/workflowy_report.py` are deprecated and replaced by this Supabase-backed system.
