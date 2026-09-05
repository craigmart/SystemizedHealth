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
     - `python3 scripts/sync_published_videos.py` (Syncs published videos from vidIQ to Vault)
     - `python3 scripts/sync_obsidian_tags.py` (Syncs authoritative App/database statuses down to Obsidian Vault tags)
     - `python3 scripts/video_pipeline.py --cache` (Refreshes [`docs/video_pipeline_cache.json`](file:///Users/craiganderson/Developer/SystemizedHealth/docs/video_pipeline_cache.json))
     - `python3 scripts/sync_jdex_titles.py` (Appends JDex descriptions to JDex files)
- Master task list location: [`TODO.md`](file:///Users/craiganderson/Developer/SystemizedHealth/TODO.md).
- Database location: [`database/clients.db`](file:///Users/craiganderson/Developer/SystemizedHealth/database/clients.db).
- Living report location: [`docs/Client_Onboarding_Status.md`](file:///Users/craiganderson/Developer/SystemizedHealth/docs/Client_Onboarding_Status.md).

---

## 3. Video Pipeline — Agent Read & Write Protocol
- **Source of truth**: Supabase `videos` table (managed via `scripts/video_pipeline.py`).
- **Agent Read Protocol**: Always read from the local cache instead of hitting the database directly:
  - Cache file: [`docs/video_pipeline_cache.json`](file:///Users/craiganderson/Developer/SystemizedHealth/docs/video_pipeline_cache.json)
  - If cache is missing or stale (>24h), prompt Dr. Anderson to run: `python3 scripts/video_pipeline.py --cache`
- **Agent Write Protocol (Database Updates)**: The Agent CAN and SHOULD execute the local python pipeline script via the terminal to update the database on behalf of Dr. Anderson.
  - To update video status or clear agent messages, run: `python3 scripts/video_pipeline.py --status <code> <new_status> --add '{"agent_message":""}'`

---

## 4. Simplified Video Production Protocol (The 3x5 Card Standard)
Videos are produced using Dr. Anderson's streamlined analog-to-camera workflow, eliminating rigid pre-scripting and teleprompter reading in favor of natural, authentic clinical delivery:
1. **Gemini Notebook Research**: Dr. Anderson reviews research, clinical transcripts, and analogies in Gemini Notebook.
2. **The 3x5 Index Card**: Dr. Anderson distills the topic onto a physical 3x5 card following the 4-Beat Formula:
   - **Beat 1: The Hook** (Relatable myth, patient fear, or daily friction)
   - **Beat 2: The Glitch** (The anatomical, neurological, or metabolic mechanism)
   - **Beat 3: The Analogy** (Clinical teaching metaphor)
   - **Beat 4: The Protocol & CTA** (Actionable test/drill + `call.systemizedhealth.com`)
3. **Direct-to-Camera Filming**: Dr. Anderson records a loosely scripted, highly personal video directly to camera using the 3x5 card as an anchor.
4. **Status Advance**: In the web App, Dr. Anderson sets the video status to `#edit`.

---

## 5. Post-Recording Transcript Ingestion & Force Multiplier Protocol
When Dr. Anderson begins editing (in Descript) and drops the **final exact spoken transcript** into the web App's `raw_transcript` field (or in chat/Obsidian):
1. **Title Optimization via vidIQ**:
   - The Agent analyzes the spoken transcript and scores 4–5 title variations using `scripts/vidiq_sync.py --score-title "[Title]"`, targeting virality scores of 90+ out of 100.
2. **Obsidian Vault Archiving**:
   - The Agent formats `Obsidian_Vault/Zettlekasten/[Code] Script - [Title].md` to preserve the final transcript as a permanent clinical study and reference document.
   - Preserves YAML frontmatter (with tags `#video`, `#edit`, `drop_date`, and `jdex` topics).
   - Injects the final transcript under a clean `## Final Spoken Transcript` section.
3. **Zettelkasten Proposition Mining**:
   - The Agent extracts 1–2 sharp clinical propositions from the spoken text and maps them to their respective Johnny Decimal (JDex) files in `Obsidian_Vault/JDex/` and Workflowy.
4. **Waterfall Ideation & Sub-Topic Alignment**:
   - Each video (long or short) is a standalone production with its own recording and editing. The "waterfall" concept refers strictly to ideation (branching related sub-topic angles from the core pillar in Gemini Notebook). Shorts are not sliced from the long video during editing.
5. **Database & Cache Sync**:
   - Updates Supabase and SQLite, refreshes `docs/video_pipeline_cache.json`, and appends a dated entry to the `## Changelog`.

---

## 6. "Agent Comments" Source Directive
Whenever Dr. Anderson says to "look for agent comments" or similar phrasing, it **always** refers to the `agent_message` field in the video pipeline database (Supabase). Do not search Obsidian documents, TODOs, or local source code files for these comments.
- Read from the local cache via `docs/video_pipeline_cache.json`.
- If the cache is stale or missing the recent comment, prompt Dr. Anderson to run `python3 scripts/video_pipeline.py --cache` to pull the latest updates.

---

## 7. Changelog & Agent Action Logging
When Dr. Anderson leaves an action or comment in the `agent_message` field and you (the agent) process it, or if you make any state changes to a script (e.g., `#film` to `#edit`), you MUST append a timestamped log to the bottom of the corresponding Obsidian video script page under a `## Changelog` header. 
- Example: `- [2026-08-23] Processed dictation and generated Stage 2 script.`
- Example: `- [2026-08-23] Status updated to #edit (Filming complete).`

**File Standardization (Post-Filming):**
Once a video reaches the `#edit` stage (filming is complete), the file transitions to a study and reference tool. The `scripts/clean_video_script.py` script should be run to strip out titles, hook options, and vidIQ scores, leaving only the final transcript and JDex-linked propositions. The `## Changelog` must be preserved.
