
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

### 🗃️ Active Work-In-Progress (Physical 3x5 Index Cards Pending)
- [ ] **Review propositions & add to Zettelkasten box (3x5 cards)**:
  - Tracked in [`docs/Published_Video_Propositions.md`](file:///Users/craiganderson/Developer/SystemizedHealth/docs/Published_Video_Propositions.md) (18 pending videos awaiting physical card filing, including newly published `80.V2B1-S1` and `80.V1B2-S2`).

### ✍️ Next Production Queue: Ideation (`#idea`) & Stage 1 Outlines
*(Weeks of Sep 14 & Sep 21 — Active Stage 1 ideation & draft outlines in Gemini Notebook)*
- [ ] **Stage 1 CNS Ideation & Draft Outlines (Gemini Notebook)**:
  - Active Brief: [`docs/CNS_Topic_Trajectory_Brief.md`](file:///Users/craiganderson/Developer/SystemizedHealth/docs/CNS_Topic_Trajectory_Brief.md)
  - Target Intake: [`docs/topic_intake.md`](file:///Users/craiganderson/Developer/SystemizedHealth/docs/topic_intake.md)
  - Week 2 (Drop: 2026-09-14 to 2026-09-19): `80.V1C3` (`TBD-025`) + 3 Waterfall Shorts (`TBD-026` to `TBD-028`)
  - Week 3 (Drop: 2026-09-21 to 2026-09-26): `80.V1C4` (`TBD-029`) + 3 Waterfall Shorts (`TBD-030` to `TBD-032`)

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