# Systemized Health — Master TODO & Task List

*Last Updated: 2026-08-01*

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
  - [ ] `80.V0B-S1`: *Why Health Information Alone Keeps You Broken* (Drop: 2026-08-18)
  - [ ] `80.V0A-S1`: *The Biological Reason Monday Resolutions Always Fail* (Drop: 2026-08-04)
  - [ ] `80.V0A-S2`: *The Exact Biological Sequence Your Body Needs to Change* (Drop: 2026-08-06)
  - [ ] `80.V0A-S3`: *Stop Treating Your Health Like an Emergency Room* (Drop: 2026-08-08)
  - [ ] `80.V0A1-S1`: *Why Relying on Willpower Guarantees Physical Burnout* (Drop: 2026-08-25)
  - [ ] `80.V0A1-S2`: *The Level 1 FMR Baseline Every Body Needs to Master* (Drop: 2026-08-27)
  - [ ] `80.V0A1-S3`: *The 3-Tier Health Pyramid That Fixes Chronic Fatigue* (Drop: 2026-08-29)
- [ ] **Short-Form Audio Riffs (Blueprint Ready, Pending Audio)**:
  - [ ] `80.V0B-S2`: *The Hidden System Glitch Ruining Your Body* (Drop: 2026-08-20)
  - [ ] `80.V0B-S3`: *Stop Buying Health Advice from Coaches Who Dont Know Physiology* (Drop: 2026-08-22)
  - [ ] `80.V1B1-S1`: *Why Exercise is Optional* (Drop: 2026-08-11)
  - [ ] `80.V1B1-S2`: *Joint Imbibition: The Only Way Your Joints Actually Get Nourished* (Drop: 2026-08-13)
  - [ ] `80.V1B1-S3`: *Cortical Smudging: Why Your Back Pain Randomly Spasms* (Drop: 2026-08-15)

---

## 3. Client Onboarding & CRM Operations
- [ ] **Database & Cache Sync Routine**: Execute startup sync scripts to maintain active client intake and video cache:
  - [`python3 scripts/tidycal_sync.py`](file:///Users/craiganderson/Developer/SystemizedHealth/scripts/tidycal_sync.py)
  - [`python3 scripts/sync_agreements.py`](file:///Users/craiganderson/Developer/SystemizedHealth/scripts/sync_agreements.py)
  - [`python3 scripts/client_db_manager.py --doc`](file:///Users/craiganderson/Developer/SystemizedHealth/scripts/client_db_manager.py)
  - [`python3 scripts/video_pipeline.py --cache`](file:///Users/craiganderson/Developer/SystemizedHealth/scripts/video_pipeline.py)
- [ ] **Status Verification**: Review and verify living onboarding report in [`docs/Client_Onboarding_Status.md`](file:///Users/craiganderson/Developer/SystemizedHealth/docs/Client_Onboarding_Status.md).

---

## 4. Marketing & Conversion Funnel Setup
- [ ] **TidyCal Redirect**: Configure TidyCal event redirect to route completed bookings to `https://call.systemizedhealth.com/success`.
- [ ] **Tracking Implementation & Verification**:
  - [ ] Embed Google Tag Manager container snippet on frontend landing (`call.systemizedhealth.com`) & success (`/success`) pages.
  - [ ] Configure GA4 page view tag and `generate_lead` conversion event trigger in GTM.
  - [ ] Set up Meta (Facebook) Base Pixel and `Lead` event tracking on `/success`.
  - [ ] Check and verify all tracking codes using Meta Pixel Helper and Google Tag Assistant.
- [ ] **CRM Conversion Tracking**: Track conversion status from free 20-minute Discovery Call to paid 2-Hour Coaching Intensive in Supabase CRM.