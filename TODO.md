
look at big picture  schedule
inbox (ideas abd thoights to process)
- reconcile uoloaded cideos and metadata with drop calendar. 

=====




# Systemized Health — Master TODO & Task List

*Last Updated: 2026-08-14*

---

## 1. Immediate Launch & Video Production (August 3 Deadline)
- [ ] **Onboarding & Setup**: Double-check onboarding plan for clients ahead of August 3 video launch.
- [ ] **First Week Uploads**: Upload first week videos and ensure metadata (titles, tags, CTA descriptions) is fully dialed in.
- [ ] **Video Editing (Descript)**: Finish video editing using scripts, using Descript for the initial batch of videos.
- [ ] **Audio Cleanup**: Perform final audio cleanup post-Descript export as needed.

---

## 2. Video Pipeline Production Queue
- [ ] **Long-Form Video Editing**:
  - [ ] `80.V0A1`: *Systemized OS Framework* (Drop Date: 2026-08-24) — Currently Editing
- [ ] **Short-Form Video Editing (Filmed, Pending Edit)**:
  - [x] `80.V0B-S1`: *Do Less to Get More* (Drop: 2026-08-04 @ 6:00 AM) — Uploaded & Live
  - [x] `80.V0A-S1`: *The Biological Reason Monday Resolutions Always Fail* (Drop: 2026-08-06) — Uploaded & Live
  - [ ] `80.V0A-S2`: *The Exact Biological Sequence Your Body Needs to Change* (Drop: 2026-08-08) — Currently Editing
  - [ ] `80.V0A-S3`: *Stop Treating Your Health Like an Emergency Room* (Drop: 2026-08-22)
  - [ ] `80.V0A1-S1`: *Why Relying on Willpower Guarantees Physical Burnout* (Drop: 2026-08-25)
  - [ ] `80.V0A1-S2`: *The Level 1 FMR Baseline Every Body Needs to Master* (Drop: 2026-08-27)
  - [ ] `80.V0A1-S3`: *The 3-Tier Health Pyramid That Fixes Chronic Fatigue* (Drop: 2026-08-29)
  - [x] `80.V0B-S3`: *The 3 Levels of the Biological OS* (Drop: 2026-08-08) — Uploaded & Live
  - [x] `80.V1B1-S1`: *Why Exercise is Optional* (Drop: 2026-08-11) — Uploaded & Live
  - [ ] `80.V1B1-S2`: *Joint Imbibition: The Only Way Your Joints Actually Get Nourished* (Drop: 2026-08-13)
  - [x] `80.V1B1-S3`: *Cortical Smudging: Why Your Back Pain Randomly Spasms* (Drop: 2026-08-15)
- [ ] **Ready to Film (Scripts Updated — Contrarian Rewrite Complete)**:
  - [ ] `80.V1A`: *The Biological Cost of Fake Fuel* (Drop: 2026-08-17) — Script rewritten, film tomorrow
  - [ ] `80.V1A-S1`: *The Mid-Afternoon Crash* (Drop: 2026-08-18) — Script rewritten, film tomorrow
  - [ ] `80.V1A-S2`: *Cellular Hydration* (Drop: 2026-08-20) — Script rewritten, film tomorrow
- [ ] **Write Audio Dictation (Outline Scripts Written — Awaiting Dictation)**:
  - [ ] `80.V1A-S3`: *The Biological Reality of Diets* (Drop: 2026-08-21)
  - [ ] `80.V1C1`: *Biological Debt of Sleep* (Drop: 2026-08-31) — Outline script written
  - [ ] `80.V1C1-S1`: *Weekend Catch-Up Myth* (Drop: 2026-09-01) — Outline script written
  - [ ] `80.V1C1-S2`: *Brain Night Shift* (Drop: 2026-09-03) — Outline script written
  - [ ] `80.V1C1-S3`: *Caffeine Illusion* (Drop: 2026-09-05) — Outline script written
  - [ ] `80.V1C2`: *Fake Rest* (Drop: 2026-09-07) — Outline script written
  - [ ] `80.V1C2-S1`: *Netflix Exhaustion* (Drop: 2026-09-08) — Outline script written
  - [ ] `80.V1C2-S2`: *Phone Scrolling Cost* (Drop: 2026-09-10) — Outline script written
  - [ ] `80.V1C2-S3`: *The Off Switch* (Drop: 2026-09-12) — Outline script written
  - [ ] `80.V1C3`: *Digestive Rest* (Drop: 2026-09-14) — Outline script written
  - [ ] `80.V1C3-S1`: *Energy Cost of Digestion* (Drop: 2026-09-15) — Outline script written
  - [ ] `80.V1C3-S2`: *The Maintenance Window* (Drop: 2026-09-17) — Outline script written
  - [ ] `80.V1C3-S3`: *Fasting is not a diet* (Drop: 2026-09-19) — Outline script written
  - [ ] `80.V1C4`: *Cognitive Load* (Drop: 2026-09-21) — Outline script written
  - [ ] `80.V1C4-S1`: *Desk Job Exhaustion* (Drop: 2026-09-22) — Outline script written
  - [ ] `80.V1C4-S2`: *Decision Fatigue* (Drop: 2026-09-24) — Outline script written
  - [ ] `80.V1C4-S3`: *Protecting the Battery* (Drop: 2026-09-26) — Outline script written

---

## 3. Client Onboarding & CRM Operations
- [ ] **Database & Cache Sync Routine**: Execute startup sync scripts to maintain active client intake and video cache:
  - [`python3 scripts/tidycal_sync.py`](file:///Users/craiganderson/Developer/SystemizedHealth/scripts/tidycal_sync.py)
  - [`python3 scripts/sync_agreements.py`](file:///Users/craiganderson/Developer/SystemizedHealth/scripts/sync_agreements.py)
  - [`python3 scripts/client_db_manager.py --doc`](file:///Users/craiganderson/Developer/SystemizedHealth/scripts/client_db_manager.py)
  - [`python3 scripts/video_pipeline.py --cache`](file:///Users/craiganderson/Developer/SystemizedHealth/scripts/video_pipeline.py)
- [ ] **Status Verification**: Review and verify living onboarding report in [`docs/Client_Onboarding_Status.md`](file:///Users/craiganderson/Developer/SystemizedHealth/docs/Client_Onboarding_Status.md).
- [ ] **Client Web App Deliverable**: Build and deploy individual client webapps for health tracking & coaching (currently prototyping with `HollyApp` in separate repository; to be rolled out to all coaching clients & subscribers).

---

## 4. Marketing & Conversion Funnel Setup
- [ ] **TidyCal Redirect**: Configure TidyCal event redirect to route completed bookings to `https://call.systemizedhealth.com/success`.
- [ ] **Tracking Implementation & Verification**:
  - [ ] Embed Google Tag Manager container snippet on frontend landing (`call.systemizedhealth.com`) & success (`/success`) pages.
  - [ ] Configure GA4 page view tag and `generate_lead` conversion event trigger in GTM.
  - [ ] Set up Meta (Facebook) Base Pixel and `Lead` event tracking on `/success`.
  - [ ] Check and verify all tracking codes using Meta Pixel Helper and Google Tag Assistant.
- [ ] **CRM Conversion Tracking**: Track conversion status from free 20-minute Discovery Call to paid 2-Hour Coaching Intensive in Supabase CRM.