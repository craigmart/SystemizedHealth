
# Systemized Health — Master TODO & Task List

*Last Updated: 2026-09-08*

---

## 1. Immediate Priorities

- [ ] **Reconcile uploaded videos & metadata** with drop calendar (confirm titles/tags match schedule)
- [ ] **Big picture schedule review** — look at runway and upcoming drop dates

---

## 2. Video Pipeline Production Queue

### 🟢 Recently Published (`#published`)
- [x] `80.V1B2`: *Can You Run With a Herniated Disc? (A Doctor's Experiment)* — Dropped: 2026-09-07
- [x] `80.V1B2-S1`: *How Do the Discs in Your Spine Stay Healthy? (It's NOT Bloodflow)* — Dropped: 2026-09-08
- [x] `80.V2B1-S1`: *The Need for Discomfort to Be Comfortable* — Dropped: 2026-09-10
- [x] `80.V1B2-S2`: *Running and Longterm Health of Your Disc* — Dropped: 2026-09-12
- [x] `80.V2C1`: *Staying Human in the Age of Artificial Intelligence* — Dropped: 2026-09-14
- [x] `80.V2C1-S1`: *The One Mindset to Save Your Brain When Using AI* — Dropped: 2026-09-15

### 🗃️ Zettelkasten Physical 3x5 Index Cards
- [x] **Review propositions & add to Zettelkasten box (3x5 cards)**:
  - All 31 published videos filed and completed in analog Zettelkasten archive box (100% complete 🎉). Tracked in [`docs/Published_Video_Propositions.md`](file:///Users/craiganderson/Developer/SystemizedHealth/docs/Published_Video_Propositions.md).

### ✍️ Next Production Queue: 12-Month Rotation Schedule (`#idea`)
*(Active pipeline view: next 3 weeks runway from [`docs/content_rotation.csv`](file:///Users/craiganderson/Developer/SystemizedHealth/docs/content_rotation.csv) & [`SOPs/Content Rotation System SOP.md`](file:///Users/craiganderson/Developer/SystemizedHealth/SOPs/Content%20Rotation%20System%20SOP.md))*

- **Week of Sep 14 (Level 2: Thinking & Connect)**:
  - [x] `80.V2C1`: *Staying Human in the Age of Artificial Intelligence* — Dropped: 2026-09-14
  - [x] `80.V2C1-S1`: *The One Mindset to Save Your Brain When Using AI* — Dropped: 2026-09-15
  - [ ] `80.V2A-S2`: *Level 2 (Inward) — Thinking (Short 2)* — Scheduled: 2026-09-17 (`#idea`)
  - [ ] `80.V2A-S3`: *Level 2 (Inward) — Thinking (Short 3)* — Scheduled: 2026-09-19 (`#idea`)

- **Week of Sep 21 (Level 3: Play)**:
  - [ ] `80.V3A1`: *Level 3 (Outward) — Play (Long)* — Scheduled: 2026-09-21 (`#idea`)
  - [ ] `80.V3A1-S1`: *Level 3 (Outward) — Play (Short 1)* — Scheduled: 2026-09-22 (`#idea`)
  - [ ] `80.V3A1-S2`: *Level 3 (Outward) — Play (Short 2)* — Scheduled: 2026-09-24 (`#idea`)
  - [ ] `80.V3A1-S3`: *Level 3 (Outward) — Play (Short 3)* — Scheduled: 2026-09-26 (`#idea`)

- **Week of Sep 28 (Level 3: Organize)**:
  - [ ] `80.V3B1`: *Level 3 (Outward) — Organize (Long)* — Scheduled: 2026-09-28 (`#idea`)
  - [ ] `80.V3B1-S1`: *Level 3 (Outward) — Organize (Short 1)* — Scheduled: 2026-09-29 (`#idea`)
  - [ ] `80.V3B1-S2`: *Level 3 (Outward) — Organize (Short 2)* — Scheduled: 2026-10-01 (`#idea`)
  - [ ] `80.V3B1-S3`: *Level 3 (Outward) — Organize (Short 3)* — Scheduled: 2026-10-03 (`#idea`)

- **Week of Oct 05 (Level 4: Lab Deep Dive)**:
  - [ ] `80.V4-01`: *Level 4 (Lab) — User Discretion (Long)* — Scheduled: 2026-10-05 (`#idea`)
  - [ ] `80.V4-01-S1`: *Level 4 (Lab) — User Discretion (Short 1)* — Scheduled: 2026-10-06 (`#idea`)
  - [ ] `80.V4-01-S2`: *Level 4 (Lab) — User Discretion (Short 2)* — Scheduled: 2026-10-08 (`#idea`)
  - [ ] `80.V4-01-S3`: *Level 4 (Lab) — User Discretion (Short 3)* — Scheduled: 2026-10-10 (`#idea`)

---

## 3. Client Onboarding & CRM Operations

- [ ] **Session Startup Sync** (run at every session start):
  - [`python3 scripts/sync_agreements.py`](file:///Users/craiganderson/Developer/SystemizedHealth/scripts/sync_agreements.py)
  - [`python3 scripts/client_db_manager.py --doc`](file:///Users/craiganderson/Developer/SystemizedHealth/scripts/client_db_manager.py)
  - [`python3 scripts/video_pipeline.py --cache`](file:///Users/craiganderson/Developer/SystemizedHealth/scripts/video_pipeline.py)
  - [`python3 scripts/sync_obsidian_tags.py`](file:///Users/craiganderson/Developer/SystemizedHealth/scripts/sync_obsidian_tags.py)
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