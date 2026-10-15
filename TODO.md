
# Systemized Health — Master TODO & Task List

*Last Updated: 2026-10-14*

---

## 1. Immediate Priorities

- [x] **Quality-Over-Quantity Pipeline Rework**:
  - Transitioned from high-volume schedule to quality focus: targeting 1–3 high-impact, well-produced videos per month.
  - Eliminated all artificial due date pressure: future videos have no mandatory drop dates (`drop_date = null` until Dr. Anderson explicitly anticipates a drop date).
  - Pruned pre-seeded future shorts and distant 2027 slots down to a clean ~3-month cycle (11 Long video topics going through the three levels three times each).
  - App updated with **"Last Video"** metric tile (tracking days since last published Long video) and flexible Pipeline view with inline date editing.
  - Retained full "+ Add Video to Pipeline" functionality to add shorts and ad-hoc productions on the fly.
- [ ] **Active Production in Work in Progress**:
  - `80.V1A2-A`: *The Science behind my intermittent fasting journal plan* (`#edit`)
  - `80.V2C2`: *Prayer and DMN* (`#write`)

---

## 2. Video Pipeline Production Queue

### 🟢 Recently Published (`#published`)
- [x] `80.V1A2`: *Energy Management for Life: The Simple Way to Intermittent Fast* — Dropped: 2026-10-12
- [x] `80.V1A2-S1`: *Intermittent Fasting Works Better When You Feast Sometimes* — Dropped: 2026-10-13
- [x] `80.V3B1`: *My Simple Bullet Journal Setup After 7 1/2 Years of use (No Art Needed)* — Dropped: 2026-10-03
- [x] `80.V1B3-A1`: *Run with Dr A #1* — Dropped: 2026-10-04
- [x] `80.V3A1`: *The 5 Stages of Brain Aging (And How to Stay Sharp Into Your 90s)* — Dropped: 2026-09-24

### 🗃️ Zettelkasten Physical 3x5 Index Cards
- **47 Completed / 0 Pending Physical 3x5 Cards** (Tracked in [`docs/Published_Video_Propositions.md`](file:///Users/craiganderson/Developer/SystemizedHealth/docs/Published_Video_Propositions.md)): All clinical propositions are filed!

### ✍️ Topic Rotation Queue (3-Month Long Cycle — No Due Date Pressure)
*(Active roadmap from [`docs/content_rotation.csv`](file:///Users/craiganderson/Developer/SystemizedHealth/docs/content_rotation.csv) & [`SOPs/Content Rotation System SOP.md`](file:///Users/craiganderson/Developer/SystemizedHealth/SOPs/Content%20Rotation%20System%20SOP.md))*

- **Cycle 1 (Level 2: Thinking & Learning | Level 4: Lab)**:
  - [ ] `80.V2A2`: *What Daily Journaling Actually Does to Your Brain* (Level 2 — Thinking) — `#idea`
  - [ ] `80.V2B2`: *Level 2 (Inward) — Learning* (Level 2 — Learning) — `#idea`
  - [ ] `80.V4-02`: *Level 4 (Lab) — User Discretion* (Level 4 — Lab) — `#idea`
- **Cycle 2 (Level 2: Connect with Creator | Level 3: Connect & Play)**:
  - [ ] `80.V2C2`: *Prayer and DMN* (Level 2 — Connect with Creator) — `#write` *(in WIP)*
  - [ ] `80.V3C1`: *Level 3 (Outward) — Connect* (Level 3 — Connect) — `#idea`
  - [ ] `80.V3A2`: *Level 3 (Outward) — Play* (Level 3 — Play) — `#idea`
- **Cycle 3 (Level 1: Rest, Fuel & Move | Level 3: Organize | Level 4: Lab)**:
  - [ ] `80.V1C2`: *Level 1 (Foundational) — Rest* (Level 1 — Rest) — `#idea`
  - [ ] `80.V4-03`: *Level 4 (Lab) — User Discretion* (Level 4 — Lab) — `#idea`
  - [ ] `80.V1A3`: *Level 1 (Foundational) — Fuel* (Level 1 — Fuel) — `#idea`
  - [ ] `80.V3B2`: *Level 3 (Outward) — Organize* (Level 3 — Organize) — `#idea`
  - [ ] `80.V1B4`: *Level 1 (Foundational) — Move* (Level 1 — Move) — `#idea`

---

## 3. Client Onboarding & CRM Operations

- [ ] **Session Startup Sync** (run at every session start):
  - [`python3 scripts/tidycal_sync.py`](file:///Users/craiganderson/Developer/SystemizedHealth/scripts/tidycal_sync.py)
  - [`python3 scripts/sync_agreements.py`](file:///Users/craiganderson/Developer/SystemizedHealth/scripts/sync_agreements.py)
  - [`python3 scripts/client_db_manager.py --doc`](file:///Users/craiganderson/Developer/SystemizedHealth/scripts/client_db_manager.py)
  - [`python3 scripts/sync_obsidian_tags.py`](file:///Users/craiganderson/Developer/SystemizedHealth/scripts/sync_obsidian_tags.py)
  - [`python3 scripts/update_propositions_tracker.py`](file:///Users/craiganderson/Developer/SystemizedHealth/scripts/update_propositions_tracker.py)
  - [`python3 scripts/generate_video_paths.py`](file:///Users/craiganderson/Developer/SystemizedHealth/scripts/generate_video_paths.py)
  - [`python3 scripts/video_pipeline.py --cache`](file:///Users/craiganderson/Developer/SystemizedHealth/scripts/video_pipeline.py)
- [ ] **Weekly Workflowy JDex Sync** (look for new/updated codes weekly):
  - [`python3 scripts/sync_workflowy_jdex.py`](file:///Users/craiganderson/Developer/SystemizedHealth/scripts/sync_workflowy_jdex.py) (Refreshes [`docs/JDex_Taxonomy_Reference.md`](file:///Users/craiganderson/Developer/SystemizedHealth/docs/JDex_Taxonomy_Reference.md) & Obsidian JDex notes)
- [ ] **Client Web App Deliverable**: Build and deploy individual client webapps for health tracking & coaching (prototyping with `HollyApp`; roll out to all coaching clients).

---

## 4. Marketing & Conversion Funnel Setup

- [ ] **Scheduling System Migration**: Configure new scheduling platform and update `https://call.systemizedhealth.com` destination.
- [ ] **Tracking Implementation**:
  - [ ] Embed Google Tag Manager on `call.systemizedhealth.com` & `/success`
  - [ ] Configure GA4 page view tag + `generate_lead` conversion event in GTM
  - [ ] Set up Meta Base Pixel + `Lead` event on `/success`
  - [ ] Verify all tracking with Meta Pixel Helper and Google Tag Assistant
- [ ] **CRM Conversion Tracking**: Track Discovery Call → paid 2-Hour Intensive conversions in Supabase.