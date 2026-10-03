
# Systemized Health — Master TODO & Task List

*Last Updated: 2026-09-27*

---

## 1. Immediate Priorities

- [x] **12-Month Endless Content Rotation & Pipeline Upgrade**:
  - Seeded 214 deterministic rotation videos through Sep 2027 (zero placeholders).
  - App pipeline view upgraded with 3-week runway, Level/Pillar tags, and 5-beat long / 3-beat short editable Outline box.
  - Video Production Log maintained for scratchpad ideas and Agent reference.
- [ ] **Reconcile uploaded videos & metadata** with drop calendar (confirm titles/tags match schedule)
- [ ] **Next upcoming production**: `80.V3A1-S1` (*Play is how you learn new things*) scheduled for 2026-09-25 (`#idea`)

---

## 2. Video Pipeline Production Queue

### 🟢 Recently Published (`#published`)
- [x] `80.V1B2`: *Can You Run With a Herniated Disc? (A Doctor's Experiment)* — Dropped: 2026-09-07
- [x] `80.V1B2-S1`: *How Do the Discs in Your Spine Stay Healthy? (It's NOT Bloodflow)* — Dropped: 2026-09-08
- [x] `80.V2B1-S1`: *The Need for Discomfort to Be Comfortable* — Dropped: 2026-09-10
- [x] `80.V1B2-S2`: *Running and Longterm Health of Your Disc* — Dropped: 2026-09-12
- [x] `80.V2C1`: *Staying Human in the Age of Artificial Intelligence* — Dropped: 2026-09-14
- [x] `80.V2C1-S1`: *The One Mindset to Save Your Brain When Using AI* — Dropped: 2026-09-15
- [x] `80.V2A1-S2A`: *This is Your Default Setting* — Dropped: 2026-09-17
- [x] `80.V2A1-S3A`: *Task Positive Network and Scrolling* — Dropped: 2026-09-19
- [x] `80.V3A1`: *The 5 Stages of Brain Aging (And How to Stay Sharp Into Your 90s)* — Dropped: 2026-09-24
- [x] `80.V2A-S4`: *Buffers make you more productive* — Dropped: 2026-09-27
- [x] `80.V3A1-S3`: *Who’s brains are better connected, men or women?* — Dropped: 2026-09-29
- [x] `80.V1A0-S1`: *Diet drugs and Ambition* — Dropped: 2026-09-30
- [x] `80.V3B1`: *My Simple Bullet Journal Setup After 7 1/2 Years of use (No Art Needed)* — Dropped: 2026-10-03

### 🗃️ Zettelkasten Physical 3x5 Index Cards
- **37 Completed / 3 Pending Physical 3x5 Cards** (Tracked in [`docs/Published_Video_Propositions.md`](file:///Users/craiganderson/Developer/SystemizedHealth/docs/Published_Video_Propositions.md)):
  - [ ] `80.V3B1`: *My Simple Bullet Journal Setup After 7 1/2 Years of use (No Art Needed)* (Propositions mined, awaiting 3x5 physical card filing)
  - [ ] `80.V3A1-S3`: *Who’s brains are better connected, men or women?* (Propositions mined, awaiting 3x5 physical card filing)
  - [ ] `80.V1A0-S1`: *Diet drugs and Ambition* (Awaiting spoken transcript ingestion to mine propositions)

### ✍️ Next Production Queue: 12-Month Rotation Schedule (`#idea`)
*(Active pipeline view: next 3 weeks runway from [`docs/content_rotation.csv`](file:///Users/craiganderson/Developer/SystemizedHealth/docs/content_rotation.csv) & [`SOPs/Content Rotation System SOP.md`](file:///Users/craiganderson/Developer/SystemizedHealth/SOPs/Content%20Rotation%20System%20SOP.md))*

- **Week of Oct 05 (Level 3: Organize)**:
  - [x] `80.V3B1`: *My Simple Bullet Journal Setup After 7 1/2 Years of use (No Art Needed)* — Dropped: 2026-10-03 (`#published`)
  - [ ] `80.V3B1-S1`: *Get it out of your head - journal!* — Scheduled: 2026-10-06 (`#edit`)
  - [ ] `80.V3B1-S2`: *The Power of a Waiting For list* — Scheduled: 2026-10-08 (`#edit`)
  - [ ] `80.V3B1-S3`: *Your mind if for creativity not to do lists* — Scheduled: 2026-10-10 (`#edit`)

- **Week of Oct 12 (Level 1: Fuel & Energy)**:
  - [ ] `80.V1A1`: *Level 1 (Foundational) — Fuel (Long)* — Scheduled: 2026-10-12 (`#idea`)
  - [ ] `80.V1A1-S1`: *Level 1 (Foundational) — Fuel (Short 1)* — Scheduled: 2026-10-13 (`#idea`)
  - [ ] `80.V1A1-S2`: *Level 1 (Foundational) — Fuel (Short 2)* — Scheduled: 2026-10-15 (`#idea`)
  - [ ] `80.V1A1-S3`: *Level 1 (Foundational) — Fuel (Short 3)* — Scheduled: 2026-10-17 (`#idea`)

- **Week of Oct 19 (Level 1: Move & Activity)**:
  - [ ] `80.V1B1`: *Level 1 (Foundational) — Move (Long)* — Scheduled: 2026-10-19 (`#idea`)
  - [ ] `80.V1B1-S1`: *Level 1 (Foundational) — Move (Short 1)* — Scheduled: 2026-10-20 (`#idea`)
  - [ ] `80.V1B1-S2`: *Level 1 (Foundational) — Move (Short 2)* — Scheduled: 2026-10-22 (`#idea`)
  - [ ] `80.V1B1-S3`: *Level 1 (Foundational) — Move (Short 3)* — Scheduled: 2026-10-24 (`#idea`)

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