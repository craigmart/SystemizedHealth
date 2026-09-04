
# Systemized Health — Master TODO & Task List

*Last Updated: 2026-08-17*

---

## 1. Immediate Priorities

- [ ] **Reconcile uploaded videos & metadata** with drop calendar (confirm titles/tags match schedule)
- [ ] **Big picture schedule review** — look at runway and upcoming drop dates

---

## 2. Video Pipeline Production Queue

### 🔴 In Editing (`#edit`) — 3 videos
- [x] `80.V0A1`: *Systemized OS Framework* — Drop: 2026-08-24
- [ ] `80.V0A-S3`: *Stop Treating Your Health Like an Emergency Room* — Drop: 2026-08-22
- [x] `80.V0A1-S1`: *Why Relying on Willpower Guarantees Physical Burnout* — Drop: 2026-08-25
- [ ] `80.V0A1-S2`: *The Level 1 FMR Baseline Every Body Needs to Master* — Drop: 2026-08-27
- [ ] `80.V0A1-S3`: *The 3-Tier Health Pyramid That Fixes Chronic Fatigue* — Drop: 2026-08-29


### 🎬 Ready to Film (`#film`) — 1 video
- [ ] `80.V1A`: *The Biological Cost of Fake Fuel* — Drop: 2026-08-17

### ✍️ In Writing (`#write`) & Ideation (`#idea`)
- [ ] `80.V1B2`: *Is running good for low back pain* (Long — Level 1 Movement / Pillar B, branch 2)
*(Weeks of Sep 7, Sep 14, Sep 21 — Active Stage 1 ideation & draft outlines in Gemini Notebook)*
- [ ] **Stage 1 CNS Ideation & Draft Outlines (Gemini Notebook)**:
  - Active Brief: [`docs/CNS_Topic_Trajectory_Brief.md`](file:///Users/craiganderson/Developer/SystemizedHealth/docs/CNS_Topic_Trajectory_Brief.md)
  - Target Intake: [`docs/topic_intake.md`](file:///Users/craiganderson/Developer/SystemizedHealth/docs/topic_intake.md)
  - Week 1 (Drop: 2026-09-07 to 2026-09-12): `80.V1C2` + 3 Waterfall Shorts
  - Week 2 (Drop: 2026-09-14 to 2026-09-19): `80.V1C3` + 3 Waterfall Shorts
  - Week 3 (Drop: 2026-09-21 to 2026-09-26): `80.V1C4` + 3 Waterfall Shorts

---

## 3. Client Onboarding & CRM Operations

- [ ] **Session Startup Sync** (run at every session start):
  - [`python3 scripts/tidycal_sync.py`](file:///Users/craiganderson/Developer/SystemizedHealth/scripts/tidycal_sync.py)
  - [`python3 scripts/sync_agreements.py`](file:///Users/craiganderson/Developer/SystemizedHealth/scripts/sync_agreements.py)
  - [`python3 scripts/client_db_manager.py --doc`](file:///Users/craiganderson/Developer/SystemizedHealth/scripts/client_db_manager.py)
  - [`python3 scripts/sync_obsidian_tags.py`](file:///Users/craiganderson/Developer/SystemizedHealth/scripts/sync_obsidian_tags.py)
  - [`python3 scripts/video_pipeline.py --cache`](file:///Users/craiganderson/Developer/SystemizedHealth/scripts/video_pipeline.py)
  - [`python3 scripts/sync_published_videos.py`](file:///Users/craiganderson/Developer/SystemizedHealth/scripts/sync_published_videos.py)
  - [`python3 scripts/sync_jdex_titles.py`](file:///Users/craiganderson/Developer/SystemizedHealth/scripts/sync_jdex_titles.py)
- [ ] **Client Web App Deliverable**: Build and deploy individual client webapps for health tracking & coaching (prototyping with `HollyApp`; roll out to all coaching clients).

---

## 4. Marketing & Conversion Funnel Setup

- [ ] **TidyCal Redirect**: Configure redirect to `https://call.systemizedhealth.com/success` post-booking.
- [ ] **Tracking Implementation**:
  - [ ] Embed Google Tag Manager on `call.systemizedhealth.com` & `/success`
  - [ ] Configure GA4 page view tag + `generate_lead` conversion event in GTM
  - [ ] Set up Meta Base Pixel + `Lead` event on `/success`
  - [ ] Verify all tracking with Meta Pixel Helper and Google Tag Assistant
- [ ] **CRM Conversion Tracking**: Track Discovery Call → paid 2-Hour Intensive conversions in Supabase.