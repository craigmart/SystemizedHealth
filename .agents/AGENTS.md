# Systemized Health — Workspace Rules & Directives

## 1. Call-To-Action (CTA) Standard for Discovery Calls
Whenever writing, scripting, outlining, or generating metadata/descriptions for videos containing a Call-To-Action (CTA) for the free discovery call:
- **Mandatory Link**: Always include the official short URL: `http://call.systemizedhealth.com/` (or `call.systemizedhealth.com`).
- **Standard CTA Copy Format**:
  - *"Book your free 20-minute Systemized Discovery Call: call.systemizedhealth.com"*
- **Target Endpoint**: Resolves to `https://tidycal.com/craigandersondc/systemized-discovery-call`.

---

## 2. Client Onboarding & CRM Maintenance (Session Startup Directive)
- **Mandatory Session Startup Action**: At the beginning of every session / login, automatically perform the following:
  1. Inspect [`TODO.md`](file:///Users/craiganderson/Developer/SystemizedHealth/TODO.md) to check active open items and priorities.
  2. Remind Dr. Anderson and run the client database & video pipeline refresh:
     - `python3 scripts/tidycal_sync.py` (Pulls new TidyCal bookings)
     - `python3 scripts/sync_agreements.py` (Pulls Google Form agreement responses)
     - `python3 scripts/client_db_manager.py --doc` (Refreshes [`docs/Client_Onboarding_Status.md`](file:///Users/craiganderson/Developer/SystemizedHealth/docs/Client_Onboarding_Status.md))
     - `python3 scripts/video_pipeline.py --cache` (Refreshes [`docs/video_pipeline_cache.json`](file:///Users/craiganderson/Developer/SystemizedHealth/docs/video_pipeline_cache.json))
- Master task list location: [`TODO.md`](file:///Users/craiganderson/Developer/SystemizedHealth/TODO.md).
- Database location: [`database/clients.db`](file:///Users/craiganderson/Developer/SystemizedHealth/database/clients.db).
- Living report location: [`docs/Client_Onboarding_Status.md`](file:///Users/craiganderson/Developer/SystemizedHealth/docs/Client_Onboarding_Status.md).

---

## 3. Video Pipeline — Agent Read Protocol
- **Source of truth**: Supabase `videos` table (managed via `scripts/video_pipeline.py`).
- **Agent cannot call Supabase directly** (sandbox DNS restriction). Always read from the local cache instead:
  - Cache file: [`docs/video_pipeline_cache.json`](file:///Users/craiganderson/Developer/SystemizedHealth/docs/video_pipeline_cache.json)
  - If cache is missing or stale (>24h), prompt Dr. Anderson to run: `python3 scripts/video_pipeline.py --cache`
- **To update video status**, provide the exact terminal command for Dr. Anderson to run:
  - `python3 scripts/video_pipeline.py --status <code> <new_status>`

---

## 4. Stage 2 Teleprompter Script Auto-Processing Protocol
Whenever Dr. Anderson says *"I have a new audio script for [Code/Folder]"*, provides a raw dictation transcript, or points to `#audiodraft` in Workflowy:
1. **Disregard all previous outlines & talking points**: The raw audio transcript is the single source of truth for the video.
2. **Save Raw Transcript (`-A` File)**: Save the raw spoken dictation text to `Videos/[Folder]/V[Code]-A Raw Audio Transcript.txt`.
3. **Generate Stage 2 Teleprompter Script (`-B` File)**: Format the spoken text into `Videos/[Folder]/V[Code] Script - [Title].md` using:
   - Header: `# [Code]: [Title]` + metadata block (`Suggested Settings`, `JDex Topic Code`).
   - Section 1 & 2: Title Ideas and Hook Options with vidIQ ratings.
   - Section 3: Teleprompter clips formatted with `### [Code]>[ClipNum] — [Title] #film #[context]` (`#insidetruck`, `#outside`, `#driving`, etc.).
   - Consolidated single spoken paragraph per clip (no sentence bullets).
   - Bracketed performance/delivery cues (`[breath]`, `[pause]`, `[gesture]`, `[tone shift]`, `[eye contact shift]`).
   - Official CTA standard (`call.systemizedhealth.com`).
   - Writing Guardrails (no AI jargon, no em dashes).
4. **Pipeline Auto-Advance**: Advance video status to `Ready to Film` in Supabase/SQLite, and refresh `docs/video_pipeline_cache.json`, `docs/Video_Pipeline_Status.md`, and `TODO.md`.


