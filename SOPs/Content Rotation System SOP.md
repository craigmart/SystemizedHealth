# 80.07 — Content Rotation System SOP

This document outlines the endless 12-month rotation schedule for Systemized Health content pillars, including monthly Lab deep-dives, video format guidelines, the mathematical rotation model, and production workflow standards.

---

## 1. Overview & Core Philosophy

The Systemized Health content calendar operates on a continuous, programmatic loop designed to eliminate creative friction and decision fatigue. Production topics are not decided arbitrarily week-to-week; instead, they follow an automated rotation through the **Systemized OS** framework levels and pillars.

Dr. Anderson works directly from the web App. The App surfaces the **next 3 weeks ahead in the pipeline** with zero placeholders. Each upcoming video card displays its specific **Level** and **Pillar** (e.g. `Level 3 (Outward) — Play`), serving as the direct prompt to outline on 3x5 cards and conduct research in Gemini Notebook.

---

## 2. Video Format Guidelines

To maintain consistency across drops and respect the biological learning curve of the audience:

| Format | Target Length | Drop Rhythm | Role & Purpose |
| :--- | :--- | :--- | :--- |
| **Long Videos** | 15 – 20 minutes | **Every Monday** | Comprehensive clinical breakdown, mechanism/glitch explanation, clinical analogy, and actionable protocol. |
| **Shorts** | 40 – 60 seconds | **Tue, Thu, Sat** | 3 waterfall shorts derived from the Monday pillar topic. Each short tackles a standalone single hook, friction point, or micro-protocol. |

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
- **Level 3 (Outward — POP)**:
  - `A`: Play
  - `B`: Organize & Goal Setting
  - `C`: Purpose & Planning

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

The content rotation schedule links directly with Dr. Anderson's analog-to-camera production standard:

```
┌────────────────────────────────────────────────────────┐
│ 1. PIPELINE INSPECTION (Web App)                       │
│    Review next video due in 3-week runway.             │
│    Note Level (e.g. Level 3) & Pillar (e.g. Play).     │
├────────────────────────────────────────────────────────┤
│ 2. RESEARCH & OUTLINE (Analog 3x5 Card)                │
│    Research clinical studies in Gemini Notebook.       │
│    Draft 4 beats on 3x5 index card:                    │
│    Beat 1: Hook | Beat 2: Glitch                       │
│    Beat 3: Analogy | Beat 4: Protocol & CTA            │
├────────────────────────────────────────────────────────┤
│ 3. DIRECT-TO-CAMERA FILMING                            │
│    Record video using 3x5 card as an anchor.           │
│    Set video status to #edit in App.                   │
├────────────────────────────────────────────────────────┤
│ 4. TRANSCRIPT INGESTION (Force Multiplier Suite)       │
│    Paste final spoken transcript into raw_transcript.  │
│    Agent automatically triggers:                       │
│    • vidIQ title scoring (90+ viral rating)            │
│    • Obsidian Vault script archiving                   │
│    • Zettelkasten proposition mining & JDex mapping    │
│    • Status progression to #uploaded / #published      │
├────────────────────────────────────────────────────────┤
│ 5. ZETTELKASTEN 3x5 CARD FILING                        │
│    Review extracted propositions in App / Obsidian.    │
│    File physical 3x5 proposition cards in analog box.  │
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
