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
     - `python3 scripts/sync_obsidian_tags.py` (Detects manual tag changes in Obsidian and syncs to Supabase)
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

## 4. Stage 2 Teleprompter Script Auto-Processing Protocol
Whenever Dr. Anderson says *"I have a new audio script for [Code/Folder]"*, provides a raw dictation transcript in chat, or pastes the transcript into the Obsidian video file with the tag `#audiodraft`:
1. **Interpret Audio as a Brainstorming Draft**: The raw audio dictation is a conceptual baseline containing the core propositions to cover, *not* a rigid word-for-word script. 
2. **Save Raw Transcript**: Append the raw spoken dictation text to the bottom of the main script file (`Obsidian_Vault/Zettlekasten/[Code] Script - [Title].md`) under a `## Raw Audio Draft Transcript (Reference)` header. Do NOT create a separate file.
3. **Draft for Review**: Transform the raw dictation into a highly polished, teleprompter-ready script. Actively edit for pacing, flow, and story arc. Remove filler, tighten sentences, and strictly adhere to Dr. Anderson's established writing voice and guardrails as defined in [`SOPs/Writing Voice.md`](file:///Users/craiganderson/Developer/SystemizedHealth/SOPs/Writing%20Voice.md) and [`SOPs/Writing Guidance.md`](file:///Users/craiganderson/Developer/SystemizedHealth/SOPs/Writing%20Guidance.md). 
   - **CRITICAL ANTI-AI VOICE RULE**: Do not summarize the dictation into stiff, generic AI structures (e.g., "Here is the simple biological reality..."). Directly lift the natural, unhurried conversational phrasing and rhythm from Dr. Anderson's raw dictation (e.g., "Look at your plate and ask yourself..."). If the initial draft feels stiff or formal, rewrite it.
   - **You MUST first present the drafted script hooks and clips to Dr. Anderson in an Implementation Plan artifact for review and approval** before modifying any Vault files.
4. **Format & Save**: Once approved, format into `Obsidian_Vault/Zettlekasten/[Code] Script - [Title].md` using:
   - **No H1 Header**: The filename acts as the primary title in Obsidian, so do NOT include a `# [Code]: [Title]` header.
   - **Metadata**: Add any relevant tags, the `drop_date`, and JDex topics to the YAML frontmatter. Only include `YouTube ID`, `Views`, and `Parent Video` in the markdown body's metadata block (remove redundant fields like `Video Code`, `Drop Date`, etc., from the body).
   - Section 1 & 2: Generate at least 4 Title Ideas and 2 Hook Options. **You must score every title and hook for virality/impact out of 100 using a simulated vidIQ rating (e.g., `(vidIQ Score: 84)`).**
   - Section 3: Teleprompter clips formatted as plain paragraphs without headers. At the end of each paragraph, append the clip code and context tags: `[Code].[ClipNum] #[context]` (e.g., `80.V0B-S3.1 #film #insidetruck`).
   - Consolidated single spoken paragraph per clip (no sentence bullets).
   - Bracketed performance/delivery cues (`[breath]`, `[pause]`, `[gesture]`, `[tone shift]`, `[eye contact shift]`).
   - Official CTA standard (`call.systemizedhealth.com`).
   - Writing Guardrails (no AI jargon, no em dashes).
5. **Pipeline Auto-Advance**: Advance video status to `Ready to Film` in Supabase/SQLite, and refresh `docs/video_pipeline_cache.json`, `docs/Video_Pipeline_Status.md`, [`Drop_Schedule.md`](file:///Users/craiganderson/Developer/SystemizedHealth/Drop_Schedule.md), and `TODO.md`.
   - **Dashboard Update**: Whenever a script is polished and pushed to the `#film` queue, you MUST copy the entire formatted teleprompter script (from Section 3) and append the snippets to the bottom of the `Obsidian_Vault/_Filming_Dashboard.md` file under the `## 📜 Script Snippets` section.
   - **Terminal Execution**: Run the terminal command to advance the status to `#film` AND clear the `agent_message` field via the `--add` parameter (e.g., `python3 scripts/video_pipeline.py --status 80.V1A '#film' --add '{"video_number":"TBD","code":"80.V1A","format_type":"Long","title":"[Title]","agent_message":""}'`) on behalf of Dr. Anderson.

---

## 5. "Agent Comments" Source Directive
Whenever Dr. Anderson says to "look for agent comments" or similar phrasing, it **always** refers to the `agent_message` field in the video pipeline database (Supabase). Do not search Obsidian documents, TODOs, or local source code files for these comments.
- Read from the local cache via `docs/video_pipeline_cache.json`.
- If the cache is stale or missing the recent comment, prompt Dr. Anderson to run `python3 scripts/video_pipeline.py --cache` to pull the latest updates.

---

## 6. Changelog & Agent Action Logging
When Dr. Anderson leaves an action or comment in the `agent_message` field and you (the agent) process it, or if you make any state changes to a script (e.g., `#film` to `#edit`), you MUST append a timestamped log to the bottom of the corresponding Obsidian video script page under a `## Changelog` header. 
- Example: `- [2026-08-23] Processed dictation and generated Stage 2 script.`
- Example: `- [2026-08-23] Status updated to #edit (Filming complete).`

**File Standardization (Post-Filming):**
Once a video reaches the `#edit` stage (filming is complete), the file transitions to a study and reference tool. The `scripts/clean_video_script.py` script should be run to strip out titles, hook options, and vidIQ scores, leaving only the final transcript and JDex-linked propositions. The `## Changelog` must be preserved.
