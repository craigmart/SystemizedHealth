# 80.05 — External Resources & Systems Catalog

This document tracks all external software platforms, web applications, databases, and third-party documents connected to the Systemized Health ecosystem.

---

## 1. Master Resource Registry

| ID | Resource Name | Platform | Primary Purpose | Integration / Automation Status |
| :--- | :--- | :--- | :--- | :--- |
| **EXT-01** | **Master Video Production Pipeline** | Local Repository (`Master_Video_Pipeline.md`) | Central master queue tracking video production order (`001`-`099`), JDex codes (`80.V...`), drop dates, and status. | **Local Git Managed Registry** (`Master_Video_Pipeline.md` / `Master_Video_Pipeline.csv`) |
| **EXT-02** | **NotebookLM Clinical Research Workspace** | NotebookLM | Academic research assistant, medical literature query engine, and research citation lookup. (Transcripts stored locally in IDE, NOT NotebookLM). | Research Query Engine |
| **EXT-03** | **Workflowy Proposition Surface** | Workflowy | Zettelkasten clinical proposition cards for future organic video branching. | Manual tag mapping (`JDex` codes) |
| **EXT-04** | **Discovery Call Transcripts** | Fathom.ai | Recording and AI transcription of 20-minute patient discovery calls for pattern recognition. | Automated recording & transcript extraction |
| **EXT-05** | **Discovery Call Scheduling** | TidyCal | Patient intake and scheduling for free 20-minute discovery calls. | Live Web Endpoint |
| **EXT-06** | **Video Editing Workspace** | LumaFusion | Final NLE video editing with left-aligned minimal supporting slides overlay. | Local storage & DAS export |
| **EXT-07** | **vidIQ Channel Analytics & Search Intelligence** | vidIQ (API / MCP) | Live read-only access to channel performance metrics, keyword search volumes, view velocity, retention analytics, and topic scores. | **Live Read-Only API/MCP** via `scripts/vidiq_sync.py` (`vidiq_api_key`) |
| **EXT-08** | **Video Pipeline Database & On-Demand Workflowy Reports** | SQLite / Python | Central SQLite video database, production task tracker, and Workflowy analytics reporter. | `database/videos.db` & `scripts/db_manager.py` |
| **EXT-09** | **Coaching Agreement & E-Signatures** | BreezeDoc | Legal coaching disclosures, client waivers, and coaching agreement e-signatures. | Web Service & Document Templates |

---

## 2. Resource Specifications & Integration Protocols

### EXT-01: Master Video Production Pipeline
- **Platform**: Local Git Repository
- **Master Files**: [`Master_Video_Pipeline.md`](file:///Users/craiganderson/Library/Mobile%20Documents/com~apple~CloudDocs/SystemizedHealth/Master_Video_Pipeline.md) & [`Master_Video_Pipeline.csv`](file:///Users/craiganderson/Library/Mobile%20Documents/com~apple~CloudDocs/SystemizedHealth/Master_Video_Pipeline.csv)
- **Primary Table Columns**:
  `Video Number` | `Code` | `Format` | `Title` | `Drop Date` | `Status` | `Uploaded Date` | `Notes`
- **Maintenance Protocol**:
  Edit `Master_Video_Pipeline.md` directly in the IDE or update `Master_Video_Pipeline.csv`. Commit changes to Git for version tracking. Google Sheets integration deprecated.

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
     Example: `72.45 // Gamma motor neurons regulate muscle spindle sensitivity (80.V1, 80.V34)`
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

### EXT-08: Video Pipeline Database & On-Demand Workflowy Reports
- **Database Path**: [`database/videos.db`](file:///Users/craiganderson/Library/Mobile%20Documents/com~apple%7ECloudDocs/SystemizedHealth/database/videos.db) (SQLite)
- **Management CLI**: [`scripts/db_manager.py`](file:///Users/craiganderson/Library/Mobile%20Documents/com~apple%7ECloudDocs/SystemizedHealth/scripts/db_manager.py)
- **Workflowy Reporter Script**: [`scripts/workflowy_report.py`](file:///Users/craiganderson/Library/Mobile%20Documents/com~apple%7ECloudDocs/SystemizedHealth/scripts/workflowy_report.py)
- **On-Demand Execution Protocol**:
  Whenever Dr. Anderson instructs the AI to update reports or check status:
  1. `python3 scripts/workflowy_report.py --push`: Generates and pushes the 4-timeframe performance metrics (48h, 7d, 28d, all-time), 7-day video drop calendar, and open task due dates directly to Workflowy under `📊 Daily Analytics & Task Reports`.
  2. `python3 scripts/db_manager.py --calendar`: Renders the full interactive publication and task due date calendar in the CLI.
  3. `python3 scripts/db_manager.py --list`: Lists all active videos and latest performance metrics.
