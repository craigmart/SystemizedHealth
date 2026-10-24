# 80.07 — Content Rotation System SOP

This document outlines the topic rotation framework for Systemized Health content pillars, including video format standards, the mathematical rotation model across levels, and quality-first production guidelines.

---

## 1. Overview & Core Philosophy

The Systemized Health content calendar operates on a continuous, programmatic loop designed to eliminate creative friction and decision fatigue, with a primary focus on **quality over quantity**:
- **Target Rhythm**: 1–3 high-quality, deeply produced videos per month.
- **Zero Due Date Pressure**: Production is freed from calendar deadlines. Videos in the pipeline have no pre-assigned due dates; Dr. Anderson inputs an anticipated drop date into the date slot only when ready.
- **Simultaneous Production**: Multiple videos can be in production at the same time across `#write`, `#film`, and `#edit` in Work in Progress.
- **Topic Pipeline**: The App maintains a ~3-month rotation cycle (~9–12 Long videos) taking Dr. Anderson through the three levels three times each (covering all 9 core framework pillars plus monthly labs).
- **Standalone Long Focus**: The scheduled pipeline consists of comprehensive Long videos. Shorts are ideated and added on the fly as desired via the "Add Video to Pipeline" feature.

---

## 2. Video Format Guidelines

To maintain clinical depth and exceptional production quality:

| Format | Target Length | Production Model | Role & Purpose |
| :--- | :--- | :--- | :--- |
| **Long Videos** | 15 – 25 minutes | **1–3 drops / month** (Pipeline sequence) | Comprehensive clinical breakdown, mechanism/glitch explanation, clinical analogy, and actionable protocol. |
| **Shorts** | 40 – 60 seconds | **On-the-Fly / Added as Desired** | Standalone hook, friction point, or micro-protocol recorded directly to camera when inspired. |

---

## 3. The Mathematical Rotation Model

The content calendar operates on a continuous loop with a monthly programmatic interruption:

### 1. Level Sprints
Each Level runs for a **2-week sprint**. The macro rotation sequence is:
```
Level 3 (Outward: POP) ➔ Level 1 (Foundational: FMR) ➔ Level 2 (Inward: TLC) ➔ (Repeat)
```

### 2. First Monday Lab Drop (Level 4: Lab)
- On the **first Monday of every calendar month**, the regular level rotation pauses.
- This entire week is dedicated to a **Level 4 (Lab)** video and its 3 waterfall shorts.
- Topic focus is at Dr. Anderson's clinical discretion (e.g. deep dive blood biomarker panels, DEXA analysis, continuous glucose monitoring, hormone panels).
- When the Lab week concludes, the regular sprint sequence resumes exactly where it left off.
- **Lab Week Deferral / Override Protocol**: If an active Framework Level sprint (e.g. Level 3B Organize) carries over or requires scheduling priority to maintain narrative momentum, Dr. Anderson may defer or skip the Level 4 Lab drop for that calendar month. When a Lab drop is skipped or deferred, the pipeline smoothly advances the active Level sprint without interrupting cadence.

### 3. Independent Pillar Queues
Each regular Level tracks its own 3-pillar sequence (A, B, C) completely independently of the others:
- **Level 1 (Foundational — FMR)**:
  - `A`: Fuel, Food & Energy
  - `B`: Move & Activity
  - `C`: Rest & Recover
- **Level 2 (Inward — TLC)**:
  - `A`: Think & Process
  - `B`: Learn & Challenge
  - `C`: Connect with Creator and Creation
- **Level 3 (Outward — POC)**:
  - `A`: Play
  - `B`: Organize & Goal Setting
  - `C`: Connect

### 4. The Endless Shift
- Because a Level sprint is **2 weeks long**, only **2 of the 3 pillars** are consumed per cycle.
- When a Level comes back into rotation (approx. 4 weeks later), it picks up **exactly where it left off**.
- *Example Level 3 cycle*:
  - Sprint 1: Pillar A (Play) + Pillar B (Organize)
  - Sprint 2: Pillar C (Purpose) + Pillar A (Play)
  - Sprint 3: Pillar B (Organize) + Pillar C (Purpose)
- This mathematical shift ensures all 9 core pillars receive equal, balanced coverage across the entire year without gaps or favoritism.

---

## 4. Weekly Waterfall Schedule

For any active pillar (or Lab) during a given week, content drops according to this standard rhythm:

```
┌──────────────┬──────────────┬──────────────┬──────────────┐
│    MONDAY    │   TUESDAY    │   THURSDAY   │   SATURDAY   │
├──────────────┼──────────────┼──────────────┼──────────────┤
│  Long Video  │   Short 1    │   Short 2    │   Short 3    │
│ (15–20 min)  │  (40–60 sec) │  (40–60 sec) │  (40–60 sec) │
│ Pillar Core  │ Sub-Angle A  │ Sub-Angle B  │ Sub-Angle C  │
└──────────────┴──────────────┴──────────────┴──────────────┘
```

> [!IMPORTANT]
> **Waterfall Ideation vs. Standalone Production**:
> "Waterfall" refers strictly to **ideation** (branching related sub-topic angles from the core pillar in Gemini Notebook). Each short is recorded and edited as an independent, direct-to-camera production; shorts are **not** clipped excerpts cut from the long video during editing.

---

## 5. End-to-End Production Workflow

The content rotation schedule links directly with Dr. Anderson's analog-to-camera production standard and the 22-beat checklist ([`SOPs/checklist261016.md`](file:///Users/craiganderson/Developer/SystemizedHealth/SOPs/checklist261016.md) & [`SOPs/checklistdefinitions261016.md`](file:///Users/craiganderson/Developer/SystemizedHealth/SOPs/checklistdefinitions261016.md)):

```
┌────────────────────────────────────────────────────────┐
│ 1. PIPELINE INSPECTION & PACKAGING (#idea)             │
│    Review next video in 3-month rotation runway.       │
│    Validate revealed preference viewer demand.         │
│    Lock working title (vidIQ 90+) & draft thumbnail.   │
│    Select Connected Video upfront for seamless CTA.    │
├────────────────────────────────────────────────────────┤
│ 2. RESEARCH, STORYBOARD & OUTLINE (#write)             │
│    Research clinical studies in Gemini Notebook.       │
│    Brainstorm raw ideas in Gemini Chat to capture flow.│
│    Create visual storyboard in Gemini Notebook.        │
│    Define non-negotiable Acceptance Criteria.          │
│    Draft outline in App text box (synced to Supabase): │
│    • Long (5 Beats): 4 Ps Hook, Body, Connected CTA    │
│    • Short (3 Beats): Hook, Teach, Action              │
│    Distill anchor triggers onto physical 3x5 card.     │
├────────────────────────────────────────────────────────┤
│ 3. DIRECT-TO-CAMERA FILMING (#film)                    │
│    Record video using 3x5 card as an anchor.           │
│    Set video status to #edit in App.                   │
├────────────────────────────────────────────────────────┤
│ 4. TRANSCRIPT INGESTION & EDITING (#edit)              │
│    Complete rough cuts; run Gemini verbosity check.    │
│    Paste final spoken transcript into raw_transcript.  │
│    Agent automatically triggers:                       │
│    • vidIQ title scoring (90+ viral rating)            │
│    • Obsidian Vault script archiving                   │
│    • Zettelkasten proposition mining & JDex mapping    │
│    Pace B-roll & enhance audio to broadcast levels.    │
├────────────────────────────────────────────────────────┤
│ 5. UPLOAD & POST-PUBLISH AUDITS (#uploaded/#published) │
│    Upload to Studio; set End Screen & Pinned Comment.  │
│    File physical 3x5 proposition cards in analog box.  │
│    Save finalized package back to Gemini Notebook.     │
│    Conduct 48-hr satisfaction audit (retention, ratio).│
│    Mark cards complete to exit Work in Progress.       │
└────────────────────────────────────────────────────────┘
```

---

## 6. Zero-Placeholder Policy

1. **No Temporary Placeholders**: The pipeline never contains `TBD-*`, generic `Placeholder` titles, or `OPEN SLOT` fallback items.
2. **Deterministic Metadata**: Every scheduled slot has an authoritative Johnny Decimal code (e.g., `80.V3A1`, `80.V3A1-S1`), scheduled drop date, format type, and Level & Pillar metadata in Supabase.
3. **Pre-Transcript State**: If a video is in pre-production (`#idea`, `#write`, `#film`) before a spoken transcript has been recorded and pasted, the App and reports display its **Level and Pillar** (e.g. `Level 3 (Outward) — Play`).
4. **Post-Transcript State**: Once Dr. Anderson pastes the exact spoken transcript into `raw_transcript`, the title updates to the optimized vidIQ clinical title.

---

## 7. Authoritative Files & References

- **Rotational Table CSV**: [`docs/content_rotation.csv`](file:///Users/craiganderson/Developer/SystemizedHealth/docs/content_rotation.csv)
- **Frontend Cached Catalog**: [`pipeline/public/content_rotation.json`](file:///Users/craiganderson/Developer/SystemizedHealth/pipeline/public/content_rotation.json)
- **Drop Schedule**: [`Drop_Schedule.md`](file:///Users/craiganderson/Developer/SystemizedHealth/Drop_Schedule.md)
- **Sync Script**: [`scripts/seed_content_rotation.py`](file:///Users/craiganderson/Developer/SystemizedHealth/scripts/seed_content_rotation.py)

### Schedule Shift & Dual-Sync Requirement
Whenever scheduled slots are shifted, deleted, or reordered:
1. Update [`docs/content_rotation.csv`](file:///Users/craiganderson/Developer/SystemizedHealth/docs/content_rotation.csv).
2. Sync the frontend static fallback catalog in [`pipeline/public/content_rotation.json`](file:///Users/craiganderson/Developer/SystemizedHealth/pipeline/public/content_rotation.json) so fallback cards match.
3. Refresh the pipeline cache and status documents:
   ```bash
   python3 scripts/video_pipeline.py --cache --doc
   ```

