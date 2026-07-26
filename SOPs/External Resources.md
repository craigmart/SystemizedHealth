# 80.05 — External Resources & Systems Catalog

This document tracks all external software platforms, web applications, databases, and third-party documents connected to the Systemized Health ecosystem.

---

## 1. Master Resource Registry

| ID | Resource Name | Platform | Primary Purpose | Integration / Automation Status |
| :--- | :--- | :--- | :--- | :--- |
| **EXT-01** | **Master Video Production Pipeline** | Google Sheets | Central queue tracking video production, JDex codes (`80.V...`), drop dates, asset URLs, and `Task Open` status. | **Live Web App API Sync** via `scripts/update_sheet.py` & `scripts/config.json` |
| **EXT-02** | **NotebookLM Clinical Workspace** | NotebookLM | Holds A-roll transcripts, research citations, and aids supporting slide generation. | Semi-automated (A-roll transcripts uploaded post-recording) |
| **EXT-03** | **Workflowy Proposition Surface** | Workflowy | Zettelkasten clinical proposition cards for future organic video branching. | Manual tag mapping (`JDex` codes) |
| **EXT-04** | **Discovery Call Transcripts** | Fathom.ai | Recording and AI transcription of 20-minute patient discovery calls for pattern recognition. | Automated recording & transcript extraction |
| **EXT-05** | **Discovery Call Scheduling** | TidyCal | Patient intake and scheduling for free 20-minute discovery calls. | Live Web Endpoint |
| **EXT-06** | **Video Editing Workspace** | LumaFusion | Final NLE video editing with left-aligned minimal supporting slides overlay. | Local storage & DAS export |

---

## 2. Resource Specifications & Integration Protocols

### EXT-01: Master Video Production Pipeline
- **Platform**: Google Sheets
- **Local Endpoint Config**: [`scripts/config.json`](file:///Users/craiganderson/SystemizedHealth/scripts/config.json)
- **Local Execution Script**: [`scripts/update_sheet.py`](file:///Users/craiganderson/SystemizedHealth/scripts/update_sheet.py)
- **Primary Table Columns**:
  `Code` | `Video Number` | `Days Upload to Publish` | `Drop Date` | `Format` | `Title` | `Uploaded` | `Asset URL` | `Platform` | `Notes` | `Task Open`
- **IDE Execution Command**:
  ```bash
  # Update by Video Code (e.g., 80.V0A1)
  python scripts/update_sheet.py --code "80.V0A1" --task_open "NO" --asset_url "https://..."

  # Update by Video Title
  python scripts/update_sheet.py --title "Video Title" --uploaded "2026-07-26" --task_open "NO"
  ```

---

### EXT-02: NotebookLM Clinical Workspace
- **Platform**: Google NotebookLM
- **Purpose**: Acts as an interactive clinical research assistant and slide generator.
- **Workflow Step**: Raw A-roll transcripts are uploaded to NotebookLM to generate left-aligned minimal supporting slides (solid black background, white text/diagrams, research citations).

---

### EXT-03: Workflowy Field Notes & Production Outlines
- **Platform**: Workflowy
- **Local Integration Script**: [`scripts/workflowy_sync.py`](file:///Users/craiganderson/SystemizedHealth/scripts/workflowy_sync.py)
- **Config Key**: `workflowy_api_key` in [`scripts/config.json`](file:///Users/craiganderson/SystemizedHealth/scripts/config.json)
- **Primary Purpose**: Mobile field notes for on-set filming, scene tracking, and Zettelkasten clinical proposition surfacing.
- **Workflow Protocol**:
  1. **Push Outline**: AI Technical Editor drafts the script/scene outline in the IDE and pushes it to Workflowy under `Systemized Health > Production Pipeline > [80.V Code]`.
  2. **Field Filming & Tagging**: Dr. Anderson opens Workflowy on mobile/iPad while on set. As scenes or B-roll shots are captured on camera, bullets are tagged inline (e.g., `#shot`, `#filmed`, `#retake`, `#broll-captured`).
  3. **Pull Production Status**: AI Technical Editor pulls field tags back into the IDE to verify filming completion and update master pipeline status.

---

### EXT-04 & EXT-05: Patient Discovery Call Ecosystem
- **Platforms**: TidyCal (Scheduling) & Fathom.ai (Transcripts)
- **Purpose**: Captures real-world physical pain points, patient anecdotes, and clinical friction without hard selling.
- **Workflow Step**: Call transcripts are reviewed during Phase I ("The Raw Input") of video production to ground narrative hooks in real human experiences.
