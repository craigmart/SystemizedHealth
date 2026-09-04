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

## 3. Video Coding Nomenclature (Zettelkasten Library Standard)

> [!IMPORTANT]
> **Videos are coded strictly by TOPIC, NEVER by order of production or drop date.**
> The video library functions as a **Zettelkasten** (slip-box) archive. Every video code places the content into a permanent topical index so Dr. Anderson can immediately see which topics are well-developed and which are thin.

### Root Identifier:
* `80.V` = Systemized Health Video

---

### Master Taxonomy Structure:

* **`80.V0` — Meta Topics**
  * High-level channel philosophy, Systemized OS architecture, clinical worldview (*e.g., 20,000 Patients Biological Reality, Knowledge vs. Action, Systemized OS Overview*).
* **`80.V1` — Foundational Framework (FMR)**
  * `80.V1A` — Fuel, Food & Energy *(Nutrition, hydration, metabolic rate, blood sugar, coffee, cellular energy)*
  * `80.V1B` — Move & Activity *(Biomechanics, joints, non-exercise movement, spine, fascia, walking)*
  * `80.V1C` — Rest & Recover *(Sleep architecture, circadian rhythms, nervous system downtime, recovery debt)*
* **`80.V2` — Inward Framework (TLC)**
  * `80.V2A` — Think & Process *(Cognitive load, mental clarity, stress calibration, emotional regulation)*
  * `80.V2B` — Learn & Challenge *(Skill acquisition, intellectual growth, neuroplasticity)*
  * `80.V2C` — Connect with Creator and Creation *(Spiritual resonance, relational health, environmental connection)*
* **`80.V3` — Outward Framework (POP)**
  * `80.V3A` — Play *(Joy, unstructured experimentation, creative expression)*
  * `80.V3B` — Organize & Goal Setting *(Systems creation, workflow management, habit architecture, anchor habits)*
  * `80.V3C` — Purpose & Planning *(Long-term life vision, execution, life alignment)*
* **`80.V4` — Lab Deep Dives**
  * Advanced clinical diagnostics, biomarker breakdowns, blood panels, lab tests.

---

### Topic Branch Numbering & Shorts:

1. **Sequential Numbers Within Topic Branches**:
   * Numbering increments within the specific topic leaf:
     * `80.V1A1` = First video in Fuel
     * `80.V1A2` = Second video in Fuel (e.g. Coffee)
     * `80.V1B1` = First video in Movement (Exercise vs. Movement)
     * `80.V1B2` = Second video in Movement (Joint Health)
     * `80.V1C1` = First video in Rest (Sleep Debt)
     * `80.V1C2` = Second video in Rest (Nervous System Recovery)
2. **Waterfall Shorts (`-S[Number]`)**:
   * Shorts derived directly from a long-form parent append `-S1`, `-S2`, `-S3` to that parent's code:
     * Example: `80.V1C2-S1` is the first waterfall short from `80.V1C2`.
3. **No Misfiling Standalone Topics**:
   * Standalone videos or shorts must be classified under their biological topic branch, **not** under the general meta bucket or an arbitrary production bundle.
   * *Example*: A short discussing coffee or hydration belongs in `80.V1A` (e.g., `80.V1A2`), never under `80.V0A`.

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

## 5. Simplified Production Workflow (The 3x5 Card Standard)

Long-form and core videos are produced using Dr. Anderson's streamlined analog-to-camera workflow, eliminating rigid pre-scripting and teleprompter reading in favor of natural, authentic clinical delivery:

```
┌────────────────────────────────────────────────────────┐
│ [Code] Working Title                                   │
├────────────────────────────────────────────────────────┤
│ 1. THE HOOK: Relatable myth, patient fear, or friction │
│ 2. THE GLITCH: The anatomical/neurological mechanism   │
│ 3. THE ANALOGY: The clinical teaching metaphor         │
│ 4. THE PROTOCOL: Actionable test/drill + CTA (call...) │
└────────────────────────────────────────────────────────┘
```

### Production Steps:
1. **Gemini Notebook Research**: Dr. Anderson reviews research, clinical seminar transcripts, and analogies in Gemini Notebook.
2. **The 3x5 Index Card**: Dr. Anderson distills the concept onto a physical 3x5 card following the 4-Beat Formula above.
3. **Direct-to-Camera Filming**: Dr. Anderson records a loosely scripted, highly personal video directly to camera using the card as an anchor.
4. **App Status Advance**: In the web App, Dr. Anderson sets the video status to `#edit`.

---

## 6. Post-Recording Transcript Ingestion & Force Multiplier Protocol

After filming, when Dr. Anderson begins editing in Descript, he drops the **exact final spoken transcript** into the web App's `raw_transcript` field (or chat/Obsidian). This triggers the Agent's automated post-production suite:

### Automated Agent Post-Production Suite:

1. **Title Optimization via vidIQ**:
   - The Agent analyzes the spoken transcript and scores 4–5 title variations using `scripts/vidiq_sync.py --score-title "[Title]"`, targeting virality scores of 90+ out of 100.
   - Example:
     - *Why Running Causes Lower Back Pain (And How to Fix It)* — **vidIQ: 96**
     - *Is Running Good for Lower Back Pain? (What Actually Happens to Your Spine)* — **vidIQ: 93**

2. **Obsidian Vault Archiving**:
   - Formats `Obsidian_Vault/Zettlekasten/[Code] Script - [Title].md` to preserve the final transcript as a permanent clinical study and reference document.
   - YAML frontmatter contains `#video`, `#edit`, `drop_date`, and full JDex topic links (e.g., `[[81.05 Lifestyle Management]]`).
   - Injects the exact transcript under `## Final Spoken Transcript`.

3. **Zettelkasten Proposition Mining**:
   - The Agent extracts 1–2 sharp, authoritative clinical propositions from the spoken words and indexes them to the appropriate JDex category in `Obsidian_Vault/JDex/` and Workflowy.

4. **Waterfall Shorts Extraction**:
   - The Agent analyzes the exact spoken transcript and isolates the **3 best 30–60 second segments** to cut as waterfall shorts (`[Code]-S1`, `[Code]-S2`, `[Code]-S3`), providing custom short-form hooks and timestamps for editing.

5. **Pipeline & Database Synchronization**:
   - Updates Supabase and SQLite, refreshes `docs/video_pipeline_cache.json`, and appends a dated entry to the `## Changelog`.

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

### Title Changes in YouTube Studio & vidIQ Sync Protocol

When adjusting video titles directly in YouTube Studio (e.g., A/B testing, character limits, or virality tweaks at upload time):
1. **Reconciliation Hierarchy**: The sync engine (`scripts/sync_published_videos.py` and `scripts/analytics_manager.py`) automatically matches published YouTube videos to pipeline records using this priority:
   - **Primary Match**: Exact YouTube Video ID (`youtube_id`).
   - **Secondary Match**: Normalized Title match (handles minor punctuation/casing differences).
   - **Fallback Match**: Published Drop Date (`drop_date` or `uploaded_date`) + Format Type (`Long` / `Short`).
2. **Title Ingestion**: Once matched, the live YouTube title automatically updates the database and the Obsidian vault script filename, preserving the canonical video code (e.g., `80.V1A`, `80.V1B1-S1`).
3. **No Duplicate `HIST.*` Codes**: `HIST.*` codes are strictly frozen and reserved for the legacy pre-August 2026 catalog. The sync engine will **never** spawn a `HIST.*` row for videos published in August 2026 or later. If a title cannot be automatically matched, the script logs a warning so it can be linked to its existing production code rather than generating a duplicate.
4. **Best Practice**: Whenever a video is uploaded and scheduled in YouTube Studio, paste the YouTube Video ID or link into chat so it can be stamped to the production code immediately via:
   ```bash
   python3 scripts/video_pipeline.py --status [Code] '#uploaded' --add '{"video_number":"[num]","code":"[Code]","format_type":"[type]","title":"[Title]","youtube_id":"[YT_ID]"}'
   ```

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
python3 scripts/sync_obsidian_tags.py       # Sync authoritative App/database statuses down to Obsidian Vault tags
python3 scripts/video_pipeline.py --cache   # Refresh video_pipeline_cache.json
```

---

## 9. App-to-Obsidian Deep Linking & Filename Architecture

The web dashboard (`pipeline/src/App.jsx`) uses Obsidian's native URI schemes (`obsidian://open`) to deep-link directly into local video script files. To ensure 100% reliability across all platforms, browsers, and title formats, the following standards are strictly enforced:

### A. Vault & URI Parameters
1. **Vault Name Requirement:** The `vault=` parameter MUST exactly match the physical root folder name of the vault where iCloud stores it, not the local symlink name. In this project, the true vault folder name is `SystemizedHealth_Vault`.
2. **Preserve Directory Slashes (`/`):** When encoding the relative path in JavaScript, do **NOT** encode the entire path with `encodeURIComponent(path)` because that turns `/` into `%2F`. Obsidian's Electron router does not recognize `%2F` as a folder delimiter and will fail to find files inside subdirectories. Always encode path segments individually:
   ```javascript
   const encodedFile = relativePath.split('/').map(encodeURIComponent).join('/');
   const uri = `obsidian://open?vault=SystemizedHealth_Vault&file=${encodedFile}`;
   ```
3. **Absolute File Mapping (`video_paths.json`):**
   - Supabase titles frequently differ from Obsidian filenames due to punctuation stripping or manual abbreviation.
   - The script `scripts/generate_video_paths.py` automatically scans `Obsidian_Vault/Zettlekasten/`, extracts video codes via regex, and maps exact relative file paths to `pipeline/public/video_paths.json`.
   - The React app fetches `video_paths.json` dynamically for instant one-click navigation.
4. **Fallback Logic (`obsidian://search`):**
   - If a script is brand new and `video_paths.json` hasn't refreshed yet, the app gracefully falls back to: `obsidian://search?vault=SystemizedHealth_Vault&query="[Code]"`.

### B. Filename Sanitization Standard (Critical Lessons Learned)
Markdown filenames in the Obsidian Vault **must never contain URL-reserved or heading-reserved characters**. In particular:

* **NO HASHTAGS (`#`) in filenames:** YouTube Shorts titles frequently include hashtags (e.g., `#bloodsugar #over50`, `#shorts #fitness`). In Obsidian URIs, `#` is the reserved anchor character for navigating to internal note headings (e.g., `file=note#Heading`). If a filename contains `#`, Obsidian parses everything before the `#` as the filename and everything after as a heading, causing immediate `"File does not exist"` lookup failures.
  * **Rule:** All hashtag suffixes MUST be stripped from filenames upon import (`re.sub(r'\s*#[a-zA-Z0-9_-]+', '', title)`).
* **NO EM DASHES (`—` or `–`):** Unicode em dashes (`\u2014`) trigger encoding and normalization discrepancies across macOS URL handlers. Always standardize on an ASCII space-hyphen-space (` - `).
* **NO QUESTION MARKS (`?`):** Question marks collide with URL query string delimiters (`?vault=...`). Always replace or strip `?` from filenames.
* **Automated Enforcement:** `scripts/sync_published_videos.py` implements this standard via `sanitize_filename()`. Any new or updated script title imported from vidIQ or YouTube Studio is automatically sanitized before creating or renaming files in the vault.
