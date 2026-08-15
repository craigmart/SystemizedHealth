# 80.06 — Video Pipeline SOP

This document defines the authoritative operating standard for managing the Systemized Health video pipeline. All video metadata, status tracking, and production scheduling flows through **Supabase** as the single source of truth.

---

## 1. Source of Truth

**Supabase (`videos` table) is the absolute single Source of Truth** for all video metadata, drop dates, status progression, and production scheduling.

- **Mandatory Supabase Sync**: Any modification to video drop schedules, titles, or status MUST be updated directly in Supabase (via `python3 scripts/db_manager.py --seed`, `python3 scripts/video_pipeline.py --status <code> <status>`, or `python3 scripts/video_pipeline.py --add '<json>'`).
- **Derived Downstream Targets**: Local SQLite (`database/videos.db`), markdown reports (`TODO.md`, `Analytics/`), local cache (`docs/video_pipeline_cache.json`), and iCalendar feeds (`publication_calendar.ics`) are derived targets synced from Supabase.

| Layer | System | Role & Access |
| :--- | :--- | :--- |
| **Primary Source of Truth** | **Supabase `videos` table** | REST API — `https://qkeloxawnpvyfasujonv.supabase.co` |
| **Primary Sync Tool** | `scripts/db_manager.py` / `scripts/video_pipeline.py` | Command line management engine |
| **Local Cache** | `docs/video_pipeline_cache.json` | Generated from Supabase via `video_pipeline.py --cache` |
| **Archived Files** | `backups/pipeline_archive/` | Historical reference only — do not edit |

> Never edit `backups/pipeline_archive/Master_Video_Pipeline.md` or `.csv`. They are frozen snapshots. All live schedule changes must be executed against Supabase.

---

## 2. Supabase Schema

### Table: `videos` (core metadata)
| Column | Type | Description |
| :--- | :--- | :--- |
| `video_number` | TEXT | Sequential production order (`001`–`099`) |
| `code` | TEXT | Johnny Decimal code (`80.V0A`, `80.V0A-S1`, etc.) |
| `format_type` | TEXT | `Long` or `Short` |
| `title` | TEXT | Full video title |
| `drop_date` | DATE | Scheduled YouTube publish date |
| `status` | TEXT | Current pipeline tag (e.g. `#idea`, `#write`, etc.) |
| `uploaded_date` | DATE | Date uploaded to YouTube (auto-stamped) |
| `youtube_id` | TEXT | YouTube video ID (once published) |
| `jdex_code` | TEXT | JDex knowledge reference code |
| `os_level` | TEXT | Systemized OS level (`Level 1: FMR`, etc.) |
| `notes` | TEXT | Free-form production notes |

### Supporting Tables
- **`video_stats`** — Performance snapshots (views, CTR, retention, etc.) over time
- **`video_keywords`** — vidIQ keyword data per video
- **`video_tasks`** — Production task checklist per video

---

## 3. Video Coding Nomenclature

Video codes (e.g., `80.V1B1`) must align directly with the Systemized OS Framework structure to ensure all content can be mapped backward to its biological origin.

**Level Prefix:**
* `V0` = Baseline / Foundation (e.g., `V0A`, `V0B`)
* `V1` = Level 1 FMR (Fuel, Move, Rest)
* `V2` = Level 2 TLC (Think, Learn, Connect)
* `V3` = Level 3 POP (Play, Organize, Purpose)

**Pillar Suffix (Alphabetical Mapping):**
Within each Level, the alphabet dictates the specific pillar being discussed.
* **Level 1 (FMR):** A = Fuel, B = Move, C = Rest.
  * Example: `80.V1B1` = Level 1, Movement, Video 1.
  * Example: `80.V1C2` = Level 1, Rest, Video 2.

**Short-Form Clips:**
Short-form clips carved out from a long-form video simply append `-S[Number]` to the parent code (e.g., `80.V1C2-S1`).

---

## 4. Pipeline Status Progression

Every video moves strictly through these tags in order:

```
#idea → #write → #film → #edit → #uploaded → #published
```

| Tag | Meaning |
| :--- | :--- |
| `#idea` | Working on the idea |
| `#write` | These are videos that are in the writing stage (outline or audio riff) |
| `#film` | Ready to film (context tags used here like `#outside`, `#studio`, etc.) |
| `#edit` | Footage captured; there is editing to be done |
| `#uploaded` | Sitting in YT Studio ready, all set (auto-stamps `uploaded_date`) |
| `#published` | The video has dropped and is live |

---

## 4. CLI Command Reference

All pipeline operations use `scripts/video_pipeline.py` from the project root:

```bash
# View full pipeline
python3 scripts/video_pipeline.py --list

# Filter by tag
python3 scripts/video_pipeline.py --list --filter '#edit'

# Next week's drops + upload gap warnings
python3 scripts/video_pipeline.py --week

# Update a video's tag (auto-stamps uploaded_date when #uploaded or #published)
python3 scripts/video_pipeline.py --status 80.V0A-S1 '#uploaded'

# Add or upsert a new video
python3 scripts/video_pipeline.py --add '{"video_number":"017","code":"80.V1B2","format_type":"Long","title":"New Video Title","drop_date":"2026-09-07"}'

# Generate docs/Video_Pipeline_Status.md from live Supabase data
python3 scripts/video_pipeline.py --doc

# Write docs/video_pipeline_cache.json (for offline / agent reads)
python3 scripts/video_pipeline.py --cache

# Generate Month-to-Date (MTD) pace report & end-of-month projections
python3 scripts/analytics_manager.py --mtd

# Pull End-of-Month (EOM) report (e.g. July 2026)
python3 scripts/analytics_manager.py --eom 2026-07
```

---

## 5. Adding a New Video & Generating Outlines

1. Run `--add` with the required fields: `video_number`, `code`, `format_type`, `title`
2. Optionally include: `drop_date`, `status`, `jdex_code`, `os_level`, `notes`, `rough_outline`
   > [!IMPORTANT]
   > The web App dashboard explicitly looks for the `rough_outline` field to display the Pre-Recording Outline Reference on the video page. You MUST sync your markdown outlines to this field so they are available while recording the audio draft.
3. Create the local folder and Markdown file: `Obsidian_Vault/Videos/[ShortCode] - [Title] ([FullCode])/`
4. **Generate the Pre-Recording Outline:**
   The initial Markdown file must contain a `## Outline for Audio Dictation:` section structured with:
   - **The Hook:** A punchy opening.
   - **Biological Reframe:** Translating the problem into the FMR framework.
   - **Clinical Insight / Study:** A credible, real-world biological or psychological study reference.
   - **Actionable Takeaway & CTA:** A simple step the viewer can take today, ending with the official CTA.
5. Verify with `python3 scripts/video_pipeline.py --list`
6. Sync the generated outline text to the Supabase `rough_outline` field so it displays in the App.

---

## 6. Stage 2 — Audio Draft → Teleprompter Script

After recording an audio dictation draft, the agent processes it into a polished, teleprompter-ready script. This is triggered by any of the following:

- Dr. Anderson says *"I have a new audio script for [Code]"* and pastes a transcript in chat
- The transcript is pasted into the Obsidian video file with the tag `#audiodraft`
- **Dr. Anderson says "run the process" or "pull from the app"** — in this case, the agent reads `raw_transcript` fields directly from the local pipeline cache (`docs/video_pipeline_cache.json`) and processes **all videos that have a populated `raw_transcript`**, regardless of current pipeline status (status is updated as appropriate after scripting)

### Step-by-Step Process

1. **Interpret as Brainstorming Draft**: The raw audio dictation is a conceptual baseline containing the core propositions to cover — not a rigid word-for-word script.

2. **Save Raw Transcript**: Append the raw spoken dictation text to the bottom of the main script file (`Obsidian_Vault/Videos/[Folder]/V[Code] Script - [Title].md`) under a `## Raw Audio Draft Transcript (Reference)` header. Do NOT create a separate file.

3. **Draft for Review — Implementation Plan First**: Transform the raw dictation into a polished teleprompter-ready script. Actively edit for pacing, flow, and story arc. Remove filler, tighten sentences, and strictly adhere to Dr. Anderson's established writing voice and guardrails as defined in [`SOPs/Writing Voice.md`](file:///Users/craiganderson/Developer/SystemizedHealth/SOPs/Writing%20Voice.md) and [`SOPs/Writing Guidance.md`](file:///Users/craiganderson/Developer/SystemizedHealth/SOPs/Writing%20Guidance.md).
   > [!IMPORTANT]
   > **Always present the drafted script hooks and clips to Dr. Anderson in an Implementation Plan artifact for review and approval before modifying any Vault files.**

4. **Format & Save (Once Approved)**:
   Format into `Obsidian_Vault/Videos/[Folder]/V[Code] Script - [Title].md` using:
   - **Header**: `# [Code]: [Title]` + metadata block (`Suggested Settings`, `JDex Topic Code`).
     - When adding the `JDex Topic Code` link, **always link to the exact, full JDex filename** (e.g., `[[77.01 Documentation]]`) — not just the numeric code (`[[77.01]]`) — to prevent Obsidian from creating empty duplicate files.
   - **Section 1 & 2**: Title Ideas and Hook Options with vidIQ ratings.
   - **Section 3**: Teleprompter clips formatted as plain paragraphs without headers.
     - At the end of each paragraph, append the clip code and context tags: `[Code].[ClipNum] #[context]` (e.g., `80.V0B-S3.1 #film #insidetruck`).
     - One consolidated spoken paragraph per clip (no sentence bullets).
     - Include bracketed performance/delivery cues: `[breath]`, `[pause]`, `[gesture]`, `[tone shift]`, `[eye contact shift]`.
     - End with official CTA: *"Book your free 20-minute Systemized Discovery Call: call.systemizedhealth.com"*
   - Apply all Writing Guardrails (no AI jargon, no em dashes).

5. **Pipeline Auto-Advance**:
   - Advance video status to `#film` in Supabase and clear the `agent_message` field:
     ```bash
     python3 scripts/video_pipeline.py --status [Code] '#film' --add '{"video_number":"[num]","code":"[Code]","format_type":"[type]","title":"[Title]","agent_message":""}'
     ```
   - Refresh all derived docs:
     ```bash
     python3 scripts/video_pipeline.py --cache
     ```
   - Update `Drop_Schedule.md` and `TODO.md`.

6. **Dashboard Update**: Copy the entire formatted teleprompter script (Section 3) and append the clips to the bottom of `Obsidian_Vault/_Filming_Dashboard.md` under the `## 📜 Script Snippets` section.

7. **Agent Log**: Append a simple action log to the bottom of the Obsidian script file under an `## Agent Log` header (e.g., *"Processed dictation and generated Stage 2 teleprompter script"*).

---

## 7. Updating Status

When a video advances through production, update Supabase immediately:

```bash
python3 scripts/video_pipeline.py --status <code> '<new_tag>'
```

Examples:
```bash
python3 scripts/video_pipeline.py --status 80.V0A-S1 '#edit'
python3 scripts/video_pipeline.py --status 80.V0A-S1 '#uploaded'
```

When set to `#uploaded` or `#published`, `uploaded_date` is automatically stamped with today's date.

### Renaming a Video & Calendar Sync

Whenever a video's title or drop schedule is renamed or updated in Supabase:
1. Update the record in Supabase (e.g. updating the `title` attribute).
2. Immediately refresh the local cache, status documentation, and iCalendar feed by running:
   ```bash
   python3 scripts/video_pipeline.py --cache --doc
   ```
   *(This automatically regenerates `docs/video_pipeline_cache.json`, `docs/Video_Pipeline_Status.md`, and `docs/publication_calendar.ics` so that all calendar subscriptions reflect the updated title).*

---

## 7. Agent Protocol

- The AI agent reads from the local cache (`docs/video_pipeline_cache.json`) to avoid REST API limits/sandbox restrictions.
- To update a video's status or clear agent messages, the agent will execute the exact `--status` and `--add` commands using `scripts/video_pipeline.py` in the terminal on behalf of Dr. Anderson.
- The agent can query live drop schedules, status summaries, and upload gaps on demand (via local cache or by running pipeline scripts).
- Session startup requires running `python3 scripts/video_pipeline.py --cache` to write a fresh local snapshot.

---

## 8. Session Startup Checklist

At the start of every session, run:

```bash
python3 scripts/tidycal_sync.py          # Pull new TidyCal bookings
python3 scripts/sync_agreements.py       # Pull Google Form agreements
python3 scripts/client_db_manager.py --doc  # Refresh Client_Onboarding_Status.md
python3 scripts/video_pipeline.py --cache   # Refresh video_pipeline_cache.json
```

---

## 9. App-to-Obsidian Deep Linking Architecture

The web dashboard (`pipeline/src/App.jsx`) uses Obsidian's native URI schemes to deep-link directly into local video script files. To ensure 100% reliability even when file names and database titles diverge, the following architecture is maintained:

1. **Vault Name Requirement:** The `vault=` parameter MUST exactly match the physical root folder name of the vault where iCloud stores it, not the local symlink name. In this project, the true vault folder name is `SystemizedHealth_Vault`.
2. **Absolute File Mapping (`video_paths.json`):** 
   - Supabase titles frequently differ from Obsidian filenames due to punctuation stripping or manual abbreviation.
   - The script `scripts/generate_analytics_reports.py` automatically scans the `Obsidian_Vault/Videos/` directory, extracts the video codes from folder names using regex, and maps the exact relative file paths.
   - It outputs this mapping to `pipeline/public/video_paths.json`.
3. **App Link Logic (`obsidian://open`):** 
   - The React app fetches `video_paths.json` dynamically.
   - When a user clicks "Open Script in Obsidian", the app looks up the exact literal file path and fires: `obsidian://open?vault=SystemizedHealth_Vault&file=[exact_path]`.
4. **Fallback Logic (`obsidian://search`):** 
   - If a script is newly created and the `video_paths.json` map hasn't updated yet, the app gracefully falls back to: `obsidian://search?vault=SystemizedHealth_Vault&query="[Code]"`. 
   - This executes an exact phrase search for the base code (e.g., `"V2A-S1"`), stripping the `80.` prefix and omitting the strict `path:` constraint, immediately revealing the new file in the Obsidian search pane.
